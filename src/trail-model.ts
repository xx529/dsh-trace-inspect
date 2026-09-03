/**
 * trail-model.ts — pure event → turn folding for dsh-turn-outline.
 *
 * Framework-agnostic (no React / DOM / Node): a single foldTurns() maps a
 * session event stream onto per-user-turn summaries:
 *
 *   turn boundary   = `turn/start .. turn/end` (the `data.turn` number is the
 *                     turn identity — stable under parallel steps / steering).
 *   input           = first `user/message` with source.kind === 'user'.
 *   context rows    = `steering` / `context` user messages (kept as grey rows).
 *   tool steps      = `tool/call` (+ `tool/result` error rows).
 *   tool groups     = consecutive tool/call steps (>=2) merged, broken by an
 *                     assistant output, an error, a compaction, a user
 *                     message or a turn end.
 *   output          = `assistant/message` text (last text block wins).
 *   compaction      = `compaction/summary` shown as a checkpoint row.
 *   command/run     = ignored (mirrors the trajectory view).
 *
 * Fallback mode: a stream with NO turn/start events folds on
 * `user/message` boundaries, so the panel still works for odd logs.
 *
 * Field asymmetry (verified against DSH 0.1.1-rc.2):
 *   user/message text lives in data.content (block array or bare string),
 *   assistant/message text lives in data.message.content.
 */

export interface SessionEventLike {
  type: string
  seq: number
  time?: number
  data?: Record<string, unknown> | null
}

export type TurnItem =
  | { kind: 'input'; seq: number; text: string; preview: string }
  | { kind: 'tool'; step: TrailStep }
  | { kind: 'output'; seq: number; text: string; preview: string }
  | { kind: 'compaction'; seq: number; preview: string }

export interface TrailStep {
  kind: 'tool' | 'error'
  seq: number
  name: string
  argsPreview: string
  callId: string | null
  error: string
}

export interface TrailTurn {
  index: number
  turn: number | null
  /** The seq a jump targets: the user input, else the first item. */
  anchorSeq: number
  inputPreview: string
  outputPreview: string
  status: 'pending' | 'running' | 'done' | 'error'
  startedAt?: number
  endedAt?: number
  items: TurnItem[]
  stepsCount: number
  /** Number of injected system-reminders / steering for this turn (not rendered). */
  contextCount: number
  hasError: boolean
}

/** Aggregated step statistics (kept incrementally, not re-derived per pull). */
export interface TrailStats {
  total: number
  failed: number
  tools: Array<{ name: string; count: number }>
}

/** Preview length for one-line summaries. */
export const PREVIEW_MAX = 120

/** Flatten every tool/error step of a turn. */
export function stepsOf(turn: TrailTurn): TrailStep[] {
  const out: TrailStep[] = []
  for (const item of turn.items) {
    if (item.kind === 'tool') out.push(item.step)
  }
  return out
}

export function compact(value: string, max = PREVIEW_MAX): string {
  const oneLine = value.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= max) return oneLine
  return `${oneLine.slice(0, max - 1).trimEnd()}…`
}

/** Extract text from a content block array (first non-empty text block). */
export function contentPreview(blocks: unknown): string {
  if (typeof blocks === 'string') return compact(blocks)
  if (!Array.isArray(blocks)) return ''
  for (const block of blocks) {
    if (
      block !== null && typeof block === 'object'
      && (block as { type?: unknown }).type === 'text'
      && typeof (block as { text?: unknown }).text === 'string'
      && (block as { text: string }).text.trim().length > 0
    ) {
      return compact((block as { text: string }).text)
    }
  }
  return ''
}

/** Last text block of an assistant message content array. */
export function lastTextBlock(blocks: unknown): string {
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return ''
  let last = ''
  for (const block of blocks) {
    if (
      block !== null && typeof block === 'object'
      && (block as { type?: unknown }).type === 'text'
      && typeof (block as { text?: unknown }).text === 'string'
      && (block as { text: string }).text.trim().length > 0
    ) {
      last = (block as { text: string }).text
    }
  }
  return last
}

function objectData(event: SessionEventLike): Record<string, unknown> {
  return event.data !== null && typeof event.data === 'object' ? event.data : {}
}

/** source.kind: 'user' | 'steering' | 'context' | 'plugin' | ... */
function sourceKindOf(event: SessionEventLike, data: Record<string, unknown>): string | undefined {
  const message = data.message !== null && typeof data.message === 'object' ? data.message : {}
  const source = message !== null && typeof (message as { source?: unknown }).source === 'object'
    ? (message as { source: { kind?: unknown } }).source
    : (data.source !== null && typeof data.source === 'object'
      ? (data.source as { kind?: unknown })
      : null)
  if (source !== null && typeof source.kind === 'string') return source.kind
  return undefined
}

export function toolCallIdOf(data: Record<string, unknown>): string | null {
  if (typeof data.callId === 'string' && data.callId.length > 0) return data.callId
  const message = data.message !== null && typeof data.message === 'object' ? data.message : {}
  const source = message !== null && typeof (message as { source?: unknown }).source === 'object'
    ? (message as { source: { callId?: unknown } }).source
    : null
  if (source !== null && typeof source.callId === 'string' && source.callId.length > 0) {
    return source.callId
  }
  return null
}

interface Builder {
  turn: number | null
  startSeq: number | null
  endSeq: number | null
  input: string
  inputSeq: number | null
  output: string
  outputSeq: number | null
  items: TurnItem[]
  steps: TrailStep[]
  contexts: Array<{ seq: number; text: string; preview: string }>
  hasError: boolean
  startedAt?: number
  endedAt?: number
  /** Turn-mode order position (set by TrailFolder); tracks frozen slots. */
  position?: number
}

function newBuilder(turn: number | null): Builder {
  return {
    turn,
    startSeq: null,
    endSeq: null,
    input: '',
    inputSeq: null,
    output: '',
    outputSeq: null,
    items: [],
    steps: [],
    contexts: [],
    hasError: false,
  }
}

function appendItem(builder: Builder, item: TurnItem): void {
  builder.items.push(item)
  if (item.kind === 'tool') {
    builder.steps.push(item.step)
    if (item.step.kind === 'error') builder.hasError = true
  }
}

function finishBuilder(builder: Builder, index: number, boundarySeq: number): TrailTurn {
  const anchorSeq = builder.inputSeq !== null ? builder.inputSeq : boundarySeq
  const status: TrailTurn['status'] = builder.hasError
    ? 'error'
    : builder.endSeq === null
      ? (builder.items.length > 0 ? 'running' : 'pending')
      : 'done'
  return {
    index,
    turn: builder.turn,
    anchorSeq,
    inputPreview: compact(builder.input),
    outputPreview: compact(builder.output),
    status,
    ...(builder.startedAt !== undefined ? { startedAt: builder.startedAt } : {}),
    ...(builder.endedAt !== undefined ? { endedAt: builder.endedAt } : {}),
    items: builder.items,
    stepsCount: builder.steps.length,
    contextCount: builder.contexts.length,
    hasError: builder.hasError,
  }
}

/** First seq-bearing entry of an item list (used as a fallback boundary). */
function firstItemSeq(items: TurnItem[]): number {
  for (const item of items) {
    if (item.kind === 'tool') return item.step.seq
    return item.seq
  }
  return 0
}

/**
 * Fold an event stream onto TrailTurn[].
 * @param events - session events ordered by seq.
 * @returns the folded turns in stream order.
 */
export function foldTurns(events: readonly SessionEventLike[]): TrailTurn[] {
  const out: TrailTurn[] = []
  if (!Array.isArray(events) || events.length === 0) return out

  const hasTurnEvents = events.some((event) => (
    event !== null && typeof event === 'object'
    && typeof (event as { type?: unknown }).type === 'string'
    && (event as { type: string }).type === 'turn/start'
  ))
  if (!hasTurnEvents) return foldByUserBoundaries(events)

  const index = new Map<number, Builder>()
  const order: number[] = []
  const pendingUser: Array<{ seq: number; text: string }> = []
  let current: Builder | null = null

  const builderOf = (turn: number): Builder => {
    let builder = index.get(turn)
    if (builder === undefined) {
      builder = newBuilder(turn)
      index.set(turn, builder)
      order.push(turn)
    }
    return builder
  }

  for (const event of events) {
    if (event === null || typeof event !== 'object' || typeof event.type !== 'string') continue
    const data = objectData(event)
    const seq = typeof event.seq === 'number' ? event.seq : 0
    const time = typeof event.time === 'number' ? event.time : undefined

    switch (event.type) {
      case 'turn/start': {
        const raw = data.turn
        if (typeof raw === 'number') {
          const builder = builderOf(raw)
          if (builder.startSeq === null) builder.startSeq = seq
          if (builder.startedAt === undefined) builder.startedAt = time
          for (const pending of pendingUser.splice(0)) {
            builder.input = pending.text
            builder.inputSeq = pending.seq
            builder.items.unshift({ kind: 'input', seq: pending.seq, text: pending.text, preview: compact(pending.text) })
          }
          current = builder
        }
        break
      }
      case 'turn/end': {
        const raw = data.turn
        const target = typeof raw === 'number' ? builderOf(raw) : current
        if (target !== null) {
          target.endSeq = seq
          target.endedAt = time
          current = null
        }
        break
      }
      case 'user/message': {
        const preview = contentPreview(data.content)
        if (preview.length === 0) break
        const kind = sourceKindOf(event, data)
        const text = typeof data.content === 'string'
          ? data.content
          : (typeof data.message === 'object' && data.message !== null
            && typeof (data.message as { content?: unknown }).content === 'string'
            ? (data.message as { content: string }).content
            : preview)
        if (kind === 'user') {
          if (current === null) {
            pendingUser.push({ seq, text })
          } else {
            current.input = text
            current.inputSeq = seq
            appendItem(current, { kind: 'input', seq, text, preview })
          }
        } else if (current !== null) {
          current.contexts.push({ seq, text, preview })
        }
        break
      }
      case 'assistant/message': {
        const message = data.message !== null && typeof data.message === 'object' ? data.message : {}
        const content = typeof (message as { content?: unknown }).content !== 'undefined'
          ? (message as { content: unknown }).content
          : data.content
        const text = lastTextBlock(content)
        if (text.length === 0) break
        if (current !== null) {
          current.output = text
          current.outputSeq = seq
          appendItem(current, { kind: 'output', seq, text, preview: compact(text) })
        }
        break
      }
      case 'tool/call': {
        if (current === null) break
        const name = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'tool'
        const args = typeof data.arguments === 'string' && data.arguments.length > 0 ? data.arguments : ''
        const step: TrailStep = {
          kind: 'tool',
          seq,
          name,
          argsPreview: compact(args),
          callId: toolCallIdOf(data),
          error: '',
        }
        appendItem(current, { kind: 'tool', step })
        break
      }
      case 'tool/result': {
        const error = (data.error !== null && typeof data.error === 'object' ? data.error : null) as {
          name?: unknown
          code?: unknown
        } | null
        if (error === null) break
        if (current === null) break
        const name = typeof error.name === 'string' && error.name.length > 0 ? error.name : 'tool'
        const detail = typeof error.code === 'string' && error.code.length > 0 ? ` · ${error.code}` : ''
        const step: TrailStep = {
          kind: 'error',
          seq,
          name,
          argsPreview: '',
          callId: toolCallIdOf(data),
          error: compact(`${name}${detail}`),
        }
        appendItem(current, { kind: 'tool', step })
        break
      }
      case 'compaction/summary': {
        const preview = contentPreview(data.summary)
        if (preview.length === 0) break
        if (current !== null) appendItem(current, { kind: 'compaction', seq, preview })
        break
      }
      default:
        // command/run and anything else: ignored.
        break
    }
  }

  let counter = 0
  for (const turn of order) {
    const builder = index.get(turn)
    if (builder === undefined) continue
    const boundarySeq = builder.startSeq !== null ? builder.startSeq : (builder.inputSeq ?? firstItemSeq(builder.items))
    out.push(finishBuilder(builder, counter, boundarySeq))
    counter += 1
  }
  // Trailing user messages that never found a turn.
  for (const pending of pendingUser) {
    const builder = newBuilder(null)
    builder.input = pending.text
    builder.inputSeq = pending.seq
    appendItem(builder, { kind: 'input', seq: pending.seq, text: pending.text, preview: compact(pending.text) })
    out.push(finishBuilder(builder, counter, pending.seq))
    counter += 1
  }
  return out
}

/** Fallback: fold on user/message boundaries when no turn/start exists. */
export function foldByUserBoundaries(events: readonly SessionEventLike[]): TrailTurn[] {
  const out: TrailTurn[] = []
  let builder: Builder | null = null
  let counter = 0

  const close = (): void => {
    if (builder === null) return
    const boundarySeq = builder.inputSeq !== null ? builder.inputSeq : builder.startSeq ?? 0
    out.push(finishBuilder(builder, counter, boundarySeq))
    counter += 1
    builder = null
  }

  for (const event of events) {
    if (event === null || typeof event !== 'object' || typeof event.type !== 'string') continue
    const data = objectData(event)
    const seq = typeof event.seq === 'number' ? event.seq : 0
    const time = typeof event.time === 'number' ? event.time : undefined

    if (event.type === 'user/message') {
      const kind = sourceKindOf(event, data)
      if (kind !== 'user') continue
      close()
      const text = typeof data.content === 'string' ? data.content : contentPreview(data.content)
      if (text.length === 0) continue
      builder = newBuilder(null)
      builder.startSeq = seq
      builder.startedAt = time
      builder.input = text
      builder.inputSeq = seq
      appendItem(builder, { kind: 'input', seq, text, preview: compact(text) })
      continue
    }
    if (builder === null) continue
    if (event.type === 'assistant/message') {
      const message = data.message !== null && typeof data.message === 'object' ? data.message : {}
      const text = lastTextBlock((message as { content?: unknown }).content ?? data.content)
      if (text.length === 0) continue
      builder.output = text
      builder.outputSeq = seq
      appendItem(builder, { kind: 'output', seq, text, preview: compact(text) })
      continue
    }
    if (event.type === 'tool/call') {
      const name = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'tool'
      const args = typeof data.arguments === 'string' && data.arguments.length > 0 ? data.arguments : ''
      const step: TrailStep = {
        kind: 'tool',
        seq,
        name,
        argsPreview: compact(args),
        callId: toolCallIdOf(data),
        error: '',
      }
      // appendItem records the step once (in items AND steps); a redundant
      // direct steps.push here would double-count stepsCount.
      appendItem(builder, { kind: 'tool', step })
      continue
    }
    if (event.type === 'tool/result') {
      const error = (data.error !== null && typeof data.error === 'object' ? data.error : null) as {
        name?: unknown
        code?: unknown
      } | null
      if (error === null) continue
      const name = typeof error.name === 'string' && error.name.length > 0 ? error.name : 'tool'
      const detail = typeof error.code === 'string' && error.code.length > 0 ? ` · ${error.code}` : ''
      const step: TrailStep = {
        kind: 'error',
        seq,
        name,
        argsPreview: '',
        callId: toolCallIdOf(data),
        error: compact(`${name}${detail}`),
      }
      appendItem(builder, { kind: 'tool', step })
      continue
    }
  }
  close()
  return out
}

// ── Incremental folding ──────────────────────────────────────────────────

/** Materialize the open user-mode turn (fallback folding) at its list index. */
function finishUserTurn(builder: Builder, index: number): TrailTurn {
  const boundarySeq = builder.inputSeq !== null ? builder.inputSeq : builder.startSeq ?? 0
  return finishBuilder(builder, index, boundarySeq)
}

/**
 * TrailFolder — incremental variant of foldTurns for live (append-only) event
 * streams. Events are consumed ONCE via push(); snapshot() materializes the
 * current turn list. The key property for rendering cost:
 *
 *   closed turns are materialized once and REUSED (object identity is stable
 *   across snapshots), so React.memo row components skip them; only the open
 *   turn and the trailing state re-materialize per push burst — O(delta) work
 *   per pull instead of a full O(n) re-fold of the whole log.
 *
 * Semantics mirror foldTurns(events) exactly for any stream — including the
 * user-boundary fallback mode and the mode flip when the first turn/start
 * arrives after fallback turns were already folded (the flip reconstructs
 * what a from-scratch turn-mode fold would hold: only pending user inputs
 * survive; pre-turn outputs/steps are dropped, matching turn-mode replay):
 *   - mode 'unknown': no boundary seen yet — every fold mode would drop the
 *     events, so they are dropped.
 *   - mode 'turn': turn/start boundaries (foldTurns' primary mode).
 *   - mode 'user': no turn/start anywhere yet (foldByUserBoundaries).
 *
 * push() additionally skips events whose seq is not strictly greater than the
 * last consumed seq, which makes the folder idempotent against duplicate or
 * re-sent pages from the transport.
 */
export class TrailFolder {
  private mode: 'unknown' | 'turn' | 'user' = 'unknown'

  // turn-mode state
  private readonly builders = new Map<number, Builder>()
  private readonly order: number[] = []
  private readonly frozen: Array<TrailTurn | null> = []
  private readonly pendingUser: Array<{ seq: number; text: string }> = []
  private current: Builder | null = null

  // user-mode state
  private readonly userClosed: TrailTurn[] = []
  private userActive: Builder | null = null
  private userActiveTurn: TrailTurn | null = null
  private userCounter = 0

  private lastSeq = -1
  private total = 0
  private failed = 0
  private readonly byTool = new Map<string, number>()

  /** Highest event seq consumed so far (duplicates / re-pages are skipped). */
  get latestSeq(): number {
    return this.lastSeq
  }

  push(event: SessionEventLike): void {
    if (event === null || typeof event !== 'object' || typeof event.type !== 'string') return
    const seq = typeof event.seq === 'number' ? event.seq : Number.NaN
    if (!Number.isFinite(seq) || seq <= this.lastSeq) return
    const data = objectData(event)
    const time = typeof event.time === 'number' ? event.time : undefined
    this.lastSeq = seq

    if (this.mode === 'turn') {
      this.applyTurnEvent(event.type, data, seq, time)
      return
    }
    if (this.mode === 'user') {
      if (event.type === 'turn/start' && typeof data.turn === 'number') {
        this.flipToTurnMode()
        this.applyTurnEvent(event.type, data, seq, time)
      } else {
        this.applyUserEvent(event.type, data, seq, time)
      }
      return
    }
    // mode 'unknown': commit on the first mode-discriminating event.
    if (event.type === 'turn/start' && typeof data.turn === 'number') {
      this.mode = 'turn'
      this.applyTurnEvent(event.type, data, seq, time)
      return
    }
    if (event.type === 'user/message' && sourceKindOf(event, data) === 'user') {
      this.mode = 'user'
      this.applyUserEvent(event.type, data, seq, time)
      return
    }
    // No boundary yet: both fold modes would drop this event (no open turn).
  }

  /** The current turn list; closed turns keep their object identity. */
  snapshot(): TrailTurn[] {
    if (this.mode === 'unknown') return []
    if (this.mode === 'user') {
      const out = this.userClosed.slice()
      if (this.userActive !== null) {
        if (this.userActiveTurn === null) {
          this.userActiveTurn = finishUserTurn(this.userActive, this.userClosed.length)
        }
        out.push(this.userActiveTurn)
      }
      return out
    }
    const out: TrailTurn[] = []
    for (let i = 0; i < this.order.length; i += 1) {
      const materialized = this.frozen[i]
      if (materialized !== null) {
        out.push(materialized)
        continue
      }
      const builder = this.builders.get(this.order[i])
      if (builder === undefined) continue
      out.push(this.materializeTurn(builder, i))
    }
    // Trailing user messages that never found a turn.
    let counter = this.order.length
    for (const pending of this.pendingUser) {
      const builder = newBuilder(null)
      builder.input = pending.text
      builder.inputSeq = pending.seq
      appendItem(builder, { kind: 'input', seq: pending.seq, text: pending.text, preview: compact(pending.text) })
      out.push(finishBuilder(builder, counter, pending.seq))
      counter += 1
    }
    return out
  }

  /** Incrementally maintained step statistics (total / failed / by-tool). */
  stats(): TrailStats {
    const tools = [...this.byTool.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
    return { total: this.total, failed: this.failed, tools }
  }

  // ── turn-mode application (mirrors foldTurns' switch verbatim) ─────────

  private builderOf(turn: number): Builder {
    let builder = this.builders.get(turn)
    if (builder === undefined) {
      builder = newBuilder(turn)
      builder.position = this.order.length
      this.builders.set(turn, builder)
      this.order.push(turn)
      this.frozen.push(null)
    }
    return builder
  }

  private markDirty(builder: Builder): void {
    if (this.mode === 'user') {
      if (builder === this.userActive) this.userActiveTurn = null
      return
    }
    const position = builder.position
    if (position !== undefined && position >= 0 && position < this.frozen.length) {
      this.frozen[position] = null
    }
  }

  private addStep(builder: Builder, item: TurnItem & { kind: 'tool' }): void {
    appendItem(builder, item)
    this.total += 1
    if (item.step.kind === 'error') this.failed += 1
    else this.byTool.set(item.step.name, (this.byTool.get(item.step.name) ?? 0) + 1)
    this.markDirty(builder)
  }

  private materializeTurn(builder: Builder, position: number): TrailTurn {
    const boundarySeq = builder.startSeq !== null ? builder.startSeq : (builder.inputSeq ?? firstItemSeq(builder.items))
    const materialized = finishBuilder(builder, position, boundarySeq)
    this.frozen[position] = materialized
    return materialized
  }

  private applyTurnEvent(type: string, data: Record<string, unknown>, seq: number, time?: number): void {
    switch (type) {
      case 'turn/start': {
        const raw = data.turn
        if (typeof raw !== 'number') break
        const builder = this.builderOf(raw)
        if (builder.startSeq === null) builder.startSeq = seq
        if (builder.startedAt === undefined) builder.startedAt = time
        for (const pending of this.pendingUser.splice(0)) {
          builder.input = pending.text
          builder.inputSeq = pending.seq
          builder.items.unshift({ kind: 'input', seq: pending.seq, text: pending.text, preview: compact(pending.text) })
        }
        this.current = builder
        this.markDirty(builder)
        break
      }
      case 'turn/end': {
        const raw = data.turn
        const target = typeof raw === 'number' ? this.builderOf(raw) : this.current
        if (target !== null) {
          target.endSeq = seq
          target.endedAt = time
          this.current = null
          this.markDirty(target)
        }
        break
      }
      case 'user/message': {
        const preview = contentPreview(data.content)
        if (preview.length === 0) break
        const kind = sourceKindOf({ type, seq, data }, data)
        const text = typeof data.content === 'string'
          ? data.content
          : (typeof data.message === 'object' && data.message !== null
            && typeof (data.message as { content?: unknown }).content === 'string'
            ? (data.message as { content: string }).content
            : preview)
        if (kind === 'user') {
          if (this.current === null) {
            this.pendingUser.push({ seq, text })
          } else {
            this.current.input = text
            this.current.inputSeq = seq
            appendItem(this.current, { kind: 'input', seq, text, preview })
            this.markDirty(this.current)
          }
        } else if (this.current !== null) {
          this.current.contexts.push({ seq, text, preview })
          this.markDirty(this.current)
        }
        break
      }
      case 'assistant/message': {
        const message = data.message !== null && typeof data.message === 'object' ? data.message : {}
        const content = typeof (message as { content?: unknown }).content !== 'undefined'
          ? (message as { content: unknown }).content
          : data.content
        const text = lastTextBlock(content)
        if (text.length === 0) break
        if (this.current !== null) {
          this.current.output = text
          this.current.outputSeq = seq
          appendItem(this.current, { kind: 'output', seq, text, preview: compact(text) })
          this.markDirty(this.current)
        }
        break
      }
      case 'tool/call': {
        if (this.current === null) break
        const name = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'tool'
        const args = typeof data.arguments === 'string' && data.arguments.length > 0 ? data.arguments : ''
        const step: TrailStep = {
          kind: 'tool',
          seq,
          name,
          argsPreview: compact(args),
          callId: toolCallIdOf(data),
          error: '',
        }
        this.addStep(this.current, { kind: 'tool', step })
        break
      }
      case 'tool/result': {
        const error = (data.error !== null && typeof data.error === 'object' ? data.error : null) as {
          name?: unknown
          code?: unknown
        } | null
        if (error === null) break
        if (this.current === null) break
        const name = typeof error.name === 'string' && error.name.length > 0 ? error.name : 'tool'
        const detail = typeof error.code === 'string' && error.code.length > 0 ? ` · ${error.code}` : ''
        const step: TrailStep = {
          kind: 'error',
          seq,
          name,
          argsPreview: '',
          callId: toolCallIdOf(data),
          error: compact(`${name}${detail}`),
        }
        this.addStep(this.current, { kind: 'tool', step })
        break
      }
      case 'compaction/summary': {
        const preview = contentPreview(data.summary)
        if (preview.length === 0) break
        if (this.current !== null) {
          appendItem(this.current, { kind: 'compaction', seq, preview })
          this.markDirty(this.current)
        }
        break
      }
      default:
        // command/run and anything else: ignored (mirrors the trajectory view).
        break
    }
  }

  // ── user-mode application (mirrors foldByUserBoundaries verbatim) ───────

  private closeUserTurn(): void {
    if (this.userActive === null) return
    this.userClosed.push(finishUserTurn(this.userActive, this.userCounter))
    this.userCounter += 1
    this.userActive = null
    this.userActiveTurn = null
  }

  private applyUserEvent(type: string, data: Record<string, unknown>, seq: number, time?: number): void {
    if (type === 'user/message') {
      const kind = sourceKindOf({ type, seq, data }, data)
      if (kind !== 'user') return
      this.closeUserTurn()
      const text = typeof data.content === 'string' ? data.content : contentPreview(data.content)
      if (text.length === 0) return
      const builder = newBuilder(null)
      builder.startSeq = seq
      builder.startedAt = time
      builder.input = text
      builder.inputSeq = seq
      appendItem(builder, { kind: 'input', seq, text, preview: compact(text) })
      this.userActive = builder
      this.userActiveTurn = null
      return
    }
    if (this.userActive === null) return
    if (type === 'assistant/message') {
      const message = data.message !== null && typeof data.message === 'object' ? data.message : {}
      const text = lastTextBlock((message as { content?: unknown }).content ?? data.content)
      if (text.length === 0) return
      this.userActive.output = text
      this.userActive.outputSeq = seq
      appendItem(this.userActive, { kind: 'output', seq, text, preview: compact(text) })
      this.userActiveTurn = null
      return
    }
    if (type === 'tool/call') {
      const name = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'tool'
      const args = typeof data.arguments === 'string' && data.arguments.length > 0 ? data.arguments : ''
      const step: TrailStep = {
        kind: 'tool',
        seq,
        name,
        argsPreview: compact(args),
        callId: toolCallIdOf(data),
        error: '',
      }
      this.addStep(this.userActive, { kind: 'tool', step })
      return
    }
    if (type === 'tool/result') {
      const error = (data.error !== null && typeof data.error === 'object' ? data.error : null) as {
        name?: unknown
        code?: unknown
      } | null
      if (error === null) return
      const name = typeof error.name === 'string' && error.name.length > 0 ? error.name : 'tool'
      const detail = typeof error.code === 'string' && error.code.length > 0 ? ` · ${error.code}` : ''
      const step: TrailStep = {
        kind: 'error',
        seq,
        name,
        argsPreview: '',
        callId: toolCallIdOf(data),
        error: compact(`${name}${detail}`),
      }
      this.addStep(this.userActive, { kind: 'tool', step })
      return
    }
    // compaction & anything else: foldByUserBoundaries ignores them.
  }

  /**
   * A turn/start arrived after user-boundary turns were folded. Reconstruct
   * what a from-scratch turn-mode fold of the consumed prefix would hold:
   * every user input becomes a pending input (in arrival order), and the
   * pre-turn outputs / tool steps are dropped — turn-mode replay attaches
   * nothing while no turn is open. Statistics reset accordingly.
   */
  private flipToTurnMode(): void {
    const pending: Array<{ seq: number; text: string }> = []
    const take = (turn: TrailTurn): void => {
      for (const item of turn.items) {
        if (item.kind === 'input') {
          pending.push({ seq: item.seq, text: item.text })
          return
        }
      }
    }
    for (const turn of this.userClosed) take(turn)
    // Read the active builder directly: it may never have been snapshot()'d.
    if (this.userActive !== null && this.userActive.inputSeq !== null) {
      pending.push({ seq: this.userActive.inputSeq, text: this.userActive.input })
    }
    this.userClosed.length = 0
    this.userActive = null
    this.userActiveTurn = null
    this.userCounter = 0
    this.pendingUser.length = 0
    this.pendingUser.push(...pending)
    this.total = 0
    this.failed = 0
    this.byTool.clear()
    this.mode = 'turn'
  }
}
