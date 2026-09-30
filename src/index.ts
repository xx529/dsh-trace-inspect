/**
 * Host half of dsh-turn-outline: one incremental, read-only route that serves
 * session events for the trail panel, behind a browser-trust fence.
 *
 *   POST /turn-outline/api/events  { sessionId, afterSeq }
 *     → 200 { events, hasMore }   (one PAGE_SIZE page, ascending seq)
 *     → 400 bad request / missing sessionId
 *     → 403 fence rejection
 *     → 404 session-not-found
 *     → 405 non-POST
 *     → 413 oversized request body
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
  TrailEventsRequest,
} from './context-types'
import { MAX_BODY_BYTES, PAGE_SIZE, projectEvent } from './wire'

export const inject = ['webServer', 'sessionQuery', 'sessions']

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
const CACHE_MAX_BYTES = 32 * 1024 * 1024
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

async function readJsonBody(req: HttpRequestLike): Promise<TrailEventsRequest | typeof BODY_TOO_LARGE> {
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

/** Slice one ascending page after afterSeq; `project` trims the wire fields. */
function respondPage(
  res: HttpResponseLike,
  events: ReadonlyArray<SessionEventLike>,
  afterSeq: number,
  project: boolean,
): void {
  const lo = upperBound(events, afterSeq)
  const end = Math.min(events.length, lo + PAGE_SIZE)
  const tail: SessionEventLike[] = []
  for (let i = lo; i < end; i += 1) tail.push(project ? projectEvent(events[i]) : events[i])
  sendJson(res, 200, { events: tail, hasMore: end < events.length })
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
    path: '/turn-outline/api/events',
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
}
