/**
 * trail-jump.ts — structured jump-back into the main conversation.
 *
 * 0.2.0 path (preferred) — the official conversation view registry
 * (`ctx.uiConversation`, module @deepseek-ai/dsh-client-ui-conversation):
 *
 *   conversation.target('chat').getSnapshot()        → { nodes } (Map keyed
 *                    by node key, each node { key, anchorSeq, visibility })
 *                    → find the chat node nearest to the target seq →
 *                    `[data-chat-anchor-key]` / `[data-chat-node-key]` row →
 *                    scrollIntoView + flash.
 *   conversation.target('trajectory').getSnapshot()  → { eventNodes,
 *                    requests } mapped to `[data-trajectory-row-key]` rows;
 *                    collapsed summaries are expanded first.
 *
 * 0.1.x fallback — the session snapshot itself used to carry both views
 * (`snapshot.chat.nodes` / `snapshot.views.get('trajectory')`); that shape is
 * still consulted when no conversation service is available.
 *
 * History paging rides the session face (`loadOlder()` + `hasMore`) on both
 * lines. All dependencies (session face, conversation face, document) are
 * injected so the module stays unit-testable.
 */

/** A fold item the user clicked — anything with a seq. */
export interface JumpTarget {
  seq: number
  kind: 'user' | 'assistant' | 'tool' | 'error' | 'compaction' | 'context' | 'input' | 'output'
  callId?: string
  turn?: number
  step?: number
}

export interface ChatNodeLike {
  key: string
  anchorSeq: number
  visibility?: string
  kind?: string
  turn?: number
  step?: number
  callId?: string
}

export interface ChatNodesStoreLike {
  values(): Iterable<ChatNodeLike>
}

/** One bound conversation view target (0.2.0 `uiConversation.binding`). */
export interface ConversationTargetLike {
  getSnapshot(): unknown
}

export interface ConversationTargetsLike {
  target(name: string): ConversationTargetLike | undefined
}

/** The client `uiConversation` service face we consume (0.2.0+). */
export interface ConversationServiceLike {
  /** Throws when the session is unknown/inactive — callers must guard. */
  binding(source: string): ConversationTargetsLike
}

export interface SessionSnapshotLike {
  hasMore?: boolean
  chat?: {
    nodes?: ChatNodesStoreLike
  }
  views?: {
    get(kind: string): unknown
  }
}

export interface SessionFace {
  loadOlder(): Promise<unknown>
  getSnapshot(): SessionSnapshotLike
}

/** The assembled view state jumpToItem needs, whatever DSH line served it. */
export interface JumpViewState {
  hasMore: boolean
  /** Chat node store (Map-like with values()); undefined on old hosts. */
  chatNodes: ChatNodesStoreLike | undefined
  /** The trajectory view snapshot; undefined when the view is absent. */
  trajectoryView: unknown
}

export interface DocumentLike {
  querySelectorAll(selector: string): ArrayLike<{ dataset: Record<string, string>; click?(): void; scrollIntoView(opts?: unknown): void }>
  querySelector(selector: string): { scrollIntoView(opts?: unknown): void; dataset?: Record<string, string>; classList?: { add(name: string): void } } | null
}

export interface JumpOptions {
  document: DocumentLike
  guard?: number
  onProgress?: (pages: number) => void
  /** 0.2.0 conversation view registry face (optional peer). */
  conversation?: ConversationTargetsLike
}

export type JumpOutcome =
  | { ok: true; mode: 'chat' | 'trajectory' }
  | { ok: false; error: string }

/** Read one conversation view target's snapshot, tolerating absent targets. */
function targetSnapshot(conversation: ConversationTargetsLike, name: string): unknown {
  try {
    const target = conversation.target(name)
    return target !== undefined ? target.getSnapshot() : undefined
  } catch {
    return undefined
  }
}

/**
 * Assemble the jump view state from the 0.2.0 conversation registry first
 * (chat nodes + trajectory view snapshot), falling back to the legacy
 * session snapshot fields when the registry face is unavailable.
 */
export function viewStateForJump(session: SessionFace, conversation?: ConversationTargetsLike): JumpViewState {
  const snapshot = session.getSnapshot()
  let chatNodes: ChatNodesStoreLike | undefined
  let trajectoryView: unknown
  if (conversation !== undefined) {
    const chat = targetSnapshot(conversation, 'chat') as { nodes?: ChatNodesStoreLike } | undefined
    if (chat !== null && typeof chat === 'object' && chat.nodes !== undefined && chat.nodes !== null) {
      chatNodes = chat.nodes
    }
    const trajectory = targetSnapshot(conversation, 'trajectory')
    if (trajectory !== null && typeof trajectory === 'object') trajectoryView = trajectory
  }
  if (chatNodes === undefined) chatNodes = snapshot.chat?.nodes
  if (trajectoryView === undefined && snapshot.views !== undefined && typeof snapshot.views.get === 'function') {
    const legacy = snapshot.views.get('trajectory')
    if (legacy !== null && typeof legacy === 'object') trajectoryView = legacy
  }
  return { hasMore: snapshot.hasMore === true, chatNodes, trajectoryView }
}

/** Whether the chat view lists a seq inside its current render window. */
export function hasSeqInWindow(view: JumpViewState, seq: number): boolean {
  const store = view.chatNodes
  if (store === undefined || typeof store.values !== 'function') return false
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const node of store.values()) {
    if (node === null || typeof node !== 'object' || typeof node.anchorSeq !== 'number') continue
    if (node.anchorSeq < min) min = node.anchorSeq
    if (node.anchorSeq > max) max = node.anchorSeq
  }
  return min <= seq && seq <= max
}

/**
 * Find the visible node nearest to a seq (exact → next → prev). Hidden
 * nodes (e.g. an injected system-reminder) are skipped, so a hidden input
 * falls back to the next visible row naturally.
 */
export function findNodeForSeq(view: JumpViewState, seq: number): ChatNodeLike | null {
  const store = view.chatNodes
  if (store === undefined || typeof store.values !== 'function') return null
  let exact: ChatNodeLike | null = null
  let next: ChatNodeLike | null = null
  let prev: ChatNodeLike | null = null
  for (const node of store.values()) {
    if (node === null || typeof node !== 'object' || node.visibility === 'hidden') continue
    const anchor = node.anchorSeq
    if (typeof anchor !== 'number') continue
    if (Math.abs(anchor - seq) < 0.5) {
      if (exact === null) exact = node
      continue
    }
    if (anchor >= seq && (next === null || anchor < next.anchorSeq)) next = node
    if (anchor <= seq && (prev === null || anchor > prev.anchorSeq)) prev = node
  }
  return exact !== null ? exact : next !== null ? next : prev
}

function isTrajectoryViewActive(document: DocumentLike): boolean {
  return document.querySelector('[data-trajectory-scroll]') !== null
}

/** trajectory view → the stable `data-trajectory-row-key` candidates (or none). */
export function trajectoryRecordIdsFor(item: JumpTarget, trajectoryView: unknown): string[] {
  if (trajectoryView === null || typeof trajectoryView !== 'object') return []
  const view = trajectoryView as { eventNodes?: unknown[]; requests?: unknown[] }
  const nodes = Array.isArray(view.eventNodes) ? view.eventNodes : []
  const requests = Array.isArray(view.requests) ? view.requests : []
  const nodeWithKind = (kinds: string[], seq: number): { seq?: number; kind?: string; turn?: number; step?: number; callId?: string } | undefined => {
    const matches = nodes.filter((node): node is Record<string, unknown> => (
      node !== null && typeof node === 'object'
      && kinds.includes(String((node as { kind?: unknown }).kind))
      && typeof (node as { seq?: unknown }).seq === 'number'
    ))
    return (matches.find((node) => node.seq === seq)
      ?? matches.filter((node) => (node.seq as number) >= seq).sort((a, b) => (a.seq as number) - (b.seq as number))[0]) as
      { seq?: number; kind?: string; turn?: number; step?: number; callId?: string } | undefined
  }

  if (item.kind === 'user' || item.kind === 'context' || item.kind === 'input') {
    const target = nodeWithKind(['user', 'steering', 'context'], item.seq)
    if (target === undefined || typeof target.seq !== 'number') return []
    const rowKind = target.kind === 'steering' ? 'user' : target.kind
    return [`${rowKind}\u0000seq\u0000${target.seq}`]
  }
  if (item.kind === 'assistant' || item.kind === 'output') {
    const target = nodeWithKind(['assistant'], item.seq)
    if (target === undefined || typeof target.seq !== 'number') return []
    const ids: string[] = []
    // 0.2.0 grammar: the cell's sourceSeq keys the row (`assistant\0seq\0N`).
    if (typeof target.turn === 'number' && typeof target.step === 'number') {
      ids.push(`assistant\u0000${target.turn}\u0000${target.step}`)
    }
    ids.push(`assistant\u0000seq\u0000${target.seq}`)
    return ids
  }
  if (item.kind === 'tool' || item.kind === 'error') {
    if (typeof item.callId === 'string' && item.callId.length > 0) return [`tool\u0000call\u0000${item.callId}`]
    const target = nodeWithKind(['tool-result'], item.seq)
    if (target === undefined || typeof target.callId !== 'string') return []
    return [`tool\u0000call\u0000${target.callId}`]
  }
  if (item.kind === 'compaction') {
    const compactions: Array<{ purpose?: unknown; startSeq?: number; resultSeq?: number }> = []
    for (const request of requests) {
      if (request === null || typeof request !== 'object') continue
      const record = request as { purpose?: unknown; startSeq?: unknown; resultSeq?: unknown }
      if (record.purpose === 'compaction' && typeof record.startSeq === 'number') {
        compactions.push({ purpose: record.purpose, startSeq: record.startSeq, resultSeq: typeof record.resultSeq === 'number' ? record.resultSeq : undefined })
      }
    }
    const target = compactions.find((request) => request.resultSeq === item.seq)
      ?? compactions.filter((request) => (request.resultSeq ?? -1) >= item.seq)
        .sort((a, b) => (a.resultSeq ?? -1) - (b.resultSeq ?? -1))[0]
    if (target === undefined) return []
    return [`compacted\u0000seq\u0000${target.startSeq}`]
  }
  return []
}

function findTrajectoryRowByKeys(document: DocumentLike, keys: string[]): { dataset: Record<string, string>; click?(): void; scrollIntoView(opts?: unknown): void } | null {
  if (keys.length === 0) return null
  for (const key of keys) {
    const encoded = encodeURIComponent(key)
    const rows = document.querySelectorAll('tr[data-trajectory-row-key]')
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index]
      const value = row.dataset !== undefined ? row.dataset.trajectoryRowKey : undefined
      if (value === encoded || value === key) return row
    }
  }
  return null
}

function findTrajectoryRowBySeq(document: DocumentLike, item: JumpTarget): { dataset: Record<string, string>; click?(): void; scrollIntoView(opts?: unknown): void } | null {
  const rows = document.querySelectorAll('tr[data-trajectory-row-key]')
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const raw = row.dataset.trajectoryRowKey ?? ''
    let id = ''
    try {
      id = decodeURIComponent(raw)
    } catch {
      continue
    }
    if (id.includes(`\u0000seq\u0000${item.seq}`)) return row
    if (typeof item.callId === 'string' && id.includes(`\u0000call\u0000${item.callId}`)) return row
  }
  return null
}

function expandCollapsedSummaries(document: DocumentLike): void {
  const rows = document.querySelectorAll('tr[data-collapsed-summary]')
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    if (typeof row.click === 'function') row.click()
  }
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
    } else {
      resolve()
    }
  })
}

/**
 * Locate the chat row for a node key. DSH 0.2.0 chat rows carry the flow key
 * on `data-chat-anchor-key` (a grouped part's key is a JSON pair, so the bare
 * node key also rides `data-chat-node-key`); older builds only had the anchor
 * attribute. Both attributes are compared.
 */
function findChatRow(document: DocumentLike, key: string): { scrollIntoView(opts?: unknown): void; dataset?: Record<string, string>; classList?: { add(name: string): void } } | null {
  const exact = document.querySelector(`[data-chat-anchor-key="${cssEscape(key)}"]`)
  if (exact !== null) return exact
  const rows = document.querySelectorAll('[data-chat-node-key],[data-chat-anchor-key]')
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    if (row.dataset !== undefined && (row.dataset.chatNodeKey === key || row.dataset.chatAnchorKey === key)) return row
  }
  return null
}

/**
 * Jump to the nearest rendered row for a fold item. Returns the outcome and
 * reports paging progress through onProgress.
 */
export async function jumpToItem(
  session: SessionFace,
  item: JumpTarget,
  options: JumpOptions,
): Promise<JumpOutcome> {
  const guard = Number.isFinite(Number(options.guard)) && (options.guard ?? 0) > 0
    ? Math.min(500, Math.max(1, Math.floor(options.guard ?? 200)))
    : 200
  const document = options.document

  try {
    let view = viewStateForJump(session, options.conversation)
    const trajectoryActive = isTrajectoryViewActive(document)

    if (trajectoryActive) {
      let keys = trajectoryRecordIdsFor(item, view.trajectoryView)
      let row = findTrajectoryRowByKeys(document, keys)
      let pages = 0
      if (row === null && view.hasMore) {
        while (view.hasMore && pages < guard) {
          await session.loadOlder()
          view = viewStateForJump(session, options.conversation)
          pages += 1
          options.onProgress?.(pages)
        }
        keys = trajectoryRecordIdsFor(item, view.trajectoryView)
        row = findTrajectoryRowByKeys(document, keys)
      }
      if (row === null) {
        expandCollapsedSummaries(document)
        await waitForNextFrame()
        keys = trajectoryRecordIdsFor(item, view.trajectoryView)
        row = findTrajectoryRowByKeys(document, keys)
      }
      if (row === null) {
        row = findTrajectoryRowBySeq(document, item)
      }
      if (row === null) return { ok: false, error: 'trajectory-row-not-rendered' }
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return { ok: true, mode: 'trajectory' }
    }

    // Chat view: load older pages until the target is in the window.
    let pages = 0
    while (view.hasMore && !hasSeqInWindow(view, item.seq) && pages < guard) {
      await session.loadOlder()
      view = viewStateForJump(session, options.conversation)
      pages += 1
      options.onProgress?.(pages)
    }
    const node = findNodeForSeq(view, item.seq)
    if (node === null) return { ok: false, error: 'seq-not-rendered' }
    // After loadOlder() the session data updates immediately, but the chat
    // DOM commits a tick later — give the freshly loaded row a few frames to
    // mount before declaring failure. (Without this the FIRST attempt used to
    // report "cannot locate" and the user had to click a second time.)
    let row = findChatRow(document, node.key)
    let retries = 0
    while (row === null && retries < 6) {
      await waitForNextFrame()
      row = findChatRow(document, node.key)
      retries += 1
    }
    if (row === null) return { ok: false, error: 'row-not-in-chat-view' }
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (row.classList !== undefined && typeof row.classList.add === 'function') {
      row.classList.add('ttl-flash')
    }
    return { ok: true, mode: 'chat' }
  } catch (reason) {
    return { ok: false, error: reason instanceof Error ? reason.message : String(reason) }
  }
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value.replace(/["\\]/g, '\\$&')
}
