/**
 * attachment-route.spec.ts — T7 host contract §10.3.1:
 * GET /trace-inspect/api/attachment?sessionId=&attachmentId=
 *
 * The route is SESSION-AUTHORIZED: bytes are read only when the session's own
 * event stream carries an image block naming that attachmentId (never a direct
 * id read), the fence / method / status vocabulary is shared with /events, and
 * every failing read lands on 404 instead of an uncaught error.
 */
import { describe, expect, it, vi } from 'vitest'
import {
  apply,
  ATTACHMENT_AUTH_MAX_SESSIONS,
  ATTACHMENT_AUTH_TTL_MS,
  ATTACHMENT_PATH,
} from '../src/index'
import type {
  HostCtx,
  HttpHeadersLike,
  HttpRequestLike,
  HttpResponseLike,
  SessionEventLike,
} from '../src/context-types'

type Handler = (req: HttpRequestLike, res: HttpResponseLike) => Promise<void>

interface AttachmentRefLike {
  attachmentId: string
  mediaType: string
  bytes?: number
  width?: number
  height?: number
  name?: string
}

const HOST = '127.0.0.1:19487'

/** One image block in the RAW session-log shape. */
function rawImageEvent(seq: number, ref: AttachmentRefLike): SessionEventLike {
  return {
    type: 'tool/result',
    seq,
    data: { callId: `c${seq}`, message: { content: [{ type: 'image', attachment: { ...ref } }] } },
  }
}

/** One image block in the PROJECTED wire shape (what /events caches). */
function projectedImageEvent(seq: number, ref: AttachmentRefLike): SessionEventLike {
  return {
    type: 'tool/result',
    seq,
    data: { callId: `c${seq}`, content: [{ type: 'image', attachment: { ...ref } }] },
  }
}

const PNG = (id: string, extra: Partial<AttachmentRefLike> = {}): AttachmentRefLike => ({
  attachmentId: id,
  mediaType: 'image/png',
  bytes: 2048,
  width: 4,
  height: 3,
  ...extra,
})

interface HarnessOptions {
  events?: SessionEventLike[]
  /** Present ⇒ `ctx.get('attachments')`; absent ⇒ the service is unavailable. */
  attachments?: unknown
  sessionQuery?: Partial<HostCtx['sessionQuery']>
}

function makeHarness(options: HarnessOptions = {}) {
  const routes = new Map<string, Handler>()
  const readSession = vi.fn(async () => ({ events: options.events ?? [] }))
  const listEvents = vi.fn(async () => (options.events ?? []).map((event) => ({ seq: event.seq })))
  const services: Record<string, unknown> = {}
  if ('attachments' in options) services.attachments = options.attachments
  const ctx = {
    webServer: {
      register: (route: { path: string; handler: unknown }) => {
        routes.set(route.path, route.handler as Handler)
      },
    },
    sessionQuery: { readSession, listEvents, ...options.sessionQuery },
    effect: (fn: () => unknown) => fn(),
    get: (key: string) => services[key],
  } as unknown as HostCtx
  apply(ctx)
  const handler = routes.get(ATTACHMENT_PATH)
  if (handler === undefined) throw new Error('attachment route not registered')
  return { ctx, routes, handler, readSession, listEvents }
}

function getReq(url: string, headers: HttpHeadersLike = { host: HOST }): HttpRequestLike {
  return {
    method: 'GET',
    headers,
    url,
    async *[Symbol.asyncIterator]() {
      // GET carries no body; the handler must not touch the stream.
    },
  } as unknown as HttpRequestLike
}

function postReq(url: string, headers: HttpHeadersLike = { host: HOST }): HttpRequestLike {
  return {
    method: 'POST',
    headers,
    url,
    async *[Symbol.asyncIterator]() {
      yield Buffer.from('{}', 'utf8')
    },
  } as unknown as HttpRequestLike
}

interface FakeRes extends HttpResponseLike {
  status: number
  headers: Record<string, string>
  raw: Buffer
}

function fakeRes(): FakeRes {
  const res: FakeRes = {
    status: 0,
    headers: {},
    raw: Buffer.alloc(0),
    writeHead(status: number, headers: Record<string, string>) {
      res.status = status
      res.headers = headers ?? {}
    },
    end(body?: string | Buffer) {
      if (body === undefined) res.raw = Buffer.alloc(0)
      else if (Buffer.isBuffer(body)) res.raw = body
      else res.raw = Buffer.from(body, 'utf8')
    },
  }
  return res
}

async function call(handler: Handler, req: HttpRequestLike): Promise<FakeRes> {
  const res = fakeRes()
  await handler(req, res)
  return res
}

const url = (sessionId: string | null, attachmentId: string | null, raw = false): string => {
  const parts: string[] = []
  if (sessionId !== null) {
    parts.push(`sessionId=${raw ? sessionId : encodeURIComponent(sessionId)}`)
  }
  if (attachmentId !== null) {
    parts.push(`attachmentId=${raw ? attachmentId : encodeURIComponent(attachmentId)}`)
  }
  return `${ATTACHMENT_PATH}?${parts.join('&')}`
}

const jsonOf = (res: FakeRes): { error?: string } => JSON.parse(res.raw.toString('utf8') || '{}')

describe('GET /api/attachment — session-authorized bytes', () => {
  it('serves the bytes with the block mediaType + no-sniff + private cache headers', async () => {
    const ref = PNG('sha256:aa11', { name: 'shot.png' })
    const readImage = vi.fn(async () => ({ ref, data: new Uint8Array([1, 2, 3, 4]) }))
    const { handler, readSession } = makeHarness({
      events: [rawImageEvent(7, ref)],
      attachments: { readImage },
    })

    const res = await call(handler, getReq(url('sess-1', ref.attachmentId)))

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('image/png')
    expect(res.headers['cache-control']).toBe('private, max-age=300')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['content-length']).toBe('4')
    expect([...res.raw]).toEqual([1, 2, 3, 4])
    // The ref handed to readImage comes from the EVENT block, verbatim.
    expect(readImage).toHaveBeenCalledTimes(1)
    expect(readImage).toHaveBeenCalledWith({
      attachmentId: 'sha256:aa11',
      mediaType: 'image/png',
      bytes: 2048,
      width: 4,
      height: 3,
      name: 'shot.png',
    })
    expect(readSession).toHaveBeenCalledWith('sess-1')
  })

  it('authorizes from a LIVE session snapshot without touching sessionQuery', async () => {
    const ref = PNG('sha256:live')
    const readImage = vi.fn(async () => ({ ref, data: new Uint8Array([9]) }))
    const routes = new Map<string, Handler>()
    const readSession = vi.fn(async () => ({ events: [] }))
    const ctx = {
      webServer: {
        register: (route: { path: string; handler: unknown }) => {
          routes.set(route.path, route.handler as Handler)
        },
      },
      sessionQuery: { readSession, listEvents: vi.fn(async () => []) },
      effect: (fn: () => unknown) => fn(),
      sessions: { get: (id: string) => (id === 'live-sess' ? { snapshotEvents: () => [rawImageEvent(3, ref)] } : undefined) },
      get: () => ({ readImage }),
    } as unknown as HostCtx
    apply(ctx)

    const res = await call(routes.get(ATTACHMENT_PATH) as Handler, getReq(url('live-sess', ref.attachmentId)))

    expect(res.status).toBe(200)
    expect(readSession).not.toHaveBeenCalled()
  })

  it('authorizes from the PROJECTED wire shape too (data.content, cached by /events)', async () => {
    const ref = PNG('sha256:proj')
    const readImage = vi.fn(async () => ({ ref, data: new Uint8Array([5, 6]) }))
    const { handler } = makeHarness({
      events: [projectedImageEvent(11, ref)],
      attachments: { readImage },
    })
    const res = await call(handler, getReq(url('sess-proj', ref.attachmentId)))
    expect(res.status).toBe(200)
    expect([...res.raw]).toEqual([5, 6])
  })

  it('never echoes a non-image mediaType as the content-type', async () => {
    const ref = PNG('sha256:sneaky', { mediaType: 'text/html' })
    const readImage = vi.fn(async () => ({ ref, data: new Uint8Array([1]) }))
    const { handler } = makeHarness({ events: [rawImageEvent(5, ref)], attachments: { readImage } })
    const res = await call(handler, getReq(url('sess-media', ref.attachmentId)))
    expect(res.status).toBe(404)
    expect(readImage).not.toHaveBeenCalled()
  })
})

describe('GET /api/attachment — authorization is the session log, never the id', () => {
  it('404 attachment-not-found and NO byte read when no image block references the id', async () => {
    const readImage = vi.fn(async () => ({ ref: PNG('x'), data: new Uint8Array([1]) }))
    const { handler } = makeHarness({
      events: [rawImageEvent(7, PNG('sha256:referenced'))],
      attachments: { readImage },
    })

    const res = await call(handler, getReq(url('sess-2', 'sha256:never-referenced')))

    expect(res.status).toBe(404)
    expect(jsonOf(res).error).toBe('attachment-not-found')
    // The id alone must never be read (enumeration defense).
    expect(readImage).not.toHaveBeenCalled()
  })

  it('404 when the session has no image blocks at all', async () => {
    const readImage = vi.fn()
    const { handler } = makeHarness({
      events: [{ type: 'tool/result', seq: 1, data: { callId: 'c1', message: { content: [{ type: 'text', text: 'no image' }] } } }],
      attachments: { readImage },
    })
    const res = await call(handler, getReq(url('sess-text', 'sha256:none')))
    expect(res.status).toBe(404)
    expect(readImage).not.toHaveBeenCalled()
  })

  it('404 session-not-found when the session cannot be read (no uncaught error)', async () => {
    const { handler } = makeHarness({
      attachments: { readImage: vi.fn() },
      sessionQuery: { readSession: vi.fn(async () => { throw new Error('no such session') }) },
    })
    const res = await call(handler, getReq(url('missing', 'sha256:x')))
    expect(res.status).toBe(404)
    expect(jsonOf(res).error).toBe('session-not-found')
  })

  it('404 attachments-unavailable when ctx.get("attachments") is undefined', async () => {
    const { handler } = makeHarness({ events: [rawImageEvent(7, PNG('sha256:a'))] })
    const res = await call(handler, getReq(url('sess-3', 'sha256:a')))
    expect(res.status).toBe(404)
    expect(jsonOf(res).error).toBe('attachments-unavailable')
  })

  it('maps a readImage rejection to 404 attachment-unavailable', async () => {
    const readImage = vi.fn(async () => { throw new Error('integrity mismatch') })
    const { handler } = makeHarness({ events: [rawImageEvent(7, PNG('sha256:b'))], attachments: { readImage } })
    const res = await call(handler, getReq(url('sess-4', 'sha256:b')))
    expect(res.status).toBe(404)
    expect(jsonOf(res).error).toBe('attachment-unavailable')
    // nothing escaped as an uncaught error
    expect(res.raw.toString('utf8')).toContain('attachment-unavailable')
  })

  it('404 when readImage resolves without byte data (or with empty bytes)', async () => {
    for (const stored of [{ ref: {} }, { ref: {}, data: null }, { ref: {}, data: new Uint8Array(0) }]) {
      const readImage = vi.fn(async () => stored)
      const { handler } = makeHarness({ events: [rawImageEvent(7, PNG('sha256:empty'))], attachments: { readImage } })
      const res = await call(handler, getReq(url(`sess-empty-${JSON.stringify(stored)}`, 'sha256:empty')))
      expect(res.status).toBe(404)
      expect(jsonOf(res).error).toBe('attachment-unavailable')
    }
  })
})

describe('GET /api/attachment — missing dimensions are completed, never thrown', () => {
  it('retries with neutral width/height when the block omitted them', async () => {
    const ref: AttachmentRefLike = { attachmentId: 'sha256:nodims', mediaType: 'image/webp' }
    const readImage = vi.fn()
      .mockRejectedValueOnce(new Error('width/height required'))
      .mockResolvedValueOnce({ ref, data: new Uint8Array([7, 7]) })
    const { handler } = makeHarness({ events: [rawImageEvent(7, ref)], attachments: { readImage } })

    const res = await call(handler, getReq(url('sess-nodims', ref.attachmentId)))

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('image/webp')
    expect(readImage).toHaveBeenCalledTimes(2)
    expect(readImage.mock.calls[0][0]).toEqual({ attachmentId: 'sha256:nodims', mediaType: 'image/webp' })
    expect(readImage.mock.calls[1][0]).toEqual({
      attachmentId: 'sha256:nodims',
      mediaType: 'image/webp',
      bytes: 0,
      width: 0,
      height: 0,
    })
  })

  it('does not retry (and 404s) when the complete ref is refused', async () => {
    const readImage = vi.fn(async () => { throw new Error('gone') })
    const { handler } = makeHarness({ events: [rawImageEvent(7, PNG('sha256:full'))], attachments: { readImage } })
    const res = await call(handler, getReq(url('sess-full', 'sha256:full')))
    expect(res.status).toBe(404)
    expect(readImage).toHaveBeenCalledTimes(1)
  })

  it('404s when the neutral retry fails too', async () => {
    const ref: AttachmentRefLike = { attachmentId: 'sha256:bad', mediaType: 'image/png' }
    const readImage = vi.fn(async () => { throw new Error('nope') })
    const { handler } = makeHarness({ events: [rawImageEvent(7, ref)], attachments: { readImage } })
    const res = await call(handler, getReq(url('sess-bad', ref.attachmentId)))
    expect(res.status).toBe(404)
    expect(jsonOf(res).error).toBe('attachment-unavailable')
    expect(readImage).toHaveBeenCalledTimes(2)
  })
})

describe('GET /api/attachment — guards', () => {
  it('403 for a non-loopback Host or a cross-site marker', async () => {
    const { handler } = makeHarness({ events: [rawImageEvent(1, PNG('i1'))], attachments: { readImage: vi.fn() } })
    const refused = await call(handler, getReq(url('s', 'i1'), { host: 'evil.example.com' }))
    expect(refused.status).toBe(403)
    const crossSite = await call(handler, getReq(url('s', 'i1'), { host: HOST, 'sec-fetch-site': 'cross-site' }))
    expect(crossSite.status).toBe(403)
    const badOrigin = await call(handler, getReq(url('s', 'i1'), { host: HOST, origin: 'http://evil.example.com' }))
    expect(badOrigin.status).toBe(403)
    // A browser <img> GET has no Origin at all — that must pass the fence and
    // only fail later on authorization.
    const noOrigin = await call(handler, getReq(url('s', 'nope'), { host: HOST }))
    expect(noOrigin.status).toBe(404)
  })

  it('405 for a non-GET method (and it never touches the service)', async () => {
    const readImage = vi.fn()
    const { handler } = makeHarness({ events: [rawImageEvent(1, PNG('i1'))], attachments: { readImage } })
    const res = await call(handler, postReq(url('s', 'i1')))
    expect(res.status).toBe(405)
    expect(readImage).not.toHaveBeenCalled()
  })

  it('400 for a missing / blank / oversized id', async () => {
    const { handler } = makeHarness({ events: [rawImageEvent(1, PNG('i1'))], attachments: { readImage: vi.fn() } })
    expect((await call(handler, getReq(ATTACHMENT_PATH))).status).toBe(400)
    expect((await call(handler, getReq(url(null, 'i1')))).status).toBe(400)
    expect((await call(handler, getReq(url('s', null)))).status).toBe(400)
    expect((await call(handler, getReq(url('   ', 'i1')))).status).toBe(400)
    expect((await call(handler, getReq(url('s', '')))).status).toBe(400)
    const longId = 'a'.repeat(513)
    const res = await call(handler, getReq(url('s', longId)))
    expect(res.status).toBe(400)
    expect(jsonOf(res).error).toContain('required')
  })

  it('decodes URL-encoded ids (sha256:… with / and +)', async () => {
    const ref = PNG('sha256:aa/bb+cc')
    const readImage = vi.fn(async () => ({ ref, data: new Uint8Array([3]) }))
    const { handler } = makeHarness({ events: [rawImageEvent(2, ref)], attachments: { readImage } })
    const res = await call(handler, getReq(url('sess enc-1', ref.attachmentId)))
    expect(res.status).toBe(400)

    // A whitespace-free session id round-trips through encodeURIComponent.
    const ok = await call(handler, getReq(url('sess-enc-1', ref.attachmentId)))
    expect(ok.status).toBe(200)
    expect(readImage).toHaveBeenCalledWith(expect.objectContaining({ attachmentId: 'sha256:aa/bb+cc' }))
  })
})

describe('GET /api/attachment — authorization cache (LRU ≤ 16 sessions, TTL ≤ 10s)', () => {
  const eventsFor = (id: string): SessionEventLike[] => [rawImageEvent(1, PNG(id))]

  it('scans the session log once per session inside the TTL', async () => {
    const readSession = vi.fn(async (id: string) => ({ events: eventsFor(`sha256:${id}`) }))
    const readImage = vi.fn(async () => ({ ref: {}, data: new Uint8Array([1]) }))
    const { handler } = makeHarness({
      attachments: { readImage },
      sessionQuery: { readSession, listEvents: vi.fn(async () => []) },
    })

    expect((await call(handler, getReq(url('cache-a', 'sha256:cache-a')))).status).toBe(200)
    expect((await call(handler, getReq(url('cache-a', 'sha256:cache-a')))).status).toBe(200)
    expect(readSession).toHaveBeenCalledTimes(1)
    expect(readImage).toHaveBeenCalledTimes(2)
  })

  it('re-scans once the TTL lapses', async () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(0)
      const readSession = vi.fn(async (id: string) => ({ events: eventsFor(`sha256:${id}`) }))
      const readImage = vi.fn(async () => ({ ref: {}, data: new Uint8Array([1]) }))
      const { handler } = makeHarness({
        attachments: { readImage },
        sessionQuery: { readSession, listEvents: vi.fn(async () => []) },
      })
      await call(handler, getReq(url('cache-ttl', 'sha256:cache-ttl')))
      await call(handler, getReq(url('cache-ttl', 'sha256:cache-ttl')))
      expect(readSession).toHaveBeenCalledTimes(1)
      vi.setSystemTime(ATTACHMENT_AUTH_TTL_MS + 1)
      await call(handler, getReq(url('cache-ttl', 'sha256:cache-ttl')))
      expect(readSession).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('evicts the least recently used session past the session budget', async () => {
    const readSession = vi.fn(async (id: string) => ({ events: eventsFor(`sha256:${id}`) }))
    const readImage = vi.fn(async () => ({ ref: {}, data: new Uint8Array([1]) }))
    const { handler } = makeHarness({
      attachments: { readImage },
      sessionQuery: { readSession, listEvents: vi.fn(async () => []) },
    })

    // ATTACHMENT_AUTH_MAX_SESSIONS + 1 distinct sessions: the first is evicted.
    for (let i = 0; i <= ATTACHMENT_AUTH_MAX_SESSIONS; i += 1) {
      const id = `lru-${i}`
      expect((await call(handler, getReq(url(id, `sha256:${id}`)))).status).toBe(200)
    }
    expect(readSession).toHaveBeenCalledTimes(ATTACHMENT_AUTH_MAX_SESSIONS + 1)
    // Re-touching the evicted session pays one fresh scan…
    await call(handler, getReq(url('lru-0', 'sha256:lru-0')))
    expect(readSession).toHaveBeenCalledTimes(ATTACHMENT_AUTH_MAX_SESSIONS + 2)
    // …while the newest one is still cached.
    await call(handler, getReq(url(`lru-${ATTACHMENT_AUTH_MAX_SESSIONS}`, `sha256:lru-${ATTACHMENT_AUTH_MAX_SESSIONS}`)))
    expect(readSession).toHaveBeenCalledTimes(ATTACHMENT_AUTH_MAX_SESSIONS + 2)
  })
})
