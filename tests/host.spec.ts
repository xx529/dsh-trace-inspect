/**
 * host.spec.ts — host route coverage: trust fence decisions, status codes,
 * afterSeq filtering, the lastSeq cache short-circuit and its probe TTL.
 */
import { describe, expect, it, vi } from 'vitest'
import { apply, ATTACHMENT_PATH, EVENTS_PATH, isTrustedApiRequest, PROBE_TTL_MS, TOOL_DETAIL_PATH } from '../src/index'
import { PAGE_BUDGET_BYTES, PAGE_SIZE } from '../src/wire'
import type { HostCtx, HttpHeadersLike, HttpRequestLike, HttpResponseLike, SessionEventLike } from '../src/context-types'

const events = (): SessionEventLike[] => [
  { type: 'user/message', seq: 1, data: { content: 'a' } },
  { type: 'assistant/message', seq: 2, data: { message: { content: 'A' } } },
  { type: 'user/message', seq: 3, data: { content: 'b' } },
]

const snapshot = { events: events() }

type Handler = (req: HttpRequestLike, res: HttpResponseLike) => Promise<void>

function fakeCtx(overrides: Partial<HostCtx> = {}): HostCtx & { captured: Handler[]; paths: string[] } {
  const captured: Handler[] = []
  const paths: string[] = []
  const ctx: HostCtx = {
    webServer: {
      register: (route) => {
        paths.push(route.path)
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
  return Object.assign(ctx, { captured, paths })
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
    url: '/trace-inspect/api/events',
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

describe('route table (v0.5.0)', () => {
  it('registers the three exact routes, events first (the handler every other test drives)', () => {
    const ctx = fakeCtx()
    apply(ctx)
    expect(ctx.paths).toEqual([EVENTS_PATH, ATTACHMENT_PATH, TOOL_DETAIL_PATH])
    expect(ctx.paths[0]).toBe('/trace-inspect/api/events')
    expect(ATTACHMENT_PATH).toBe('/trace-inspect/api/attachment')
    expect(TOOL_DETAIL_PATH).toBe('/trace-inspect/api/tool-detail')
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
  const liveCtx = (session: unknown): HostCtx & { captured: Handler[] } => {
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = { get: (id: string) => (id === 'live1' ? session : undefined) }
    return ctx
  }

  it('serves from the live store without touching sessionQuery (0.2.0 snapshotEvents)', async () => {
    const events: SessionEventLike[] = [
      { type: 'user/message', seq: 1, data: { content: 'a' } },
      { type: 'assistant/message', seq: 2, data: { message: { content: 'A' } } },
    ]
    const ctx = liveCtx({ snapshotEvents: () => events })
    apply(ctx)
    const { status, body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'live1', afterSeq: 0 }) }))
    expect(status).toBe(200)
    expect((body as { events: SessionEventLike[] }).events.map((event) => event.seq)).toEqual([1, 2])
    expect(ctx.sessionQuery.readSession).not.toHaveBeenCalled()
    expect(ctx.sessionQuery.listEvents).not.toHaveBeenCalled()
  })

  it('serves from the live store without touching sessionQuery (0.1.x events property)', async () => {
    const events: SessionEventLike[] = [
      { type: 'user/message', seq: 1, data: { content: 'a' } },
      { type: 'assistant/message', seq: 2, data: { message: { content: 'A' } } },
    ]
    const ctx = liveCtx({ events })
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
    const ctx = liveCtx({ snapshotEvents: () => events })
    apply(ctx)
    const { body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'live1', afterSeq: 9 }) }))
    expect((body as { events: SessionEventLike[] }).events.map((event) => event.seq)).toEqual([12, 15, 18, 21, 24, 27, 30])
  })

  it('falls back to the persisted path when the session is not live', async () => {
    const ctx = liveCtx(undefined)
    apply(ctx)
    // Unique id: the module-level lastSeq cache remembers session ids used
    // by earlier tests in this file (a hit would skip readSession entirely).
    const { status } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'cold-1', afterSeq: 0 }) }))
    expect(status).toBe(200)
    expect(ctx.sessionQuery.readSession).toHaveBeenCalled()
  })

  it('degrades to the persisted path when the live session exposes no log face', async () => {
    const ctx = liveCtx({ someOtherField: true })
    apply(ctx)
    const { status } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'cold-2', afterSeq: 0 }) }))
    expect(status).toBe(200)
    expect(ctx.sessionQuery.readSession).toHaveBeenCalled()
  })
})

describe('wire projection', () => {
  it('reshapes tool/result content into ordered blocks, keeps error fields and call ids', async () => {
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
    // The bulky payload is re-shaped (clipped to RESULT_CAP); the raw
    // message.content array is never forwarded verbatim.
    const blocks = sent.data?.content as Array<{ type: string; text: string }>
    expect(blocks).toHaveLength(1)
    expect(blocks[0].text.length).toBe(32769)
    expect(sent.data?.contentBytes).toBe(50_000)
    expect(sent.data?.contentTruncated).toBe(true)
    expect((sent.data?.message as { content?: unknown } | undefined)?.content).toBeUndefined()
  })

  it('clips text to TEXT_CAP and arguments to ARGS_CAP', async () => {
    const events: SessionEventLike[] = [
      { type: 'user/message', seq: 1, data: { content: 'u'.repeat(9000) } },
      { type: 'tool/call', seq: 2, data: { name: 'read', arguments: 'a'.repeat(40_000), callId: 'c2' } },
    ]
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = { get: () => ({ events }) }
    apply(ctx)
    const { body } = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 's', afterSeq: 0 }) }))
    const eventsOut = (body as { events: SessionEventLike[] }).events
    expect((eventsOut[0].data?.content as string).length).toBeLessThanOrEqual(2049)
    expect((eventsOut[1].data?.arguments as string).length).toBe(32769)
    expect(eventsOut[1].data?.argsBytes).toBe(40_000)
    expect(eventsOut[1].data?.argsTruncated).toBe(true)
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

describe('page byte budget (AC4)', () => {
  /** A tool/result whose projected text block is RESULT_CAP characters. */
  const heavyEvent = (seq: number): SessionEventLike => ({
    type: 'tool/result',
    seq,
    data: {
      callId: `c${seq}`,
      message: { content: [{ type: 'text', text: 'x'.repeat(32768) }], source: { callId: `c${seq}` } },
    },
  })

  const liveCtx = (events: SessionEventLike[]): HostCtx & { captured: Handler[] } => {
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = { get: () => ({ events }) }
    return ctx
  }

  it('cuts a page at PAGE_BUDGET_BYTES, keeps at least one event and reports hasMore', async () => {
    const events = Array.from({ length: 200 }, (_, i) => heavyEvent(i + 1))
    const ctx = liveCtx(events)
    apply(ctx)
    const first = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'budget-1', afterSeq: 0 }) }))
    const firstBody = first.body as { events: SessionEventLike[]; hasMore: boolean }
    // The budget bites long before PAGE_SIZE...
    expect(firstBody.events.length).toBeGreaterThanOrEqual(1)
    expect(firstBody.events.length).toBeLessThan(200)
    // ...and the drain is advertised correctly.
    expect(firstBody.hasMore).toBe(true)
    // Every event but the last one fit inside the budget (the loop always
    // admits at least one event per page).
    const settled = Buffer.byteLength(JSON.stringify(firstBody.events.slice(0, -1)))
    expect(settled).toBeLessThanOrEqual(PAGE_BUDGET_BYTES)
    // A single page stays close to the budget (it may overshoot by ≤ one event).
    const pageBytes = Buffer.byteLength(JSON.stringify(firstBody.events))
    expect(pageBytes).toBeLessThanOrEqual(PAGE_BUDGET_BYTES + Buffer.byteLength(JSON.stringify(firstBody.events[firstBody.events.length - 1])))
    // The next page resumes exactly after the last delivered seq — no gap.
    const lastSeq = firstBody.events[firstBody.events.length - 1].seq
    const second = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'budget-1', afterSeq: lastSeq }) }))
    const secondBody = second.body as { events: SessionEventLike[]; hasMore: boolean }
    expect(secondBody.events[0].seq).toBe(lastSeq + 1)
    expect(secondBody.events.length).toBeGreaterThanOrEqual(1)
  })

  it('still delivers an event that alone exceeds the page budget (no stall)', async () => {
    // ~2.6 MiB of projected text in ONE event: bigger than the page budget.
    const huge: SessionEventLike = {
      type: 'tool/result',
      seq: 1,
      data: {
        callId: 'huge',
        message: { content: Array.from({ length: 80 }, () => ({ type: 'text', text: 'y'.repeat(32768) })) },
      },
    }
    const events: SessionEventLike[] = [huge, { type: 'turn/end', seq: 2, data: { turn: 0 } }]
    const ctx = liveCtx(events)
    apply(ctx)
    const first = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'budget-2', afterSeq: 0 }) }))
    const firstBody = first.body as { events: SessionEventLike[]; hasMore: boolean }
    expect(firstBody.events).toHaveLength(1)
    expect(firstBody.events[0].seq).toBe(1)
    expect(Buffer.byteLength(JSON.stringify(firstBody.events[0]))).toBeGreaterThan(PAGE_BUDGET_BYTES)
    expect(firstBody.hasMore).toBe(true)
    // The drain completes on the next pull instead of looping forever.
    const second = await run(ctx, fakeReq({ body: JSON.stringify({ sessionId: 'budget-2', afterSeq: 1 }) }))
    const secondBody = second.body as { events: SessionEventLike[]; hasMore: boolean }
    expect(secondBody.events.map((event) => event.seq)).toEqual([2])
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
      url: '/trace-inspect/api/events',
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
      url: '/trace-inspect/api/events',
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

// ── v0.12.0: backwards (segmented) history ───────────────────────────────

describe('backwards history (v0.12.0)', () => {
  /** One complete turn: prompt → turn/start → assistant text → turn/end. */
  const promptTurn = (turn: number, base: number): SessionEventLike[] => [
    { type: 'user/message', seq: base, data: { content: `q${turn}`, message: { source: { kind: 'user' } } } },
    { type: 'turn/start', seq: base + 1, data: { turn } },
    { type: 'assistant/message', seq: base + 2, data: { message: { content: [{ type: 'text', text: `a${turn}` }] } } },
    { type: 'turn/end', seq: base + 3, data: { turn } },
  ]
  const threeTurns = (): SessionEventLike[] => [
    ...promptTurn(1, 1),
    ...promptTurn(2, 5),
    ...promptTurn(3, 9),
  ]

  /** Host context whose persisted log is exactly `events`. */
  const logCtx = (sessionId: string, events: SessionEventLike[]): HostCtx & { captured: Handler[] } => {
    const ctx = fakeCtx({
      sessionQuery: {
        readSession: vi.fn(async () => ({ events })),
        listEvents: vi.fn(async () => events.map((event) => ({ seq: event.seq }))),
      },
    })
    return ctx
  }

  const page = async (
    ctx: HostCtx & { captured: Handler[] },
    body: Record<string, unknown>,
  ): Promise<{ status: number; events: SessionEventLike[]; hasOlder: boolean; hasMore: boolean }> => {
    const res = fakeRes()
    await ctx.captured[0]!(fakeReq({ body: JSON.stringify(body) }), res)
    const parsed = JSON.parse(res.body || '{}') as { events?: SessionEventLike[]; hasOlder?: boolean; hasMore?: boolean }
    return {
      status: res.status,
      events: parsed.events ?? [],
      hasOlder: parsed.hasOlder === true,
      hasMore: parsed.hasMore === true,
    }
  }

  it('serves the newest segment first, then pages back to the beginning', async () => {
    const sessionId = 'back-three-turns'
    const ctx = logCtx(sessionId, threeTurns())
    apply(ctx)

    // Tail segment: the newest `maxTurns` turns, prompt-aligned.
    const tail = await page(ctx, { sessionId, direction: 'before', maxTurns: 2 })
    expect(tail.status).toBe(200)
    expect(tail.events.map((event) => event.seq)).toEqual([5, 6, 7, 8, 9, 10, 11, 12])
    expect(tail.events[0]?.type).toBe('user/message')
    expect(tail.hasOlder).toBe(true)
    expect(tail.hasMore).toBe(false)

    // Older segment: `beforeSeq` = the tail's first seq.
    const older = await page(ctx, { sessionId, direction: 'before', beforeSeq: 5, maxTurns: 2 })
    expect(older.events.map((event) => event.seq)).toEqual([1, 2, 3, 4])
    expect(older.hasOlder).toBe(false)
  })

  it('returns the whole log when it fits one segment', async () => {
    const sessionId = 'back-fits'
    const ctx = logCtx(sessionId, threeTurns())
    apply(ctx)
    const tail = await page(ctx, { sessionId, direction: 'before' })
    expect(tail.events.map((event) => event.seq)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(tail.hasOlder).toBe(false)
  })

  it('an empty / before-the-start request yields no events and no older claim', async () => {
    const sessionId = 'back-empty'
    const ctx = logCtx(sessionId, threeTurns())
    apply(ctx)
    const empty = await page(ctx, { sessionId, direction: 'before', beforeSeq: 0 })
    expect(empty.events).toEqual([])
    expect(empty.hasOlder).toBe(false)
  })

  it('falls back to user-message boundaries on logs without turn events', async () => {
    const sessionId = 'back-user-mode'
    const ctx = logCtx(sessionId, [
      { type: 'user/message', seq: 1, data: { content: 'a', message: { source: { kind: 'user' } } } },
      { type: 'assistant/message', seq: 2, data: { message: { content: 'A' } } },
      { type: 'user/message', seq: 3, data: { content: 'b', message: { source: { kind: 'user' } } } },
      { type: 'assistant/message', seq: 4, data: { message: { content: 'B' } } },
      { type: 'user/message', seq: 5, data: { content: 'c', message: { source: { kind: 'user' } } } },
      { type: 'assistant/message', seq: 6, data: { message: { content: 'C' } } },
    ])
    apply(ctx)
    const tail = await page(ctx, { sessionId, direction: 'before', maxTurns: 2 })
    expect(tail.events.map((event) => event.seq)).toEqual([3, 4, 5, 6])
    expect(tail.hasOlder).toBe(true)
    const older = await page(ctx, { sessionId, direction: 'before', beforeSeq: 3 })
    expect(older.events.map((event) => event.seq)).toEqual([1, 2])
    expect(older.hasOlder).toBe(false)
  })

  it('trims the OLDEST turns when a segment exceeds the page byte budget', async () => {
    const sessionId = 'back-budget'
    // Each turn carries a ~1.5 MiB surfaceOp pass-through (projectEvent keeps
    // it verbatim), so two turns cannot fit one 2 MiB page.
    const big = (turn: number, base: number): SessionEventLike[] => {
      const [prompt, start, assistant, end] = promptTurn(turn, base) as SessionEventLike[]
      return [
        prompt!,
        start!,
        {
          ...assistant!,
          surfaceOp: { op: 'replace', startSeq: base, endSeq: base, pad: 'z'.repeat(1_500_000) },
        } as unknown as SessionEventLike,
        end!,
      ]
    }
    const ctx = logCtx(sessionId, [...big(1, 1), ...big(2, 5)])
    apply(ctx)
    const tail = await page(ctx, { sessionId, direction: 'before', maxTurns: 2 })
    // The newest turn is always delivered; the older one waits for the next call.
    expect(tail.events.map((event) => event.seq)).toEqual([5, 6, 7, 8])
    expect(tail.hasOlder).toBe(true)
    const older = await page(ctx, { sessionId, direction: 'before', beforeSeq: 5, maxTurns: 2 })
    expect(older.events.map((event) => event.seq)).toEqual([1, 2, 3, 4])
    expect(older.hasOlder).toBe(false)
  })

  it('never splits a turn at a mid-turn steering message', async () => {
    const sessionId = 'back-steering'
    const ctx = logCtx(sessionId, [
      // Turn 1: prompt, then a STEERING user message while the turn runs.
      { type: 'user/message', seq: 1, data: { content: 'q1', message: { source: { kind: 'user' } } } },
      { type: 'turn/start', seq: 2, data: { turn: 1 } },
      { type: 'user/message', seq: 3, data: { content: 'steer', message: { source: { kind: 'user' } } } },
      { type: 'assistant/message', seq: 4, data: { message: { content: [{ type: 'text', text: 'a1' }] } } },
      { type: 'turn/end', seq: 5, data: { turn: 1 } },
      // Turn 2: prompt + turn.
      { type: 'user/message', seq: 6, data: { content: 'q2', message: { source: { kind: 'user' } } } },
      { type: 'turn/start', seq: 7, data: { turn: 2 } },
      { type: 'assistant/message', seq: 8, data: { message: { content: [{ type: 'text', text: 'a2' }] } } },
      { type: 'turn/end', seq: 9, data: { turn: 2 } },
    ])
    apply(ctx)

    // One turn per segment: the segment starts at turn 2's PROMPT, not at the
    // steering message, and the older segment still carries the steering copy.
    const tail = await page(ctx, { sessionId, direction: 'before', maxTurns: 1 })
    expect(tail.events.map((event) => event.seq)).toEqual([6, 7, 8, 9])
    expect(tail.hasOlder).toBe(true)
    const older = await page(ctx, { sessionId, direction: 'before', beforeSeq: 6, maxTurns: 1 })
    expect(older.events.map((event) => event.seq)).toEqual([1, 2, 3, 4, 5])
    expect(older.hasOlder).toBe(false)
  })

  it('serves backwards segments from the live store without touching sessionQuery', async () => {
    const liveEvents = threeTurns()
    const ctx = fakeCtx()
    ;(ctx as HostCtx & { sessions?: unknown }).sessions = {
      get: (id: string) => (id === 'back-live' ? { snapshotEvents: () => liveEvents } : undefined),
    }
    apply(ctx)
    const tail = await page(ctx, { sessionId: 'back-live', direction: 'before', maxTurns: 1 })
    expect(tail.events.map((event) => event.seq)).toEqual([9, 10, 11, 12])
    expect(tail.hasOlder).toBe(true)
    expect(ctx.sessionQuery.readSession).not.toHaveBeenCalled()
    expect(ctx.sessionQuery.listEvents).not.toHaveBeenCalled()
  })

  it('keeps the forward page unchanged when direction is absent', async () => {
    const sessionId = 'back-forward-compat'
    const ctx = logCtx(sessionId, threeTurns())
    apply(ctx)
    const forward = await page(ctx, { sessionId, afterSeq: 8 })
    expect(forward.events.map((event) => event.seq)).toEqual([9, 10, 11, 12])
    expect(forward.hasMore).toBe(false)
    expect(forward.hasOlder).toBe(false)
  })
})
