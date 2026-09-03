/**
 * trail-jump.ts — structured jump-back into the main conversation, via the
 * client `sessions` service (no DOM text matching, no "load older" button
 * hacking).
 *
 *   chat view:       session.loadOlder() loop → snapshot.chat.nodes (Map,
 *                    keyed by node key, each with anchorSeq) → find the node
 *                    nearest to the target seq → `[data-chat-anchor-key]`
 *                    row → scrollIntoView + flash.
 *   trajectory view: snapshot.views.get('trajectory') → { eventNodes,
 *                    requests } mapped to `[data-trajectory-row-key]` rows;
 *                    collapsed summaries are expanded first.
 *
 * All dependencies (session face, document) are injected so the module stays
 * unit-testable.
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

export interface SessionSnapshotLike {
  hasMore?: boolean
  chat?: {
    nodes?: {
      values(): Iterable<ChatNodeLike>
    }
  }
  views?: {
    get(kind: string): unknown
  }
}

export interface SessionFace {
  loadOlder(): Promise<unknown>
  getSnapshot(): SessionSnapshotLike
}

export interface DocumentLike {
  querySelectorAll(selector: string): ArrayLike<{ dataset: Record<string, string>; click?(): void; scrollIntoView(opts?: unknown): void }>
  querySelector(selector: string): { scrollIntoView(opts?: unknown): void; dataset?: Record<string, string>; classList?: { add(name: string): void } } | null
}

export interface JumpOptions {
  document: DocumentLike
  guard?: number
  onProgress?: (pages: number) => void
}

export type JumpOutcome =
  | { ok: true; mode: 'chat' | 'trajectory' }
  | { ok: false; error: string }

/** Whether the chat view lists a seq inside its current render window. */
export function hasSeqInWindow(snapshot: SessionSnapshotLike, seq: number): boolean {
  const store = snapshot.chat?.nodes
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
export function findNodeForSeq(snapshot: SessionSnapshotLike, seq: number): ChatNodeLike | null {
  const store = snapshot.chat?.nodes
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

/** trajectory view → a stable `data-trajectory-row-key` value (or null). */
export function trajectoryRecordIdFor(item: JumpTarget, snapshot: SessionSnapshotLike): string | null {
  const views = snapshot.views
  if (views === undefined || typeof views.get !== 'function') return null
  const trajectory = views.get('trajectory')
  if (trajectory === null || typeof trajectory !== 'object') return null
  const view = trajectory as { eventNodes?: unknown[]; requests?: unknown[] }
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
    if (target === undefined || typeof target.seq !== 'number') return null
    const rowKind = target.kind === 'steering' ? 'user' : target.kind
    return `${rowKind}\u0000seq\u0000${target.seq}`
  }
  if (item.kind === 'assistant' || item.kind === 'output') {
    const target = nodeWithKind(['assistant'], item.seq)
    if (target === undefined || typeof target.turn !== 'number' || typeof target.step !== 'number') return null
    return `assistant\u0000${target.turn}\u0000${target.step}`
  }
  if (item.kind === 'tool' || item.kind === 'error') {
    if (typeof item.callId === 'string' && item.callId.length > 0) return `tool\u0000call\u0000${item.callId}`
    const target = nodeWithKind(['tool-result'], item.seq)
    if (target === undefined || typeof target.callId !== 'string') return null
    return `tool\u0000call\u0000${target.callId}`
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
    if (target === undefined) return null
    return `compacted\u0000seq\u0000${target.startSeq}`
  }
  return null
}

function findTrajectoryRow(document: DocumentLike, key: string): { dataset: Record<string, string>; click?(): void; scrollIntoView(opts?: unknown): void } | null {
  const encoded = encodeURIComponent(key)
  const rows = document.querySelectorAll('tr[data-trajectory-row-key]')
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const value = row.dataset !== undefined ? row.dataset.trajectoryRowKey : undefined
    if (value === encoded || value === key) return row
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
    let snapshot = session.getSnapshot()
    const trajectoryActive = isTrajectoryViewActive(document)

    if (trajectoryActive) {
      let key = trajectoryRecordIdFor(item, snapshot)
      let row = key === null ? null : findTrajectoryRow(document, key)
      let pages = 0
      if (row === null && snapshot.hasMore === true) {
        while (snapshot.hasMore === true && pages < guard) {
          await session.loadOlder()
          snapshot = session.getSnapshot()
          pages += 1
          options.onProgress?.(pages)
        }
        key = trajectoryRecordIdFor(item, snapshot)
        row = key === null ? null : findTrajectoryRow(document, key)
      }
      if (row === null) {
        expandCollapsedSummaries(document)
        await waitForNextFrame()
        row = key === null ? null : findTrajectoryRow(document, key)
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
    while (snapshot.hasMore === true && !hasSeqInWindow(snapshot, item.seq) && pages < guard) {
      await session.loadOlder()
      snapshot = session.getSnapshot()
      pages += 1
      options.onProgress?.(pages)
    }
    const node = findNodeForSeq(snapshot, item.seq)
    if (node === null) return { ok: false, error: 'seq-not-rendered' }
    // After loadOlder() the session data updates immediately, but the chat
    // DOM commits a tick later — give the freshly loaded row a few frames to
    // mount before declaring failure. (Without this the FIRST attempt used to
    // report "cannot locate" and the user had to click a second time.)
    const selector = `[data-chat-anchor-key="${cssEscape(node.key)}"]`
    let row = document.querySelector(selector)
    let retries = 0
    while (row === null && retries < 6) {
      await waitForNextFrame()
      row = document.querySelector(selector)
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
