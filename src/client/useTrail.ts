/**
 * useTrail.ts — subscription-driven session-event hook for the trail panel.
 *
 * Refreshing strategy (v0.2+): no timer polling. Pull once on activation,
 * then subscribe to the client `sessions` binding snapshot; any snapshot
 * change (running flip, new steps, older pages) re-pulls the delta. The tab's
 * `visible` gate pauses the subscription entirely.
 *
 * Incremental folding (v0.2.1): incoming events are pushed ONCE into a
 * TrailFolder instead of re-folding the whole accumulated array on every
 * pull. Closed turns keep their object identity across snapshots, so
 * memoized row components skip re-rendering; each throttled pull costs
 * O(delta) folding + O(page) appends instead of a full O(n) re-fold.
 * Duplicate / re-sent pages are dropped by the folder's seq watermark.
 *
 * One pull drains at most MAX_PULL_PAGES pages; if pages remain pending
 * (first open of a huge cold session), the throttled path schedules a
 * continuation pull so the trail is never silently truncated. The chain is
 * guarded: it stops when the tab hides, the session/generation changes, or a
 * pull makes zero seq progress (stalled / looping transport).
 */
import * as React from 'react'
import type { SessionEventLike } from '../trail-model'
import { TrailFolder, type TrailStats, type TrailTurn } from '../trail-model'

export interface FetchEventsResult {
  events: SessionEventLike[]
  /** True when the server held more events back (page); re-pull to drain. */
  hasMore?: boolean
}

export type FetchEvents = (sessionId: string, afterSeq: number) => Promise<FetchEventsResult>

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
}

/** Cap on drained pages per pull (each page ≤ PAGE_SIZE events). */
export const MAX_PULL_PAGES = 64

/** Default transport: POST the /turn-outline/api/events route. */
export function fetchTrailEvents(sessionId: string, afterSeq: number, base?: string): Promise<FetchEventsResult> {
  const url = new URL('/turn-outline/api/events', base ?? window.location.origin)
  return fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sessionId, afterSeq }),
  }).then(async (response) => {
    const data = (await response.json()) as { events?: SessionEventLike[]; hasMore?: boolean; error?: string }
    if (!response.ok || data === null || typeof data !== 'object' || !Array.isArray(data.events)) {
      throw new Error(data !== null && typeof data === 'object' && typeof data.error === 'string'
        ? data.error
        : `HTTP ${response.status}`)
    }
    return { events: data.events, hasMore: data.hasMore === true }
  })
}

const EMPTY: TrailTurn[] = []
const EMPTY_STATS: TrailStats = { total: 0, failed: 0, tools: [] }

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
  const folderRef = React.useRef<TrailFolder | null>(null)
  const seqRef = React.useRef(0)
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

  const pull = React.useCallback(async (): Promise<void> => {
    const generation = ++requestGen.current
    const sid = sessionIdRef.current
    const seqBefore = seqRef.current
    // True when the drain loop hit MAX_PULL_PAGES with pages still pending.
    let drainCapped = false
    try {
      // Drain possibly-paginated pages until the server log is current.
      for (let page = 0; page < MAX_PULL_PAGES; page += 1) {
        const { events, hasMore } = await fetchRef.current(sid, seqRef.current)
        if (generation !== requestGen.current || sid !== sessionIdRef.current) return
        if (events.length > 0) {
          let folder = folderRef.current
          if (folder === null) folder = folderRef.current = new TrailFolder()
          let anyPushed = false
          for (const event of events) {
            const before = folder.latestSeq
            folder.push(event)
            if (folder.latestSeq !== before) anyPushed = true
          }
          if (anyPushed) {
            const last = events[events.length - 1]
            if (typeof last.seq === 'number' && last.seq > seqRef.current) seqRef.current = last.seq
            setTurns(folder.snapshot())
            setStats(folder.stats())
          }
        }
        if (hasMore !== true || events.length === 0) {
          drainCapped = false
          break
        }
        drainCapped = page === MAX_PULL_PAGES - 1
      }
      setError(null)
      setStatus('ready')
      // A capped drain with pages pending (first open of a huge cold session)
      // must not truncate silently: keep draining through the throttled path.
      // Guards stop a misbehaving transport from looping forever: the tab is
      // still visible, the pull is still current, and THIS pull made real seq
      // progress (a stalled transport yields none, so scheduling stops).
      if (
        drainCapped
        && seqRef.current !== seqBefore
        && generation === requestGen.current
        && sid === sessionIdRef.current
        && visibleRef.current
        && schedulePullRef.current !== null
      ) {
        schedulePullRef.current()
      }
    } catch (reason) {
      if (generation !== requestGen.current) return
      setError(reason instanceof Error ? reason.message : String(reason))
      setStatus((current) => (current === 'ready' ? current : 'error'))
    }
  }, [])

  const refresh = React.useCallback(() => { void pull() }, [pull])

  /**
   * Throttled pull for the subscription path: at most one run per MIN_GAP ms,
   * trailing catch-up so the last event of a burst is never dropped.
   */
  const schedulePull = React.useCallback((): void => {
    const MIN_GAP = 120
    const now = Date.now()
    const since = now - lastPullAt.current
    if (since >= MIN_GAP) {
      lastPullAt.current = now
      void pull()
      return
    }
    if (throttleTimer.current !== null) return
    throttleTimer.current = window.setTimeout(() => {
      throttleTimer.current = null
      lastPullAt.current = Date.now()
      void pull()
    }, MIN_GAP - since)
  }, [pull])
  // Expose the scheduler to pull()'s cap-continuation (declared above it).
  React.useEffect(() => {
    schedulePullRef.current = schedulePull
  }, [schedulePull])

  // Session switch: reset the accumulator.
  React.useEffect(() => {
    sessionIdRef.current = sessionId
    folderRef.current = null
    seqRef.current = 0
    setTurns(EMPTY)
    setStats(EMPTY_STATS)
    setError(null)
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
    void pull()
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
  }, [sessionId, visible, pull, schedulePull, sessionsService])

  return { turns, stats, status, error, refresh }
}
