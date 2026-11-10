/**
 * auto-open.ts — first-turn auto-open of the 「轮次轨迹」 tab (v0.10.39).
 *
 * Owner requirement (2026-11-10): when a conversation runs its FIRST turn, the
 * right-side sidebar should pop out on its own with this tab already showing —
 * no + menu, no manual tab open. The tab stays put afterwards: the automatic
 * open happens ONCE per conversation, and a conversation the reader already
 * closed the tab in is never reopened (there is nothing left to detect: after
 * the first turn the session is no longer blank, and this watcher's only arming
 * condition is that blankness).
 *
 * HOW THE TRIGGER IS DERIVED (no new host route, no polling):
 *
 *   1. Follow the ON-SCREEN session — the native right column's `mounted`
 *      observable (the session list carries no "current" field), falling back
 *      to the better-sidebar store snapshot's `sessionId` on hosts without the
 *      native column.
 *   2. ARM only when that session is still BLANK (`sessions.list` row
 *      `blank: true` — "no turn has started", the same hint `session.create`
 *      uses to reuse a conversation). A session with history is skipped
 *      outright, so opening an old conversation never pops the panel.
 *   3. Wait for the first sign of activity — the session list flipping the row
 *      (running / blank) or, when the conversation is retained, the binding's
 *      two feeds (`session` state + `eventSource` journal mutations). Both are
 *      borrowed observables, not polls.
 *   4. CONFIRM with the plugin's own `POST /trace-inspect/api/events` probe
 *      (afterSeq 0). Only a non-empty read proves the first turn really wrote
 *      events — a list row can lag, and a confirm keeps the pop-up honest.
 *   5. Open through `ctx.betterSidebar.openTab({type}, {scope})`: with the
 *      native surface installed this lands the page in DSH's right column and
 *      the HOST expands the column on every open (it does not open content the
 *      reader cannot see), which is exactly the "自动弹出" the owner asked for.
 *      The open is once per session, so a later manual close sticks.
 *
 * WHY plugin level (not the tab component): the tab does not exist yet when the
 * first turn starts — the mount order is precisely what this module inverts.
 * better-sidebar's own context stays reachable from a plugin-level effect via
 * `ctx.get(...)`, so no React tree is needed.
 *
 * GATES (all evaluated at FIRE time, so a setting flip before the first turn is
 * honoured): the plugin-owned switch `pluginSettings['trace-inspect']
 * .autoOpenFirstTurn` (absent = on), the tab's own enable switch
 * (`tabsEnabled`), a wide-enough viewport (narrow hosts draw that column
 * fullscreen — the ecosystem convention is to stay out of the way), and the
 * native tab type being registered (a fresh client load can briefly race the
 * registration; the open then retries a few times instead of throwing).
 *
 * The browser-trust surface is unchanged: no host code is touched, and the
 * confirm probe is the same read-only route the panel itself uses.
 */

/** The persisted switch key, in the descriptor's own `pluginSettings` blob. */
export const AUTO_OPEN_SETTING_KEY = 'autoOpenFirstTurn'

/**
 * Narrow-viewport threshold. Mirrors better-sidebar's own `isNarrowWidth`
 * (and DSH's `viewportWidth < 768` auto-fullscreen bracket): below it the right
 * column is the whole screen, so auto-opening it would take the conversation
 * away instead of showing the trail beside it.
 */
export const AUTO_OPEN_MIN_WIDTH = 768

/** Tab type this module opens (the descriptor id registered in `index.tsx`). */
export const AUTO_OPEN_TAB_ID = 'trace-inspect'

/**
 * Event types that prove a TURN has started.
 *
 * A brand-new DSH 0.2.2 conversation is NOT an empty event log: session
 * creation writes housekeeping events first (`sandbox/mode`,
 * `approval/policy` — verified on a live 0.2.2-rc.1 instance). So "the log has
 * events" is not first-turn evidence — that gate fired the auto-open on a
 * 0-turn conversation. Only a user message or a turn boundary proves the first
 * turn actually ran.
 */
const FIRST_TURN_EVENT_TYPES = new Set(['user/message', 'turn/start'])

/**
 * Whether a page of session events carries a started turn.
 * @param events - one `/events` page (unknown data; structural check only).
 * @returns true when the log proves a turn exists (not just session setup).
 */
export function hasFirstTurnEvidence(events: unknown): boolean {
  if (!Array.isArray(events)) return false
  return events.some((event) => {
    if (event === null || typeof event !== 'object') return false
    const type = (event as { type?: unknown }).type
    return typeof type === 'string' && FIRST_TURN_EVENT_TYPES.has(type)
  })
}

/** Retry cadence/count while the native tab type is not registered yet. */
const TAB_READY_RETRIES = 5
const TAB_READY_RETRY_MS = 400

/** One retry-debounce for the confirm probe (coalesce an event burst). */
const CONFIRM_DEBOUNCE_MS = 120

/** The slice of `SidebarPrefs` this module reads. */
export interface AutoOpenPrefsLike {
  /** Plugin-owned blobs, keyed by descriptor id (`pluginSettings['trace-inspect']`). */
  pluginSettings?: Record<string, Record<string, unknown>>
  /** Per-tab-type enable switches (absent = enabled). */
  tabsEnabled?: Record<string, boolean>
}

/** An observable, as cordis client services publish them. */
export interface ObservableLike<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** The better-sidebar service face this module needs (optional peer). */
export interface BetterSidebarFaceLike {
  openTab?: (seed: { type: string; reveal?: boolean }, scope?: { sessionId: string }) => void
  getSnapshot?: () => { sessionId?: string; prefs?: AutoOpenPrefsLike } | undefined
  subscribeState?: (listener: () => void) => () => void
  isTabEnabled?: (id: string) => boolean
}

/** One `sessions.list` row, as far as the blank/running hints go. */
export interface SessionRowLike {
  id?: string
  blank?: boolean
  running?: boolean
}

/** The client `sessions` service face this module needs. */
export interface SessionsFaceLike {
  list?: {
    getSnapshot(): { byId?: Record<string, SessionRowLike | undefined> } | undefined
    subscribe(listener: () => void): () => void
  }
  binding?(sessionId: string): {
    session?: ObservableLike<{ running?: boolean } | null>
    eventSource?: ObservableLike<unknown>
  } | undefined
}

/** The DSH native right-column controller (`ctx.get('sidebarRight')`). */
export interface RightColumnFaceLike {
  mounted?: ObservableLike<string | undefined>
  isExpanded?: () => boolean
  toggleExpanded?: () => void
  active?: () => { kind?: string } | undefined
}

/** The host's native tab-type registry (`ctx.get('sidebarRightTabs')`). */
export interface TabRegistryFaceLike {
  get?(id: string): unknown
}

/** The plugin context slice the installer needs. */
export interface AutoOpenCtxLike {
  get(name: string): unknown
  effect<T>(fn: () => T): T
}

/** Test seams / host adaptations. */
export interface AutoOpenDeps {
  /**
   * Confirm transport: one read of the session's events page from seq 0.
   * Defaults to the plugin's own host route (the panel's transport), so the
   * auto-open never invents a second read path.
   */
  fetchEvents?: (sessionId: string, afterSeq: number) => Promise<{ events: unknown[] }>
  /** Viewport width seam (jsdom has no layout); defaults to `window.innerWidth`. */
  viewportWidth?: () => number
  /** Timer seams so tests can drive the debounce/retry deterministically. */
  setTimeout?: (fn: () => void, ms: number) => unknown
  clearTimeout?: (handle: unknown) => void
}

/** Default confirm transport: the panel's own `/events` page read. */
async function fetchEventsDefault(sessionId: string, afterSeq: number): Promise<{ events: unknown[] }> {
  const url = new URL('/trace-inspect/api/events', window.location.origin)
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sessionId, afterSeq }),
  })
  const data = (await response.json()) as { events?: unknown }
  if (!response.ok || data === null || typeof data !== 'object' || !Array.isArray(data.events)) {
    throw new Error(`HTTP ${response.status}`)
  }
  return { events: data.events }
}

/** Read a service through the optional `ctx.get` accessor, never throwing. */
function serviceOf<T>(ctx: AutoOpenCtxLike, name: string): T | undefined {
  try {
    const value = ctx.get(name)
    return value !== null && typeof value === 'object' ? (value as T) : undefined
  } catch {
    return undefined
  }
}

/**
 * Arm state of the current watch. `pending` only exists on hosts whose session
 * list has not published the watched row yet (a brand-new conversation can be
 * on screen a beat before its row lands); the row/probe resolves it to
 * `armed` or `skipped`.
 */
type Phase = 'idle' | 'pending' | 'armed' | 'skipped' | 'fired'

/**
 * Install the first-turn auto-open watcher for one client plugin activation.
 *
 * @param ctx - the client plugin context (`get` for services, `effect` for the
 *   disposal chain — the returned disposer is registered through it by the
 *   caller, matching the registration-entry convention).
 * @param deps - test seams (transport, viewport, timers).
 * @returns a disposer that detaches every subscription and pending timer.
 */
export function installFirstTurnAutoOpen(ctx: AutoOpenCtxLike, deps: AutoOpenDeps = {}): () => void {
  const sidebar = serviceOf<BetterSidebarFaceLike>(ctx, 'betterSidebar')
  if (sidebar === undefined || typeof sidebar.openTab !== 'function') return () => {}

  const sessions = serviceOf<SessionsFaceLike>(ctx, 'sessions')
  const right = serviceOf<RightColumnFaceLike>(ctx, 'sidebarRight')
  const tabRegistry = serviceOf<TabRegistryFaceLike>(ctx, 'sidebarRightTabs')
  const fetchEvents = deps.fetchEvents ?? fetchEventsDefault
  const viewportWidth = deps.viewportWidth
    ?? ((): number => (typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerWidth))
  const setTimer = deps.setTimeout ?? ((fn: () => void, ms: number): unknown => window.setTimeout(fn, ms))
  const clearTimer = deps.clearTimeout ?? ((handle: unknown): void => window.clearTimeout(handle as number))

  let disposed = false
  /** The session this watch is currently about (the on-screen one). */
  let watched: string | undefined
  let phase: Phase = 'idle'
  let release: (() => void) | undefined
  let retryTimer: unknown
  let retriesLeft = 0
  let confirmTimer: unknown
  /** One settle probe at a time (a row republish can arrive in a burst). */
  let probing = false
  /** Sessions already auto-opened in this page load (the once-per-session latch). */
  const fired = new Set<string>()
  /** Sessions proved to have history, so a later row republish cannot re-arm them. */
  const skipped = new Set<string>()

  const readPrefs = (): AutoOpenPrefsLike | undefined => {
    try {
      return sidebar.getSnapshot?.()?.prefs
    } catch {
      return undefined
    }
  }

  /** The plugin-owned switch (absent = on, the declared default). */
  const settingEnabled = (): boolean => {
    const blob = readPrefs()?.pluginSettings?.[AUTO_OPEN_TAB_ID]
    return blob?.[AUTO_OPEN_SETTING_KEY] !== false
  }

  /** The tab's own enable switch (`tabsEnabled[<id>] === false` disables it). */
  const tabEnabled = (): boolean => {
    try {
      if (sidebar.isTabEnabled !== undefined) return sidebar.isTabEnabled(AUTO_OPEN_TAB_ID) !== false
      return readPrefs()?.tabsEnabled?.[AUTO_OPEN_TAB_ID] !== false
    } catch {
      return true
    }
  }

  /** Whether the native tab type is registered yet (the open throws before it). */
  const tabReady = (): boolean => {
    if (tabRegistry === undefined || typeof tabRegistry.get !== 'function') return true
    try {
      return tabRegistry.get(AUTO_OPEN_TAB_ID) !== undefined
    } catch {
      return false
    }
  }

  /**
   * The on-screen session: the native column's mounted seat when that face
   * exists, else the better-sidebar store's session id. A PRESENT `mounted`
   * observable is authoritative even while it reports "no session" (a global
   * panel) — falling back to the store there could arm a session nobody is
   * looking at, and the native open would then be queued behind it.
   */
  const onScreenSession = (): string | undefined => {
    const mountedFace = right?.mounted
    if (mountedFace !== undefined && typeof mountedFace.getSnapshot === 'function') {
      try {
        const mounted = mountedFace.getSnapshot()
        return typeof mounted === 'string' && mounted.length > 0 ? mounted : undefined
      } catch {
        return undefined
      }
    }
    try {
      const id = sidebar.getSnapshot?.()?.sessionId
      return typeof id === 'string' && id.length > 0 ? id : undefined
    } catch {
      return undefined
    }
  }

  /** One session-list row, when the host has published it. */
  const rowOf = (sessionId: string): SessionRowLike | undefined => {
    try {
      const list = sessions?.list
      if (list === undefined) return undefined
      const row = list.getSnapshot()?.byId?.[sessionId]
      return row !== null && typeof row === 'object' ? row : undefined
    } catch {
      return undefined
    }
  }

  /** Detach the per-session watchers (arm-time subscriptions). */
  const detach = (): void => {
    if (release !== undefined) {
      try {
        release()
      } catch {
        // a disposed binding may throw; the disposer is best-effort
      }
      release = undefined
    }
    if (confirmTimer !== undefined) {
      clearTimer(confirmTimer)
      confirmTimer = undefined
    }
  }

  /** Detach and forget the retry timer (the open-side race helper). */
  const clearRetry = (): void => {
    if (retryTimer !== undefined) {
      clearTimer(retryTimer)
      retryTimer = undefined
    }
  }

  /**
   * Open the tab for `sessionId`, once. All gates are checked HERE so a setting
   * flip or a viewport resize before the first turn is honoured; a failed open
   * (the host refuses an unmounted seat, or the type is not registered yet) is
   * swallowed — this feature must never surface an error bar.
   */
  const open = (sessionId: string): void => {
    if (disposed || phase === 'fired' || fired.has(sessionId) || retryTimer !== undefined) return
    if (!settingEnabled() || !tabEnabled() || viewportWidth() < AUTO_OPEN_MIN_WIDTH) {
      phase = 'fired'
      detach()
      return
    }
    if (!tabReady()) {
      // A fresh client load can race the native registration; retry briefly
      // (still one logical open — the retry timer keeps it single-shot).
      if (retriesLeft > 0) {
        retriesLeft -= 1
        retryTimer = setTimer(() => {
          retryTimer = undefined
          if (disposed || phase !== 'armed') return
          open(sessionId)
        }, TAB_READY_RETRY_MS)
        return
      }
      phase = 'fired'
      detach()
      return
    }
    fired.add(sessionId)
    detach()
    try {
      // No `reveal:false`: the owner asked for the panel to pop out, and the
      // host expands the column for any open that focuses a page.
      sidebar.openTab?.({ type: AUTO_OPEN_TAB_ID }, { sessionId })
    } catch {
      // 'no session surface is mounted' / 'no tab type is registered as …':
      // both are wiring races, never user-facing failures.
    }
    // Fallback for a host whose open did not expand the column itself: read
    // then toggle, so an already-expanded column is never closed.
    try {
      if (right !== undefined && right.isExpanded?.() === false) right.toggleExpanded?.()
    } catch {
      // an absent/unknown column face is fine — the native open already asked
    }
  }

  /**
   * Confirm the first turn really started before popping the panel: a list row
   * may lag, while the durable log is authoritative. A network failure keeps
   * the watch armed so the next signal retries instead of losing the trigger.
   */
  const confirm = (sessionId: string): void => {
    if (disposed || phase !== 'armed' || watched !== sessionId) return
    void fetchEvents(sessionId, 0)
      .then((result) => {
        if (disposed || phase !== 'armed' || watched !== sessionId) return
        // Housekeeping-only pages (a just-created session) keep the watch
        // armed: the pop-up waits for the turn, never for session setup.
        if (hasFirstTurnEvidence(result.events)) open(sessionId)
      })
      .catch(() => {
        // stay armed: the next activity signal re-runs the confirm
      })
  }

  /** Coalesce a burst of activity signals into one confirm probe. */
  const scheduleConfirm = (sessionId: string): void => {
    if (confirmTimer !== undefined) return
    confirmTimer = setTimer(() => {
      confirmTimer = undefined
      confirm(sessionId)
    }, CONFIRM_DEBOUNCE_MS)
  }

  /** Subscription hub for the armed session's activity signals. */
  const arm = (sessionId: string): void => {
    phase = 'armed'
    // Every freshly armed conversation gets the full registration-retry budget
    // (the budget is spent per open attempt, not once per plugin lifetime).
    retriesLeft = TAB_READY_RETRIES
    const disposers: Array<() => void> = []
    const binding = sessions?.binding?.(sessionId)
    for (const feed of [binding?.session, binding?.eventSource]) {
      if (feed === undefined || typeof feed.subscribe !== 'function') continue
      try {
        disposers.push(feed.subscribe(() => { scheduleConfirm(sessionId) }))
      } catch {
        // a binding without a retained generation may refuse feeds; the list
        // subscription below still drives the trigger.
      }
    }
    // The session list is the host-independent signal: a prompt acceptance
    // flips the row's running/blank hints even when no binding is retained.
    if (sessions?.list !== undefined) {
      try {
        disposers.push(sessions.list.subscribe(() => {
          const row = rowOf(sessionId)
          if (row !== undefined && row.running === true) scheduleConfirm(sessionId)
          else if (row !== undefined && row.blank === false) scheduleConfirm(sessionId)
        }))
      } catch {
        // a listing host without a subscription: the binding feeds remain
      }
    }
    release = () => {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {
          // disposers are best-effort
        }
      }
    }
  }

  /**
   * Settle a session whose list row is not published yet by ONE probe of the
   * durable log: an empty read is a conversation that has not started (arm), a
   * non-empty one is history (skip). A failed probe leaves the phase pending so
   * the next session-list/state signal calls this again — never a busy loop.
   */
  const resolvePending = (sessionId: string): void => {
    phase = 'pending'
    if (probing) return
    probing = true
    void fetchEvents(sessionId, 0)
      .then((result) => {
        probing = false
        if (disposed || watched !== sessionId || phase !== 'pending') return
        // A session that already logged a turn is history (skip); one whose log
        // holds only creation housekeeping is still a blank conversation (arm).
        if (hasFirstTurnEvidence(result.events)) {
          skipped.add(sessionId)
          phase = 'skipped'
          return
        }
        arm(sessionId)
      })
      .catch(() => {
        probing = false
        // stay pending: the next activity signal retries the probe
      })
  }

  /**
   * Decide what the freshly on-screen session is: a blank conversation to arm,
   * a session with history to skip, or an unknown row to probe once. An earlier
   * auto-open in this page load wins over everything (the once latch).
   */
  const watch = (sessionId: string | undefined): void => {
    if (sessionId === watched) {
      // Same session: an unresolved watch is settled again when its row lands.
      if (sessionId !== undefined && phase === 'pending') resolvePending(sessionId)
      return
    }
    detach()
    watched = sessionId
    phase = 'idle'
    if (sessionId === undefined) return
    if (fired.has(sessionId) || skipped.has(sessionId)) {
      phase = fired.has(sessionId) ? 'fired' : 'skipped'
      return
    }
    const row = rowOf(sessionId)
    if (row !== undefined) {
      if (row.blank === false) {
        skipped.add(sessionId)
        phase = 'skipped'
        return
      }
      if (row.blank === true) {
        arm(sessionId)
        return
      }
    }
    resolvePending(sessionId)
  }

  // Follow the on-screen session. The native column's `mounted` observable is
  // the authoritative seat; the store snapshot subscription is the fallback for
  // hosts without it, and also the signal that re-reads an unresolved session.
  const disposers: Array<() => void> = []
  const mounted = right?.mounted
  if (mounted !== undefined && typeof mounted.subscribe === 'function') {
    try {
      disposers.push(mounted.subscribe(() => { watch(onScreenSession()) }))
    } catch {
      // no mounted feed: the store subscription below covers it
    }
  }
  if (typeof sidebar.subscribeState === 'function') {
    try {
      disposers.push(sidebar.subscribeState(() => {
        const current = onScreenSession()
        if (current !== watched) {
          watch(current)
          return
        }
        // Same session: an unresolved row may have arrived, and an armed watch
        // may have seen its row flip.
        if (phase === 'pending') watch(current)
        else if (phase === 'armed' && current !== undefined) {
          const row = rowOf(current)
          if (row !== undefined && (row.running === true || row.blank === false)) scheduleConfirm(current)
        }
      }))
    } catch {
      // no state subscription: the mounted observable is the only trigger
    }
  }
  if (sessions?.list !== undefined && typeof sessions.list.subscribe === 'function') {
    try {
      disposers.push(sessions.list.subscribe(() => {
        if (phase === 'pending' && watched !== undefined) watch(watched)
      }))
    } catch {
      // listing without subscription support: nothing else to follow
    }
  }

  // First pass: a page can load with a blank conversation already on screen.
  retriesLeft = TAB_READY_RETRIES
  watch(onScreenSession())

  // The pending retry timer must not outlive the plugin fiber.
  return () => {
    disposed = true
    detach()
    clearRetry()
    for (const dispose of disposers) {
      try {
        dispose()
      } catch {
        // disposers are best-effort
      }
    }
  }
}

/**
 * Pure decision probe, exported for tests and for a future "why didn't it
 * open?" diagnostic: does this session row qualify as a not-yet-started
 * conversation? A missing row is `unknown` (the caller probes the log).
 */
export function armDecisionOf(row: SessionRowLike | undefined): 'arm' | 'skip' | 'unknown' {
  if (row === undefined) return 'unknown'
  if (row.blank === false) return 'skip'
  if (row.blank === true) return 'arm'
  return 'unknown'
}
