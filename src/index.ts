/**
 * Host half of dsh-trace-inspect: one incremental, read-only route that serves
 * session events for the trail panel, behind a browser-trust fence.
 *
 *   POST /trace-inspect/api/events  { sessionId, afterSeq }
 *     → 200 { events, hasMore }   (one PAGE_SIZE page, ascending seq,
 *                                  truncated early at PAGE_BUDGET_BYTES)
 *     → 400 bad request / missing sessionId
 *     → 403 fence rejection
 *     → 404 session-not-found
 *     → 405 non-POST
 *     → 413 oversized request body
 *
 * v0.5.0 adds two more routes behind the same fence and error vocabulary:
 *
 *   GET  /trace-inspect/api/attachment?sessionId=&attachmentId=
 *     → 200 raw bytes (content-type = the referencing image block's mediaType)
 *     → 400 missing / malformed sessionId or attachmentId
 *     → 403 / 404 (no session-authorized image block, service unavailable,
 *                  readImage refused) / 405
 *   POST /trace-inspect/api/tool-detail  { sessionId, seqs }
 *     → 200 { items }   (unclipped arguments/results, ≤ TOOL_DETAIL_MAX_SEQS
 *                        seqs, whole response ≤ 8 MiB)
 *     → 400 / 403 / 404 / 405 / 413
 *
 * Two read paths, hottest first:
 *
 *   LIVE sessions (the trail's hot case — the session is generating):
 *     borrow the live store's frozen event snapshot (`snapshotEvents()` on
 *     DSH 0.2.0+, the `events` property on 0.1.x — both zero-copy borrows).
 *     The probe is O(1) (last seq), the tail slice is O(delta), and the whole
 *     path is synchronous — no await between borrowing the snapshot and
 *     writing the response, so no interleaved mutation. Zero deep clones: the
 *     store already deep-freezes its events, and `JSON.stringify` reads
 *     frozen objects fine. (The sessionQuery equivalents each
 *     `structuredClone` EVERY event — 3× per request through listEvents +
 *     readSession — which hammered the very process running the agent.)
 *
 *   COLD / persisted sessions (idle, pulled only on activation):
 *     sessionQuery with a per-session lastSeq cache, exactly as before. The
 *     `listEvents` probe is itself a whole-log read + per-event structuredClone
 *     inside sessionQuery, so the probe result is cached behind a short TTL
 *     (PROBE_TTL_MS): one probe per multi-page drain instead of one per page.
 *
 * inject = ['webServer', 'sessionQuery', 'sessions'] — all host services;
 * `sessions` is core DSH (sessionQuery itself depends on it), and the code
 * feature-detects it so foreign contexts degrade to the persisted path.
 */
import type {
  HostCtx,
  HttpHeadersLike,
  HttpRequestLike,
  HttpResponseLike,
  LiveSessionLike,
  SessionEventLike,
} from './context-types'
import { MAX_BODY_BYTES, PAGE_BUDGET_BYTES, PAGE_SIZE, projectEvent } from './wire'

export const inject = ['webServer', 'sessionQuery', 'sessions']

/** The plugin's host routes (exact paths; the fence + method rules are per route). */
export const EVENTS_PATH = '/trace-inspect/api/events'
export const ATTACHMENT_PATH = '/trace-inspect/api/attachment'
export const TOOL_DETAIL_PATH = '/trace-inspect/api/tool-detail'

/** Per-session cache: { lastSeq, events } refreshed only on growth (LRU). */
interface CacheEntry {
  lastSeq: number
  /** Time of the last authoritative listEvents probe for this entry. */
  probedAt: number
  events: SessionEventLike[]
  bytes: number
}
const trailCache = new Map<string, CacheEntry>()
const CACHE_MAX_ENTRIES = 64
const CACHE_MAX_BYTES = 64 * 1024 * 1024
let cacheBytes = 0

/**
 * Freshness window for the cached lastSeq probe. A persisted (non-live) log
 * cannot grow in this process — a session that starts generating turns live
 * and is served by the zero-copy fast path above — so reusing a recent probe
 * across a multi-page drain is safe; the TTL only bounds the staleness window.
 */
export const PROBE_TTL_MS = 2000

// ── Browser-trust fence (DNS-rebinding / cross-site defense, not auth) ────

function header(headers: HttpHeadersLike, name: string): string | undefined {
  const value = (headers as Record<string, unknown>)[name]
  return typeof value === 'string' ? value : undefined
}

function parseAuthority(authority: string): URL | undefined {
  try {
    return new URL(`http://${authority}`)
  } catch {
    return undefined
  }
}

export function isLoopbackHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  const parts = hostname.split('.')
  return parts.length === 4
    && parts[0] === '127'
    && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

/**
 * Decide whether one request may reach the trail routes. Behaviorally
 * identical to DSH's /api gateway fence (api-request-trust + loopback-hostname):
 * Host must resolve to loopback; cross-site browser markers refuse; an Origin
 * (when present) must name the same hostname.
 */
export function isTrustedApiRequest(request: { headers: HttpHeadersLike }): boolean {
  const host = header(request.headers, 'host')
  if (host === undefined) return false
  const hostUrl = parseAuthority(host)
  if (hostUrl === undefined || !isLoopbackHostname(hostUrl.hostname)) return false
  if (header(request.headers, 'sec-fetch-site') === 'cross-site') return false
  const origin = header(request.headers, 'origin')
  if (origin === undefined) return true
  try {
    return new URL(origin).hostname === hostUrl.hostname
  } catch {
    return false
  }
}

// ── Route helpers ─────────────────────────────────────────────────────────

function sendJson(res: HttpResponseLike, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(Buffer.byteLength(text)),
  })
  res.end(text)
}

/** Sentinel for an oversized request body (mapped to 413). */
const BODY_TOO_LARGE = Symbol('trail-body-too-large')

async function readJsonBody(req: HttpRequestLike): Promise<Record<string, unknown> | typeof BODY_TOO_LARGE> {
  const declared = header(req.headers, 'content-length')
  if (declared !== undefined) {
    const declaredBytes = Number(declared)
    if (Number.isFinite(declaredBytes) && declaredBytes > MAX_BODY_BYTES) return BODY_TOO_LARGE
  }
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8')
    total += buf.length
    if (total > MAX_BODY_BYTES) return BODY_TOO_LARGE
    chunks.push(buf)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  try {
    const parsed = JSON.parse(text.length > 0 ? text : '{}')
    return parsed !== null && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function afterSeqOf(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/** First index whose event seq is strictly greater than afterSeq (ascending seqs). */
function upperBound(events: ReadonlyArray<{ seq?: number }>, afterSeq: number): number {
  let lo = 0
  let hi = events.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    const seq = events[mid].seq
    if (typeof seq === 'number' && seq <= afterSeq) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Borrow the live store's frozen snapshot — O(1) amortized, zero copies.
 * DSH 0.2.0 renamed the live session's frozen log from the `events` property
 * to the `snapshotEvents()` method (the returned array is frozen and cached
 * between appends, so the borrow stays zero-copy); older DSH exposed the
 * array directly. Either face is accepted; the events must be ascending by
 * seq for the binary-search page slice.
 */
function liveEventsOf(session: LiveSessionLike): ReadonlyArray<SessionEventLike> | undefined {
  if (typeof session.snapshotEvents === 'function') {
    try {
      const snapshot = session.snapshotEvents()
      if (Array.isArray(snapshot)) return snapshot
    } catch {
      return undefined
    }
  }
  return Array.isArray(session.events) ? session.events : undefined
}

function liveSessionOf(ctx: HostCtx, sessionId: string): LiveSessionLike | undefined {
  const sessions = ctx.sessions
  if (sessions === undefined || typeof sessions.get !== 'function') return undefined
  try {
    const session = sessions.get(sessionId)
    if (session === null || typeof session !== 'object') return undefined
    return liveEventsOf(session as LiveSessionLike) !== undefined
      ? (session as LiveSessionLike)
      : undefined
  } catch {
    return undefined
  }
}

/**
 * Slice one ascending page after afterSeq; `project` trims the wire fields.
 *
 * A page also stops early at PAGE_BUDGET_BYTES so one hot session cannot make
 * a single response arbitrarily large. The first event of a page is always
 * delivered (even when it alone exceeds the budget) — otherwise a payload
 * larger than the budget would stall the client's `hasMore` drain forever.
 * `hasMore` keeps its meaning: the last delivered event is not the last one.
 */
function respondPage(
  res: HttpResponseLike,
  events: ReadonlyArray<SessionEventLike>,
  afterSeq: number,
  project: boolean,
): void {
  const lo = upperBound(events, afterSeq)
  const hardEnd = Math.min(events.length, lo + PAGE_SIZE)
  const tail: SessionEventLike[] = []
  let bytes = 0
  let i = lo
  for (; i < hardEnd; i += 1) {
    const projected = project ? projectEvent(events[i]) : events[i]
    const size = Buffer.byteLength(JSON.stringify(projected))
    if (tail.length > 0 && bytes + size > PAGE_BUDGET_BYTES) break
    bytes += size
    tail.push(projected)
  }
  sendJson(res, 200, { events: tail, hasMore: i < events.length })
}

/** Insert/refresh one cache entry, then evict past the entry/byte budgets. */
function cacheStore(
  sessionId: string,
  lastSeq: number,
  events: SessionEventLike[],
  bytes: number,
  probedAt: number,
): void {
  const existing = trailCache.get(sessionId)
  if (existing !== undefined) {
    trailCache.delete(sessionId)
    cacheBytes -= existing.bytes
  }
  trailCache.set(sessionId, { lastSeq, probedAt, events, bytes })
  cacheBytes += bytes
  while (trailCache.size > CACHE_MAX_ENTRIES || (cacheBytes > CACHE_MAX_BYTES && trailCache.size > 1)) {
    const oldest = trailCache.keys().next().value
    if (oldest === undefined) break
    const entry = trailCache.get(oldest)
    trailCache.delete(oldest)
    cacheBytes -= entry?.bytes ?? 0
  }
}

export function apply(ctx: HostCtx): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: EVENTS_PATH,
    handler: async (rawReq, rawRes) => {
      const req = rawReq as HttpRequestLike
      const res = rawRes as HttpResponseLike

      if (!isTrustedApiRequest({ headers: req.headers })) {
        sendJson(res, 403, { error: 'forbidden' })
        return
      }
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'method not allowed' })
        return
      }
      const body = await readJsonBody(req)
      if (body === BODY_TOO_LARGE) {
        sendJson(res, 413, { error: 'payload too large' })
        return
      }
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (sessionId.length === 0) {
        sendJson(res, 400, { error: 'sessionId is required' })
        return
      }
      const afterSeq = afterSeqOf(body.afterSeq)

      try {
        // Live fast path: synchronous, O(1) probe, O(delta) projection.
        const live = liveSessionOf(ctx, sessionId)
        if (live !== undefined) {
          respondPage(res, liveEventsOf(live) ?? [], afterSeq, true)
          return
        }

        // Persisted path. The listEvents probe costs a whole-log read +
        // per-event structuredClone inside sessionQuery, so its result is
        // cached behind PROBE_TTL_MS: a multi-page drain (each page = one
        // request) probes once instead of once per page.
        const cached = trailCache.get(sessionId)
        let lastSeq = -1
        let probedAt = 0
        if (cached !== undefined && Date.now() - cached.probedAt < PROBE_TTL_MS) {
          // Fresh probe reuse: trust the cached lastSeq, skip the round-trip.
          lastSeq = cached.lastSeq
          probedAt = cached.probedAt
        } else {
          try {
            const records = await ctx.sessionQuery.listEvents(sessionId)
            const last = records[records.length - 1]
            lastSeq = last !== undefined && typeof last.seq === 'number' ? last.seq : -1
            probedAt = Date.now()
          } catch {
            lastSeq = -1
            probedAt = Date.now()
          }
        }
        let base: SessionEventLike[]
        if (cached !== undefined && lastSeq >= 0 && cached.lastSeq === lastSeq) {
          base = cached.events
          if (probedAt > cached.probedAt) cached.probedAt = probedAt
          // LRU touch: re-insert at the fresh end.
          trailCache.delete(sessionId)
          trailCache.set(sessionId, cached)
        } else {
          const snapshot = await ctx.sessionQuery.readSession(sessionId)
          const raw = Array.isArray(snapshot.events) ? snapshot.events : []
          // Project once, accumulating wire bytes per event in the same pass —
          // no separate whole-log JSON.stringify just for the byte budget.
          let bytes = 0
          base = raw.map((event) => {
            const projected = projectEvent(event)
            bytes += Buffer.byteLength(JSON.stringify(projected))
            return projected
          })
          cacheStore(sessionId, lastSeq, base, bytes, probedAt)
        }
        // base is already projected (idempotently); serve without re-projecting.
        respondPage(res, base, afterSeq, false)
      } catch {
        sendJson(res, 404, { error: 'session-not-found' })
      }
    },
  }))

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: ATTACHMENT_PATH,
    handler: async (rawReq, rawRes) => {
      const req = rawReq as HttpRequestLike
      const res = rawRes as HttpResponseLike

      if (!isTrustedApiRequest({ headers: req.headers })) {
        sendJson(res, 403, { error: 'forbidden' })
        return
      }
      if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'method not allowed' })
        return
      }
      const params = queryParamsOf(req.url)
      const sessionId = params.get('sessionId')
      const attachmentId = params.get('attachmentId')
      if (!isUsableAttachmentId(sessionId) || !isUsableAttachmentId(attachmentId)) {
        sendJson(res, 400, { error: 'sessionId and attachmentId are required' })
        return
      }

      try {
        // Authorization: the id alone proves nothing — the SESSION's own event
        // stream must carry an image block naming it (§10.3.1).
        let ref: AttachmentRefLike | undefined
        try {
          ref = await authorizedImageOf(ctx, sessionId, attachmentId)
        } catch {
          sendJson(res, 404, { error: 'session-not-found' })
          return
        }
        if (ref === undefined) {
          sendJson(res, 404, { error: 'attachment-not-found' })
          return
        }
        // The Service contract types mediaType as ImageMediaType; a block that
        // names anything else is not a platform image reference, and must never
        // be echoed back as this origin's content-type.
        if (!IMAGE_MEDIA_TYPES.has(ref.mediaType)) {
          sendJson(res, 404, { error: 'attachment-unavailable' })
          return
        }

        const attachments = optionalService<AttachmentsServiceLike>(ctx, 'attachments')
        if (attachments === undefined || typeof attachments.readImage !== 'function') {
          sendJson(res, 404, { error: 'attachments-unavailable' })
          return
        }

        const data = await readImageBytes(attachments, ref)
        if (data === undefined) {
          sendJson(res, 404, { error: 'attachment-unavailable' })
          return
        }
        const body = Buffer.from(data)
        res.writeHead(200, {
          'content-type': ref.mediaType,
          'content-length': String(body.length),
          'cache-control': 'private, max-age=300',
          'x-content-type-options': 'nosniff',
        })
        res.end(body)
      } catch {
        // Nothing may escape as an uncaught error: a refused read is a 404.
        sendJson(res, 404, { error: 'attachment-unavailable' })
      }
    },
  }))

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: TOOL_DETAIL_PATH,
    handler: async (rawReq, rawRes) => {
      const req = rawReq as HttpRequestLike
      const res = rawRes as HttpResponseLike

      if (!isTrustedApiRequest({ headers: req.headers })) {
        sendJson(res, 403, { error: 'forbidden' })
        return
      }
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'method not allowed' })
        return
      }
      const body = await readJsonBody(req)
      if (body === BODY_TOO_LARGE) {
        sendJson(res, 413, { error: 'payload too large' })
        return
      }
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
      if (sessionId.length === 0) {
        sendJson(res, 400, { error: 'sessionId is required' })
        return
      }
      const rawSeqs = body.seqs
      if (!Array.isArray(rawSeqs) || rawSeqs.length > TOOL_DETAIL_MAX_SEQS) {
        sendJson(res, 400, { error: `seqs must be an array of at most ${TOOL_DETAIL_MAX_SEQS} seqs` })
        return
      }

      try {
        // Raw events, never the projected cache: the detail must be UNCLIPPED,
        // so the ARGS_CAP/RESULT_CAP-clipped trail cache is unusable here.
        const events = await rawSessionEventsOf(ctx, sessionId)
        const items = fitToolDetailItems(buildToolDetailItems(events, rawSeqs))
        sendJson(res, 200, { items })
      } catch {
        sendJson(res, 404, { error: 'session-not-found' })
      }
    },
  }))
}

// ── v0.5.0: session-authorized attachment bytes (§10.3.1) ────────────────

/** Longest accepted sessionId / attachmentId (a sane bound, not a format). */
export const ATTACHMENT_ID_MAX = 512

/** Session-authorization cache: LRU over ≤ 16 sessions, TTL ≤ 10s (§10.3.1). */
export const ATTACHMENT_AUTH_MAX_SESSIONS = 16
export const ATTACHMENT_AUTH_TTL_MS = 10_000

/**
 * One image reference as it appears in a session event — the host twin of the
 * client's `AttachmentRefLike`. `bytes` / `width` / `height` ride along only
 * when the source event provides them; `ImageAttachmentRef` types them as
 * required, so a reference missing them is completed before the call below.
 */
export interface AttachmentRefLike {
  attachmentId: string
  mediaType: string
  bytes?: number
  width?: number
  height?: number
  name?: string
}

/** The platform's own image media types (Service contract: `ImageMediaType`). */
const IMAGE_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

/** `attachments.readImage` as declared by the host Service contract. */
interface StoredImageLike {
  data: Uint8Array
}

interface AttachmentsServiceLike {
  readImage(ref: AttachmentRefLike, signal?: AbortSignal): Promise<StoredImageLike>
}

/** `ctx.get(key)` is the harness' optional-service accessor. */
interface HostCtxWithServices extends HostCtx {
  get?: (service: string) => unknown
}

/** Resolve an optional host service; missing accessor / refusal ⇒ undefined. */
function optionalService<T>(ctx: HostCtx, key: string): T | undefined {
  const getter = (ctx as HostCtxWithServices).get
  if (typeof getter !== 'function') return undefined
  try {
    const service = getter.call(ctx, key)
    return service !== null && typeof service === 'object' ? (service as T) : undefined
  } catch {
    return undefined
  }
}

function recordOf(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

/** Query params of the request URL; a malformed URL yields none. */
function queryParamsOf(url: string | undefined): URLSearchParams {
  try {
    return new URL(url ?? '/', 'http://localhost').searchParams
  } catch {
    return new URLSearchParams()
  }
}

/**
 * A usable id: non-empty, bounded, and free of whitespace / control characters
 * (which could never be a real session id or attachment id). Purely structural:
 * whether the id EXISTS is decided by the session log, below.
 */
function isUsableAttachmentId(value: string | null): value is string {
  if (value === null || value.length === 0 || value.length > ATTACHMENT_ID_MAX) return false
  return !/[\s\u0000-\u001f\u007f]/.test(value)
}

/** The event face the v0.5.0 routes read (surfaceOp rides on the event). */
type RawEvent = SessionEventLike & { surfaceOp?: unknown }

/**
 * Read one session's events for the attachment authorization scan: the live
 * store's frozen snapshot first (zero copy), then the /events projection cache
 * (its wire projection keeps image blocks intact), then sessionQuery. Throws
 * like sessionQuery does when the session cannot be read (⇒ 404).
 */
async function sessionEventsForAuth(ctx: HostCtx, sessionId: string): Promise<ReadonlyArray<RawEvent>> {
  const live = liveSessionOf(ctx, sessionId)
  if (live !== undefined) return (liveEventsOf(live) ?? []) as ReadonlyArray<RawEvent>
  const cached = trailCache.get(sessionId)
  if (cached !== undefined) {
    // LRU touch, same convention as the events route.
    trailCache.delete(sessionId)
    trailCache.set(sessionId, cached)
    return cached.events as ReadonlyArray<RawEvent>
  }
  return rawSessionEventsOf(ctx, sessionId)
}

/**
 * Read one session's RAW events: live snapshot first, then sessionQuery. The
 * projected trail cache is deliberately NOT consulted — /tool-detail must see
 * the unclipped arguments and result content (§10.3.2).
 */
async function rawSessionEventsOf(ctx: HostCtx, sessionId: string): Promise<ReadonlyArray<RawEvent>> {
  const live = liveSessionOf(ctx, sessionId)
  if (live !== undefined) return (liveEventsOf(live) ?? []) as ReadonlyArray<RawEvent>
  const snapshot = await ctx.sessionQuery.readSession(sessionId)
  const raw = Array.isArray(snapshot.events) ? snapshot.events : []
  return raw as ReadonlyArray<RawEvent>
}

/** One image block's reference, or undefined when the block is malformed. */
function imageRefOf(value: unknown): AttachmentRefLike | undefined {
  const attachment = recordOf(value)
  if (attachment === undefined) return undefined
  const attachmentId = attachment.attachmentId
  const mediaType = attachment.mediaType
  if (typeof attachmentId !== 'string' || attachmentId.length === 0) return undefined
  if (typeof mediaType !== 'string' || mediaType.length === 0) return undefined
  const ref: AttachmentRefLike = { attachmentId, mediaType }
  if (typeof attachment.bytes === 'number' && Number.isFinite(attachment.bytes)) ref.bytes = attachment.bytes
  if (typeof attachment.width === 'number' && Number.isFinite(attachment.width)) ref.width = attachment.width
  if (typeof attachment.height === 'number' && Number.isFinite(attachment.height)) ref.height = attachment.height
  if (typeof attachment.name === 'string' && attachment.name.length > 0) ref.name = attachment.name
  return ref
}

/** Every image block of one content value (string content carries none). */
function imageBlocksOf(content: unknown): AttachmentRefLike[] {
  if (!Array.isArray(content)) return []
  const out: AttachmentRefLike[] = []
  for (const block of content) {
    const b = recordOf(block)
    if (b === undefined || b.type !== 'image') continue
    const ref = imageRefOf(b.attachment)
    if (ref !== undefined) out.push(ref)
  }
  return out
}

/**
 * Index every image block a session's event stream references, by
 * attachmentId. Both shapes are scanned, so a live (raw) log and the projected
 * /events cache answer identically: `data.content` (projection) and
 * `data.message.content` (raw session log).
 */
function sessionImagesOf(events: ReadonlyArray<RawEvent>): Map<string, AttachmentRefLike> {
  const out = new Map<string, AttachmentRefLike>()
  for (const event of events) {
    const data = recordOf(event?.data)
    if (data === undefined) continue
    const message = recordOf(data.message)
    const contents = message !== undefined ? [data.content, message.content] : [data.content]
    for (const content of contents) {
      for (const ref of imageBlocksOf(content)) {
        if (!out.has(ref.attachmentId)) out.set(ref.attachmentId, ref)
      }
    }
  }
  return out
}

interface AttachmentAuthEntry {
  at: number
  images: Map<string, AttachmentRefLike>
}

const attachmentAuthCache = new Map<string, AttachmentAuthEntry>()

function storeAuthEntry(sessionId: string, images: Map<string, AttachmentRefLike>): void {
  const existing = attachmentAuthCache.get(sessionId)
  if (existing !== undefined) attachmentAuthCache.delete(sessionId)
  attachmentAuthCache.set(sessionId, { at: Date.now(), images })
  while (attachmentAuthCache.size > ATTACHMENT_AUTH_MAX_SESSIONS) {
    const oldest = attachmentAuthCache.keys().next().value
    if (oldest === undefined) break
    attachmentAuthCache.delete(oldest)
  }
}

/**
 * The reference the session log authorizes for this attachmentId — undefined
 * when no image block names it (⇒ 404, never a direct id read).
 */
async function authorizedImageOf(
  ctx: HostCtx,
  sessionId: string,
  attachmentId: string,
): Promise<AttachmentRefLike | undefined> {
  const cached = attachmentAuthCache.get(sessionId)
  if (cached !== undefined && Date.now() - cached.at < ATTACHMENT_AUTH_TTL_MS) {
    attachmentAuthCache.delete(sessionId)
    attachmentAuthCache.set(sessionId, cached)
    return cached.images.get(attachmentId)
  }
  const events = await sessionEventsForAuth(ctx, sessionId)
  const images = sessionImagesOf(events)
  storeAuthEntry(sessionId, images)
  return images.get(attachmentId)
}

function isBytes(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array
}

/**
 * Read one image's bytes, then (only when the log omitted dimensions) retry
 * once with the neutral shape the Service contract's required `width`/`height`
 * demand. Never throws: every failure is `undefined` (⇒ 404).
 */
async function readImageBytes(
  attachments: AttachmentsServiceLike,
  ref: AttachmentRefLike,
): Promise<Uint8Array | undefined> {
  const attempt = async (candidate: AttachmentRefLike): Promise<Uint8Array | undefined> => {
    try {
      const stored = await attachments.readImage(candidate)
      const data = recordOf(stored)?.data
      return isBytes(data) && data.length > 0 ? data : undefined
    } catch {
      return undefined
    }
  }

  const first = await attempt(ref)
  if (first !== undefined) return first
  if (ref.bytes !== undefined && ref.width !== undefined && ref.height !== undefined) return undefined
  return attempt({ ...ref, bytes: ref.bytes ?? 0, width: ref.width ?? 0, height: ref.height ?? 0 })
}

// ── v0.5.0: on-demand full tool detail (§10.3.2) ─────────────────────────

/** Max seqs per /tool-detail request (contract §10.3.2: `seqs ≤ 32`). */
export const TOOL_DETAIL_MAX_SEQS = 32

/** Hard cap for one /tool-detail response. */
export const TOOL_DETAIL_MAX_RESPONSE_BYTES = 8 * 1024 * 1024

/** Per-field text cap applied when a response would exceed the hard cap. */
export const TOOL_DETAIL_TEXT_CAP_BYTES = 4 * 1024 * 1024

/** One content block of a full tool result (text kept whole, image as a ref). */
export type ToolDetailBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; attachment: AttachmentRefLike }

/** The full (unclipped) detail of one tool step. */
export interface ToolDetailItem {
  /**
   * Echo of the requested seq (a call seq or any result seq of that step);
   * `arguments`/`content` are always the whole step, resolved by callId. The
   * client only ever asks for `TrailStep.seq` (= the call seq) — see T10 F-V4.
   */
  seq: number
  callId: string | null
  name: string
  arguments: string | null
  argsBytes: number
  content: ToolDetailBlock[] | null
  contentBytes: number
  isError: boolean
  error: { name?: string; code?: string } | null
  /** Any field was clipped again by the response-size cap (not the request caps). */
  truncated?: boolean
}

/** `data.callId`, else `data.message.source.callId` (raw session logs). */
function callIdOf(data: Record<string, unknown>): string | null {
  if (typeof data.callId === 'string' && data.callId.length > 0) return data.callId
  const source = recordOf(recordOf(data.message)?.source)
  if (source !== undefined && typeof source.callId === 'string' && source.callId.length > 0) {
    return source.callId
  }
  return null
}

/** `data.content`, else `data.message.content` (raw session logs). */
function rawDetailContent(data: Record<string, unknown>): unknown {
  const direct = data.content
  if (typeof direct === 'string' || Array.isArray(direct)) return direct
  const nested = recordOf(data.message)?.content
  return typeof nested === 'string' || Array.isArray(nested) ? nested : undefined
}

/** Full content blocks of one tool/result event (no clipping, order kept). */
function detailBlocksOf(content: unknown): ToolDetailBlock[] {
  if (typeof content === 'string') return content.length > 0 ? [{ type: 'text', text: content }] : []
  if (!Array.isArray(content)) return []
  const out: ToolDetailBlock[] = []
  for (const block of content) {
    const b = recordOf(block)
    if (b === undefined) continue
    if (b.type === 'text') {
      if (typeof b.text === 'string' && b.text.length > 0) out.push({ type: 'text', text: b.text })
      continue
    }
    if (b.type !== 'image') continue
    const ref = imageRefOf(b.attachment)
    if (ref !== undefined) out.push({ type: 'image', attachment: ref })
  }
  return out
}

function errorOf(data: Record<string, unknown>): { name?: string; code?: string } | null {
  const error = recordOf(data.error)
  if (error === undefined) return null
  const out: { name?: string; code?: string } = {}
  if (typeof error.name === 'string' && error.name.length > 0) out.name = error.name
  if (typeof error.code === 'string' && error.code.length > 0) out.code = error.code
  return Object.keys(out).length > 0 ? out : null
}

/** `surfaceOp` on the event, else inside `data`; anything odd means append. */
function isReplaceOp(value: unknown): boolean {
  const op = recordOf(value)
  return op !== undefined && op.op === 'replace'
}

/**
 * Aggregate the full detail of one step from its contributing tool/result
 * events, in ascending seq order: text blocks concatenate, images dedupe by
 * attachmentId, and a surfaceOp `replace` drops everything collected before it
 * (the same rule the client fold applies, so the detail matches the preview).
 */
function detailContentOf(events: ReadonlyArray<RawEvent>): {
  blocks: ToolDetailBlock[] | null
  bytes: number
  isError: boolean
  error: { name?: string; code?: string } | null
} {
  let blocks: ToolDetailBlock[] = []
  const seenImages = new Set<string>()
  let bytes = 0
  let isError = false
  let error: { name?: string; code?: string } | null = null

  for (const event of events) {
    const data = recordOf(event.data) ?? {}
    if (isReplaceOp(event.surfaceOp !== undefined ? event.surfaceOp : data.surfaceOp)) {
      blocks = []
      seenImages.clear()
      bytes = 0
    }
    for (const block of detailBlocksOf(rawDetailContent(data))) {
      if (block.type === 'text') {
        bytes += block.text.length
        blocks.push(block)
        continue
      }
      const id = block.attachment.attachmentId
      if (seenImages.has(id)) continue
      seenImages.add(id)
      blocks.push(block)
    }
    const message = recordOf(data.message)
    isError = data.isError === true || (message !== undefined && message.isError === true)
    error = errorOf(data)
  }
  return { blocks: blocks.length > 0 ? blocks : null, bytes, isError, error }
}

/** Argument string of one tool/call event (full, unclipped). */
function argumentsOf(event: RawEvent): string | null {
  const data = recordOf(event.data)
  if (data === undefined) return null
  return typeof data.arguments === 'string' ? data.arguments : null
}

/**
 * Resolve the requested seqs to full step details. A seq that names no
 * tool/call or tool/result event is omitted (never an error). Both faces of a
 * step are returned together: the tool/call supplies name + full arguments,
 * and every tool/result of the same callId supplies the full content — so a
 * request for either the call seq (the client's TrailStep.seq) or a result seq
 * yields the whole step.
 */
export function buildToolDetailItems(
  events: ReadonlyArray<RawEvent>,
  seqs: ReadonlyArray<unknown>,
): ToolDetailItem[] {
  const bySeq = new Map<number, RawEvent>()
  const callByCallId = new Map<string, RawEvent>()
  const resultsByCallId = new Map<string, RawEvent[]>()
  for (const event of events) {
    if (typeof event?.seq !== 'number') continue
    const type = event.type
    if (type !== 'tool/call' && type !== 'tool/result') continue
    if (!bySeq.has(event.seq)) bySeq.set(event.seq, event)
    const data = recordOf(event.data)
    if (data === undefined) continue
    const callId = callIdOf(data)
    if (callId === null) continue
    if (type === 'tool/call') {
      if (!callByCallId.has(callId)) callByCallId.set(callId, event)
      continue
    }
    const list = resultsByCallId.get(callId)
    if (list === undefined) resultsByCallId.set(callId, [event])
    else list.push(event)
  }

  const items: ToolDetailItem[] = []
  const requested = new Set<number>()
  for (const raw of seqs) {
    const seq = Number(raw)
    if (!Number.isFinite(seq) || requested.has(seq)) continue
    requested.add(seq)
    const event = bySeq.get(seq)
    if (event === undefined) continue
    const data = recordOf(event.data) ?? {}
    const callId = callIdOf(data)
    const call = callId !== null ? callByCallId.get(callId) : undefined
    const callName = call !== undefined ? recordOf(call.data)?.name : undefined
    const errorName = errorOf(data)?.name
    const name = typeof data.name === 'string' && data.name.length > 0
      ? data.name
      : (errorName ?? (typeof callName === 'string' && callName.length > 0 ? callName : 'tool'))

    // Result events of the step: this event plus every contribution of its
    // callId, in ascending seq order, each counted once.
    const contributions = new Map<number, RawEvent>()
    if (event.type === 'tool/result') contributions.set(event.seq, event)
    if (callId !== null) {
      for (const result of resultsByCallId.get(callId) ?? []) contributions.set(result.seq, result)
    }
    const ordered = [...contributions.values()].sort((a, b) => a.seq - b.seq)
    const content = detailContentOf(ordered)

    const argumentsRaw = event.type === 'tool/call' ? argumentsOf(event) : (call !== undefined ? argumentsOf(call) : null)
    items.push({
      seq,
      callId,
      name,
      arguments: argumentsRaw,
      argsBytes: argumentsRaw === null ? 0 : argumentsRaw.length,
      content: content.blocks,
      contentBytes: content.bytes,
      isError: content.isError,
      error: content.error,
    })
  }
  return items
}

/** Clip one string to at most `maxBytes` UTF-8 bytes, on a code-point boundary. */
function clipUtf8(value: string, maxBytes: number): { text: string; clipped: boolean } {
  const buf = Buffer.from(value, 'utf8')
  if (buf.length <= maxBytes) return { text: value, clipped: false }
  let end = Math.min(maxBytes, buf.length)
  // Stopping ON a continuation byte would split a code point: back off to the
  // lead byte of the split character.
  while (end > 0 && end < buf.length && (buf[end] & 0xc0) === 0x80) end -= 1
  return { text: buf.subarray(0, end).toString('utf8'), clipped: true }
}

/** Apply the per-field byte cap to one item's arguments and content texts. */
function truncateToolDetailItem(item: ToolDetailItem, capBytes: number): ToolDetailItem {
  let clipped = false
  let args = item.arguments
  if (args !== null) {
    const result = clipUtf8(args, capBytes)
    if (result.clipped) {
      clipped = true
      args = result.text
    }
  }
  let content = item.content
  if (content !== null) {
    content = content.map((block) => {
      if (block.type !== 'text') return block
      const result = clipUtf8(block.text, capBytes)
      if (!result.clipped) return block
      clipped = true
      return { type: 'text' as const, text: result.text }
    })
  }
  return clipped ? { ...item, arguments: args, content, truncated: true } : { ...item, arguments: args, content }
}

function detailBytes(items: ToolDetailItem[]): number {
  return Buffer.byteLength(JSON.stringify({ items }))
}

/**
 * Fit a tool-detail response inside TOOL_DETAIL_MAX_RESPONSE_BYTES: the
 * contract's per-field 4 MiB cap first; when even that leaves the response over
 * the hard cap (many requested seqs, or JSON escaping), the per-field cap is
 * shrunk proportionally — always downward, never above 4 MiB — until the whole
 * response fits. A field that gets clipped carries `truncated: true`.
 */
export function fitToolDetailItems(items: ToolDetailItem[]): ToolDetailItem[] {
  if (detailBytes(items) <= TOOL_DETAIL_MAX_RESPONSE_BYTES) return items
  let cap = TOOL_DETAIL_TEXT_CAP_BYTES
  let out = items.map((item) => truncateToolDetailItem(item, cap))
  for (let guard = 0; guard < 64; guard += 1) {
    const bytes = detailBytes(out)
    if (bytes <= TOOL_DETAIL_MAX_RESPONSE_BYTES) return out
    if (cap === 0) return out
    const scaled = Math.floor(cap * (TOOL_DETAIL_MAX_RESPONSE_BYTES / bytes))
    cap = scaled >= cap ? cap - 1 : scaled
    if (cap < 0) cap = 0
    out = items.map((item) => truncateToolDetailItem(item, cap))
  }
  return out
}
