/**
 * verify-v050.spec.ts — T10 independent adversarial verification of the
 * **v0.5.0 increment** (contract `docs/detail-contract-v1.md` §10–§11).
 *
 * Independent means: this file re-derives the v0.5.0 claims from the source and
 * the frozen contract, with its own fixtures/harness, and attacks the edges the
 * implementation's own tests do not (cross-session authorization, id shape
 * boundaries, UTF-8 clipping boundaries, response-size caps, F7 field-by-field
 * preservation, F8 envelope/footer boundaries, collapsed-DOM invariants, the
 * on-demand inflight dedupe, and the no-new-runtime-dependency norm).
 *
 * Deterministic by construction: no network, no real session log, no /tmp
 * fixture files. The only non-hermetic reads are the repository's own files
 * (package.json / CHANGELOG.md / pnpm-lock.yaml / lib/*.js) and `git show
 * HEAD:package.json` for the dependency baseline — all local and required by
 * the task.
 *
 * Groups:
 *   A · attachment route authorization (防越权)
 *   B · /tool-detail route (caps, callId aggregation, byte limits)
 *   C · mergedFrom (model)
 *   D · F7 (replace rewrites result only)
 *   E · F8 (read envelope unwrap + footer stripping)
 *   F · components (ZoomOverlay / lazy detail / thumbnails / collapsed DOM)
 *   G · norms (no new runtime deps, no innerHTML/eval, token-only colors)
 *   H · artifact consistency (version/CHANGELOG, src↔lib, host seeds)
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  apply,
  ATTACHMENT_ID_MAX,
  ATTACHMENT_AUTH_MAX_SESSIONS,
  ATTACHMENT_AUTH_TTL_MS,
  ATTACHMENT_PATH,
  TOOL_DETAIL_MAX_RESPONSE_BYTES,
  TOOL_DETAIL_MAX_SEQS,
  TOOL_DETAIL_PATH,
  TOOL_DETAIL_TEXT_CAP_BYTES,
  type ToolDetailItem,
} from '../src/index'
import type {
  HostCtx,
  HttpHeadersLike,
  HttpRequestLike,
  HttpResponseLike,
  SessionEventLike,
} from '../src/context-types'
import {
  compact,
  foldTurns,
  stepsOf,
  TrailFolder,
  type TrailResult,
  type TrailStep,
  type TrailTurn,
} from '../src/trail-model'
import { attachmentUrl } from '../src/client/attachment-url'
import { looksLikeMarkdown, MarkdownResult, unwrapFileResult } from '../src/client/markdown-result'
import { markdownLabels } from '../src/client/markdown-labels'
import { setPrimitivesForTest, type PrimitivesModule } from '../src/client/ui-primitives'
import { TrailImages, ZoomOverlay } from '../src/client/ZoomOverlay'
import { TrailTab } from '../src/client/TrailTab'
import { t, type Dict } from '../src/client/locales'
import { trailCss } from '../src/client/styles'
import type { ToolDetailResult } from '../src/client/useTrail'

const ROOT = resolve(__dirname, '..')
const HOST = '127.0.0.1:19487'

afterEach(() => {
  cleanup()
  setPrimitivesForTest(undefined)
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ── Host route harness ───────────────────────────────────────────────────

type Handler = (req: HttpRequestLike, res: HttpResponseLike) => Promise<void>

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

interface HarnessOptions {
  events?: SessionEventLike[]
  eventsBySession?: Record<string, SessionEventLike[]>
  /** Present ⇒ `ctx.get('attachments')` returns it; absent ⇒ service unavailable. */
  attachments?: unknown
  readSession?: (sessionId: string) => Promise<{ events: SessionEventLike[] }>
}

function makeHarness(options: HarnessOptions = {}) {
  const routes = new Map<string, Handler>()
  const bySession = options.eventsBySession ?? {}
  const eventsFor = (id: string): SessionEventLike[] => bySession[id] ?? options.events ?? []
  const readSession = options.readSession ?? vi.fn(async (id: string) => ({ events: eventsFor(id) }))
  const listEvents = vi.fn(async (id: string) => eventsFor(id).map((event) => ({ seq: event.seq })))
  const services: Record<string, unknown> = {}
  if ('attachments' in options) services.attachments = options.attachments
  const ctx = {
    webServer: {
      register: (route: { path: string; handler: unknown }) => {
        routes.set(route.path, route.handler as Handler)
      },
    },
    sessionQuery: { readSession, listEvents },
    effect: (fn: () => unknown) => fn(),
    get: (key: string) => services[key],
  } as unknown as HostCtx
  apply(ctx)
  const handlerOf = (path: string): Handler => {
    const handler = routes.get(path)
    if (handler === undefined) throw new Error(`route not registered: ${path}`)
    return handler
  }
  return { routes, handlerOf, readSession, listEvents }
}

function makeReq(
  method: string,
  url: string,
  headers: Record<string, string> = { host: HOST },
  body?: string,
): HttpRequestLike {
  return {
    method,
    headers: headers as HttpHeadersLike,
    url,
    async *[Symbol.asyncIterator]() {
      if (body !== undefined) yield Buffer.from(body, 'utf8')
    },
  } as unknown as HttpRequestLike
}

async function call(handler: Handler, request: HttpRequestLike): Promise<FakeRes> {
  const res = fakeRes()
  await handler(request, res)
  return res
}

const jsonOf = (res: FakeRes): Record<string, unknown> =>
  JSON.parse(res.raw.toString('utf8') || '{}') as Record<string, unknown>

const postDetail = (sessionId: string, seqs: unknown, host = HOST): HttpRequestLike =>
  makeReq('POST', TOOL_DETAIL_PATH, { host, 'content-type': 'application/json' },
    JSON.stringify({ sessionId, seqs }))

// ── Attachment fixtures ──────────────────────────────────────────────────

interface RefLike {
  attachmentId: string
  mediaType: string
  bytes?: number
  width?: number
  height?: number
  name?: string
}

const png = (id: string, extra: Partial<RefLike> = {}): RefLike => ({
  attachmentId: id,
  mediaType: 'image/png',
  bytes: 2048,
  width: 4,
  height: 3,
  ...extra,
})

/** One tool/result event in the RAW session-log shape (data.message.content). */
function rawImage(seq: number, refs: RefLike[], callId = `c${seq}`): SessionEventLike {
  return {
    type: 'tool/result',
    seq,
    data: { callId, message: { content: refs.map((ref) => ({ type: 'image', attachment: { ...ref } })) } },
  }
}

/** One tool/result event in the PROJECTED wire shape (data.content). */
function projectedImage(seq: number, refs: RefLike[], callId = `c${seq}`): SessionEventLike {
  return {
    type: 'tool/result',
    seq,
    data: { callId, content: refs.map((ref) => ({ type: 'image', attachment: { ...ref } })) },
  }
}

const attUrl = (sessionId: string, attachmentId: string): string =>
  `${ATTACHMENT_PATH}?sessionId=${encodeURIComponent(sessionId)}&attachmentId=${encodeURIComponent(attachmentId)}`

const storedBytes = (...bytes: number[]) => ({
  readImage: vi.fn(async () => ({ data: new Uint8Array(bytes) })),
})

// ═════════════════════════════════════════════════════════════════════════
// A · attachment route authorization
// ═════════════════════════════════════════════════════════════════════════

describe('A · GET /api/attachment — session authorization (防越权)', () => {
  it('A1 事件流无引用 → 404 attachment-not-found 且绝不调用 readImage', async () => {
    const readImage = vi.fn(async () => ({ data: new Uint8Array([1]) }))
    const { handlerOf } = makeHarness({
      events: [rawImage(7, [png('sha256:referenced')])],
      attachments: { readImage },
    })
    const res = await call(handlerOf(ATTACHMENT_PATH), makeReq('GET', attUrl('v050-a1', 'sha256:never-referenced')))
    expect(res.status).toBe(404)
    expect(jsonOf(res).error).toBe('attachment-not-found')
    expect(readImage).not.toHaveBeenCalled()
  })

  it('A2 只有别的 session 引用 → 404；缓存按 session 隔离（不互相命中、不重复扫描）', async () => {
    const readImage = vi.fn(async () => ({ data: new Uint8Array([1, 2, 3]) }))
    const { handlerOf, readSession } = makeHarness({
      eventsBySession: {
        'v050-a2-A': [rawImage(3, [png('sha256:A')])],
        'v050-a2-B': [rawImage(4, [png('sha256:B')])],
      },
      attachments: { readImage },
    })
    const handler = handlerOf(ATTACHMENT_PATH)

    expect((await call(handler, makeReq('GET', attUrl('v050-a2-A', 'sha256:A')))).status).toBe(200)
    // B 的日志里没有 A 的 id —— 即使 A 已把 sha256:A 授权进缓存，B 也必须 404。
    const cross = await call(handler, makeReq('GET', attUrl('v050-a2-B', 'sha256:A')))
    expect(cross.status).toBe(404)
    expect(jsonOf(cross).error).toBe('attachment-not-found')
    expect(readImage).toHaveBeenCalledTimes(1)

    expect((await call(handler, makeReq('GET', attUrl('v050-a2-B', 'sha256:B')))).status).toBe(200)
    // A 的缓存里也不会有 B 的 id（反向污染检查）。
    expect((await call(handler, makeReq('GET', attUrl('v050-a2-A', 'sha256:B')))).status).toBe(404)
    // 每个 session 恰好扫描一次（授权缓存生效）。
    expect(readSession).toHaveBeenCalledTimes(2)
  })

  it('A3 有引用 → 200：原始字节 + 该 image 块的 mediaType + nosniff + cache-control', async () => {
    const ref = png('sha256:hdr', { name: 'shot.png' })
    const readImage = vi.fn(async () => ({ ref, data: new Uint8Array([137, 80, 78, 71]) }))
    const { handlerOf } = makeHarness({ events: [rawImage(7, [ref])], attachments: { readImage } })

    const res = await call(handlerOf(ATTACHMENT_PATH), makeReq('GET', attUrl('v050-a3', ref.attachmentId)))

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('image/png')
    expect(res.headers['cache-control']).toBe('private, max-age=300')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['content-length']).toBe('4')
    expect([...res.raw]).toEqual([137, 80, 78, 71])
    // 授权扫描给出的 ref 来自事件块本身（含尺寸），不是调用方拼出来的。
    expect(readImage).toHaveBeenCalledWith(expect.objectContaining({
      attachmentId: 'sha256:hdr', mediaType: 'image/png', bytes: 2048, width: 4, height: 3, name: 'shot.png',
    }))
  })

  it('A4 投影形态（data.content）同样授权；非 GET → 405 且不触碰服务', async () => {
    const readImage = vi.fn(async () => ({ data: new Uint8Array([5, 6]) }))
    const { handlerOf } = makeHarness({
      events: [projectedImage(11, [png('sha256:proj')])],
      attachments: { readImage },
    })
    const handler = handlerOf(ATTACHMENT_PATH)
    const ok = await call(handler, makeReq('GET', attUrl('v050-a4', 'sha256:proj')))
    expect(ok.status).toBe(200)
    expect([...ok.raw]).toEqual([5, 6])

    for (const method of ['POST', 'PUT', 'DELETE', 'HEAD', 'PATCH']) {
      const res = await call(handler, makeReq(method, attUrl('v050-a4', 'sha256:proj')))
      expect(res.status, method).toBe(405)
    }
    expect(readImage).toHaveBeenCalledTimes(1)
  })

  it('A5 围栏：非 loopback Host / cross-site / 异源 Origin → 403；无 Origin 的 <img> GET 放行', async () => {
    const { handlerOf } = makeHarness({
      events: [rawImage(1, [png('sha256:fence')])],
      attachments: storedBytes(1),
    })
    const handler = handlerOf(ATTACHMENT_PATH)

    expect((await call(handler, makeReq('GET', attUrl('v050-a5', 'sha256:fence'), { host: 'evil.example.com' }))).status).toBe(403)
    expect((await call(handler, makeReq('GET', attUrl('v050-a5', 'sha256:fence'), { host: HOST, 'sec-fetch-site': 'cross-site' }))).status).toBe(403)
    expect((await call(handler, makeReq('GET', attUrl('v050-a5', 'sha256:fence'), { host: HOST, origin: 'http://evil.example.com' }))).status).toBe(403)
    expect((await call(handler, makeReq('GET', attUrl('v050-a5', 'sha256:fence'), { host: HOST, origin: `http://${HOST}` }))).status).toBe(200)
    // 浏览器 <img> 不带 Origin：必须穿过围栏，只在授权层判定。
    expect((await call(handler, makeReq('GET', attUrl('v050-a5', 'sha256:missing'), { host: HOST }))).status).toBe(404)
  })

  it('A6 attachments 服务缺失/无 readImage → 404 attachments-unavailable，不抛未捕获异常', async () => {
    const handlerOfMissing = makeHarness({ events: [rawImage(7, [png('sha256:svc')])] }).handlerOf
    const missing = await call(handlerOfMissing(ATTACHMENT_PATH), makeReq('GET', attUrl('v050-a6', 'sha256:svc')))
    expect(missing.status).toBe(404)
    expect(jsonOf(missing).error).toBe('attachments-unavailable')

    const handlerOfEmpty = makeHarness({ events: [rawImage(7, [png('sha256:svc2')])], attachments: {} }).handlerOf
    const empty = await call(handlerOfEmpty(ATTACHMENT_PATH), makeReq('GET', attUrl('v050-a6b', 'sha256:svc2')))
    expect(empty.status).toBe(404)
    expect(jsonOf(empty).error).toBe('attachments-unavailable')
  })

  it('A7 mediaType 不在平台 4 个白名单 → 404 且不调用 readImage，也不回显该 mediaType', async () => {
    for (const bad of ['text/html', 'image/svg+xml', 'IMAGE/PNG', 'application/octet-stream', 'image/avif']) {
      const readImage = vi.fn(async () => ({ data: new Uint8Array([1]) }))
      const { handlerOf } = makeHarness({
        events: [rawImage(5, [png(`sha256:mt-${bad}`, { mediaType: bad })])],
        attachments: { readImage },
      })
      const res = await call(
        handlerOf(ATTACHMENT_PATH),
        makeReq('GET', attUrl(`v050-a7-${bad}`, `sha256:mt-${bad}`)),
      )
      expect(res.status, bad).toBe(404)
      expect(jsonOf(res).error, bad).toBe('attachment-unavailable')
      expect(readImage, bad).not.toHaveBeenCalled()
      // 关键：绝不能把不可信 mediaType 变成我们源上的 content-type。
      expect(res.headers['content-type'], bad).toBe('application/json; charset=utf-8')
      expect(res.raw.toString('utf8'), bad).not.toContain(bad)
    }
    // 四个白名单本身必须被接受（用无尺寸 ref 触发重试路径也一样 200）。
    for (const good of ['image/png', 'image/jpeg', 'image/webp', 'image/gif']) {
      const readImage = vi.fn(async () => ({ data: new Uint8Array([9]) }))
      const { handlerOf } = makeHarness({
        events: [rawImage(6, [{ attachmentId: `sha256:ok-${good}`, mediaType: good }])],
        attachments: { readImage },
      })
      const res = await call(handlerOf(ATTACHMENT_PATH), makeReq('GET', attUrl(`v050-a7ok-${good}`, `sha256:ok-${good}`)))
      expect(res.status, good).toBe(200)
      expect(res.headers['content-type'], good).toBe(good)
    }
  })

  it('A8 id 形态边界：空 / 空白 / 控制字符 / >512 → 400；恰好 512 → 结构性通过（404）', async () => {
    const { handlerOf } = makeHarness({
      events: [rawImage(1, [png('sha256:id')])],
      attachments: storedBytes(1),
    })
    const handler = handlerOf(ATTACHMENT_PATH)

    expect((await call(handler, makeReq('GET', ATTACHMENT_PATH))).status).toBe(400)
    expect((await call(handler, makeReq('GET', `${ATTACHMENT_PATH}?attachmentId=sha256:id`))).status).toBe(400)
    expect((await call(handler, makeReq('GET', `${ATTACHMENT_PATH}?sessionId=v050-a8`))).status).toBe(400)
    for (const bad of ['', '   ', 'a b', 'a\tb', 'a\nb', 'a\u0000b', 'a\u00a0b']) {
      const res = await call(handler, makeReq('GET', attUrl('v050-a8', bad)))
      expect(res.status, JSON.stringify(bad)).toBe(400)
    }
    const tooLong = 'a'.repeat(ATTACHMENT_ID_MAX + 1)
    const over = await call(handler, makeReq('GET', attUrl('v050-a8', tooLong)))
    expect(over.status).toBe(400)
    expect(String(jsonOf(over).error)).toContain('required')

    // 恰好 512 不是「格式非法」：它是结构合法但未被授权 → 404（证明边界是 >512）。
    const atLimit = 'a'.repeat(ATTACHMENT_ID_MAX)
    const limit = await call(handler, makeReq('GET', attUrl('v050-a8', atLimit)))
    expect(limit.status).toBe(404)
    expect(jsonOf(limit).error).toBe('attachment-not-found')
  })

  it('A9 畸形 image 块一律不授权（缺 attachment / 空 id / 非字符串 mediaType / 字符串 content）', async () => {
    const readImage = vi.fn(async () => ({ data: new Uint8Array([1]) }))
    const events: SessionEventLike[] = [
      { type: 'tool/result', seq: 1, data: { callId: 'c1', content: [{ type: 'image' }] } },
      { type: 'tool/result', seq: 2, data: { callId: 'c2', content: [{ type: 'image', attachment: { attachmentId: '', mediaType: 'image/png' } }] } },
      { type: 'tool/result', seq: 3, data: { callId: 'c3', content: [{ type: 'image', attachment: { attachmentId: 'sha256:nomedia' } }] } },
      { type: 'tool/result', seq: 4, data: { callId: 'c4', content: [{ type: 'image', attachment: { attachmentId: 'sha256:nummedia', mediaType: 42 } }] } },
      { type: 'tool/result', seq: 5, data: { callId: 'c5', content: 'plain string' } },
      { type: 'tool/result', seq: 6, data: { callId: 'c6' } },
    ]
    const { handlerOf } = makeHarness({ events, attachments: { readImage } })
    const handler = handlerOf(ATTACHMENT_PATH)
    for (const id of ['sha256:nomedia', 'sha256:nummedia']) {
      const res = await call(handler, makeReq('GET', attUrl('v050-a9', id)))
      expect(res.status, id).toBe(404)
      expect(jsonOf(res).error, id).toBe('attachment-not-found')
    }
    expect(readImage).not.toHaveBeenCalled()
  })

  it('A10 授权缓存 TTL：TTL 内一次扫描，过期后重新扫描', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)
    const readSession = vi.fn(async () => ({ events: [rawImage(1, [png('sha256:ttl')])] }))
    const { handlerOf } = makeHarness({
      readSession,
      attachments: storedBytes(7),
    })
    const handler = handlerOf(ATTACHMENT_PATH)
    const url = attUrl('v050-a10', 'sha256:ttl')

    expect((await call(handler, makeReq('GET', url))).status).toBe(200)
    expect((await call(handler, makeReq('GET', url))).status).toBe(200)
    expect(readSession).toHaveBeenCalledTimes(1)

    vi.setSystemTime(1_000_000 + ATTACHMENT_AUTH_TTL_MS)
    expect((await call(handler, makeReq('GET', url))).status).toBe(200)
    expect(readSession).toHaveBeenCalledTimes(2)
  })

  it('A11 LRU ≤ 16：第 17 个 session 挤掉最久未用的一个，最近的仍在缓存', async () => {
    const readSession = vi.fn(async (id: string) => ({ events: [rawImage(1, [png(`sha256:${id}`)])] }))
    const { handlerOf } = makeHarness({ readSession, attachments: storedBytes(3) })
    const handler = handlerOf(ATTACHMENT_PATH)

    for (let i = 0; i <= ATTACHMENT_AUTH_MAX_SESSIONS; i += 1) {
      const id = `v050-a11-${i}`
      expect((await call(handler, makeReq('GET', attUrl(id, `sha256:${id}`)))).status).toBe(200)
    }
    expect(readSession).toHaveBeenCalledTimes(ATTACHMENT_AUTH_MAX_SESSIONS + 1)
    // 第 0 个已被挤出 → 重新扫描。
    const id0 = 'v050-a11-0'
    await call(handler, makeReq('GET', attUrl(id0, `sha256:${id0}`)))
    expect(readSession).toHaveBeenCalledTimes(ATTACHMENT_AUTH_MAX_SESSIONS + 2)
    // 最新的一个仍在缓存 → 不再扫描。
    const newest = `v050-a11-${ATTACHMENT_AUTH_MAX_SESSIONS}`
    await call(handler, makeReq('GET', attUrl(newest, `sha256:${newest}`)))
    expect(readSession).toHaveBeenCalledTimes(ATTACHMENT_AUTH_MAX_SESSIONS + 2)
  })
})

// ═════════════════════════════════════════════════════════════════════════
// B · /tool-detail route
// ═════════════════════════════════════════════════════════════════════════

const dCall = (seq: number, name = 'read', args = '{"path":"a.md"}', callId = `c${seq}`): SessionEventLike =>
  ({ type: 'tool/call', seq, data: { name, arguments: args, callId } })

const dResult = (seq: number, text: string, callId: string, extra: Record<string, unknown> = {}): SessionEventLike =>
  ({ type: 'tool/result', seq, data: { callId, content: [{ type: 'text', text }], ...extra } })

/** Events with the host-side top-level `surfaceOp` (the wire pass-through field). */
type EventWithOp = SessionEventLike & { surfaceOp?: unknown }

const withSurfaceOp = (event: SessionEventLike, surfaceOp: unknown): EventWithOp => ({ ...event, surfaceOp })

async function detailItems(sessionId: string, seqs: unknown, events: SessionEventLike[]): Promise<{ res: FakeRes; items: ToolDetailItem[] }> {
  const { handlerOf } = makeHarness({ events })
  const res = await call(handlerOf(TOOL_DETAIL_PATH), postDetail(sessionId, seqs))
  const items = res.status === 200 ? (jsonOf(res).items as ToolDetailItem[]) : []
  return { res, items }
}

describe('B · POST /api/tool-detail — caps, aggregation, byte limits', () => {
  it('B1 seqs 非数组（缺失/字符串/数字/对象/null）→ 400；空数组 → 200 items:[]', async () => {
    const { handlerOf } = makeHarness({ events: [dCall(1)] })
    const handler = handlerOf(TOOL_DETAIL_PATH)
    for (const seqs of [undefined, 'abc', 42, {}, null, true]) {
      const res = await call(handler, makeReq('POST', TOOL_DETAIL_PATH, { host: HOST }, JSON.stringify({ sessionId: 'v050-b1', seqs })))
      expect(res.status, String(seqs)).toBe(400)
      expect(String(jsonOf(res).error), String(seqs)).toContain('seqs')
    }
    const empty = await call(handler, makeReq('POST', TOOL_DETAIL_PATH, { host: HOST }, JSON.stringify({ sessionId: 'v050-b1', seqs: [] })))
    expect(empty.status).toBe(200)
    expect(jsonOf(empty).items).toEqual([])
    // 非数字元素被忽略（宽松但确定），不报错。
    const mixed = await call(handler, makeReq('POST', TOOL_DETAIL_PATH, { host: HOST }, JSON.stringify({ sessionId: 'v050-b1', seqs: ['x', null] })))
    expect(mixed.status).toBe(200)
    expect(jsonOf(mixed).items).toEqual([])
  })

  it('B2 恰好 32 个 seq → 200；33 个 → 400', async () => {
    const events = Array.from({ length: 33 }, (_, i) => dCall(i + 1, 'bash', `a${i}`))
    const seqs32 = Array.from({ length: 32 }, (_, i) => i + 1)
    const ok = await detailItems('v050-b2', seqs32, events)
    expect(ok.res.status).toBe(200)
    expect(ok.items).toHaveLength(TOOL_DETAIL_MAX_SEQS)

    const over = await detailItems('v050-b2', [...seqs32, 33], events)
    expect(over.res.status).toBe(400)
  })

  it('B3 不存在的 seq 被省略，顺序保持请求顺序，sessionId 缺失 → 400', async () => {
    const events = [dCall(1), dCall(2, 'bash', 'ls')]
    const { handlerOf } = makeHarness({ events })
    const handler = handlerOf(TOOL_DETAIL_PATH)

    const res = await call(handler, postDetail('v050-b3', [999, 2, 1, 1000]))
    expect(res.status).toBe(200)
    expect((jsonOf(res).items as ToolDetailItem[]).map((item) => item.seq)).toEqual([2, 1])

    const noSession = await call(handler, makeReq('POST', TOOL_DETAIL_PATH, { host: HOST }, JSON.stringify({ seqs: [1] })))
    expect(noSession.status).toBe(400)
    // 非 POST → 405；请求体超 64 KiB → 413。
    expect((await call(handler, makeReq('GET', TOOL_DETAIL_PATH))).status).toBe(405)
    const tooBig = await call(handler, makeReq('POST', TOOL_DETAIL_PATH, { host: HOST }, 'x'.repeat(70 * 1024)))
    expect(tooBig.status).toBe(413)
  })

  it('B4 不施 ARGS_CAP(32768)/RESULT_CAP(32768)：40 KiB 参数与结果完整返回', async () => {
    const args = 'x'.repeat(40 * 1024)
    const text = 'y'.repeat(40 * 1024)
    const { res, items } = await detailItems('v050-b4', [1], [
      dCall(1, 'read', args),
      dResult(2, text, 'c1'),
    ])
    expect(res.status).toBe(200)
    expect(items[0].arguments).toBe(args)
    expect(items[0].argsBytes).toBe(40 * 1024)
    expect(items[0].truncated).toBeUndefined()
    expect(items[0].contentBytes).toBe(40 * 1024)
    expect((items[0].content ?? [])[0]).toEqual({ type: 'text', text })
  })

  it('B5 按 callId 聚合整步：请求 call seq 或任一 result seq 都返回同名/同参数/同内容', async () => {
    const events = [
      dCall(1, 'read', '{"path":"a.md"}'),
      dResult(2, 'part A', 'c1'),
      dResult(3, 'part B', 'c1'),
    ]
    for (const requested of [1, 2, 3]) {
      const { res, items } = await detailItems(`v050-b5-${requested}`, [requested], events)
      expect(res.status, String(requested)).toBe(200)
      expect(items, String(requested)).toHaveLength(1)
      // 返回的 seq 是**请求的那个** seq（请求 result seq 时 item.seq 即该 result seq）。
      // 契约 §10.3.2 的字段注释写的是「tool/call 事件的 seq」；客户端只请求
      // step.seq（= call seq），故功能上无影响 —— 见 §12 记录的口径偏差（低）。
      expect(items[0].seq, String(requested)).toBe(requested)
      expect(items[0].name, String(requested)).toBe('read')
      expect(items[0].callId, String(requested)).toBe('c1')
      expect(items[0].arguments, String(requested)).toBe('{"path":"a.md"}')
      expect(items[0].argsBytes, String(requested)).toBe('{"path":"a.md"}'.length)
      expect(items[0].content, String(requested)).toEqual([
        { type: 'text', text: 'part A' },
        { type: 'text', text: 'part B' },
      ])
      expect(items[0].contentBytes, String(requested)).toBe(12)
    }
  })

  it('B6 replace 语义与客户端折叠一致：替换前的内容整段被丢弃，参数不受影响', async () => {
    const events: EventWithOp[] = [
      dCall(1, 'read', '{"path":"a.md"}'),
      dResult(2, 'part A', 'c1'),
      dResult(3, 'part B', 'c1'),
      withSurfaceOp(dResult(4, '[compacted]', 'c1'), { op: 'replace', startSeq: 2, endSeq: 3 }),
    ]
    const { items } = await detailItems('v050-b6', [1], events)
    expect(items[0].content).toEqual([{ type: 'text', text: '[compacted]' }])
    expect(items[0].arguments).toBe('{"path":"a.md"}')

    // 与服务端聚合对照：客户端折叠对同一事件流的文本必须相同。
    const folded = foldTurns([
      { type: 'user/message', seq: 0, data: { content: 'x', message: { source: { kind: 'user' } } } },
      { type: 'turn/start', seq: 0.5, data: { turn: 1 } },
      ...events,
      { type: 'turn/end', seq: 5, data: { turn: 1 } },
    ].sort((a, b) => a.seq - b.seq))
    expect(stepsOf(folded[0])[0].result?.text).toBe('[compacted]')
  })

  it('B7 响应 >8 MiB：按 4 MiB 截断并置 truncated:true，argsBytes/contentBytes 保持原始大小', async () => {
    const args = 'a'.repeat(5 * 1024 * 1024)
    const text = 'b'.repeat(5 * 1024 * 1024)
    const { res, items } = await detailItems('v050-b7', [1], [
      dCall(1, 'read', args),
      dResult(2, text, 'c1'),
    ])
    expect(res.status).toBe(200)
    expect(Buffer.byteLength(res.raw) <= TOOL_DETAIL_MAX_RESPONSE_BYTES).toBe(true)
    expect(items[0].truncated).toBe(true)
    // 原始大小（截断前）必须原样保留，客户端据此显示「已截断」。
    expect(items[0].argsBytes).toBe(args.length)
    expect(items[0].contentBytes).toBe(text.length)
    const clippedArgs = items[0].arguments ?? ''
    const clippedText = ((items[0].content ?? [])[0] as { text: string }).text
    expect(Buffer.byteLength(clippedArgs, 'utf8') <= TOOL_DETAIL_TEXT_CAP_BYTES).toBe(true)
    expect(Buffer.byteLength(clippedText, 'utf8') <= TOOL_DETAIL_TEXT_CAP_BYTES).toBe(true)
    expect(clippedArgs.length).toBeGreaterThan(0)
    expect(clippedText.length).toBeGreaterThan(0)
    expect(clippedArgs).not.toContain('\uFFFD')
    expect(clippedText).not.toContain('\uFFFD')
  })

  it('B8 4 MiB 上限落在多字节码点中间：退到码点边界，无 U+FFFD', async () => {
    const args = '\u2192'.repeat(3 * 1024 * 1024) // 3 bytes/char → 9 MiB
    const { res, items } = await detailItems('v050-b8', [1], [dCall(1, 'read', args)])
    expect(res.status).toBe(200)
    const clipped = items[0].arguments ?? ''
    expect(items[0].truncated).toBe(true)
    expect(items[0].argsBytes).toBe(args.length)
    expect(clipped).not.toContain('\uFFFD')
    expect(Buffer.byteLength(clipped, 'utf8') <= TOOL_DETAIL_TEXT_CAP_BYTES).toBe(true)
    // 每个码点 3 字节：字节数必是 3 的倍数（未被截成半个字符）。
    expect(Buffer.byteLength(clipped, 'utf8') % 3).toBe(0)
    expect(clipped.length).toBeGreaterThan(0)
  })
})

// ═════════════════════════════════════════════════════════════════════════
// C · mergedFrom
// ═════════════════════════════════════════════════════════════════════════

const user = (seq: number, content: string): SessionEventLike =>
  ({ type: 'user/message', seq, data: { content, message: { source: { kind: 'user' } } } })
const turnStart = (seq: number, turn: number): SessionEventLike => ({ type: 'turn/start', seq, data: { turn } })
const turnEnd = (seq: number, turn: number): SessionEventLike => ({ type: 'turn/end', seq, data: { turn } })
const mCall = (seq: number, callId = 'c1', args = '{"path":"a.md"}'): SessionEventLike =>
  ({ type: 'tool/call', seq, data: { name: 'read', arguments: args, callId } })
const mResult = (seq: number, text: string, callId = 'c1', extra: Record<string, unknown> = {}): SessionEventLike =>
  ({ type: 'tool/result', seq, data: { callId, content: [{ type: 'text', text }], ...extra } })

const stepAt = (turns: readonly TrailTurn[], seq: number): TrailStep => {
  for (const turn of turns) {
    for (const step of stepsOf(turn)) if (step.seq === seq) return step
  }
  throw new Error(`no step with seq ${seq}`)
}

describe('C · mergedFrom（append 递增 / replace 重置 / 顺序无关）', () => {
  const base = (): SessionEventLike[] => [
    user(1, 'stream'),
    turnStart(2, 1),
    mCall(3),
    mResult(4, 'A'),
  ]

  it('C1 首次挂 result → mergedFrom = 1', () => {
    const step = stepAt(foldTurns([...base(), turnEnd(5, 1)]), 3)
    expect(step.result?.mergedFrom).toBe(1)
    expect(step.result?.text).toBe('A')
  })

  it('C2 同 callId 追加 → 每次 append +1，文本按 seq 合并', () => {
    const step = stepAt(foldTurns([...base(), mResult(5, 'B'), mResult(6, 'C'), turnEnd(7, 1)]), 3)
    expect(step.result?.mergedFrom).toBe(3)
    expect(step.result?.text).toBe('ABC')
  })

  it('C3 replace → mergedFrom 重置为 1，并记录 replacedBy / replacedFrom', () => {
    const events = [
      ...base(),
      mResult(5, 'B'),
      mResult(6, '[pruned]', 'c1', { surfaceOp: { op: 'replace', startSeq: 4, endSeq: 5 } }),
      turnEnd(7, 1),
    ]
    const step = stepAt(foldTurns(events), 3)
    expect(step.result?.mergedFrom).toBe(1)
    expect(step.result?.text).toBe('[pruned]')
    expect(step.result?.replacedBy).toBe(6)
    expect(step.result?.replacedFrom).toBe(4)
  })

  it('C4 replace 早于它覆盖的 append 到达（call 已登记）→ 与顺序到达结果一致', () => {
    const ordered = [
      ...base(),
      mResult(5, 'B'),
      mResult(6, '[pruned]', 'c1', { surfaceOp: { op: 'replace', startSeq: 4, endSeq: 5 } }),
      turnEnd(7, 1),
    ]
    // 同一个事件集合，但 replace(6) 被排到它覆盖的 append(4/5) 之前。
    const shuffled = [ordered[0], ordered[1], ordered[2], ordered[5], ordered[3], ordered[4], ordered[6]]
    const a = stepAt(foldTurns(ordered), 3).result
    const b = stepAt(foldTurns(shuffled), 3).result
    expect(b?.text).toBe(a?.text)
    expect(b?.mergedFrom).toBe(a?.mergedFrom)
    expect(b?.replacedBy).toBe(a?.replacedBy)
    expect(b?.replacedFrom).toBe(a?.replacedFrom)
  })

  it('C5 【characterization】replace 早于其 tool/call 时被静默忽略（契约字面「与到达顺序无关」不成立；真实链路不可达）', () => {
    const ordered = [
      ...base(),
      mResult(5, 'B'),
      mResult(6, '[pruned]', 'c1', { surfaceOp: { op: 'replace', startSeq: 4, endSeq: 5 } }),
      turnEnd(7, 1),
    ]
    // replace(6) 先于 tool/call(3)：applyToolResult 找不到任何目标（seqIndex 为空、
    // byCallId 尚无 c1），于是整条 replace 被丢弃。
    const shuffled = [ordered[0], ordered[1], ordered[5], ordered[2], ordered[3], ordered[4], ordered[6]]
    const step = stepAt(foldTurns(shuffled), 3)
    expect(step.result?.text).toBe('AB')
    expect(step.result?.replacedBy).toBeUndefined()
    expect(step.result?.mergedFrom).toBe(2)
    // 与顺序到达不同 → 该 readme/契约字面（§3.3「最终结果必须与到达顺序无关」）
    // 在此形态下不成立。真实链路不可达：TrailFolder.push 有 seq 水位线，
    // wire 页按 seq 升序，且 replace 事件的 seq 恒大于被替换 seq（§0）。
    expect(step.result?.text).not.toBe(stepAt(foldTurns(ordered), 3).result?.text)
  })

  it('C6 TrailFolder（增量）与 foldTurns（批量）对同一事件流输出一致', () => {
    const events = [
      user(1, 'stream'),
      turnStart(2, 1),
      mCall(3),
      mResult(4, 'A'),
      mResult(5, 'B'),
      mResult(6, '[pruned]', 'c1', { surfaceOp: { op: 'replace', startSeq: 4, endSeq: 5 } }),
      mResult(7, 'C'),
      turnEnd(8, 1),
    ]
    const folder = new TrailFolder()
    for (const event of events) folder.push(event)
    const incremental = stepAt(folder.snapshot(), 3).result
    const batch = stepAt(foldTurns(events), 3).result
    expect(incremental?.text).toBe(batch?.text)
    expect(incremental?.mergedFrom).toBe(batch?.mergedFrom)
    expect(incremental?.replacedBy).toBe(batch?.replacedBy)
    expect(incremental?.replacedFrom).toBe(batch?.replacedFrom)
    expect(incremental?.text).toBe('[pruned]C')
    expect(incremental?.mergedFrom).toBe(2)
  })
})

// ═════════════════════════════════════════════════════════════════════════
// D · F7 — replace rewrites result only
// ═════════════════════════════════════════════════════════════════════════

describe('D · F7 surfaceOp.replace 只改写 result（契约 §11.2）', () => {
  const original = '{"command":"rm -rf /tmp/x"}'

  it('D1 args / argsPreview / argsBytes / argsTruncated 逐字段保持 tool/call 原值', () => {
    const events: SessionEventLike[] = [
      user(1, 'clean'),
      turnStart(2, 1),
      { type: 'tool/call', seq: 3, data: { name: 'bash', arguments: original, argsBytes: 4242, argsTruncated: true, callId: 'c3' } },
      dResult(4, 'long output', 'c3'),
      mResult(5, '[dsh-jev-compaction] pruned', 'c3', { surfaceOp: { op: 'replace', startSeq: 4, endSeq: 4 } }),
      turnEnd(6, 1),
    ]
    const step = stepAt(foldTurns(events), 3)

    expect(step.args).toBe(original)
    expect(step.argsPreview).toBe(compact(original))
    expect(step.argsBytes).toBe(4242)
    expect(step.argsTruncated).toBe(true)
    expect(step.kind).toBe('tool')
    // result 仍被替换（AC3 意图不变）。
    expect(step.result?.text).toBe('[dsh-jev-compaction] pruned')
    expect(step.result?.replacedBy).toBe(5)
    expect(step.result?.replacedFrom).toBe(4)
  })

  it('D2 目标步本来没有 result：replace 建出 result，参数依旧原样', () => {
    const events: SessionEventLike[] = [
      user(1, 'no result yet'),
      turnStart(2, 1),
      { type: 'tool/call', seq: 3, data: { name: 'bash', arguments: 'CMD-ORIGINAL', callId: 'c3' } },
      turnEnd(4, 1),
      // 轮次已关闭后到达的 replace（真实场景：压缩插件改写历史结果）。
      mResult(5, '[pruned-after-close]', 'c3', { surfaceOp: { op: 'replace', startSeq: 3, endSeq: 3 } }),
    ]
    const step = stepAt(foldTurns(events), 3)
    expect(step.args).toBe('CMD-ORIGINAL')
    expect(step.argsPreview).toBe('CMD-ORIGINAL')
    expect(step.result?.text).toBe('[pruned-after-close]')
    expect(step.result?.replacedBy).toBe(5)
    expect(step.result?.kind).toBe('text')
  })

  it('D3 replace 只命中目标步：未被覆盖的邻居步骤逐字段不变', () => {
    const events: SessionEventLike[] = [
      user(1, 'two calls'),
      turnStart(2, 1),
      dCall(3, 'bash', 'first-cmd', 'c3'),
      dResult(4, 'first out', 'c3'),
      dCall(5, 'read', 'second-args', 'c5'),
      dResult(6, 'second out', 'c5'),
      mResult(7, '[pruned]', 'c3', { surfaceOp: { op: 'replace', startSeq: 4, endSeq: 4 } }),
      turnEnd(8, 1),
    ]
    const turns = foldTurns(events)
    const first = stepAt(turns, 3)
    const second = stepAt(turns, 5)
    expect(first.args).toBe('first-cmd')
    expect(first.result?.text).toBe('[pruned]')
    expect(second.args).toBe('second-args')
    expect(second.argsPreview).toBe('second-args')
    expect(second.result?.text).toBe('second out')
    expect(second.result?.replacedBy).toBeUndefined()
  })
})

// ═════════════════════════════════════════════════════════════════════════
// E · F8 — read envelope unwrap
// ═════════════════════════════════════════════════════════════════════════

const mdCalls: string[] = []
function fakePrimitives(): PrimitivesModule {
  return {
    MarkdownText: (props) => {
      mdCalls.push(props.text)
      return <div data-testid="fake-md">{props.text}</div>
    },
    MarkdownDelegateProvider: (props) => <div>{props.children}</div>,
  }
}

const envelope = (path: string, type: string, body: string): string =>
  `<path>${path}</path>\n<type>${type}</type>\n<content>\n${body}\n</content>`

const renderResult = (text: string): void => {
  render(<MarkdownResult text={text} labels={markdownLabels('en')} />)
}

describe('E · F8 read 结果信封解包（契约 §11.3 / §11.4）', () => {
  it('E1 .md 信封：解包 + 行号剥离，渲染的是 body（表格分隔行仍被识别）', () => {
    const body = [
      '1: # AC13 宽表格 fixture',
      '2: ',
      '3: | 模块 | 路径 |',
      '4: | --- | --- |',
      '5: | core | src/index.ts |',
    ].join('\n')
    const text = envelope('/tmp/ac13-wide-table.md', 'file', body)
    const unwrapped = unwrapFileResult(text)
    expect(unwrapped).toEqual({
      path: '/tmp/ac13-wide-table.md',
      type: 'file',
      body: '# AC13 宽表格 fixture\n\n| 模块 | 路径 |\n| --- | --- |\n| core | src/index.ts |',
    })
    expect(looksLikeMarkdown(text)).toBe(true)

    setPrimitivesForTest(fakePrimitives())
    mdCalls.length = 0
    renderResult(text)
    expect(screen.getByTestId('ttl-md')).toBeTruthy()
    expect(mdCalls).toEqual([unwrapped?.body])
    expect(screen.getByTestId('fake-md').textContent).not.toContain('1: ')
    expect(screen.getByTestId('fake-md').textContent).not.toContain('<content>')
  })

  it('E2 末尾工具 chrome 被剥离（两种真实形态）', () => {
    const eof = envelope('a.md', 'file', '1: # T\n2: body\n3: (End of file - total 2 lines)')
    expect(unwrapFileResult(eof)?.body).toBe('# T\nbody')
    expect(unwrapFileResult(eof)?.body).not.toContain('End of file')

    const showing = envelope('b.md', 'file', '1: # T\n2: body\n3: (Showing lines 1-2 of 576. Use offset=3 to continue.)')
    expect(unwrapFileResult(showing)?.body).toBe('# T\nbody')

    // 尾部空行不影响判定（只剥离「最后一个非空行」）。
    const trailing = envelope('c.md', 'file', '1: text\n2: (End of file - total 1 lines)\n3: ')
    expect(unwrapFileResult(trailing)?.body).toBe('text\n')
  })

  it('E3 正文中间的同形文本不被误删', () => {
    const body = [
      '1: intro',
      '2: (End of file - total 5 lines)',
      '3: middle',
      '4: (Showing lines 1-4 of 9. Use offset=5 to continue.)',
      '5: outro',
    ].join('\n')
    const unwrapped = unwrapFileResult(envelope('mid.md', 'file', body))
    expect(unwrapped?.body).toBe(
      'intro\n(End of file - total 5 lines)\nmiddle\n(Showing lines 1-4 of 9. Use offset=5 to continue.)\noutro',
    )
  })

  it('E4 .ts / .json / image 信封一律原文（不因正文含 Markdown 信号而误渲染）', () => {
    const tsText = envelope('/tmp/x.ts', 'file', '1: # not a heading\n2: | a | b |\n3: | --- | --- |\n4: * not a list')
    expect(looksLikeMarkdown(tsText)).toBe(false)
    // 带 type=image 的信封也解析出对象（§11.4 裁定 3），但绝不按 Markdown 渲染。
    const imageText = envelope('/tmp/a.png', 'image', '1: binary')
    expect(unwrapFileResult(imageText)).toMatchObject({ type: 'image' })
    expect(looksLikeMarkdown(imageText)).toBe(false)

    setPrimitivesForTest(fakePrimitives())
    mdCalls.length = 0
    renderResult(tsText)
    // 走原文：整段未被改动的信封（含 tag 与行号）。
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe(tsText)
    expect(mdCalls).toEqual([])
  })

  it('E5 非信封 / 缺 </content> 一律返回 null（并继续按 §5 判原文）', () => {
    expect(unwrapFileResult('plain text, not an envelope')).toBeNull()
    expect(unwrapFileResult('<path>a.md</path>\n<type>file</type>\n<content>\n1: x')).toBeNull()
    expect(unwrapFileResult('<path>a.md</path>\n<type>file</type>\n<content>\n1: x\n</content>\ntrailing')).toBeNull()
    expect(unwrapFileResult('')).toBeNull()
    // 未闭合信封里即使有 Markdown 信号，也按原文处理（§5 仍可能命中 → 用纯文本验证）。
    expect(looksLikeMarkdown('<path>a.md</path>\n<type>file</type>\n<content>\n1: x')).toBe(false)
  })

  it('E6 CRLF / 大小写 type / 大写扩展名也被识别', () => {
    const text = '<path>/tmp/READ.MD</path>\r\n<type>File</type>\r\n<content>\r\n1: # H\r\n2: body\r\n</content>'
    const unwrapped = unwrapFileResult(text)
    expect(unwrapped).toMatchObject({ path: '/tmp/READ.MD', type: 'File', body: '# H\nbody' })
    expect(looksLikeMarkdown(text)).toBe(true)
  })

  it('E7 行号前缀边界：空行 `12: ` 被剥离，`2024 report` / `3.14 pie` 保持原样', () => {
    const body = ['12: ', '2024 report', '3.14 pie', '- bullet'].join('\n')
    const unwrapped = unwrapFileResult(envelope('n.md', 'file', body))
    expect(unwrapped?.body).toBe('\n2024 report\n3.14 pie\n- bullet')
  })

  it('E8 loadPrimitives() 为 null 时 .md 信封显示原信封 + markdownFallback（§11.4 裁定 4）', () => {
    const text = envelope('a.md', 'file', '1: # H\n2: body')
    setPrimitivesForTest(null)
    renderResult(text)
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe(text)
    expect(screen.getByTestId('ttl-md-fallback')).toBeTruthy()
  })

  it('E9 §11.4#5：.md 信封但 body 不含 Markdown 信号 → 仍显示解包后的 body（不是原信封）', () => {
    const text = envelope('plain.md', 'file', '1: just one plain line')
    expect(unwrapFileResult(text)?.body).toBe('just one plain line')
    expect(looksLikeMarkdown(text)).toBe(false)
    setPrimitivesForTest(fakePrimitives())
    renderResult(text)
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    // §11.4#5：`.md` 信封的字面回退用解包后的 body（chrome 已剥离）。
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe('just one plain line')
    expect(screen.getByTestId('ttl-md-raw').textContent).not.toContain('<path>')
  })

  it('E10 字面回退只对 .md 信封用 body：.ts 信封仍显示原信封全文', () => {
    const tsText = envelope('/tmp/x.ts', 'file', '1: const a = 1')
    setPrimitivesForTest(fakePrimitives())
    renderResult(tsText)
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe(tsText)
  })
})

// ═════════════════════════════════════════════════════════════════════════
// F · components
// ═════════════════════════════════════════════════════════════════════════

const uiUser = (seq: number, content: string): SessionEventLike =>
  ({ type: 'user/message', seq, data: { content, message: { source: { kind: 'user' } } } })

const threeSteps = (): SessionEventLike[] => [
  uiUser(1, 'run tests'),
  turnStart(2, 1),
  dCall(3, 'bash', 'npm test', 'c3'),
  dCall(4, 'bash', 'npm lint', 'c4'),
  dCall(5, 'read', '{"path":"package.json"}', 'c5'),
  dResult(6, '# pkg\n\n- name', 'c5'),
  turnEnd(7, 1),
]

const truncatedStepTurn = (): SessionEventLike[] => [
  uiUser(1, 'big file'),
  turnStart(2, 1),
  { type: 'tool/call', seq: 3, data: { name: 'read', arguments: '{"path":"big.md"}', argsBytes: 99999, argsTruncated: true, callId: 'c3' } },
  { type: 'tool/result', seq: 4, data: { callId: 'c3', content: [{ type: 'text', text: 'wire preview' }], contentBytes: 99999, contentTruncated: true } },
  turnEnd(5, 1),
]

const imageStepTurn = (): SessionEventLike[] => [
  uiUser(1, 'look'),
  turnStart(2, 1),
  dCall(3, 'read_image', '{"path":"a.png"}', 'c3'),
  {
    type: 'tool/result',
    seq: 4,
    data: {
      callId: 'c3',
      content: [{
        type: 'image',
        attachment: { attachmentId: 'sha256:abc', mediaType: 'image/png', bytes: 2048, width: 100, height: 50, name: 'a.png' },
      }],
      contentBytes: 0,
    },
  },
  turnEnd(5, 1),
]

const FULL_DETAIL: ToolDetailItem = {
  seq: 3,
  callId: 'c3',
  name: 'read',
  arguments: '{"path":"big.md","full":true}',
  argsBytes: 99999,
  content: [{ type: 'text', text: 'full result body' }],
  contentBytes: 16,
  isError: false,
  error: null,
}

type DetailFetch = (sessionId: string, seqs: number[]) => Promise<ToolDetailResult>

function renderTab(events: SessionEventLike[], detail?: DetailFetch): void {
  render(
    <TrailTab
      ctx={{ get: () => undefined }}
      scope={{ sessionId: 'v050-ui' }}
      visible
      tab={{ id: 'trace-inspect' }}
      fetchEventsOverride={async () => ({ events })}
      {...(detail !== undefined ? { fetchToolDetailOverride: detail } : {})}
    />,
  )
}

const zStep = (seq: number, name: string, args: string, result?: Partial<TrailResult>): TrailStep => ({
  kind: 'tool',
  seq,
  name,
  argsPreview: args.replace(/\s+/g, ' ').slice(0, 80),
  args,
  callId: `c${seq}`,
  error: '',
  ...(result !== undefined
    ? { result: { seq: seq + 1000, kind: 'text' as const, text: '', truncated: false, isError: false, ...result } }
    : {}),
})

const zSteps = (): TrailStep[] => [
  zStep(3, 'bash', '{"command":"ls -la"}', { text: 'total 0' }),
  zStep(4, 'read', '{"path":"README.md"}', { text: '# Title' }),
  zStep(5, 'grep', 'needle', { text: '' }),
]

function renderOverlay(steps: TrailStep[], initialSeq = 3): { onClose: ReturnType<typeof vi.fn> } {
  const onClose = vi.fn()
  render(<ZoomOverlay steps={steps} initialSeq={initialSeq} sessionId="s1" lang="en" onClose={onClose} />)
  return { onClose }
}

describe('F · components (ZoomOverlay / lazy detail / thumbnails / collapsed DOM)', () => {
  it('F1 浮层是 body 里的 modal dialog：role=dialog + aria-modal + 初始焦点在面板', () => {
    const { container } = (() => {
      const onClose = vi.fn()
      const rendered = render(
        <div data-testid="host"><ZoomOverlay steps={zSteps()} initialSeq={3} sessionId="s1" lang="en" onClose={onClose} /></div>,
      )
      return { container: rendered.container }
    })()
    expect(container.querySelector('[data-testid="ttl-zoom"]')).toBeNull() // portal 到 body
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-label')).toContain('bash')
    expect(document.activeElement).toBe(screen.getByTestId('ttl-zoom-panel'))
    expect(screen.getAllByTestId('ttl-zoom-step')).toHaveLength(3)
  })

  it('F2 Esc 关闭恰好一次；其它键不关闭', () => {
    const { onClose } = renderOverlay(zSteps())
    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('F3 ↑/↓ 在筛选后的步骤表内移动并被夹紧', () => {
    renderOverlay(zSteps())
    const search = screen.getByTestId('ttl-zoom-search')
    fireEvent.change(search, { target: { value: 'bash' } })
    const rows = screen.getAllByTestId('ttl-zoom-step')
    expect(rows).toHaveLength(1)
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(screen.getByTestId('ttl-zoom-seq').textContent).toBe('seq #3')
    // 搜索框获得焦点时 ↑/↓ 留给光标。
    fireEvent.change(search, { target: { value: '' } })
    search.focus()
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    expect(screen.getByTestId('ttl-zoom-seq').textContent).toBe('seq #3')
  })

  it('F4 ⌘F 聚焦搜索框；⌘C 复制当前页，但在输入框聚焦或有选区时不抢占', () => {
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { language: 'en-US', clipboard: { writeText } })
    renderOverlay(zSteps())
    const search = screen.getByTestId('ttl-zoom-search')

    fireEvent.keyDown(window, { key: 'f', metaKey: true })
    expect(document.activeElement).toBe(search)

    // 输入框内 ⌘C：不复制（交给浏览器）。
    fireEvent.keyDown(search, { key: 'c', metaKey: true })
    expect(writeText).not.toHaveBeenCalled()

    // 有实时选区：不复制。
    vi.stubGlobal('getSelection', () => ({ toString: () => 'selected text' }))
    fireEvent.keyDown(window, { key: 'c', metaKey: true })
    expect(writeText).not.toHaveBeenCalled()

    // 无选区：复制当前（结果）页。
    vi.stubGlobal('getSelection', () => ({ toString: () => '' }))
    fireEvent.keyDown(window, { key: 'c', metaKey: true })
    expect(writeText).toHaveBeenCalledWith('total 0')

    // 切到「原始」页后复制的是参数。
    fireEvent.click(screen.getByTestId('ttl-zoom-tab-raw'))
    writeText.mockClear()
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true })
    expect(writeText).toHaveBeenCalledWith('{"command":"ls -la"}')
  })

  it('F5 导出 JSON：payload 含整步字段（无 URL.createObjectURL 时走 data URL）', () => {
    const original = (URL as unknown as { createObjectURL?: unknown }).createObjectURL
    delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL
    const clicked: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })
    try {
      renderOverlay([
        zStep(7, 'read', '{"path":"a.md"}', { text: 'body', truncated: true }),
      ], 7)
      fireEvent.click(screen.getByTestId('ttl-zoom-export'))
      expect(clicked).toHaveLength(1)
      expect(clicked[0].download).toBe('trace-step-7.json')
      const href = clicked[0].href
      expect(href.startsWith('data:application/json')).toBe(true)
      const payload = JSON.parse(decodeURIComponent(href.slice(href.indexOf(',') + 1))) as Record<string, unknown>
      expect(payload).toMatchObject({ seq: 7, callId: 'c7', name: 'read', kind: 'tool', arguments: '{"path":"a.md"}' })
      expect(payload.result).toMatchObject({ text: 'body', truncated: true })
      // 页脚 pill 反映截断。
      expect(screen.getByTestId('ttl-zoom-pill').textContent).toBe('Truncated')
    } finally {
      if (original === undefined) delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL
      else (URL as unknown as { createObjectURL: unknown }).createObjectURL = original
    }
  })

  it('F6 行聚焦时 ⌘⇧O 打开浮层，Esc 关闭后焦点回到触发行', async () => {
    renderTab(threeSteps())
    const rows = await screen.findAllByTestId('ttl-step')
    rows[1].focus()
    fireEvent.keyDown(rows[1], { key: 'O', shiftKey: true, metaKey: true })
    const dialog = await screen.findByRole('dialog')
    expect(dialog.getAttribute('aria-label')).toContain('bash')

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => { expect(screen.queryByTestId('ttl-zoom')).toBeNull() })
    expect(document.activeElement).toBe(rows[1])
  })

  it('F7 懒加载 inflight 去重：加载中关闭再打开，只发一次请求', async () => {
    let settle: (value: ToolDetailResult) => void = () => undefined
    const pending = new Promise<ToolDetailResult>((resolveSettled) => { settle = resolveSettled })
    const detail = vi.fn<DetailFetch>(() => pending)
    renderTab(truncatedStepTurn(), detail)

    const row = await screen.findByTestId('ttl-step')
    fireEvent.click(row)
    expect(await screen.findByTestId('ttl-detail-load')).toBeTruthy()
    expect(detail).toHaveBeenCalledTimes(1)

    fireEvent.click(row) // 收起（请求仍在飞）
    fireEvent.click(row) // 再展开 → 必须复用同一个 inflight promise
    expect(detail).toHaveBeenCalledTimes(1)

    await act(async () => { settle({ ok: true, items: [FULL_DETAIL] }) })
    expect(await screen.findByTestId('ttl-detail-full')).toBeTruthy()
    expect(screen.getByTestId('ttl-detail-pill').textContent).toBe('Full')
  })

  it('F8 用户重试最多 1 次：首次自动 + 1 次点击后按钮禁用', async () => {
    const detail = vi.fn<DetailFetch>(async () => ({ ok: false, reason: 'http' }))
    renderTab(truncatedStepTurn(), detail)
    fireEvent.click(await screen.findByTestId('ttl-step'))

    const retry = await screen.findByTestId('ttl-detail-retry')
    fireEvent.click(retry)
    await waitFor(() => {
      expect((screen.getByTestId('ttl-detail-retry') as HTMLButtonElement).disabled).toBe(true)
    })
    expect(detail).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByTestId('ttl-detail-retry'))
    expect(detail).toHaveBeenCalledTimes(2)
  })

  it('F9 缩略图：授权 URL + lazy + alt；onError 隐藏 img、保留 chip 并告警', async () => {
    renderTab(imageStepTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))

    const thumb = (await screen.findByTestId('ttl-img-thumb')) as HTMLImageElement
    expect(thumb.getAttribute('loading')).toBe('lazy')
    expect(thumb.getAttribute('src')).toBe('/trace-inspect/api/attachment?sessionId=v050-ui&attachmentId=sha256%3Aabc')
    expect(thumb.getAttribute('alt')).toBe('Image: a.png')
    expect(thumb.parentElement?.className).toBe('ttl-imgThumbWrap')

    fireEvent.error(thumb)
    expect(screen.queryByTestId('ttl-img-thumb')).toBeNull()
    expect(screen.getByTestId('ttl-img-chip').textContent).toContain('Image: a.png')
    expect(screen.getByTestId('ttl-img-failed').textContent).toBe('Image failed to load — metadata only')
  })

  it('F10 无 sessionId / 空 attachmentId → 不渲染 <img>（不请求未授权 URL）', () => {
    const { unmount } = render(
      <TrailImages
        images={[{ attachmentId: 'sha256:x', mediaType: 'image/png', bytes: 10 }]}
        sessionId=""
        lang="en"
      />,
    )
    expect(screen.queryByTestId('ttl-img-thumb')).toBeNull()
    expect(screen.getByTestId('ttl-img-chip')).toBeTruthy()
    unmount()

    render(
      <TrailImages
        images={[{ attachmentId: '', mediaType: 'image/png', bytes: 10 }]}
        sessionId="s1"
        lang="en"
      />,
    )
    expect(screen.queryByTestId('ttl-img-thumb')).toBeNull()
    expect(screen.getByTestId('ttl-img-chip')).toBeTruthy()
    expect(attachmentUrl('s1', { attachmentId: '', mediaType: 'image/png' })).toBeNull()
    expect(attachmentUrl('   ', { attachmentId: 'a', mediaType: 'image/png' })).toBeNull()
  })

  it('F11 折叠态行 DOM 不新增子节点：wrap=2 个子元素，行=4 个 span，无 .ttl-detail', async () => {
    renderTab(threeSteps())
    const wraps = await screen.findAllByTestId('ttl-step-wrap')
    expect(wraps).toHaveLength(3)
    for (const wrap of wraps) {
      expect(wrap.children).toHaveLength(2)
      expect(wrap.querySelectorAll('.ttl-detail')).toHaveLength(0)
    }
    const row = wraps[0].querySelector('[data-testid="ttl-step"]') as HTMLElement
    expect(row.children).toHaveLength(4)
    expect([...row.children].map((child) => child.className)).toEqual([
      'ttl-caret',
      'ttl-rowDot ttl-dot-success',
      'ttl-rowName ttl-rowNameMono',
      'ttl-rowArgs',
    ])
    fireEvent.click(row)
    const wrap = (await screen.findAllByTestId('ttl-step-wrap'))[0]
    expect(wrap.querySelectorAll('.ttl-detail')).toHaveLength(1)
    expect(wrap.children).toHaveLength(3)
  })
})

// ═════════════════════════════════════════════════════════════════════════
// G · norms
// ═════════════════════════════════════════════════════════════════════════

/** Remove every `var( … )` span (nesting-aware): what remains holds no fallback. */
function stripVarSpans(css: string): string {
  let out = ''
  let i = 0
  while (i < css.length) {
    const at = css.indexOf('var(', i)
    if (at === -1) {
      out += css.slice(i)
      break
    }
    out += css.slice(i, at)
    let depth = 0
    let j = at + 3
    for (; j < css.length; j += 1) {
      if (css[j] === '(') depth += 1
      else if (css[j] === ')') {
        depth -= 1
        if (depth === 0) { j += 1; break }
      }
    }
    i = j
  }
  return out
}

describe('G · 规范（依赖 / 安全 / token）', () => {
  it('G1 无新增运行时依赖：dependencies 缺省，peerDependencies 与 HEAD 一致，lockfile importers 无 dependencies', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    expect(pkg.dependencies).toBeUndefined()

    const headPkg = JSON.parse(
      execFileSync('git', ['show', 'HEAD:package.json'], { cwd: ROOT, encoding: 'utf8' }),
    ) as { dependencies?: Record<string, string>; peerDependencies?: Record<string, string> }
    expect(headPkg.dependencies).toBeUndefined()
    expect(Object.keys(pkg.peerDependencies ?? {}).sort())
      .toEqual(Object.keys(headPkg.peerDependencies ?? {}).sort())

    const lock = readFileSync(resolve(ROOT, 'pnpm-lock.yaml'), 'utf8')
    const importers = lock.slice(lock.indexOf('importers:'), lock.indexOf('\npackages:'))
    expect(importers.length).toBeGreaterThan(0)
    expect(/^\s{4}dependencies:/m.test(importers)).toBe(false)
  })

  it('G2 构建产物只 require 宿主注入的种子（react / react-dom / ui-primitives）', () => {
    const bundle = readFileSync(resolve(ROOT, 'lib/client.js'), 'utf8')
    const requires = [...bundle.matchAll(/require\("([^"]+)"\)/g)].map((match) => match[1] as string)
    const unique = [...new Set(requires)].sort()
    expect(unique.length).toBeGreaterThan(0)
    for (const specifier of unique) {
      expect([
        '@deepseek-ai/dsh-client-ui-primitives',
        'react',
        'react-dom',
      ], specifier).toContain(specifier)
    }
    // 证据（见 §12）：v0.5.0 的 portal 需要 react-dom，profile 里 7 个已装插件
    // 也 require 它，且 app.asar 注册了 `react-dom` seed —— 属宿主注入，不是新增依赖。
  })

  it('G3 未把不可信内容交给 innerHTML / dangerouslySetInnerHTML / eval（源码只在注释里提及）', () => {
    const files = ['TrailTab.tsx', 'ZoomOverlay.tsx', 'markdown-result.tsx', 'json-tree.tsx', 'ui-primitives.ts']
    const pattern = /dangerouslySetInnerHTML|\.innerHTML|\beval\s*\(/
    for (const file of files) {
      const lines = readFileSync(resolve(ROOT, 'src/client', file), 'utf8').split('\n')
      lines.forEach((line, index) => {
        if (!pattern.test(line)) return
        const trimmed = line.trim()
        const isComment = trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')
        expect(isComment, `${file}:${index + 1} → ${trimmed}`).toBe(true)
      })
    }
    // 产物里连注释都没有：出现即真实调用。
    const bundle = readFileSync(resolve(ROOT, 'lib/client.js'), 'utf8')
    expect(bundle).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML|\beval\s*\(|new Function\s*\(/)
  })

  it('G4 无裸 hex（hex 只能出现在 var(--…) fallback 里）；20 个 v0.5.0 类名 + 13 个新文案键齐备', () => {
    expect(stripVarSpans(trailCss)).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    // 反证清洗器有效：把 fallback 还回去就能看到 hex。
    expect(trailCss).toMatch(/#[0-9a-fA-F]{3,8}\b/)

    const classes = [
      '.ttl-imgThumbWrap', '.ttl-imgThumb', '.ttl-detailLoad', '.ttl-detailRetry', '.ttl-detailMerged',
      '.ttl-zoom', '.ttl-zoomBackdrop', '.ttl-zoomPanel', '.ttl-zoomHead', '.ttl-zoomTitle', '.ttl-zoomTools',
      '.ttl-zoomSearch', '.ttl-zoomBody', '.ttl-zoomOutline', '.ttl-zoomOutlineRow', '.ttl-zoomPane',
      '.ttl-zoomTabs', '.ttl-zoomFoot', '.ttl-zoomKbd',
    ]
    for (const cls of classes) {
      const escaped = cls.replace(/\./g, '\\.')
      expect(new RegExp(`${escaped}(?=[\\s,{:.\\[]|$)`).test(trailCss), cls).toBe(true)
    }
    expect(trailCss).toContain('.ttl-zoomOutlineRow[aria-current="true"]')

    const keys: Array<keyof Dict> = [
      'imageLoadFailed', 'detailLoading', 'detailLoadFailed', 'detailRetry', 'detailLoadedFull',
      'mergedNoSurfaceOp', 'zoomOpen', 'zoomTitle', 'zoomClose', 'zoomSearch', 'zoomNoMatch',
      'zoomExport', 'zoomHint',
    ]
    for (const key of keys) {
      expect(t('zh', key), `zh.${key}`).toBeDefined()
      expect(t('en', key), `en.${key}`).toBeDefined()
    }
    expect(typeof t('zh', 'mergedNoSurfaceOp')).toBe('function')
    expect((t('en', 'mergedNoSurfaceOp') as (n: number) => string)(3)).toContain('3')
    expect(typeof t('zh', 'zoomTitle')).toBe('function')
  })
})

// ═════════════════════════════════════════════════════════════════════════
// H · artifact consistency
// ═════════════════════════════════════════════════════════════════════════

describe('H · 产物一致性', () => {
  it('H1 package.json 版本与 CHANGELOG 最新标题一致（bump-proof）', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as { version: string }
    const changelog = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf8')
    const match = /^##\s*\[([^\]]+)\]/m.exec(changelog)
    expect(match).not.toBeNull()
    expect(pkg.version).toBe(match?.[1])
    expect(pkg.version).toBe('0.5.0')
  })

  it('H2 lib/ 由 git 跟踪，且 v0.5.0 的 host/client 标记都进了产物', () => {
    const tracked = execFileSync('git', ['ls-files', '--', 'lib'], { cwd: ROOT, encoding: 'utf8' }).trim()
    expect(tracked.split('\n').filter(Boolean).length).toBeGreaterThan(0)

    const host = readFileSync(resolve(ROOT, 'lib/index.js'), 'utf8')
    for (const path of ['/trace-inspect/api/events', '/trace-inspect/api/attachment', '/trace-inspect/api/tool-detail']) {
      expect(host, path).toContain(path)
    }
    expect(host).toContain('attachment-not-found')

    const client = readFileSync(resolve(ROOT, 'lib/client.js'), 'utf8')
    for (const marker of ['ttl-img-thumb', 'ttl-detail-merged', 'ttl-zoomBackdrop', 'ttl-detail-retry', 'mergedNoSurfaceOp']) {
      expect(client, marker).toContain(marker)
    }
  })

  it('H3 产物含 v0.5.0 的响应头与错误词表（lib/index.js 与 src 同步）', () => {
    const host = readFileSync(resolve(ROOT, 'lib/index.js'), 'utf8')
    // 附件路由的冻结响应头。
    expect(host).toContain('private, max-age=300')
    expect(host).toContain('x-content-type-options')
    expect(host).toContain('nosniff')
    // 两条新路由的错误词表。
    for (const word of [
      'attachments-unavailable',
      'attachment-unavailable',
      'attachment-not-found',
      'seqs must be an array of at most',
    ]) {
      expect(host, word).toContain(word)
    }
    // 授权扫描在 host 侧执行（不是「只按 attachmentId 直读」）。
    expect(host).toContain('readImage')
  })
})
