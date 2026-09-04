/**
 * host.spec.ts — host route coverage: trust fence decisions, status codes,
 * afterSeq filtering, the lastSeq cache short-circuit and its probe TTL.
 */
import { describe, expect, it, vi } from 'vitest'
import { apply, isTrustedApiRequest, PROBE_TTL_MS } from '../src/index'
import { PAGE_SIZE } from '../src/wire'
import type { HostCtx, HttpHeadersLike, HttpRequestLike, HttpResponseLike, SessionEventLike } from '../src/context-types'

const events = (): SessionEventLike[] => [
  { type: 'user/message', seq: 1, data: { content: 'a' } },
  { type: 'assistant/message', seq: 2, data: { message: { content: 'A' } } },
  { type: 'user/message', seq: 3, data: { content: 'b' } },
]

const snapshot = { events: events() }

type Handler = (req: HttpRequestLike, res: HttpResponseLike) => Promise<void>

function fakeCtx(overrides: Partial<HostCtx> = {}): HostCtx & { captured: Handler[] } {
  const captured: Handler[] = []
  const ctx: HostCtx = {
    webServer: {
      register: (route) => {
        captured.push(route.handler as Handler)
      },
    },
    sessionQuery: {
      readSession: vi.fn(async () => snapshot),
      listEvents: vi.fn(async () => snapshot.events.map((event) => ({ seq: event.seq }))),
    },
    effect: (fn) => fn(),
    ...overrides,
  }
  return Object.assign(ctx, { captured })
}

interface ReqOverrides {
  method?: string
  headers?: HttpHeadersLike
  body?: string
}

function fakeReq(overrides: ReqOverrides = {}): HttpRequestLike {
  const body = overrides.body ?? JSON.stringify({ sessionId: 's1', afterSeq: 0 })
  return {
    method: overrides.method ?? 'POST',
    headers: overrides.headers ?? { host: '127.0.0.1:43120' },
    url: '/turntrail/api/events',
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(body, 'utf8')
    },
  } as unknown as HttpRequestLike
}

function fakeRes(): HttpResponseLike & { status: number; body: string } {
  const res = {
    status: 0,
    body: '',
    writeHead(status: number) {
      this.status = status
    },
    end(body?: string | Buffer) {
      this.body = typeof body === 'string' ? body : String(body ?? '')
    },
  }
  return res
}

async function run(ctx: HostCtx & { captured: Handler[] }, req: HttpRequestLike): Promise<{ status: number; body: unknown }> {
  const res = fakeRes()
  await ctx.captured[0](req, res)
  return { status: res.status, body: JSON.parse(res.body || '{}') }
}

describe('isTrustedApiRequest', () => {
  it('loopback hosts pass; non-loopback refuse', () => {
    expect(isTrustedApiRequest({ headers: { host: '127.0.0.1:43120' } })).toBe(true)
    expect(isTrustedApiRequest({ headers: { host: 'localhost:43120' } })).toBe(true)
    expect(isTrustedApiRequest({ headers: { host: '[::1]:43120' } })).toBe(true)
    expect(isTrustedApiRequest({ headers: { host: 'evil.example.com' } })).toBe(false)
    expect(isTrustedApiRequest({ headers: {} })).toBe(false)
  })

  it('cross-site and mismatched origins refuse', () => {
    expect(isTrustedApiRequest({ headers: { host: '127.0.0.1:43120', 'sec-fetch-site': 'cross-site' } })).toBe(false)
    expect(isTrustedApiRequest({ headers: { host: '127.0.0.1:43120', origin: 'http://evil.example.com' } })).toBe(false)
    expect(isTrustedApiRequest({ headers: { host: '127.0.0.1:43120', origin: 'http://127.0.0.1:43120' } })).toBe(true)
  })
})

describe('route behavior', () => {
  it('403 when the fence refuses', async () => {
    const ctx = fakeCtx()
    apply(ctx)
    const { status } = await run(ctx, fakeReq({ headers: { host: 'evil.example.com' } }))
    expect(status).toBe(403)
  })

  it('405 for non-POST', async () => {
    const ctx = fakeCtx()
    apply(ctx)
    const { status } = await run(ctx, fakeReq({ method: 'GET' }))
    expect(status).toBe(405)
  })

  it('400 when sessionId is missing', async () => {
    const ctx = fakeCtx()
    apply(ctx)
    const { status } = await run(ctx, fakeReq({ body: JSON.stringify({ afterSeq: 0 }) }))
    expect(status).toBe(400)
  })

  it('200 returns only events after afterSeq', async () => {
    const ctx = fakeCtx()
    apply(ctx)
    const { status, body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 's1', afterSeq: 1 }) }))
    expect(status).toBe(200)
    expect((body as { events: SessionEventLike[] }).events.map((event) => event.seq)).toEqual([2, 3])
  })

  it('lastSeq cache short-circuits re-reads (cached tail served)', async () => {
    const ctx = fakeCtx()
    apply(ctx)
    const body = JSON.stringify({ sessionId: 'cache-s1', afterSeq: 0 })
    await run(ctx, fakeReq({ body }))
    const readSession = ctx.sessionQuery.readSession as ReturnType<typeof vi.fn>
    const listEvents = ctx.sessionQuery.listEvents as ReturnType<typeof vi.fn>
    expect(readSession).toHaveBeenCalledTimes(1)
    // Second request within the probe TTL reuses the cached lastSeq: neither
    // the probe (a whole-log read + clone inside sessionQuery) nor the log
    // is touched again.
    await run(ctx, fakeReq({ body }))
    expect(listEvents).toHaveBeenCalledTimes(1)
    expect(readSession).toHaveBeenCalledTimes(1)
  })

  it('re-probes lastSeq once the probe TTL lapses', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(0)
      const ctx = fakeCtx()
      apply(ctx)
      const body = JSON.stringify({ sessionId: 'ttl-s1', afterSeq: 0 })
      await run(ctx, fakeReq({ body }))
      await run(ctx, fakeReq({ body }))
      const listEvents = ctx.sessionQuery.listEvents as ReturnType<typeof vi.fn>
      expect(listEvents).toHaveBeenCalledTimes(1)
      expect((ctx.sessionQuery.readSession as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
      // Past the TTL the next request pays one fresh probe — and still hits
      // the events cache (no readSession) because lastSeq did not move.
      vi.setSystemTime(PROBE_TTL_MS + 1)
      await run(ctx, fakeReq({ body }))
      expect(listEvents).toHaveBeenCalledTimes(2)
      expect((ctx.sessionQuery.readSession as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('404 for an unknown session', async () => {
    const ctx = fakeCtx({
      sessionQuery: {
        listEvents: vi.fn(async () => { throw new Error('no such session') }),
        readSession: vi.fn(async () => { throw new Error('no such session') }),
      },
    })
    apply(ctx)
    const { status } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'missing', afterSeq: 0 }) }))
    expect(status).toBe(404)
  })
})

describe('live fast path', () => {
  const liveCtx = (events: SessionEventLike[]): HostCtx & { captured: Handler[] } => {
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = { get: (id: string) => (id === 'live1' ? { events } : undefined) }
    return ctx
  }

  it('serves from the live store without touching sessionQuery', async () => {
    const events: SessionEventLike[] = [
      { type: 'user/message', seq: 1, data: { content: 'a' } },
      { type: 'assistant/message', seq: 2, data: { message: { content: 'A' } } },
    ]
    const ctx = liveCtx(events)
    apply(ctx)
    const { status, body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'live1', afterSeq: 0 }) }))
    expect(status).toBe(200)
    expect((body as { events: SessionEventLike[] }).events.map((event) => event.seq)).toEqual([1, 2])
    expect(ctx.sessionQuery.readSession).not.toHaveBeenCalled()
    expect(ctx.sessionQuery.listEvents).not.toHaveBeenCalled()
  })

  it('honors afterSeq on the live path (binary search over seqs)', async () => {
    const events: SessionEventLike[] = Array.from({ length: 10 }, (_, i) => ({
      type: 'turn/start',
      seq: (i + 1) * 3, // non-dense seqs: 3,6,9,…30
      data: { turn: i },
    }))
    const ctx = liveCtx(events)
    apply(ctx)
    const { body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'live1', afterSeq: 9 }) }))
    expect((body as { events: SessionEventLike[] }).events.map((event) => event.seq)).toEqual([12, 15, 18, 21, 24, 27, 30])
  })

  it('falls back to the persisted path when the session is not live', async () => {
    const ctx = liveCtx([])
    apply(ctx)
    // Unique id: the module-level lastSeq cache remembers session ids used
    // by earlier tests in this file (a hit would skip readSession entirely).
    const { status } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'cold-1', afterSeq: 0 }) }))
    expect(status).toBe(200)
    expect(ctx.sessionQuery.readSession).toHaveBeenCalled()
  })
})

describe('wire projection', () => {
  it('drops tool/result content, keeps error fields and call ids', async () => {
    const events: SessionEventLike[] = [
      {
        type: 'tool/result',
        seq: 7,
        data: {
          callId: 'c7',
          message: { content: [{ type: 'text', text: 'x'.repeat(50_000) }] },
          error: { name: 'TimeoutError', code: 'ETIMEDOUT' },
        },
      },
    ]
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = { get: () => ({ events }) }
    apply(ctx)
    const { body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 's', afterSeq: 0 }) }))
    const sent = (body as { events: SessionEventLike[] }).events[0]
    expect(sent.seq).toBe(7)
    expect(sent.data?.error).toEqual({ name: 'TimeoutError', code: 'ETIMEDOUT' })
    expect(sent.data?.callId).toBe('c7')
    expect(JSON.stringify(sent.data?.message ?? {})).not.toContain('xxxx')
  })

  it('clips text and arguments to the wire caps', async () => {
    const events: SessionEventLike[] = [
      { type: 'user/message', seq: 1, data: { content: 'u'.repeat(9000) } },
      { type: 'tool/call', seq: 2, data: { name: 'read', arguments: 'a'.repeat(9000), callId: 'c2' } },
    ]
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = { get: () => ({ events }) }
    apply(ctx)
    const { body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 's', afterSeq: 0 }) }))
    const eventsOut = (body as { events: SessionEventLike[] }).events
    expect((eventsOut[0].data?.content as string).length).toBeLessThanOrEqual(2049)
    expect((eventsOut[1].data?.arguments as string).length).toBeLessThanOrEqual(513)
  })

  it('keeps only text blocks in projected content arrays', async () => {
    const events: SessionEventLike[] = [
      {
        type: 'assistant/message',
        seq: 3,
        data: { message: { content: [
          { type: 'reasoning', text: 'r' },
          { type: 'text', text: 'visible' },
          { type: 'text', text: '' },
        ] } },
      },
    ]
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = { get: () => ({ events }) }
    apply(ctx)
    const { body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 's', afterSeq: 0 }) }))
    const sent = (body as { events: SessionEventLike[] }).events[0]
    expect(sent.data?.message).toEqual({ content: [{ type: 'text', text: 'visible' }] })
  })
})

describe('pagination', () => {
  it('pages a long first load and reports hasMore', async () => {
    const events: SessionEventLike[] = Array.from({ length: PAGE_SIZE + 2 }, (_, i) => ({
      type: 'turn/start',
      seq: i + 1,
      data: { turn: i },
    }))
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = { get: () => ({ events }) }
    apply(ctx)
    const first = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 's', afterSeq: 0 }) }))
    const firstBody = first.body as { events: SessionEventLike[]; hasMore: boolean }
    expect(firstBody.events).toHaveLength(PAGE_SIZE)
    expect(firstBody.events[0].seq).toBe(1)
    expect(firstBody.events[PAGE_SIZE - 1].seq).toBe(PAGE_SIZE)
    expect(firstBody.hasMore).toBe(true)
    const second = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 's', afterSeq: PAGE_SIZE }) }))
    const secondBody = second.body as { events: SessionEventLike[]; hasMore: boolean }
    expect(secondBody.events.map((event) => event.seq)).toEqual([PAGE_SIZE + 1, PAGE_SIZE + 2])
    expect(secondBody.hasMore).toBe(false)
  })
})

describe('request guards', () => {
  it('413 for an oversized body (content-length pre-check)', async () => {
    const ctx = fakeCtx()
    apply(ctx)
    const res = fakeRes()
    const req = {
      method: 'POST',
      headers: { host: '127.0.0.1:43120', 'content-length': String(1024 * 1024) },
      url: '/turntrail/api/events',
      async *[Symbol.asyncIterator]() {
        yield Buffer.from('x'.repeat(1024 * 1024), 'utf8')
      },
    } as unknown as HttpRequestLike
    await ctx.captured[0](req, res)
    expect(res.status).toBe(413)
  })

  it('413 when the streamed body itself exceeds the cap', async () => {
    const ctx = fakeCtx()
    apply(ctx)
    const res = fakeRes()
    const big = JSON.stringify({ sessionId: 's1', afterSeq: 0, pad: 'x'.repeat(70 * 1024) })
    const req = {
      method: 'POST',
      headers: { host: '127.0.0.1:43120' },
      url: '/turntrail/api/events',
      async *[Symbol.asyncIterator]() {
        for (let i = 0; i < 10; i += 1) yield Buffer.from(big.slice(i * 7 * 1024, (i + 1) * 7 * 1024), 'utf8')
      },
    } as unknown as HttpRequestLike
    await ctx.captured[0](req, res)
    expect(res.status).toBe(413)
  })
})

describe('cache eviction', () => {
  it('evicts the least recently used entry past the entry budget', async () => {
    const ctx = fakeCtx()
    apply(ctx)
    // Phase 0: flood with 64 unique sessions — whatever earlier tests left
    // in the module-level cache is fully evicted by the end of this loop.
    for (let i = 0; i < 64; i += 1) {
      await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: `flood-${i}`, afterSeq: 0 }) }))
    }
    const readsAfterFlood = (ctx.sessionQuery.readSession as ReturnType<typeof vi.fn>).mock.calls.length
    expect(readsAfterFlood).toBe(64)
    // Phase 1: touch flood-0 (LRU refresh), then one more session → flood-1 evicted.
    await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'flood-0', afterSeq: 0 }) }))
    await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'extra', afterSeq: 0 }) }))
    expect((ctx.sessionQuery.readSession as ReturnType<typeof vi.fn>).mock.calls.length).toBe(65)
    // Phase 2: the touched entry is still cached (no re-read)…
    await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'flood-0', afterSeq: 0 }) }))
    expect((ctx.sessionQuery.readSession as ReturnType<typeof vi.fn>).mock.calls.length).toBe(65)
    // …while the evicted one re-reads.
    await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'flood-1', afterSeq: 0 }) }))
    expect((ctx.sessionQuery.readSession as ReturnType<typeof vi.fn>).mock.calls.length).toBe(66)
  })
})
