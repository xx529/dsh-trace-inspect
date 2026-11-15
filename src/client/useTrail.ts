/**
 * useTrail.ts — session-event source + incremental folding for the trail panel.
 *
 * Two data sources, preferred first:
 *
 * 1. SESSION WINDOW (v0.13.0, the normal path on DSH 0.2.x):
 *    the client session controller already keeps a contiguous history window
 *    (`binding(sessionId).eventSource`) that the conversation view consumes —
 *    the last ~50 messages ending on a turn boundary, `hasMore` while older
 *    history remains, and `session.loadOlder()` to page it. The trail folds
 *    exactly that window, so opening a long session loads the SAME segment the
 *    conversation shows (not the whole log), "load earlier" calls the SAME
 *    `loadOlder()` the chat pane uses, and the two views stay in lockstep.
 *    No extra network work: the entries are the ones already in memory.
 *
 * 2. OWN ROUTE (fallback for hosts without the client window feed):
 *    the plugin's read-only `/trace-inspect/api/events` route serves the tail
 *    turn segment (v0.12.0) and backwards pages via `direction: 'before'`,
 *    still bounded by `PAGE_TURNS` and the 2 MiB page budget.
 *
 * Folding stays incremental on the hot path: a live append pushes ONE event
 * into the `TrailFolder` (O(delta)); a window replace/prepend (paging, or a
 * settlement rebaseline) re-folds the contiguous window once. Subscription
 * bursts are throttled so a fast stream cannot pin the main thread.
 *
 * Legacy transports that omit `hasOlder` (old host / test stubs) fall back to
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

/** One record of the session controller's client history window. */
export interface SessionWindowEntryLike {
  /** `event` is one durable event; `chunks` / `transient` are stream rows. */
  type?: string
  event?: SessionEventLike
}

/** The session window snapshot the conversation view consumes. */
export interface SessionWindowSnapshotLike {
  entries?: readonly SessionWindowEntryLike[]
  hasMore?: boolean
  revision?: number
  change?: { kind?: string; entries?: readonly SessionWindowEntryLike[] }
}

/** The 0.2.x client event window feed (entries + hasMore per snapshot). */
export interface EventSourceFaceLike {
  subscribe(listener: () => void): () => void
  getSnapshot(): SessionWindowSnapshotLike | undefined
}

/** The session's own open state / paging state (client session controller). */
export interface SessionSnapshotLike {
  running?: boolean
  /** Older history remains before the loaded window. */
  hasMore?: boolean
  /** A `loadOlder()` request is in flight (session-owned latch). */
  loadingOlder?: boolean
  /** `cold` | `loading` | `open` | `error`. */
  openState?: string
  openError?: unknown
}

export interface SessionFaceLike {
  subscribe(listener: () => void): () => void
  getSnapshot(): SessionSnapshotLike | null
  /** Pages one earlier history segment; the conversation view uses the same. */
  loadOlder?: (options?: unknown) => Promise<unknown>
  /** Opens the session history window (idempotent). */
  open?: () => Promise<unknown>
}

export interface SessionsServiceLike {
  binding(sessionId: string): {
    session?: SessionFaceLike
    /** 0.2.x bindings also carry the client event window feed. */
    eventSource?: EventSourceFaceLike
  } | undefined
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
   * Load one earlier segment and prepend it. Returns true when a request
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

/**
 * Durable events of one window snapshot, in order. `chunks` (packed assistant
 * deltas) and `transient` (live partial rows) are not needed by the fold.
 */
function windowEventsOf(entries: readonly SessionWindowEntryLike[] | undefined): SessionEventLike[] {
  if (!Array.isArray(entries)) return []
  const events: SessionEventLike[] = []
  for (const entry of entries) {
    if (entry === null || typeof entry !== 'object' || entry.type !== 'event') continue
    const event = entry.event
    if (event === undefined || event === null) continue
    if (typeof event.type !== 'string' || typeof event.seq !== 'number') continue
    events.push(event)
  }
  return events
}

/** Message of a session open error (`RemoteError`-shaped values included). */
function sessionErrorText(error: unknown): string | null {
  if (error === undefined || error === null) return null
  if (typeof error === 'string') return error
  if (typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return null
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
  /** Resolved session binding (undefined until the conversation retains it). */
  const [binding, setBinding] = React.useState<{
    session?: SessionFaceLike
    eventSource?: EventSourceFaceLike
  } | undefined>(undefined)
  /** False until the binding lookup settles (found, or gave up). */
  const [bindingResolved, setBindingResolved] = React.useState(false)

  const folderRef = React.useRef<TrailFolder | null>(null)
  /** Route path: the contiguous loaded event window (tail + older + live). */
  const routeWindowRef = React.useRef<SessionEventLike[]>([])
  /** Window path: the durable events of the current session window. */
  const windowEventsRef = React.useRef<SessionEventLike[]>([])
  const seqRef = React.useRef(0)
  const hasOlderRef = React.useRef(false)
  const loadingOlderRef = React.useRef(false)
  const initializingRef = React.useRef(false)
  const pendingRefreshRef = React.useRef(false)
  const sessionIdRef = React.useRef(sessionId)
  const fetchRef = React.useRef(fetchEvents)
  const requestGen = React.useRef(0)
  // Throttle the subscription-driven route refresh. During live generation DSH
  // emits many events; a network round-trip + fold + re-render on EVERY event
  // hammers the (shared) main thread. Coalesce a burst into one update.
  const lastPullAt = React.useRef(0)
  const throttleTimer = React.useRef<number | null>(null)
  // Window path: coalesce bursts of appends into one publish.
  const publishTimer = React.useRef<number | null>(null)
  // Mirrors for async callbacks: pull() must know the current visibility and
  // reach the throttled scheduler (defined below it) without re-creating.
  const visibleRef = React.useRef(visible)
  const schedulePullRef = React.useRef<(() => void) | null>(null)
  /** Which source drives the panel right now. */
  const windowModeRef = React.useRef(false)
  const feedRef = React.useRef<EventSourceFaceLike | undefined>(undefined)
  const sessionRef = React.useRef<SessionFaceLike | undefined>(undefined)

  React.useEffect(() => { fetchRef.current = fetchEvents }, [fetchEvents])
  React.useEffect(() => { visibleRef.current = visible }, [visible])

  // Cancel every pending timer on teardown.
  React.useEffect(() => () => {
    if (throttleTimer.current !== null) window.clearTimeout(throttleTimer.current)
    if (publishTimer.current !== null) window.clearTimeout(publishTimer.current)
    schedulePullRef.current = null
  }, [])

  /** Publish one folder snapshot (turn object identity survives appends). */
  const publish = React.useCallback((folder: TrailFolder): void => {
    setTurns(folder.snapshot())
    setStats(folder.stats())
  }, [])

  /** Coalesce window-appended events into one publish (window path). */
  const publishSoon = React.useCallback((): void => {
    if (publishTimer.current !== null) return
    publishTimer.current = window.setTimeout(() => {
      publishTimer.current = null
      const folder = folderRef.current
      if (folder !== null) publish(folder)
    }, 80)
  }, [publish])

  /** Replace the whole window (rebuild) and publish immediately. */
  const rebuildWindow = React.useCallback((events: SessionEventLike[]): void => {
    if (publishTimer.current !== null) {
      window.clearTimeout(publishTimer.current)
      publishTimer.current = null
    }
    const folder = foldWindow(events)
    windowEventsRef.current = events
    folderRef.current = folder
    seqRef.current = Math.max(0, folder.latestSeq)
    publish(folder)
  }, [publish])

  /** Push one durable window append into the open fold (window path). */
  const appendWindow = React.useCallback((entries: readonly SessionWindowEntryLike[] | undefined): void => {
    const events = windowEventsOf(entries)
    if (events.length === 0) return
    let folder = folderRef.current
    if (folder === null) {
      const feed = feedRef.current
      const snapshot = feed?.getSnapshot()
      rebuildWindow(windowEventsOf(snapshot?.entries))
      return
    }
    let pushed = false
    for (const event of events) {
      const before = folder.latestSeq
      folder.push(event)
      if (folder.latestSeq !== before) {
        windowEventsRef.current.push(event)
        pushed = true
      }
    }
    if (pushed) {
      seqRef.current = Math.max(0, folder.latestSeq)
      publishSoon()
    }
  }, [publishSoon, rebuildWindow])

  /** Read one window snapshot and apply its change kind (window path). */
  const applyWindowSnapshot = React.useCallback((snapshot: SessionWindowSnapshotLike | undefined): void => {
    if (snapshot === undefined) return
    const hasMoreValue = snapshot.hasMore === true
    hasOlderRef.current = hasMoreValue
    setHasOlder(hasMoreValue)
    const change = snapshot.change
    if (change !== undefined && change.kind === 'append' && Array.isArray(change.entries)) {
      appendWindow(change.entries)
    } else {
      rebuildWindow(windowEventsOf(snapshot.entries))
    }
    if (windowEventsRef.current.length > 0) {
      setError(null)
      setStatus('ready')
    }
  }, [appendWindow, rebuildWindow])

  /** Apply the session's own snapshot (hasMore / busy / open state). */
  const applySessionSnapshot = React.useCallback((snapshot: SessionSnapshotLike | null): void => {
    if (snapshot === null) return
    const hasMoreValue = snapshot.hasMore === true
    hasOlderRef.current = hasMoreValue
    setHasOlder(hasMoreValue)
    if (snapshot.loadingOlder === true) {
      setLoadingOlder(true)
    } else if (!loadingOlderRef.current) {
      setLoadingOlder(false)
    }
    if (snapshot.openState === 'error') {
      setError(sessionErrorText(snapshot.openError))
      setStatus('error')
      return
    }
    if (snapshot.openState === 'open') {
      setStatus((current) => (current === 'error' ? current : 'ready'))
    }
  }, [])

  // ── Route path (fallback): forward drain + backwards turn segments ──────

  /**
   * Push one ascending forward page into the open folder AND the route window.
   * Returns true when the watermark advanced.
   */
  const appendRouteEvents = React.useCallback((events: readonly SessionEventLike[]): boolean => {
    let folder = folderRef.current
    if (folder === null) folder = folderRef.current = new TrailFolder()
    let pushed = false
    for (const event of events) {
      const before = folder.latestSeq
      folder.push(event)
      if (folder.latestSeq !== before) {
        routeWindowRef.current.push(event)
        pushed = true
      }
    }
    if (pushed) {
      seqRef.current = Math.max(0, folder.latestSeq)
      publish(folder)
    }
    return pushed
  }, [publish])

  /**
   * Drain the forward tail from the current watermark (route path's "follow"
   * direction): at most MAX_PULL_PAGES pages per pull.
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
        if (windowModeRef.current) return // the session window took over mid-drain
        if (events.length > 0) appendRouteEvents(events)
        if (hasMore !== true || events.length === 0) {
          drainCapped = false
          break
        }
        drainCapped = page === MAX_PULL_PAGES - 1
      }
      setError(null)
      setStatus('ready')
      // A capped drain with pages pending must not truncate silently: keep
      // draining through the throttled path. Guards stop a misbehaving
      // transport from looping forever.
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
  }, [appendRouteEvents])

  /**
   * First route load: the TAIL turn segment. A transport that does not answer
   * `hasOlder` predates the backwards axis, so its response is the forward
   * prefix from seq 0 and the historical drain keeps the panel whole.
   */
  const loadInitialRoute = React.useCallback(async (): Promise<void> => {
    const generation = ++requestGen.current
    const sid = sessionIdRef.current
    initializingRef.current = true
    pendingRefreshRef.current = false
    try {
      const page = await fetchRef.current(sid, { direction: 'before', maxTurns: PAGE_TURNS })
      if (generation !== requestGen.current || sid !== sessionIdRef.current) return
      if (windowModeRef.current) return
      if (typeof page.hasOlder === 'boolean') {
        const folder = foldWindow(page.events)
        folderRef.current = folder
        routeWindowRef.current = page.events.slice()
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
      routeWindowRef.current = []
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
      // Only the newest open may drop the latch.
      if (generation === requestGen.current) initializingRef.current = false
      // A live mutation landing mid-open was parked; catch up now.
      if (pendingRefreshRef.current && sid === sessionIdRef.current) {
        pendingRefreshRef.current = false
        schedulePullRef.current?.()
      }
    }
  }, [drainForward, publish])

  /** Route path: forward refresh (the live tail / next run page). */
  const refreshRoute = React.useCallback((): void => {
    if (initializingRef.current) {
      pendingRefreshRef.current = true
      return
    }
    if (folderRef.current === null) {
      void loadInitialRoute()
      return
    }
    void drainForward(++requestGen.current)
  }, [drainForward, loadInitialRoute])

  /** Route path: page up with the window's first seq as the cut. */
  const loadOlderRoute = React.useCallback((): boolean => {
    if (!hasOlderRef.current || loadingOlderRef.current) return false
    const sid = sessionIdRef.current
    const window = routeWindowRef.current
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
        if (sid !== sessionIdRef.current || windowModeRef.current) return
        const older = page.events.filter(
          (event) => typeof event.seq === 'number' && event.seq < beforeSeq,
        )
        if (older.length > 0) {
          const merged = older.concat(routeWindowRef.current)
          const folder = foldWindow(merged)
          routeWindowRef.current = merged
          folderRef.current = folder
          seqRef.current = Math.max(0, folder.latestSeq)
          publish(folder)
        }
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

  // ── Window path: the session controller's own history window ────────────

  /** Window path: page up through the session's own loader. */
  const loadOlderWindow = React.useCallback((): boolean => {
    if (!hasOlderRef.current || loadingOlderRef.current) return false
    const sid = sessionIdRef.current
    const session = sessionRef.current
    if (sid.length === 0 || session === undefined || typeof session.loadOlder !== 'function') return false
    const loadOlderPage = session.loadOlder
    loadingOlderRef.current = true
    setLoadingOlder(true)
    void (async (): Promise<void> => {
      try {
        await loadOlderPage.call(session)
      } catch {
        // Keep hasOlder: the user can retry the same segment.
      } finally {
        if (sid === sessionIdRef.current) {
          loadingOlderRef.current = false
          const snapshot = session.getSnapshot()
          setLoadingOlder(snapshot?.loadingOlder === true)
        }
      }
    })()
    return true
  }, [])

  /** Window path: re-read the current window (retry / tab re-show). */
  const refreshWindow = React.useCallback((): void => {
    const session = sessionRef.current
    const snapshot = session?.getSnapshot?.()
    if (snapshot !== null && snapshot !== undefined) {
      if (snapshot.openState === 'cold' && typeof session?.open === 'function') {
        void session.open().catch(() => {})
      }
      applySessionSnapshot(snapshot)
    }
    const feed = feedRef.current
    if (feed !== undefined) applyWindowSnapshot(feed.getSnapshot())
  }, [applySessionSnapshot, applyWindowSnapshot])

  /** Load-earlier dispatch: the session loader when bound, else the route. */
  const loadOlder = React.useCallback((): boolean => (
    windowModeRef.current ? loadOlderWindow() : loadOlderRoute()
  ), [loadOlderRoute, loadOlderWindow])

  /** Refresh dispatch: the window re-read when bound, else the route pull. */
  const refresh = React.useCallback((): void => {
    if (windowModeRef.current) {
      refreshWindow()
      return
    }
    refreshRoute()
  }, [refreshRoute, refreshWindow])

  /**
   * Throttled pull for the route subscription path: at most one run per
   * MIN_GAP ms, trailing catch-up so the last event of a burst is never dropped.
   */
  const schedulePull = React.useCallback((): void => {
    if (windowModeRef.current) return // the window feed pushes changes itself
    if (initializingRef.current) {
      pendingRefreshRef.current = true
      return
    }
    const MIN_GAP = 120
    const now = Date.now()
    const since = now - lastPullAt.current
    if (since >= MIN_GAP) {
      lastPullAt.current = now
      refreshRoute()
      return
    }
    if (throttleTimer.current !== null) return
    throttleTimer.current = window.setTimeout(() => {
      throttleTimer.current = null
      lastPullAt.current = Date.now()
      refreshRoute()
    }, MIN_GAP - since)
  }, [refreshRoute])
  // Expose the scheduler to drainForward's cap-continuation (declared above it).
  React.useEffect(() => {
    schedulePullRef.current = schedulePull
  }, [schedulePull])

  // Session switch: reset the accumulator.
  React.useEffect(() => {
    sessionIdRef.current = sessionId
    folderRef.current = null
    routeWindowRef.current = []
    windowEventsRef.current = []
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
    setBinding(undefined)
    setBindingResolved(false)
    setStatus(sessionId.length > 0 ? 'loading' : 'idle')
  }, [sessionId])

  // Resolve the session binding. The conversation view retains the session
  // scope; during the first frames it may still be arriving, so poll briefly
  // instead of silently falling back to the route for the whole tab lifetime.
  React.useEffect(() => {
    if (sessionId.length === 0 || !visible) return undefined
    if (sessionsService === undefined) {
      setBindingResolved(true)
      return undefined
    }
    const resolve = (): boolean => {
      const next = sessionsService.binding(sessionId)
      if (next !== undefined && (next.session !== undefined || next.eventSource !== undefined)) {
        setBinding(next)
        setBindingResolved(true)
        return true
      }
      return false
    }
    if (resolve()) return undefined
    let tries = 0
    const timer = window.setInterval(() => {
      tries += 1
      if (resolve()) {
        window.clearInterval(timer)
        return
      }
      if (tries >= 20) {
        window.clearInterval(timer)
        setBindingResolved(true)
      }
    }, 150)
    return () => window.clearInterval(timer)
  }, [sessionId, visible, sessionsService])

  // Activation + source subscriptions (paused while invisible).
  React.useEffect(() => {
    if (sessionId.length === 0 || !visible || !bindingResolved) return undefined
    const feed = binding?.eventSource
    const session = binding?.session
    const windowMode = feed !== undefined && session !== undefined && typeof session.loadOlder === 'function'
    windowModeRef.current = windowMode
    feedRef.current = feed
    sessionRef.current = session

    if (windowMode && feed !== undefined && session !== undefined) {
      const snapshot = session.getSnapshot()
      if (snapshot !== null) applySessionSnapshot(snapshot)
      if (snapshot !== null && snapshot !== undefined && snapshot.openState !== 'open') {
        setStatus((current) => (current === 'error' ? current : 'loading'))
        if (snapshot.openState === 'cold' && typeof session.open === 'function') {
          void session.open().catch(() => {})
        }
      }
      const disposers: Array<() => void> = []
      disposers.push(feed.subscribe(() => { applyWindowSnapshot(feed.getSnapshot()) }))
      disposers.push(session.subscribe(() => { applySessionSnapshot(session.getSnapshot()) }))
      // Initial read AFTER subscribing: a publish cannot fall between them.
      applyWindowSnapshot(feed.getSnapshot())
      return () => { for (const dispose of disposers) dispose() }
    }

    // Route path: first open pulls the tail segment; afterwards only the delta
    // is fetched, so the loaded window survives a hide/show cycle.
    if (folderRef.current === null) void loadInitialRoute()
    else refreshRoute()
    const disposers: Array<() => void> = []
    if (session !== undefined && typeof session.subscribe === 'function') {
      disposers.push(session.subscribe(() => { schedulePull() }))
    }
    if (feed !== undefined && typeof feed.subscribe === 'function') {
      disposers.push(feed.subscribe(() => { schedulePull() }))
    }
    if (disposers.length === 0) return undefined
    return () => { for (const dispose of disposers) dispose() }
  }, [
    sessionId,
    visible,
    binding,
    bindingResolved,
    applySessionSnapshot,
    applyWindowSnapshot,
    loadInitialRoute,
    refreshRoute,
    schedulePull,
  ])

  return { turns, stats, status, error, refresh, hasOlder, loadingOlder, loadOlder }
}
