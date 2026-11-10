/**
 * client-auto-open.spec.ts — v0.10.39 first-turn auto-open contract.
 *
 * The feature must pop the 「轮次轨迹」 tab out on a conversation's FIRST turn
 * and then stay quiet:
 *   - a session WITH history is never auto-opened (blankness is the only arm);
 *   - one open per session (a manual close sticks);
 *   - the plugin-owned switch, the tab's enable switch and the narrow-viewport
 *     gate are evaluated at FIRE time, so a flip before the first turn counts;
 *   - the durable log — not the lagging list row — confirms the turn started;
 *   - a session whose list row has not landed yet is settled by one probe;
 *   - the native tab registration race retries instead of throwing;
 *   - disposal detaches every feed.
 *
 * Transport, viewport and timers are injected, so the whole trigger is
 * deterministic (no sleeps, no network).
 */
import { describe, expect, it, vi } from 'vitest'
import {
  AUTO_OPEN_MIN_WIDTH,
  AUTO_OPEN_SETTING_KEY,
  AUTO_OPEN_TAB_ID,
  armDecisionOf,
  hasFirstTurnEvidence,
  installFirstTurnAutoOpen,
  type AutoOpenCtxLike,
} from '../src/client/auto-open'

// ── Minimal observables/stores the client container publishes ─────────────

function makeStore<T>(initial: T): { getSnapshot(): T; subscribe(fn: () => void): () => void; set(next: T): void } {
  const listeners = new Set<() => void>()
  let value = initial
  return {
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set: (next) => {
      value = next
      for (const listener of listeners) listener()
    },
  }
}

/** Let the confirm/pending promise chains settle (no real timers involved). */
const flush = async (): Promise<void> => {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
}

/** A hand-driven timer queue standing in for window.setTimeout. */
function makeTimers(): {
  run: () => void
  pending: () => number
  setTimeout: (fn: () => void, ms: number) => unknown
  clearTimeout: (handle: unknown) => void
} {
  const queue = new Map<number, { fn: () => void; ms: number }>()
  let next = 1
  return {
    setTimeout: (fn: () => void, ms: number) => {
      const id = next++
      queue.set(id, { fn, ms })
      return id
    },
    clearTimeout: (handle: unknown) => {
      queue.delete(handle as number)
    },
    run: () => {
      const entries = [...queue.entries()]
      queue.clear()
      for (const [, entry] of entries) entry.fn()
    },
    pending: () => queue.size,
  }
}

interface HarnessOptions {
  /** Session list rows keyed by id (omit for "row not published yet"). */
  rows?: Record<string, { blank?: boolean; running?: boolean }>
  /** The on-screen session id. */
  mounted?: string | string[]
  /** Events page the confirm probe sees for one session id. */
  events?: Record<string, unknown[]>
  /** The plugin-owned switch blob. */
  pluginSettings?: Record<string, unknown>
  /** The tab's enable switch. */
  tabEnabled?: boolean
  /** The better-sidebar store's own active session (fallback source). */
  storeSessionId?: string
  /** Whether the native tab type is registered (a false retries). */
  tabReady?: boolean | ((call: number) => boolean)
  viewportWidth?: number
  /** Whether the right column currently reports itself expanded (default true). */
  expanded?: boolean
  /** When given, the confirm transport rejects with this error. */
  transportError?: boolean
}

interface Harness {
  ctx: AutoOpenCtxLike
  openTab: ReturnType<typeof vi.fn>
  isExpanded: ReturnType<typeof vi.fn>
  toggleExpanded: ReturnType<typeof vi.fn>
  fetchEvents: ReturnType<typeof vi.fn>
  timers: ReturnType<typeof makeTimers>
  /** Push a session-list snapshot (the activity signal). */
  setRows(rows: Record<string, { blank?: boolean; running?: boolean }>): void
  /** Move the on-screen session. */
  setMounted(id: string | undefined): void
  /** Emit an event-source/journal mutation for one session. */
  emitSessionEvent(sessionId: string): void
  /** Current better-sidebar prefs (the switch flips through here). */
  setPluginSettings(blob: Record<string, unknown>): void
  /** Registration gate flips to registered (the retry path). */
  registerTabType(): void
  /** Change what the durable log returns for a session (the confirm probe). */
  setEvents(sessionId: string, events: unknown[]): void
  /** The install disposer under test. */
  dispose(): void
}

function makeHarness(options: HarnessOptions = {}): Harness {
  const rowsStore = makeStore<{ byId: Record<string, { blank?: boolean; running?: boolean }> }>({
    byId: options.rows ?? {},
  })
  const mountedStore = makeStore<string | undefined>(
    Array.isArray(options.mounted) ? options.mounted[0] : options.mounted,
  )
  const prefsStore = makeStore<{ pluginSettings?: Record<string, Record<string, unknown>>; tabsEnabled?: Record<string, boolean> }>({
    pluginSettings: options.pluginSettings === undefined ? {} : { [AUTO_OPEN_TAB_ID]: options.pluginSettings },
    tabsEnabled: options.tabEnabled === false ? { [AUTO_OPEN_TAB_ID]: false } : {},
  })
  const stateListeners = new Set<() => void>()
  const eventFeeds = new Map<string, Set<() => void>>()
  const timers = makeTimers()
  let tabReadyCalls = 0
  const feedOf = (sessionId: string): Set<() => void> => {
    let listeners = eventFeeds.get(sessionId)
    if (listeners === undefined) {
      listeners = new Set()
      eventFeeds.set(sessionId, listeners)
    }
    return listeners
  }

  const openTab = vi.fn()
  const isExpanded = vi.fn(() => options.expanded !== false)
  const toggleExpanded = vi.fn()
  const fetchEvents = vi.fn(async (sessionId: string) => {
    if (options.transportError === true) throw new Error('offline')
    return { events: options.events?.[sessionId] ?? [] }
  })

  const betterSidebar = {
    openTab,
    isTabEnabled: () => (options.tabEnabled === false ? false : true),
    getSnapshot: () => ({
      sessionId: options.storeSessionId ?? mountedStore.getSnapshot(),
      prefs: prefsStore.getSnapshot(),
    }),
    subscribeState: (listener: () => void) => {
      stateListeners.add(listener)
      return () => stateListeners.delete(listener)
    },
  }

  const sessions = {
    list: {
      getSnapshot: () => rowsStore.getSnapshot(),
      subscribe: (listener: () => void) => rowsStore.subscribe(listener),
    },
    binding: (sessionId: string) => {
      const listeners = feedOf(sessionId)
      const feed = {
        getSnapshot: () => ({ running: true }),
        subscribe: (listener: () => void) => {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }
      return { session: feed, eventSource: feed }
    },
  }

  const right = {
    mounted: mountedStore,
    isExpanded,
    toggleExpanded,
  }

  const tabRegistry = {
    get: () => {
      tabReadyCalls += 1
      if (typeof options.tabReady === 'function') return options.tabReady(tabReadyCalls) ? { id: AUTO_OPEN_TAB_ID } : undefined
      return options.tabReady === false ? undefined : { id: AUTO_OPEN_TAB_ID }
    },
  }

  const services: Record<string, unknown> = {
    betterSidebar,
    sessions,
    sidebarRight: right,
    sidebarRightTabs: tabRegistry,
  }

  const ctx: AutoOpenCtxLike = {
    get: (name: string) => services[name],
    effect: <T,>(fn: () => T): T => fn(),
  }

  const dispose = installFirstTurnAutoOpen(ctx, {
    fetchEvents,
    viewportWidth: () => options.viewportWidth ?? 1440,
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
  })

  return {
    ctx,
    openTab,
    isExpanded,
    toggleExpanded,
    fetchEvents,
    timers,
    setRows: (rows) => rowsStore.set({ byId: rows }),
    setMounted: (id) => {
      mountedStore.set(id)
      for (const listener of stateListeners) listener()
    },
    emitSessionEvent: (sessionId) => {
      // Mirrors a retained generation accepting a journal mutation.
      for (const listener of feedOf(sessionId)) listener()
    },
    setPluginSettings: (blob) => {
      prefsStore.set({ pluginSettings: { [AUTO_OPEN_TAB_ID]: blob }, tabsEnabled: prefsStore.getSnapshot().tabsEnabled })
      for (const listener of stateListeners) listener()
    },
    registerTabType: () => {
      options.tabReady = true
    },
    setEvents: (sessionId, events) => {
      options.events = { ...(options.events ?? {}), [sessionId]: events }
      // The transport closure reads the (mutated) options map on each call.
    },
    dispose: () => dispose(),
  }
}

describe('armDecisionOf — the pure arming probe', () => {
  it('arms a blank conversation, skips one with history, and treats a missing row as unknown', () => {
    expect(armDecisionOf({ blank: true })).toBe('arm')
    expect(armDecisionOf({ blank: false })).toBe('skip')
    expect(armDecisionOf({ running: true })).toBe('unknown')
    expect(armDecisionOf(undefined)).toBe('unknown')
  })
})

describe('hasFirstTurnEvidence — a started turn, not session setup', () => {
  /** The two housekeeping events DSH 0.2.2 writes when a session is created. */
  const BIRTH = [
    { seq: 1, type: 'sandbox/mode' },
    { seq: 2, type: 'approval/policy' },
  ]

  it('rejects a log that only holds creation housekeeping', () => {
    expect(hasFirstTurnEvidence(BIRTH)).toBe(false)
    expect(hasFirstTurnEvidence([])).toBe(false)
    expect(hasFirstTurnEvidence(undefined)).toBe(false)
    expect(hasFirstTurnEvidence('nope')).toBe(false)
  })

  it('accepts a user message or a turn boundary', () => {
    expect(hasFirstTurnEvidence([...BIRTH, { seq: 3, type: 'user/message' }])).toBe(true)
    expect(hasFirstTurnEvidence([{ seq: 1, type: 'turn/start' }])).toBe(true)
    expect(hasFirstTurnEvidence([{ seq: 1 }, null, 'x', { seq: 2, type: 7 }])).toBe(false)
  })
})

describe('installFirstTurnAutoOpen — inert paths', () => {
  it('stays inert without a usable betterSidebar service', () => {
    const ctx: AutoOpenCtxLike = {
      get: () => undefined,
      effect: <T,>(fn: () => T): T => fn(),
    }
    expect(() => installFirstTurnAutoOpen(ctx)).not.toThrow()
  })

  it('stays inert when the service has no openTab', () => {
    const ctx: AutoOpenCtxLike = {
      get: (name: string) => (name === 'betterSidebar' ? { registerTab: () => () => {} } : undefined),
      effect: <T,>(fn: () => T): T => fn(),
    }
    expect(() => installFirstTurnAutoOpen(ctx)).not.toThrow()
  })
})

describe('installFirstTurnAutoOpen — the first-turn trigger', () => {
  it('opens the tab once the first turn of a blank conversation writes events', async () => {
    const h = makeHarness({
      mounted: 'sess-new',
      rows: { 'sess-new': { blank: true } },
      events: { 'sess-new': [{ seq: 3, type: 'user/message' }] },
    })
    // Blank at mount: armed, but nothing opened yet.
    expect(h.openTab).not.toHaveBeenCalled()
    // The list row flips running on prompt acceptance → debounced confirm.
    h.setRows({ 'sess-new': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.fetchEvents).toHaveBeenCalledWith('sess-new', 0)
    expect(h.openTab).toHaveBeenCalledTimes(1)
    expect(h.openTab).toHaveBeenCalledWith({ type: AUTO_OPEN_TAB_ID }, { sessionId: 'sess-new' })
    expect(h.toggleExpanded).not.toHaveBeenCalled() // the host expanded it
  })

  it('never auto-opens a session that already has history', async () => {
    const h = makeHarness({
      mounted: 'sess-old',
      rows: { 'sess-old': { blank: false, running: false } },
      events: { 'sess-old': [{ seq: 3, type: 'user/message' }] },
    })
    h.setRows({ 'sess-old': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.fetchEvents).not.toHaveBeenCalled()
    expect(h.openTab).not.toHaveBeenCalled()
  })

  it('opens once per session — a later activity burst cannot reopen it', async () => {
    const h = makeHarness({
      mounted: 'sess-a',
      rows: { 'sess-a': { blank: true } },
      events: { 'sess-a': [{ seq: 3, type: 'user/message' }] },
    })
    h.setRows({ 'sess-a': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledTimes(1)
    // Leave and come back, then run again: the once-latch wins.
    h.setMounted('sess-b')
    h.setMounted('sess-a')
    h.setRows({ 'sess-a': { blank: true, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledTimes(1)
  })

  it('follows a session switch: a new blank conversation arms afresh', async () => {
    const h = makeHarness({
      mounted: 'sess-old',
      rows: { 'sess-old': { blank: false }, 'sess-new': { blank: true } },
      events: { 'sess-old': [{ seq: 3, type: 'user/message' }], 'sess-new': [{ seq: 3, type: 'turn/start' }] },
    })
    h.setMounted('sess-new')
    await flush()
    h.setRows({ 'sess-old': { blank: false }, 'sess-new': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledWith({ type: AUTO_OPEN_TAB_ID }, { sessionId: 'sess-new' })
  })

  it('probes an unpublished session row once, arms on an empty log, then opens on the first events', async () => {
    const h = makeHarness({
      mounted: 'sess-fresh',
      events: { 'sess-fresh': [] },
    })
    await flush()
    // The settling probe ran with afterSeq 0 and found no events → armed.
    expect(h.fetchEvents).toHaveBeenCalledWith('sess-fresh', 0)
    expect(h.openTab).not.toHaveBeenCalled()
    // The first turn lands in the durable log and the feed reports activity.
    h.setEvents('sess-fresh', [{ seq: 3, type: 'turn/start' }])
    h.emitSessionEvent('sess-fresh')
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledWith({ type: AUTO_OPEN_TAB_ID }, { sessionId: 'sess-fresh' })
  })

  it('does NOT open on session-creation housekeeping events (regression)', async () => {
    // Live 0.2.2-rc.1 finding: a brand-new conversation's log already holds
    // `sandbox/mode` + `approval/policy`. "Has events" must never be mistaken
    // for "first turn started" — that popped the panel on a 0-turn session.
    const h = makeHarness({
      mounted: 'sess-birth',
      rows: { 'sess-birth': { blank: true } },
      events: { 'sess-birth': [{ seq: 1, type: 'sandbox/mode' }, { seq: 2, type: 'approval/policy' }] },
    })
    // Creation activity signals the confirm probe — it must stay armed.
    h.emitSessionEvent('sess-birth')
    h.timers.run()
    await flush()
    expect(h.fetchEvents).toHaveBeenCalled()
    expect(h.openTab).not.toHaveBeenCalled()
    // The real first prompt lands: now the watch fires.
    h.setEvents('sess-birth', [
      { seq: 1, type: 'sandbox/mode' },
      { seq: 2, type: 'approval/policy' },
      { seq: 3, type: 'user/message' },
    ])
    h.setRows({ 'sess-birth': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledWith({ type: AUTO_OPEN_TAB_ID }, { sessionId: 'sess-birth' })
  })

  it('arms an unpublished session whose log holds only housekeeping events', async () => {
    const h = makeHarness({
      mounted: 'sess-birth2',
      events: { 'sess-birth2': [{ seq: 1, type: 'sandbox/mode' }, { seq: 2, type: 'approval/policy' }] },
    })
    await flush()
    // Not history: the settling probe armed instead of skipping.
    h.setEvents('sess-birth2', [{ seq: 1, type: 'sandbox/mode' }, { seq: 3, type: 'user/message' }])
    h.emitSessionEvent('sess-birth2')
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledWith({ type: AUTO_OPEN_TAB_ID }, { sessionId: 'sess-birth2' })
  })

  it('skips a session whose unpublished row turns out to have history', async () => {
    const h = makeHarness({
      mounted: 'sess-history',
      events: { 'sess-history': [{ seq: 7, type: 'user/message' }] },
    })
    await flush()
    expect(h.fetchEvents).toHaveBeenCalledTimes(1)
    h.setRows({ 'sess-history': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).not.toHaveBeenCalled()
  })

  it('opens without touching an already-expanded column', async () => {
    const h = makeHarness({
      mounted: 'sess-x',
      rows: { 'sess-x': { blank: true } },
      events: { 'sess-x': [{ seq: 3, type: 'user/message' }] },
    })
    h.setRows({ 'sess-x': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledTimes(1)
    expect(h.isExpanded).toHaveBeenCalled()
    expect(h.toggleExpanded).not.toHaveBeenCalled()
  })

  it('does not fall back to the store session while the native column reports no seat', async () => {
    // A present `mounted` observable is authoritative even when it says "no
    // session" (a global panel): the store's session must not be armed there,
    // or the native open would land behind a session nobody is looking at.
    const h = makeHarness({
      mounted: undefined,
      storeSessionId: 'sess-store',
      rows: { 'sess-store': { blank: true } },
      events: { 'sess-store': [{ seq: 3, type: 'user/message' }] },
    })
    await flush()
    expect(h.fetchEvents).not.toHaveBeenCalled()
    h.setRows({ 'sess-store': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).not.toHaveBeenCalled()
  })

  it('expands a collapsed column itself when the host open did not (fallback)', async () => {
    const h = makeHarness({
      mounted: 'sess-collapsed',
      rows: { 'sess-collapsed': { blank: true } },
      events: { 'sess-collapsed': [{ seq: 3, type: 'user/message' }] },
      expanded: false,
    })
    h.setRows({ 'sess-collapsed': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledTimes(1)
    expect(h.toggleExpanded).toHaveBeenCalledTimes(1)
  })
})

describe('installFirstTurnAutoOpen — gates', () => {
  it('honours the plugin-owned switch (off = no auto-open)', async () => {
    const h = makeHarness({
      mounted: 'sess-s',
      rows: { 'sess-s': { blank: true } },
      events: { 'sess-s': [{ seq: 3, type: 'user/message' }] },
      pluginSettings: { [AUTO_OPEN_SETTING_KEY]: false },
    })
    h.setRows({ 'sess-s': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).not.toHaveBeenCalled()
  })

  it('treats an absent switch as ON (the declared default)', async () => {
    const h = makeHarness({
      mounted: 'sess-d',
      rows: { 'sess-d': { blank: true } },
      events: { 'sess-d': [{ seq: 3, type: 'user/message' }] },
      pluginSettings: { someOtherKey: true },
    })
    h.setRows({ 'sess-d': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledTimes(1)
  })

  it('honours the tab enable switch', async () => {
    const h = makeHarness({
      mounted: 'sess-disabled',
      rows: { 'sess-disabled': { blank: true } },
      events: { 'sess-disabled': [{ seq: 3, type: 'user/message' }] },
      tabEnabled: false,
    })
    h.setRows({ 'sess-disabled': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).not.toHaveBeenCalled()
  })

  it('stays out of the way on a narrow viewport', async () => {
    const h = makeHarness({
      mounted: 'sess-narrow',
      rows: { 'sess-narrow': { blank: true } },
      events: { 'sess-narrow': [{ seq: 3, type: 'user/message' }] },
      viewportWidth: AUTO_OPEN_MIN_WIDTH - 1,
    })
    h.setRows({ 'sess-narrow': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.openTab).not.toHaveBeenCalled()
  })
})

describe('installFirstTurnAutoOpen — robustness', () => {
  it('retries while the native tab type is not registered yet', async () => {
    const h = makeHarness({
      mounted: 'sess-race',
      rows: { 'sess-race': { blank: true } },
      events: { 'sess-race': [{ seq: 3, type: 'user/message' }] },
      tabReady: (call) => call > 1, // registered only on the second probe
    })
    h.setRows({ 'sess-race': { blank: false, running: true } })
    h.timers.run() // confirm debounce
    await flush()
    expect(h.openTab).not.toHaveBeenCalled()
    expect(h.timers.pending()).toBe(1) // the registration retry is armed
    h.timers.run()
    await flush()
    expect(h.openTab).toHaveBeenCalledTimes(1)
  })

  it('keeps the watch armed when the confirm transport fails, and retries later', async () => {
    const h = makeHarness({
      mounted: 'sess-net',
      rows: { 'sess-net': { blank: true } },
      events: { 'sess-net': [{ seq: 3, type: 'user/message' }] },
      transportError: true,
    })
    h.setRows({ 'sess-net': { blank: false, running: true } })
    h.timers.run()
    await flush()
    expect(h.fetchEvents).toHaveBeenCalled()
    expect(h.openTab).not.toHaveBeenCalled()
  })

  it('detaches its feeds on disposal (a plugin unload cannot fire late)', async () => {
    const h = makeHarness({
      mounted: 'sess-dispose',
      rows: { 'sess-dispose': { blank: true } },
      events: { 'sess-dispose': [{ seq: 3, type: 'user/message' }] },
    })
    h.dispose()
    h.setRows({ 'sess-dispose': { blank: false, running: true } })
    h.emitSessionEvent('sess-dispose')
    h.timers.run()
    await flush()
    expect(h.openTab).not.toHaveBeenCalled()
  })
})
