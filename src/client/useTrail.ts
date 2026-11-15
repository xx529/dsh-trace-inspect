/**
 * useTrail.ts — subscription-driven session-event hook for the trail panel.
 *
 * Refreshing strategy (v0.2+): no timer polling. Pull once on activation,
 * then subscribe to the client `sessions` binding snapshot; any snapshot
 * change (running flip, new steps) re-pulls the delta. The tab's `visible`
 * gate pauses the subscription entirely.
 *
 * Incremental folding (v0.2.1): incoming events are pushed ONCE into a
 * TrailFolder instead of re-folding the whole accumulated array on every
 * pull. Closed turns keep their object identity across snapshots, so
 * memoized row components skip re-rendering; each throttled pull costs
 * O(delta) folding + O(page) appends instead of a full O(n) re-fold.
 * Duplicate / re-sent pages are dropped by the folder's seq watermark.
 *
 * Segmented history (v0.12.0): the first load is the TAIL segment — the host
 * returns at most PAGE_TURNS prompt-anchored turns (`direction: 'before'`),
 * exactly the backwards axis DSH's own session window exposes through
 * `SessionPageRequest.beforeSeq` / `hasMore` / `loadOlder()`. Opening a long
 * session therefore no longer walks the whole log: `hasOlder` drives a
 * "load earlier" affordance, and each older page is prepended (the window is
 * re-folded once per page — O(loaded window), never O(whole log)).
 *
 * Forward pulls keep working unchanged: the live tail is drained from the
 * current seq watermark, at most MAX_PULL_PAGES pages per pull, with the
 * throttled continuation when a burst leaves pages pending. A transport that
 * predates the backwards axis (no `hasOlder` in the response) falls back to
 * the historical "drain the whole log from seq 0" behaviour.
 */
import * as React from 'react'
import type { AttachmentRefLike } from './attachment-url'
import type { SessionEventLike } from '../trail-model'
import { TrailFolder, type TrailStats, type TrailTurn } from '../trail-model'
import { PAGE_TURNS } from '../paging'

/** One history request: forward page or backwards turn segment. */
export interface TrailPageRequest {
  /** Forward page: deliver events with seq > afterSeq. */
  afterSeq?: number
  /** Backwards segment: deliver the turn segment ending just before this seq. */
  beforeSeq?: number
  /** Backwards segment size in turns (host clamps 1..MAX_PAGE_TURNS). */
  maxTurns?: number
  /** `'before'` selects the backwards axis; omitted means the forward page. */
  direction?: 'before'
}

export interface FetchEventsResult {
  events: SessionEventLike[]
  /** Forward pages: the server held more events back; re-pull to drain. */
  hasMore?: boolean
  /**
   * Backwards pages: an earlier turn segment still exists. Its presence is
   * also the capability probe — a transport that omits it is treated as a
   * legacy forward-only transport.
   */
  hasOlder?: boolean
}

export type FetchEvents = (sessionId: string, request: TrailPageRequest) => Promise<FetchEventsResult>

export interface SessionsServiceLike {
  binding(sessionId: string): {
    session?: SessionFaceLike
    /** 0.2.0 bindings also carry the client event window feed. */
    eventSource?: EventSourceFaceLike
  } | undefined
}

export interface SessionFaceLike {
  subscribe(listener: () => void): () => void
  getSnapshot(): { running?: boolean } | null
}

/** The 0.2.0 client event window feed (entries + hasMore per snapshot). */
export interface EventSourceFaceLike {
  subscribe(listener: () => void): () => void
  getSnapshot(): unknown
}

export type TrailStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface TrailState {
  turns: TrailTurn[]
  stats: TrailStats
  status: TrailStatus
  error: string | null
  refresh: () => void
  /** An earlier turn segment exists before the loaded window. */
  hasOlder: boolean
  /** One older segment is being fetched (button/auto-load busy state). */
  loadingOlder: boolean
  /**
   * Fetch one earlier turn segment and prepend it. Returns true when a request
   * actually started (false while busy, exhausted, or unloaded) — the panel
   * uses it to decide whether to arm its scroll anchor.
   */
  loadOlder: () => boolean
}

/** Cap on drained forward pages per pull (each page ≤ PAGE_SIZE events). */
export const MAX_PULL_PAGES = 64

/**
 * Default transport: POST /trace-inspect/api/events.
 *
 * The request body is the page request verbatim (`afterSeq` / `direction` /
 * `beforeSeq` / `maxTurns`); the response's optional `hasOlder` says whether
 * the host understands the backwards axis.
 */
export function fetchTrailEvents(sessionId: string, request: TrailPageRequest = {}): Promise<FetchEventsResult> {
  const url = new URL('/trace-inspect/api/events', window.location.origin)
  return fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sessionId, ...request }),
  }).then(async (response) => {
    const data = (await response.json()) as {
      events?: SessionEventLike[]
      hasMore?: boolean
      hasOlder?: boolean
      error?: string
    }
    if (!response.ok || data === null || typeof data !== 'object' || !Array.isArray(data.events)) {
      throw new Error(data !== null && typeof data === 'object' && typeof data.error === 'string'
        ? data.error
        : `HTTP ${response.status}`)
    }
    return {
      events: data.events,
      hasMore: data.hasMore === true,
      ...(typeof data.hasOlder === 'boolean' ? { hasOlder: data.hasOlder } : {}),
    }
  })
}

const EMPTY: TrailTurn[] = []
const EMPTY_STATS: TrailStats = { total: 0, failed: 0, tools: [] }

/** Fold one contiguous ascending event window from scratch. */
function foldWindow(events: readonly SessionEventLike[]): TrailFolder {
  const folder = new TrailFolder()
  for (const event of events) folder.push(event)
  return folder
}

// ── On-demand full tool detail (contract §10.3.4) ────────────────────────

/** One full (unclipped) content block of a tool result. */
export type ToolDetailBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; attachment: AttachmentRefLike }

/**
 * The full detail of one tool step, as returned by POST
 * /trace-inspect/api/tool-detail. `arguments` / `content` are the values the
 * wire preview clipped (ARGS_CAP / RESULT_CAP); `truncated` marks a field the
 * host clipped AGAIN to keep the whole response ≤ 8 MiB.
 */
export interface ToolDetailItem {
  seq: number
  callId: string | null
  name: string
  arguments: string | null
  argsBytes: number
  content: ToolDetailBlock[] | null
  contentBytes: number
  isError: boolean
  error: { name?: string; code?: string } | null
  truncated?: boolean
}

export type ToolDetailResult =
  | { ok: true; items: ToolDetailItem[] }
  | { ok: false; reason: 'http' | 'network' | 'unavailable' }

/**
 * Fetch untruncated tool details for one session. Never throws:
 *   - `network`     the request itself failed (offline, aborted, DNS, …)
 *   - `http`        the route answered a non-2xx status
 *   - `unavailable` no fetch/window to call, or a 2xx body without `items`
 */
export async function fetchToolDetail(
  sessionId: string,
  seqs: number[],
  signal?: AbortSignal,
): Promise<ToolDetailResult> {
  if (seqs.length === 0) return { ok: true, items: [] }
  if (typeof fetch !== 'function' || typeof window === 'undefined') return { ok: false, reason: 'unavailable' }
  try {
    const url = new URL('/trace-inspect/api/tool-detail', window.location.origin)
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sessionId, seqs }),
      ...(signal !== undefined ? { signal } : {}),
    })
    if (!response.ok) return { ok: false, reason: 'http' }
    const data = (await response.json()) as { items?: unknown }
    if (data === null || typeof data !== 'object' || !Array.isArray(data.items)) {
      return { ok: false, reason: 'unavailable' }
    }
    return { ok: true, items: data.items as ToolDetailItem[] }
  } catch {
    return { ok: false, reason: 'network' }
  }
}

export function useTrail(
  sessionId: string,
  visible: boolean,
  fetchEvents: FetchEvents,
  sessionsService?: SessionsServiceLike,
): TrailState {
  const [turns, setTurns] = React.useState<TrailTurn[]>(EMPTY)
  const [stats, setStats] = React.useState<TrailStats>(EMPTY_STATS)
  const [status, setStatus] = React.useState<TrailStatus>('idle')
  const [error, setError] = React.useState<string | null>(null)
  const [hasOlder, setHasOlder] = React.useState(false)
  const [loadingOlder, setLoadingOlder] = React.useState(false)

  const folderRef = React.useRef<TrailFolder | null>(null)
  /**
   * The contiguous loaded window (ascending): tail segment first, older
   * segments prepended, live events appended. Only a prepend needs a re-fold;
   * appends go through the folder's incremental push.
   */
  const windowRef = React.useRef<SessionEventLike[]>([])
  const seqRef = React.useRef(0)
  const hasOlderRef = React.useRef(false)
  const loadingOlderRef = React.useRef(false)
  const initializingRef = React.useRef(false)
  const pendingRefreshRef = React.useRef(false)
  const sessionIdRef = React.useRef(sessionId)
  const fetchRef = React.useRef(fetchEvents)
  const requestGen = React.useRef(0)
  // Throttle the subscription-driven refresh. During live generation DSH emits
  // many events; a network round-trip + fold + re-render on EVERY event
  // hammers the (shared) main thread. Coalesce a burst into one update.
  const lastPullAt = React.useRef(0)
  const throttleTimer = React.useRef<number | null>(null)
  // Mirrors for async callbacks: pull() must know the current visibility and
  // reach the throttled scheduler (defined below it) without re-creating.
  const visibleRef = React.useRef(visible)
  const schedulePullRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => { fetchRef.current = fetchEvents }, [fetchEvents])
  React.useEffect(() => { visibleRef.current = visible }, [visible])

  // Cancel any pending throttled pull on teardown.
  React.useEffect(() => () => {
    if (throttleTimer.current !== null) window.clearTimeout(throttleTimer.current)
    schedulePullRef.current = null
  }, [])

  /** Publish one folder snapshot (turn object identity survives appends). */
  const publish = React.useCallback((folder: TrailFolder): void => {
    setTurns(folder.snapshot())
    setStats(folder.stats())
  }, [])

  /**
   * Push one ascending forward page into the open folder AND the window.
   * Returns true when the watermark advanced. Duplicates are dropped by the
   * folder, so a re-sent page never grows the window.
   */
  const appendEvents = React.useCallback((events: readonly SessionEventLike[]): boolean => {
    let folder = folderRef.current
    if (folder === null) folder = folderRef.current = new TrailFolder()
    let pushed = false
    for (const event of events) {
      const before = folder.latestSeq
      folder.push(event)
      if (folder.latestSeq !== before) {
        windowRef.current.push(event)
        pushed = true
      }
    }
    if (pushed) {
      seqRef.current = folder.latestSeq
      publish(folder)
    }
    return pushed
  }, [publish])

  /**
   * Drain the forward tail from the current watermark (the session window's
   * "follow" direction): at most MAX_PULL_PAGES pages per pull.
   */
  const drainForward = React.useCallback(async (
    generation: number,
    /** First response already fetched (legacy opening page), drained in place. */
    firstPage?: FetchEventsResult,
  ): Promise<void> => {
    const sid = sessionIdRef.current
    const seqBefore = seqRef.current
    const visibleValue = visibleRef.current
    let drainCapped = false
    let pending: FetchEventsResult | undefined = firstPage
    try {
      for (let page = 0; page < MAX_PULL_PAGES; page += 1) {
        const response = pending ?? await fetchRef.current(sid, { afterSeq: seqRef.current })
        pending = undefined
        const { events, hasMore } = response
        if (generation !== requestGen.current || sid !== sessionIdRef.current) return
        if (events.length > 0) appendEvents(events)
        if (hasMore !== true || events.length === 0) {
          drainCapped = false
          break
        }
        drainCapped = page === MAX_PULL_PAGES - 1
      }
      setError(null)
      setStatus('ready')
      // A capped drain with pages pending (a long gap while the tab was
      // hidden) must not truncate silently: keep draining through the
      // throttled path. Guards stop a misbehaving transport from looping
      // forever: the tab is still visible, the pull is still current, and THIS
      // pull made real seq progress (a stalled transport yields none).
      if (
        drainCapped
        && seqRef.current !== seqBefore
        && generation === requestGen.current
        && sid === sessionIdRef.current
        && visibleValue
        && schedulePullRef.current !== null
      ) {
        schedulePullRef.current()
      }
    } catch (reason) {
      if (generation !== requestGen.current) return
      setError(reason instanceof Error ? reason.message : String(reason))
      setStatus((current) => (current === 'ready' ? current : 'error'))
    }
  }, [appendEvents])

  /**
   * First load: the TAIL turn segment (v0.12.0). A transport that does not
   * answer `hasOlder` predates the backwards axis, so its response is the
   * forward prefix from seq 0 and the historical drain keeps the panel whole.
   */
  const loadInitial = React.useCallback(async (): Promise<void> => {
    const generation = ++requestGen.current
    const sid = sessionIdRef.current
    initializingRef.current = true
    pendingRefreshRef.current = false
    try {
      const page = await fetchRef.current(sid, { direction: 'before', maxTurns: PAGE_TURNS })
      if (generation !== requestGen.current || sid !== sessionIdRef.current) return
      if (typeof page.hasOlder === 'boolean') {
        // Segmented transport: the page IS the newest turn segment.
        const folder = foldWindow(page.events)
        folderRef.current = folder
        windowRef.current = page.events.slice()
        seqRef.current = Math.max(0, folder.latestSeq)
        hasOlderRef.current = page.hasOlder === true && page.events.length > 0
        setHasOlder(hasOlderRef.current)
        publish(folder)
        setError(null)
        setStatus('ready')
        return
      }
      // Legacy forward-only transport: its answer is the forward prefix from
      // seq 0, so it doubles as the opening page of the historical drain.
      folderRef.current = null
      windowRef.current = []
      seqRef.current = 0
      hasOlderRef.current = false
      setHasOlder(false)
      if (page.events.length > 0) await drainForward(generation, page)
      else {
        setError(null)
        setStatus('ready')
      }
    } catch (reason) {
      if (generation !== requestGen.current) return
      setError(reason instanceof Error ? reason.message : String(reason))
      setStatus((current) => (current === 'ready' ? current : 'error'))
    } finally {
      // Only the newest open may drop the latch: a superseded pass must not
      // mark the transport idle while its successor is still loading.
      if (generation === requestGen.current) initializingRef.current = false
      // A live mutation landing mid-open was parked; catch up now.
      if (pendingRefreshRef.current && sid === sessionIdRef.current) {
        pendingRefreshRef.current = false
        schedulePullRef.current?.()
      }
    }
  }, [appendEvents, drainForward, publish])

  /**
   * Forward refresh: the live tail (or, on an empty/unloaded window, a fresh
   * tail segment). Parked while the first load is in flight — otherwise the
   * session subscription's opening burst would race the tail load and drain
   * the whole log from seq 0, which is exactly what segmented loading avoids.
   */
  const refresh = React.useCallback((): void => {
    if (initializingRef.current) {
      pendingRefreshRef.current = true
      return
    }
    if (folderRef.current === null) {
      void loadInitial()
      return
    }
    void drainForward(++requestGen.current)
  }, [drainForward, loadInitial])

  /**
   * Page up: fetch one earlier turn segment with the window's first seq as the
   * cut (`beforeSeq`), prepend it, and re-fold the contiguous window once.
   * Mirrors `Session.loadOlder()`: guarded by `hasOlder` + a busy latch, and a
   * failed page keeps `hasOlder` so the user can retry.
   */
  const loadOlder = React.useCallback((): boolean => {
    if (!hasOlderRef.current || loadingOlderRef.current) return false
    const sid = sessionIdRef.current
    const window = windowRef.current
    if (sid.length === 0 || window.length === 0) return false
    const first = window[0]
    const beforeSeq = first !== undefined && typeof first.seq === 'number' ? first.seq : 0
    if (!Number.isFinite(beforeSeq) || beforeSeq <= 0) {
      hasOlderRef.current = false
      setHasOlder(false)
      return false
    }
    loadingOlderRef.current = true
    setLoadingOlder(true)
    void (async (): Promise<void> => {
      try {
        const page = await fetchRef.current(sid, { direction: 'before', beforeSeq, maxTurns: PAGE_TURNS })
        if (sid !== sessionIdRef.current) return
        const older = page.events.filter(
          (event) => typeof event.seq === 'number' && event.seq < beforeSeq,
        )
        if (older.length > 0) {
          // Re-read the window: a forward pull may have appended while we
          // awaited, and the re-fold must cover the whole contiguous range.
          const merged = older.concat(windowRef.current)
          const folder = foldWindow(merged)
          windowRef.current = merged
          folderRef.current = folder
          seqRef.current = folder.latestSeq
          publish(folder)
        }
        // Only claim an earlier segment when this page actually advanced; a
        // stale/empty page must not spin the control forever.
        hasOlderRef.current = page.hasOlder === true && older.length > 0
        setHasOlder(hasOlderRef.current)
        setError(null)
        setStatus('ready')
      } catch (reason) {
        if (sid !== sessionIdRef.current) return
        setError(reason instanceof Error ? reason.message : String(reason))
        // Keep hasOlder: the same segment can be retried.
      } finally {
        // A session switch already reset both flags; a stale completion must
        // not unlock the NEW session's load-earlier control.
        if (sid === sessionIdRef.current) {
          loadingOlderRef.current = false
          setLoadingOlder(false)
        }
      }
    })()
    return true
  }, [publish])

  /**
   * Throttled pull for the subscription path: at most one run per MIN_GAP ms,
   * trailing catch-up so the last event of a burst is never dropped.
   */
  const schedulePull = React.useCallback((): void => {
    if (initializingRef.current) {
      pendingRefreshRef.current = true
      return
    }
    const MIN_GAP = 120
    const now = Date.now()
    const since = now - lastPullAt.current
    if (since >= MIN_GAP) {
      lastPullAt.current = now
      refresh()
      return
    }
    if (throttleTimer.current !== null) return
    throttleTimer.current = window.setTimeout(() => {
      throttleTimer.current = null
      lastPullAt.current = Date.now()
      refresh()
    }, MIN_GAP - since)
  }, [refresh])
  // Expose the scheduler to drainForward's cap-continuation (declared above it).
  React.useEffect(() => {
    schedulePullRef.current = schedulePull
  }, [schedulePull])

  // Session switch: reset the accumulator.
  React.useEffect(() => {
    sessionIdRef.current = sessionId
    folderRef.current = null
    windowRef.current = []
    seqRef.current = 0
    hasOlderRef.current = false
    loadingOlderRef.current = false
    initializingRef.current = false
    pendingRefreshRef.current = false
    setTurns(EMPTY)
    setStats(EMPTY_STATS)
    setError(null)
    setHasOlder(false)
    setLoadingOlder(false)
    setStatus(sessionId.length > 0 ? 'loading' : 'idle')
  }, [sessionId])

  // Activation + subscription-driven refresh (paused while invisible).
  // Every 0.2.0 binding carries `eventSource` — the client event window feed
  // whose subscribe fires on every accepted journal mutation — while the
  // session face's own subscribe relays state flips. Both are subscribed
  // when present (subscriptions of the same burst coalesce in schedulePull),
  // so the trail stays current on either DSH line.
  React.useEffect(() => {
    if (sessionId.length === 0 || !visible) return undefined
    // First open (or a re-open after a failed one): pull the tail segment;
    // afterwards only the delta is fetched, so the loaded window survives a
    // hide/show cycle.
    if (folderRef.current === null) void loadInitial()
    else refresh()
    const binding = sessionsService?.binding(sessionId)
    const disposers: Array<() => void> = []
    const session = binding !== undefined && binding.session !== undefined ? binding.session : undefined
    if (session !== undefined && typeof session.subscribe === 'function') {
      disposers.push(session.subscribe(() => { schedulePull() }))
    }
    const eventSource = binding !== undefined ? binding.eventSource : undefined
    if (eventSource !== undefined && typeof eventSource.subscribe === 'function') {
      try {
        disposers.push(eventSource.subscribe(() => { schedulePull() }))
      } catch {
        // A binding without a retained generation may refuse feeds — the
        // session subscription above still drives refreshes.
      }
    }
    if (disposers.length === 0) return undefined
    return () => { for (const dispose of disposers) dispose() }
  }, [sessionId, visible, loadInitial, refresh, schedulePull, sessionsService])

  return { turns, stats, status, error, refresh, hasOlder, loadingOlder, loadOlder }
}
