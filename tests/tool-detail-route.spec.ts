/**
 * tool-detail-route.spec.ts — T7 host contract §10.3.2 + §10.3.4:
 * POST /trace-inspect/api/tool-detail  { sessionId, seqs }
 *
 * The route returns the FULL (unclipped) arguments and result content of the
 * requested steps — the /events wire preview clipped them at ARGS_CAP /
 * RESULT_CAP — while the whole response stays under 8 MiB (fields are then
 * clipped to at most 4 MiB each and marked `truncated`). The last section
 * covers the client transport `fetchToolDetail`, which must never throw.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apply,
  TOOL_DETAIL_MAX_RESPONSE_BYTES,
  TOOL_DETAIL_MAX_SEQS,
  TOOL_DETAIL_PATH,
  TOOL_DETAIL_TEXT_CAP_BYTES,
} from '../src/index'
import { ARGS_CAP, RESULT_CAP } from '../src/wire'
import type {
  HostCtx,
  HttpHeadersLike,
  HttpRequestLike,
  HttpResponseLike,
  SessionEventLike,
} from '../src/context-types'

type Handler = (req: HttpRequestLike, res: HttpResponseLike) => Promise<void>

const HOST = '127.0.0.1:19487'

interface ToolDetailBlockLike {
  type: 'text' | 'image'
  text?: string
  attachment?: { attachmentId: string; mediaType: string; bytes?: number; width?: number; height?: number }
}

interface ToolDetailItemLike {
  seq: number
  callId: string | null
  name: string
  arguments: string | null
  argsBytes: number
  content: ToolDetailBlockLike[] | null
  contentBytes: number
  isError: boolean
  error: { name?: string; code?: string } | null
  truncated?: boolean
}

/** tool/call in the RAW session-log shape. */
function toolCall(seq: number, name: string, args: string | null, callId: string | null = `c${seq}`): SessionEventLike {
  return {
    type: 'tool/call',
    seq,
    data: {
      ...(args !== null ? { arguments: args } : {}),
      name,
      ...(callId !== null ? { callId } : {}),
      message: { source: { kind: 'tool', callId } },
    },
  }
}

/** tool/result in the RAW session-log shape (content under data.message.content). */
function toolResult(seq: number, callId: string | null, content: unknown[], extra: Record<string, unknown> = {}): SessionEventLike {
  return {
    type: 'tool/result',
    seq,
    data: { ...(callId !== null ? { callId } : {}), message: { content, source: { callId }, isError: false }, ...extra },
  }
}

function makeHarness(events: SessionEventLike[] = [], hooks: {
  sessionQuery?: Partial<HostCtx['sessionQuery']>
  sessions?: HostCtx['sessions']
} = {}) {
  const routes = new Map<string, Handler>()
  const readSession = vi.fn(async () => ({ events }))
  const listEvents = vi.fn(async () => events.map((event) => ({ seq: event.seq })))
  const ctx = {
    webServer: {
      register: (route: { path: string; handler: unknown }) => {
        routes.set(route.path, route.handler as Handler)
      },
    },
    sessionQuery: { readSession, listEvents, ...hooks.sessionQuery },
    effect: (fn: () => unknown) => fn(),
    get: () => undefined,
    ...(hooks.sessions !== undefined ? { sessions: hooks.sessions } : {}),
  } as unknown as HostCtx
  apply(ctx)
  const handler = routes.get(TOOL_DETAIL_PATH)
  if (handler === undefined) throw new Error('tool-detail route not registered')
  return { handler, readSession, listEvents }
}

function postReq(
  payload: unknown,
  headers: HttpHeadersLike = { host: HOST },
  raw?: string,
): HttpRequestLike {
  const body = raw ?? JSON.stringify(payload)
  return {
    method: 'POST',
    headers,
    url: TOOL_DETAIL_PATH,
    async *[Symbol.asyncIterator]() {
      yield Buffer.from(body, 'utf8')
    },
  } as unknown as HttpRequestLike
}

interface FakeRes extends HttpResponseLike {
  status: number
  headers: Record<string, string>
  text: string
}

function fakeRes(): FakeRes {
  const res: FakeRes = {
    status: 0,
    headers: {},
    text: '',
    writeHead(status: number, headers: Record<string, string>) {
      res.status = status
      res.headers = headers ?? {}
    },
    end(body?: string | Buffer) {
      res.text = body === undefined ? '' : body.toString()
    },
  }
  return res
}

async function call(handler: Handler, req: HttpRequestLike): Promise<FakeRes> {
  const res = fakeRes()
  await handler(req, res)
  return res
}

const bodyOf = (res: FakeRes): { items?: ToolDetailItemLike[]; error?: string } =>
  JSON.parse(res.text || '{}')

const itemsOf = async (handler: Handler, sessionId: string, seqs: unknown[]): Promise<ToolDetailItemLike[]> => {
  const res = await call(handler, postReq({ sessionId, seqs }))
  expect(res.status).toBe(200)
  return bodyOf(res).items ?? []
}

/** A session whose steps are spread across 2 turns (turn/start events are not needed by this route). */
const session = (): SessionEventLike[] => [
  toolCall(10, 'bash', '{"command":"pwd"}', 'call_10'),
  toolResult(20, 'call_10', [{ type: 'text', text: 'stdout line' }]),
]

describe('POST /api/tool-detail — unclipped detail', () => {
  it('returns arguments and content far beyond ARGS_CAP / RESULT_CAP, untruncated', async () => {
    const args = 'a'.repeat(ARGS_CAP + 5_000)
    const text = 'b'.repeat(RESULT_CAP + 7_000)
    const events: SessionEventLike[] = [
      toolCall(10, 'bash', args, 'call_10'),
      toolResult(20, 'call_10', [{ type: 'text', text }]),
    ]
    const { handler, readSession } = makeHarness(events)

    const items = await itemsOf(handler, 'sess-full', [10])

    expect(items).toHaveLength(1)
    const item = items[0]
    expect(item.seq).toBe(10)
    expect(item.callId).toBe('call_10')
    expect(item.name).toBe('bash')
    expect(item.arguments).toBe(args)
    expect(item.argsBytes).toBe(args.length)
    expect(item.content).toEqual([{ type: 'text', text }])
    expect(item.contentBytes).toBe(text.length)
    expect(item.isError).toBe(false)
    expect(item.error).toBeNull()
    expect(item.truncated).toBeUndefined()
    // The raw session log was read (never the clipped /events cache).
    expect(readSession).toHaveBeenCalledWith('sess-full')
  })

  it('assembles the whole step: the call seq returns its result content too', async () => {
    const { handler } = makeHarness(session())
    const [item] = await itemsOf(handler, 'sess-1', [10])
    expect(item.arguments).toBe('{"command":"pwd"}')
    expect(item.content).toEqual([{ type: 'text', text: 'stdout line' }])
    expect(item.name).toBe('bash')
  })

  it('a result seq returns the content plus the arguments/name resolved by callId', async () => {
    const { handler } = makeHarness(session())
    const [item] = await itemsOf(handler, 'sess-2', [20])
    expect(item.seq).toBe(20)
    expect(item.callId).toBe('call_10')
    expect(item.name).toBe('bash')
    expect(item.arguments).toBe('{"command":"pwd"}')
    expect(item.argsBytes).toBe('{"command":"pwd"}'.length)
    expect(item.content).toEqual([{ type: 'text', text: 'stdout line' }])
  })

  it('merges every result of one callId in ascending seq order', async () => {
    const events: SessionEventLike[] = [
      toolCall(10, 'bash', 'ls', 'call_10'),
      toolResult(30, 'call_10', [{ type: 'text', text: ' second' }]),
      toolResult(20, 'call_10', [{ type: 'text', text: 'first' }]),
    ]
    const { handler } = makeHarness(events)
    const [item] = await itemsOf(handler, 'sess-merge', [10])
    expect(item.content).toEqual([
      { type: 'text', text: 'first' },
      { type: 'text', text: ' second' },
    ])
    expect(item.contentBytes).toBe('first'.length + ' second'.length)
  })

  it('a surfaceOp replace drops the content collected before it', async () => {
    // `surfaceOp` rides on the EVENT (host projection); the structural
    // SessionEventLike type does not spell that field out.
    const replace = {
      type: 'tool/result',
      seq: 40,
      surfaceOp: { op: 'replace', startSeq: 20, endSeq: 30 },
      data: { callId: 'call_10', message: { content: [{ type: 'text', text: 'PRUNED' }], source: { callId: 'call_10' } } },
    } as SessionEventLike & { surfaceOp?: unknown }
    const events: SessionEventLike[] = [
      toolCall(10, 'bash', 'cat huge.log', 'call_10'),
      toolResult(20, 'call_10', [{ type: 'text', text: 'x'.repeat(100) }]),
      replace,
    ]
    const { handler } = makeHarness(events)
    const [item] = await itemsOf(handler, 'sess-replace', [10])
    expect(item.content).toEqual([{ type: 'text', text: 'PRUNED' }])
    // F7: the replace never rewrites the call's arguments.
    expect(item.arguments).toBe('cat huge.log')
  })

  it('keeps image blocks as attachment references and dedupes by id', async () => {
    const events: SessionEventLike[] = [
      toolCall(10, 'read_image', '{"path":"a.png"}', 'call_10'),
      toolResult(20, 'call_10', [
        { type: 'image', attachment: { attachmentId: 'sha256:i1', mediaType: 'image/png', bytes: 10, width: 4, height: 3, name: 'a.png' } },
      ]),
      toolResult(30, 'call_10', [
        { type: 'image', attachment: { attachmentId: 'sha256:i1', mediaType: 'image/png', bytes: 10 } },
        { type: 'image', attachment: { attachmentId: 'sha256:i2', mediaType: 'image/jpeg', bytes: 11 } },
      ]),
    ]
    const { handler } = makeHarness(events)
    const [item] = await itemsOf(handler, 'sess-img', [10])
    expect(item.content).toEqual([
      { type: 'image', attachment: { attachmentId: 'sha256:i1', mediaType: 'image/png', bytes: 10, width: 4, height: 3, name: 'a.png' } },
      { type: 'image', attachment: { attachmentId: 'sha256:i2', mediaType: 'image/jpeg', bytes: 11 } },
    ])
    expect(item.contentBytes).toBe(0)
  })

  it('reports errors and reads their name from the error payload', async () => {
    const events: SessionEventLike[] = [
      toolCall(10, 'bash', 'sleep 60', 'call_10'),
      {
        type: 'tool/result',
        seq: 20,
        data: {
          callId: 'call_10',
          error: { name: 'TimeoutError', code: 'ETIMEDOUT' },
          message: { content: [{ type: 'text', text: 'command timed out' }], isError: true, source: { callId: 'call_10' } },
        },
      },
    ]
    const { handler } = makeHarness(events)
    const [item] = await itemsOf(handler, 'sess-err', [20])
    expect(item.isError).toBe(true)
    expect(item.error).toEqual({ name: 'TimeoutError', code: 'ETIMEDOUT' })
    expect(item.name).toBe('TimeoutError')
    expect(item.content).toEqual([{ type: 'text', text: 'command timed out' }])
  })

  it('accepts the projected wire shape (content under data.content) too', async () => {
    const events: SessionEventLike[] = [
      toolCall(10, 'bash', 'pwd', 'call_10'),
      { type: 'tool/result', seq: 20, data: { callId: 'call_10', content: [{ type: 'text', text: 'wire shape' }] } },
    ]
    const { handler } = makeHarness(events)
    const [item] = await itemsOf(handler, 'sess-wire', [10])
    expect(item.content).toEqual([{ type: 'text', text: 'wire shape' }])
  })

  it('serves a live session snapshot without touching sessionQuery', async () => {
    const events = session()
    const readSession = vi.fn(async () => ({ events: [] }))
    const { handler } = makeHarness([], {
      sessionQuery: { readSession, listEvents: vi.fn(async () => []) },
      sessions: { get: (id: string) => (id === 'live-1' ? { events } : undefined) },
    })
    const items = await itemsOf(handler, 'live-1', [10])
    expect(items[0].content).toEqual([{ type: 'text', text: 'stdout line' }])
    expect(readSession).not.toHaveBeenCalled()
  })

  it('never emits a body when arguments are absent', async () => {
    const { handler } = makeHarness([toolCall(10, 'bash', null, 'call_10')])
    const [item] = await itemsOf(handler, 'sess-noargs', [10])
    expect(item.arguments).toBeNull()
    expect(item.argsBytes).toBe(0)
    expect(item.content).toBeNull()
    expect(item.contentBytes).toBe(0)
  })
})

describe('POST /api/tool-detail — seqs semantics', () => {
  it('omits unknown seqs and non-tool events instead of failing', async () => {
    const events: SessionEventLike[] = [
      ...session(),
      { type: 'assistant/message', seq: 30, data: { message: { content: 'answer' } } },
    ]
    const { handler } = makeHarness(events)
    const items = await itemsOf(handler, 'sess-missing', [10, 999, 30])
    expect(items.map((item) => item.seq)).toEqual([10])
  })

  it('keeps the requested order and drops duplicates', async () => {
    const events: SessionEventLike[] = [
      toolCall(10, 'bash', 'a', 'c10'),
      toolCall(40, 'read', 'b', 'c40'),
      toolResult(20, 'c10', [{ type: 'text', text: 'A' }]),
    ]
    const { handler } = makeHarness(events)
    const items = await itemsOf(handler, 'sess-order', [40, 10, 40])
    expect(items.map((item) => item.seq)).toEqual([40, 10])
  })

  it('returns an empty items array for an empty seqs list', async () => {
    const { handler } = makeHarness(session())
    expect(await itemsOf(handler, 'sess-empty', [])).toEqual([])
  })

  it('accepts exactly 32 seqs and rejects 33', async () => {
    const events: SessionEventLike[] = Array.from({ length: 33 }, (_, i) => toolCall(i + 1, 'bash', `a${i}`, `c${i + 1}`))
    const { handler } = makeHarness(events)
    const okSeqs = Array.from({ length: TOOL_DETAIL_MAX_SEQS }, (_, i) => i + 1)
    expect((await call(handler, postReq({ sessionId: 'sess-32', seqs: okSeqs }))).status).toBe(200)
    const tooMany = await call(handler, postReq({ sessionId: 'sess-33', seqs: [...okSeqs, 33] }))
    expect(tooMany.status).toBe(400)
    expect(bodyOf(tooMany).error).toContain('32')
  })
})

describe('POST /api/tool-detail — response size cap (8 MiB / 4 MiB)', () => {
  it('clips a single oversized argument to 4 MiB and marks truncated', async () => {
    const args = 'a'.repeat(9 * 1024 * 1024)
    const { handler } = makeHarness([toolCall(10, 'bash', args, 'call_10')])
    const res = await call(handler, postReq({ sessionId: 'sess-big', seqs: [10] }))
    expect(res.status).toBe(200)
    expect(Buffer.byteLength(res.text)).toBeLessThanOrEqual(TOOL_DETAIL_MAX_RESPONSE_BYTES)
    const [item] = bodyOf(res).items ?? []
    expect(item.truncated).toBe(true)
    expect(Buffer.byteLength(item.arguments ?? '', 'utf8')).toBeLessThanOrEqual(TOOL_DETAIL_TEXT_CAP_BYTES)
    expect(Buffer.byteLength(item.arguments ?? '', 'utf8')).toBeGreaterThan(TOOL_DETAIL_TEXT_CAP_BYTES - 8)
    // The recorded size is still the ORIGINAL field size.
    expect(item.argsBytes).toBe(args.length)
  })

  it('clips oversized result text (content) inside the same budget', async () => {
    const text = 'b'.repeat(9 * 1024 * 1024)
    const { handler } = makeHarness([
      toolCall(10, 'bash', 'pwd', 'call_10'),
      toolResult(20, 'call_10', [{ type: 'text', text }]),
    ])
    const res = await call(handler, postReq({ sessionId: 'sess-bigtext', seqs: [10] }))
    expect(res.status).toBe(200)
    expect(Buffer.byteLength(res.text)).toBeLessThanOrEqual(TOOL_DETAIL_MAX_RESPONSE_BYTES)
    const [item] = bodyOf(res).items ?? []
    expect(item.truncated).toBe(true)
    const block = item.content?.[0]
    expect(Buffer.byteLength(block?.text ?? '', 'utf8')).toBeLessThanOrEqual(TOOL_DETAIL_TEXT_CAP_BYTES)
    expect(item.contentBytes).toBe(text.length)
  })

  it('shrinks the per-field cap further when many fields still overflow 8 MiB', async () => {
    const each = 'c'.repeat(5 * 1024 * 1024)
    const events: SessionEventLike[] = [
      toolCall(10, 'bash', each, 'c10'),
      toolCall(11, 'bash', each, 'c11'),
    ]
    const { handler } = makeHarness(events)
    const res = await call(handler, postReq({ sessionId: 'sess-many', seqs: [10, 11] }))
    expect(res.status).toBe(200)
    expect(Buffer.byteLength(res.text)).toBeLessThanOrEqual(TOOL_DETAIL_MAX_RESPONSE_BYTES)
    const items = bodyOf(res).items ?? []
    expect(items).toHaveLength(2)
    for (const item of items) {
      expect(item.truncated).toBe(true)
      expect(Buffer.byteLength(item.arguments ?? '', 'utf8')).toBeLessThanOrEqual(TOOL_DETAIL_TEXT_CAP_BYTES)
      expect(item.argsBytes).toBe(each.length)
    }
  })

  it('slices on a code-point boundary (no broken character at the cut)', async () => {
    // 3-byte characters: 3 Mi chars = 9 MiB, and a 4 MiB byte cap lands
    // mid-character, so the clip must back off to the previous boundary.
    const args = '中'.repeat(3 * 1024 * 1024)
    const { handler } = makeHarness([toolCall(10, 'bash', args, 'c10')])
    const res = await call(handler, postReq({ sessionId: 'sess-utf8', seqs: [10] }))
    expect(res.status).toBe(200)
    const [item] = bodyOf(res).items ?? []
    expect(item.truncated).toBe(true)
    expect(item.arguments).not.toContain('\uFFFD')
    expect(item.arguments).toBe(args.slice(0, (item.arguments ?? '').length))
    expect(Buffer.byteLength(item.arguments ?? '', 'utf8')).toBeLessThanOrEqual(TOOL_DETAIL_TEXT_CAP_BYTES)
  })

  it('leaves a small response untouched and unflagged', async () => {
    const { handler } = makeHarness(session())
    const res = await call(handler, postReq({ sessionId: 'sess-small', seqs: [10] }))
    expect(res.status).toBe(200)
    expect(bodyOf(res).items?.[0].truncated).toBeUndefined()
    expect(Buffer.byteLength(res.text)).toBeLessThan(1024)
  })
})

describe('POST /api/tool-detail — guards', () => {
  it('403 for an untrusted Host / cross-site request', async () => {
    const { handler } = makeHarness(session())
    expect((await call(handler, postReq({ sessionId: 's', seqs: [10] }, { host: 'evil.example.com' }))).status).toBe(403)
    expect((await call(handler, postReq({ sessionId: 's', seqs: [10] }, { host: HOST, 'sec-fetch-site': 'cross-site' }))).status).toBe(403)
  })

  it('405 for a non-POST method', async () => {
    const { handler } = makeHarness(session())
    const res = await call(handler, {
      method: 'GET',
      headers: { host: HOST },
      url: TOOL_DETAIL_PATH,
      async *[Symbol.asyncIterator]() {},
    } as unknown as HttpRequestLike)
    expect(res.status).toBe(405)
  })

  it('400 when sessionId is missing / blank, or seqs is not an array', async () => {
    const { handler } = makeHarness(session())
    expect((await call(handler, postReq({ seqs: [10] }))).status).toBe(400)
    expect((await call(handler, postReq({ sessionId: '', seqs: [10] }))).status).toBe(400)
    expect((await call(handler, postReq({ sessionId: 's' }))).status).toBe(400)
    expect((await call(handler, postReq({ sessionId: 's', seqs: 'nope' }))).status).toBe(400)
    expect((await call(handler, postReq({ sessionId: 's', seqs: { 0: 1 } }))).status).toBe(400)
  })

  it('413 for an oversized body (content-length pre-check and streamed cap)', async () => {
    const { handler } = makeHarness(session())
    const declared = await call(handler, {
      method: 'POST',
      headers: { host: HOST, 'content-length': String(1024 * 1024) },
      url: TOOL_DETAIL_PATH,
      async *[Symbol.asyncIterator]() {
        yield Buffer.from('{}', 'utf8')
      },
    } as unknown as HttpRequestLike)
    expect(declared.status).toBe(413)
    const streamed = await call(handler, postReq({}, { host: HOST }, JSON.stringify({ sessionId: 's', pad: 'x'.repeat(70 * 1024) })))
    expect(streamed.status).toBe(413)
  })

  it('404 session-not-found when the session cannot be read', async () => {
    const { handler } = makeHarness([], {
      sessionQuery: {
        readSession: vi.fn(async () => { throw new Error('no such session') }),
        listEvents: vi.fn(async () => []),
      },
    })
    const res = await call(handler, postReq({ sessionId: 'missing', seqs: [1] }))
    expect(res.status).toBe(404)
    expect(bodyOf(res).error).toBe('session-not-found')
  })

  it('ignores non-numeric seq entries instead of failing the whole request', async () => {
    const { handler } = makeHarness(session())
    const items = await itemsOf(handler, 'sess-junk', [10, 'x', null, 999])
    expect(items.map((item) => item.seq)).toEqual([10])
  })
})

describe('fetchToolDetail — client transport (§10.3.4)', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  const okBody = { items: [{ seq: 10, callId: 'c10', name: 'bash', arguments: 'full', argsBytes: 4, content: null, contentBytes: 0, isError: false, error: null }] }

  it('POSTs the session + seqs and returns the parsed items', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => okBody }))
    vi.stubGlobal('fetch', fetchMock)
    const { fetchToolDetail } = await import('../src/client/useTrail')

    const result = await fetchToolDetail('sess-1', [10])

    expect(result).toEqual({ ok: true, items: okBody.items })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${window.location.origin}/trace-inspect/api/tool-detail`)
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ sessionId: 'sess-1', seqs: [10] })
  })

  it('never throws: a non-2xx answer is reason "http"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 413, json: async () => ({ error: 'payload too large' }) })))
    const { fetchToolDetail } = await import('../src/client/useTrail')
    expect(await fetchToolDetail('sess-1', [10])).toEqual({ ok: false, reason: 'http' })
  })

  it('never throws: a rejected fetch is reason "network" (abort included)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('aborted', 'AbortError') }))
    const { fetchToolDetail } = await import('../src/client/useTrail')
    expect(await fetchToolDetail('sess-1', [10], new AbortController().signal)).toEqual({ ok: false, reason: 'network' })
  })

  it('never throws: a 2xx body without items is reason "unavailable"', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ nope: true }) })))
    const { fetchToolDetail } = await import('../src/client/useTrail')
    expect(await fetchToolDetail('sess-1', [10])).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('short-circuits an empty seqs list without a request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { fetchToolDetail } = await import('../src/client/useTrail')
    expect(await fetchToolDetail('sess-1', [])).toEqual({ ok: true, items: [] })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('exposes the frozen ToolDetailItem shape to the UI', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => okBody })))
    const { fetchToolDetail } = await import('../src/client/useTrail')
    const result = await fetchToolDetail('sess-1', [10])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.items[0].arguments).toBe('full')
      expect(result.items[0].truncated).toBeUndefined()
    }
  })
})
