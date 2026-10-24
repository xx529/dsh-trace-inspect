/**
 * trail-model.ts — pure event → turn folding for dsh-trace-inspect.
 *
 * Framework-agnostic (no React / DOM / Node): a single foldTurns() maps a
 * session event stream onto per-user-turn summaries:
 *
 *   turn boundary   = `turn/start .. turn/end` (the `data.turn` number is the
 *                     turn identity — stable under parallel steps / steering).
 *   input           = first `user/message` with source.kind === 'user'.
 *   context rows    = `steering` / `context` user messages (kept as grey rows).
 *   tool steps      = `tool/call` (+ `tool/result` error rows); every
 *                     `tool/result` is folded onto its step as TrailResult
 *                     content (append merges by seq / surfaceOp replace).
 *   orphan results  = `tool/result` with no matching `tool/call` → placeholder
 *                     row (`orphan: true`) instead of being dropped.
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
  /**
   * Surface bookkeeping, forwarded verbatim on the EVENT (not inside `data`)
   * by the host projection — the same place real session logs put it
   * (session.v4.jsonl.zstd seq 182/183). `{op:'replace',startSeq,endSeq}` or
   * the `'append'` tag.
   */
  surfaceOp?: unknown
  /** Seqs the surface operation refers to (host pass-through, unused by the fold). */
  sourceEventSeqs?: number[]
}

export type TurnItem =
  | { kind: 'input'; seq: number; text: string; preview: string }
  | { kind: 'tool'; step: TrailStep }
  | { kind: 'output'; seq: number; text: string; preview: string }
  | { kind: 'compaction'; seq: number; preview: string }

/** One image block of a tool result (no URL is fetched; the UI renders a chip). */
export interface TrailResultImage {
  attachmentId: string
  mediaType: string
  bytes: number
  width?: number
  height?: number
  name?: string
}

/** The folded result content of one tool step. */
export interface TrailResult {
  /** Seq of the tool/result event producing/appending this content (a replace switches it to the replace event's seq). */
  seq: number
  kind: 'text' | 'image' | 'mixed' | 'error'
  /** Final text: append segments merged by seq (or the replace content once replaced). */
  text: string
  images?: TrailResultImage[]
  truncated: boolean
  isError: boolean
  errorName?: string
  errorCode?: string
  /** Seq of the replace event that covered this content (debug + UI hint). */
  replacedBy?: number
  /** Start of the replaced range (= surfaceOp.startSeq). */
  replacedFrom?: number
  /**
   * tool/result events merged into this content: every append segment adds 1,
   * a surfaceOp replace resets it to 1 (the replace is itself one event), and
   * the first attach is 1. `> 1` with no `replacedBy` means the events never
   * declared a merge intent (the v1.0 "both surfaceOp fields lost" gap, §9.5).
   */
  mergedFrom?: number
}

export interface TrailStep {
  kind: 'tool' | 'error'
  seq: number
  name: string
  argsPreview: string
  /** Full arguments as delivered by the wire (may still be ARGS_CAP-clipped). */
  args?: string
  argsTruncated?: boolean
  argsBytes?: number
  callId: string | null
  error: string
  errorCode?: string
  result?: TrailResult
  /** No matching tool/call was found for this result (orphan placeholder row). */
  orphan?: boolean
  /**
   * Assistant step that issued this call: `tool/call.data.turn`. The wire
   * forwards it verbatim (wire.ts tool/call `turn`); logs that predate the
   * field leave it undefined, and the UI then shows no parallelism.
   *
   * Two or more tool calls sharing the same `turn` + `step` are one model
   * step's tool-call batch — the assistant response contained several tool
   * calls at once. DSH schedules that batch through its tool-call scheduler
   * (parallel pool for concurrency-safe tools, exclusive barriers otherwise),
   * so the batch is the trace-visible unit of "parallel tool calls".
   */
  turn?: number
  /** Assistant step index inside the turn: `tool/call.data.step`. */
  step?: number
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

// ── Parallel tool-call batches (assistant step grouping) ─────────────────
//
// DSH journals every model step as `tool/call` events carrying `{turn, step}`;
// step = one assistant response. A response that emits several tool calls
// yields several `tool/call` events with the SAME `{turn, step}` — the
// trace-visible evidence that these calls were requested together (the loop
// then schedules the batch: a parallel pool for concurrency-safe tools, an
// exclusive barrier for the rest). The helpers below group consecutive
// folded steps by that identity for the panel; they never guess from
// adjacency or timing, so logs without `step` simply show no groups.

/** One run of consecutive tool steps issued in the same assistant step. */
export interface TrailParallelGroup {
  /** Stable React key: identity + first call seq (unique per contiguous run). */
  key: string
  turn: number
  step: number
  /** The run's steps, in journaled (model) order; always length >= 2. */
  steps: TrailStep[]
}

/** A filtered item list split into single items and parallel batches. */
export type TrailGroupedItem =
  | { kind: 'item'; item: TurnItem }
  | { kind: 'group'; group: TrailParallelGroup }

/** The assistant-step identity of one step, or null when it must not group. */
function assistantStepOf(step: TrailStep): { turn: number; step: number } | null {
  if (step.kind !== 'tool') return null
  if (step.orphan === true) return null
  if (typeof step.turn !== 'number' || typeof step.step !== 'number') return null
  if (!Number.isFinite(step.turn) || !Number.isFinite(step.step)) return null
  return { turn: step.turn, step: step.step }
}

/**
 * Runs of >= 2 consecutive tool steps sharing `{turn, step}`, in list order.
 * A non-tool item (assistant output / compaction / error row) breaks a run;
 * so does a different assistant step. Single-call steps yield no group.
 *
 * `items` is expected to be the TURN's item list (or a filtered subset): only
 * list order and step identity participate, never absolute turn numbers.
 */
export function parallelGroupsOf(items: readonly TurnItem[]): TrailParallelGroup[] {
  const groups: TrailParallelGroup[] = []
  let run: TrailStep[] = []
  let identity: { turn: number; step: number } | null = null

  const flush = (): void => {
    if (identity !== null && run.length >= 2) {
      groups.push({
        key: `parallel:${identity.turn}:${identity.step}:${run[0].seq}`,
        turn: identity.turn,
        step: identity.step,
        steps: run,
      })
    }
    run = []
    identity = null
  }

  for (const item of items) {
    if (item.kind !== 'tool') {
      flush()
      continue
    }
    const step = assistantStepOf(item.step)
    if (step === null) {
      flush()
      continue
    }
    if (identity !== null && (identity.turn !== step.turn || identity.step !== step.step)) flush()
    identity = step
    run.push(item.step)
  }
  flush()
  return groups
}

/**
 * Split a filtered item list into render entries: consecutive calls of one
 * assistant step become one `group` entry, everything else stays an `item`.
 * Group keys are unique per contiguous run, so a run cut by slicing renders
 * as its own (smaller) group instead of colliding with the other half.
 */
export function groupParallelItems(items: readonly TurnItem[]): TrailGroupedItem[] {
  const byFirstSeq = new Map<number, TrailParallelGroup>()
  for (const group of parallelGroupsOf(items)) byFirstSeq.set(group.steps[0].seq, group)
  const out: TrailGroupedItem[] = []
  let index = 0
  while (index < items.length) {
    const item = items[index]
    if (item.kind === 'tool') {
      const group = byFirstSeq.get(item.step.seq)
      if (group !== undefined) {
        out.push({ kind: 'group', group })
        index += group.steps.length
        continue
      }
    }
    out.push({ kind: 'item', item })
    index += 1
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

// ── tool/result content model (segment table) ────────────────────────────
//
// A step's result content is kept as a small "segment table" keyed by the seq
// of the tool/result event that produced it, plus the replace marks seen for
// that step. The public TrailResult is rebuilt from the table in ascending seq
// order, so the outcome never depends on the order events are consumed in: a
// replace may be consumed before, or after, the append it covers.
//
// Verified against a real session log (session-8b8489a4…/session.v4.jsonl.zstd
// seq 182/183): a surface compact-replace carries its text in
// `data.message.content[].text`, its `surfaceOp.startSeq/endSeq` point at the
// replaced `tool/result` seq (20/22), NOT at the `tool/call` seq. The seqIndex
// therefore registers both the tool/call seq and every tool/result seq.

interface StepRef {
  builder: Builder
  step: TrailStep
}

/** One content contribution of a tool/result event. */
interface Segment {
  seq: number
  text: string
  images: TrailResultImage[]
  truncated: boolean
  isError: boolean
  errorName?: string
  errorCode?: string
}

/** A surfaceOp replace mark: seq is the replacing event, [from,to] selected the steps. */
interface ReplaceMark {
  seq: number
  from: number
  to: number
}

interface StepContent {
  segments: Map<number, Segment>
  replaces: Map<number, ReplaceMark>
}

type SurfaceOp = { op: 'append' } | { op: 'replace'; startSeq: number; endSeq: number }

interface ContentBits {
  text: string
  images: TrailResultImage[]
  truncated: boolean
  isError: boolean
  errorName?: string
  errorCode?: string
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

/** tool/result content value: wire `data.content`, else the raw `data.message.content`. */
function rawResultContent(data: Record<string, unknown>): unknown {
  const direct = data.content
  if (typeof direct === 'string' || Array.isArray(direct)) return direct
  const message = record(data.message)
  if (message !== null) {
    const nested = message.content
    if (typeof nested === 'string' || Array.isArray(nested)) return nested
  }
  return undefined
}

/** Merge the text blocks of one content value, in order (empty blocks skipped). */
function resultText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  const parts: string[] = []
  for (const block of content) {
    const b = record(block)
    if (b === null || b.type !== 'text' || typeof b.text !== 'string' || b.text.length === 0) continue
    parts.push(b.text)
  }
  return parts.join('\n')
}

function resultImages(content: unknown): TrailResultImage[] {
  if (!Array.isArray(content)) return []
  const out: TrailResultImage[] = []
  for (const block of content) {
    const b = record(block)
    if (b === null || b.type !== 'image') continue
    const attachment = record(b.attachment)
    if (attachment === null) continue
    if (typeof attachment.attachmentId !== 'string' || attachment.attachmentId.length === 0) continue
    const image: TrailResultImage = {
      attachmentId: attachment.attachmentId,
      mediaType: typeof attachment.mediaType === 'string' ? attachment.mediaType : '',
      bytes: typeof attachment.bytes === 'number' && Number.isFinite(attachment.bytes) ? attachment.bytes : 0,
    }
    if (typeof attachment.width === 'number') image.width = attachment.width
    if (typeof attachment.height === 'number') image.height = attachment.height
    if (typeof attachment.name === 'string') image.name = attachment.name
    out.push(image)
  }
  return out
}

/** Content + error flags delivered by one tool/result projection. */
function resultContentOf(data: Record<string, unknown>): ContentBits {
  const content = rawResultContent(data)
  const message = record(data.message)
  const isError = data.isError === true || (message !== null && message.isError === true)
  return {
    text: resultText(content),
    images: resultImages(content),
    truncated: data.contentTruncated === true,
    isError,
  }
}

/**
 * surfaceOp pass-through shape; anything non-conforming is treated as an
 * append. The host projects `surfaceOp` onto the EVENT (`event.surfaceOp`);
 * `data.surfaceOp` is accepted too so raw/replayed logs fold identically.
 */
function parseSurfaceOp(raw: unknown): SurfaceOp {
  if (raw === 'append') return { op: 'append' }
  const op = record(raw)
  if (op !== null) {
    if (
      op.op === 'replace'
      && typeof op.startSeq === 'number' && Number.isFinite(op.startSeq)
      && typeof op.endSeq === 'number' && Number.isFinite(op.endSeq)
    ) {
      return { op: 'replace', startSeq: op.startSeq, endSeq: op.endSeq }
    }
    if (op.op === 'append') return { op: 'append' }
  }
  return { op: 'append' }
}

/** Prefer the event-level surfaceOp (host projection), fall back to data. */
function surfaceOpOf(eventSurfaceOp: unknown, data: Record<string, unknown>): SurfaceOp {
  return parseSurfaceOp(eventSurfaceOp !== undefined ? eventSurfaceOp : data.surfaceOp)
}

function segmentOf(seq: number, bits: ContentBits): Segment {
  return {
    seq,
    text: bits.text,
    images: bits.images,
    truncated: bits.truncated,
    isError: bits.isError,
    ...(bits.errorName !== undefined ? { errorName: bits.errorName } : {}),
    ...(bits.errorCode !== undefined ? { errorCode: bits.errorCode } : {}),
  }
}

/**
 * Rebuild `step.result` from its segment table, in ascending seq order:
 * append segments merge; a replace mark rewrites the WHOLE content of its step
 * — every segment produced before the replace (seq < mark.seq) is dropped and
 * the replacement segment survives. Order-independent by construction (marks
 * and segments are sorted by seq, so a replace consumed before the append it
 * covers rebuilds identically).
 */
function rebuildResult(step: TrailStep, content: StepContent): void {
  const entries: Array<{ seq: number; seg?: Segment; rep?: ReplaceMark }> = []
  for (const seg of content.segments.values()) entries.push({ seq: seg.seq, seg })
  for (const rep of content.replaces.values()) entries.push({ seq: rep.seq, rep })
  // A replace event contributes both a mark and its replacement segment at the
  // same seq: apply the segment first, then the mark.
  entries.sort((a, b) => (a.seq - b.seq) || ((a.seg !== undefined ? 0 : 1) - (b.seg !== undefined ? 0 : 1)))

  const live = new Map<number, Segment>()
  let replacedBy: number | undefined
  let replacedFrom: number | undefined
  for (const entry of entries) {
    if (entry.seg !== undefined) {
      live.set(entry.seg.seq, entry.seg)
      continue
    }
    const rep = entry.rep as ReplaceMark
    for (const key of [...live.keys()]) {
      if (key < rep.seq) live.delete(key)
    }
    if (replacedBy === undefined || rep.seq > replacedBy) {
      replacedBy = rep.seq
      replacedFrom = rep.from
    }
  }

  const ordered = [...live.values()].sort((a, b) => a.seq - b.seq)
  const text = ordered.map((seg) => seg.text).join('')
  const images: TrailResultImage[] = []
  const seen = new Set<string>()
  for (const seg of ordered) {
    for (const image of seg.images) {
      if (seen.has(image.attachmentId)) continue
      seen.add(image.attachmentId)
      images.push(image)
    }
  }
  const top = ordered.length > 0 ? ordered[ordered.length - 1] : undefined
  const isError = top !== undefined && top.isError
  const truncated = ordered.some((seg) => seg.truncated)
  let seq = step.seq
  for (const key of content.segments.keys()) {
    if (key > seq) seq = key
  }
  const kind: TrailResult['kind'] = isError
    ? 'error'
    : text.length > 0 && images.length > 0
      ? 'mixed'
      : text.length === 0 && images.length > 0
        ? 'image'
        : 'text'
  const result: TrailResult = {
    seq,
    kind,
    text,
    truncated,
    isError,
    mergedFrom: ordered.length,
    ...(images.length > 0 ? { images } : {}),
    ...(isError && top !== undefined && top.errorName !== undefined ? { errorName: top.errorName } : {}),
    ...(isError && top !== undefined && top.errorCode !== undefined ? { errorCode: top.errorCode } : {}),
    ...(replacedBy !== undefined ? { replacedBy } : {}),
    ...(replacedFrom !== undefined ? { replacedFrom } : {}),
  }
  step.result = result
}

/**
 * Shared tool/call + tool/result application for both fold implementations:
 * foldTurns passes no-op callbacks, TrailFolder wires addStep/markDirty so the
 * incremental snapshot stays identical to the batch fold while reusing the
 * frozen turn objects (every write to an existing step nulls its frozen slot).
 */
class ResultIndex {
  private readonly byCallId = new Map<string, StepRef>()
  private readonly seqIndex = new Map<number, StepRef>()
  private contents = new WeakMap<TrailStep, StepContent>()

  constructor(
    private readonly addStep: (builder: Builder, step: TrailStep) => void,
    private readonly markDirty: (builder: Builder) => void,
  ) {}

  /** Drop every registration (used when the folder flips from user mode). */
  reset(): void {
    this.byCallId.clear()
    this.seqIndex.clear()
    this.contents = new WeakMap<TrailStep, StepContent>()
  }

  /** Register an already-built step under callId and seq. */
  register(callId: string | null, seq: number, ref: StepRef): void {
    if (callId !== null) this.byCallId.set(callId, ref)
    this.seqIndex.set(seq, ref)
  }

  /** tool/call → build the step (full args) and register callId + seq. */
  applyToolCall(builder: Builder, data: Record<string, unknown>, seq: number): void {
    const name = typeof data.name === 'string' && data.name.length > 0 ? data.name : 'tool'
    const args = typeof data.arguments === 'string' && data.arguments.length > 0 ? data.arguments : ''
    const callId = toolCallIdOf(data)
    const step: TrailStep = {
      kind: 'tool',
      seq,
      name,
      argsPreview: compact(args),
      args,
      argsTruncated: data.argsTruncated === true,
      argsBytes: typeof data.argsBytes === 'number' && Number.isFinite(data.argsBytes) ? data.argsBytes : args.length,
      callId,
      error: '',
      ...(typeof data.turn === 'number' ? { turn: data.turn } : {}),
      ...(typeof data.step === 'number' ? { step: data.step } : {}),
    }
    this.addStep(builder, step)
    this.register(callId, seq, { builder, step })
  }

  /** tool/result → error rows keep v0.3.1 behavior; success results merge by surfaceOp. */
  applyToolResult(
    current: Builder | null,
    data: Record<string, unknown>,
    seq: number,
    eventSurfaceOp?: unknown,
  ): void {
    const callId = toolCallIdOf(data)
    const error = record(data.error)

    if (error !== null) {
      if (current === null) return
      const errorName = typeof error.name === 'string' && error.name.length > 0 ? error.name : 'tool'
      const errorCode = typeof error.code === 'string' && error.code.length > 0 ? error.code : undefined
      const detail = errorCode !== undefined ? ` · ${errorCode}` : ''
      const step: TrailStep = {
        kind: 'error',
        seq,
        name: errorName,
        argsPreview: '',
        args: '',
        argsTruncated: false,
        argsBytes: 0,
        callId,
        error: compact(`${errorName}${detail}`),
        ...(errorCode !== undefined ? { errorCode } : {}),
        ...(typeof data.turn === 'number' ? { turn: data.turn } : {}),
        ...(typeof data.step === 'number' ? { step: data.step } : {}),
      }
      this.addStep(current, step)
      const bits: ContentBits = {
        ...resultContentOf(data),
        isError: true,
        errorName,
        ...(errorCode !== undefined ? { errorCode } : {}),
      }
      this.applyContent(current, step, seq, bits)
      // The error row owns the result seq; an existing tool step keeps callId.
      this.seqIndex.set(seq, { builder: current, step })
      if (callId !== null && !this.byCallId.has(callId)) this.byCallId.set(callId, { builder: current, step })
      return
    }

    // A surface replace is resolved through seqIndex, NOT through the open
    // turn: in real logs the compact-replace of turn N's result arrives while
    // turn N+1 is running (session.v4.jsonl.zstd seq 182/183 replaces seq
    // 20/22 of turn 1 after turn 1 ended), so it must apply with `current`
    // null as well — that is exactly the frozen-slot case markDirty covers.
    const surfaceOp = surfaceOpOf(eventSurfaceOp, data)
    const bits = resultContentOf(data)

    if (surfaceOp.op === 'replace') {
      const targets: StepRef[] = []
      const seen = new Set<TrailStep>()
      for (const [key, ref] of this.seqIndex) {
        if (key < surfaceOp.startSeq || key > surfaceOp.endSeq) continue
        if (seen.has(ref.step)) continue
        seen.add(ref.step)
        targets.push(ref)
      }
      if (targets.length === 0 && callId !== null) {
        const hit = this.byCallId.get(callId)
        if (hit !== undefined) targets.push(hit)
      }
      // Unresolvable replace (truncated window): ignored, never orphaned.
      if (targets.length === 0) return
      for (const target of targets) {
        this.applyContent(target.builder, target.step, seq, bits, surfaceOp)
        this.seqIndex.set(seq, target)
        if (callId !== null && !this.byCallId.has(callId)) this.byCallId.set(callId, target)
      }
      return
    }

    // v0.3.1 keeps dropping non-replace results that arrive with no open turn.
    if (current === null) return

    const hit = callId !== null ? this.byCallId.get(callId) : undefined
    if (hit !== undefined) {
      this.applyContent(hit.builder, hit.step, seq, bits)
      this.seqIndex.set(seq, hit)
      return
    }

    // Orphan result: no matching tool/call — still a placeholder row.
    const step: TrailStep = {
      kind: 'tool',
      seq,
      name: 'tool',
      argsPreview: '',
      args: '',
      argsTruncated: false,
      argsBytes: 0,
      callId,
      error: '',
      orphan: true,
    }
    this.addStep(current, step)
    this.applyContent(current, step, seq, bits)
    this.register(callId, seq, { builder: current, step })
  }

  private applyContent(
    builder: Builder,
    step: TrailStep,
    seq: number,
    bits: ContentBits,
    surfaceOp?: SurfaceOp,
  ): void {
    let state = this.contents.get(step)
    if (state === undefined) {
      state = { segments: new Map<number, Segment>(), replaces: new Map<number, ReplaceMark>() }
      this.contents.set(step, state)
    }
    if (surfaceOp !== undefined && surfaceOp.op === 'replace') {
      state.replaces.set(seq, { seq, from: surfaceOp.startSeq, to: surfaceOp.endSeq })
      // F7 (contract §11.2): a compact-replace rewrites the RESULT only. The
      // tool arguments are the call's own fact (the compaction plugin never
      // touches tool/call), so args / argsPreview / argsBytes / argsTruncated
      // keep the original call verbatim — the row preview stays the command.
    }
    state.segments.set(seq, segmentOf(seq, bits))
    rebuildResult(step, state)
    this.markDirty(builder)
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
  const results = new ResultIndex(
    (builder, step) => { appendItem(builder, { kind: 'tool', step }) },
    () => {},
  )

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
        results.applyToolCall(current, data, seq)
        break
      }
      case 'tool/result': {
        results.applyToolResult(current, data, seq, event.surfaceOp)
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
  const results = new ResultIndex(
    (target, step) => { appendItem(target, { kind: 'tool', step }) },
    () => {},
  )

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
      results.applyToolCall(builder, data, seq)
      continue
    }
    if (event.type === 'tool/result') {
      results.applyToolResult(builder, data, seq, event.surfaceOp)
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
  /** Builders of the closed user-mode turns, so a late write can re-materialize. */
  private readonly userClosedBuilders: Builder[] = []
  private userActive: Builder | null = null
  private userActiveTurn: TrailTurn | null = null
  private userCounter = 0

  private lastSeq = -1
  private total = 0
  private failed = 0
  private readonly byTool = new Map<string, number>()

  /**
   * Shared tool/call + tool/result application. addStep keeps the incremental
   * stats in sync with a batch re-fold; markDirty nulls the frozen slot of the
   * owning turn, so a replace that rewrites an already-frozen step forces React
   * to re-render the reused turn object.
   */
  private readonly results = new ResultIndex(
    (builder, step) => { this.addStep(builder, { kind: 'tool', step }) },
    (builder) => { this.markDirty(builder) },
  )

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
      this.applyTurnEvent(event.type, data, seq, time, event.surfaceOp)
      return
    }
    if (this.mode === 'user') {
      if (event.type === 'turn/start' && typeof data.turn === 'number') {
        this.flipToTurnMode()
        this.applyTurnEvent(event.type, data, seq, time, event.surfaceOp)
      } else {
        this.applyUserEvent(event.type, data, seq, time, event.surfaceOp)
      }
      return
    }
    // mode 'unknown': commit on the first mode-discriminating event.
    if (event.type === 'turn/start' && typeof data.turn === 'number') {
      this.mode = 'turn'
      this.applyTurnEvent(event.type, data, seq, time, event.surfaceOp)
      return
    }
    if (event.type === 'user/message' && sourceKindOf(event, data) === 'user') {
      this.mode = 'user'
      this.applyUserEvent(event.type, data, seq, time, event.surfaceOp)
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
      // A closed user-mode turn was materialized once and is reused by
      // snapshot(); re-materialize it so a late replace is visible to React.
      const closedAt = this.userClosedBuilders.indexOf(builder)
      if (closedAt >= 0) {
        this.userClosed[closedAt] = finishUserTurn(builder, closedAt)
        return
      }
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

  private applyTurnEvent(
    type: string,
    data: Record<string, unknown>,
    seq: number,
    time?: number,
    surfaceOp?: unknown,
  ): void {
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
        this.results.applyToolCall(this.current, data, seq)
        break
      }
      case 'tool/result': {
        this.results.applyToolResult(this.current, data, seq, surfaceOp)
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
    this.userClosedBuilders.push(this.userActive)
    this.userCounter += 1
    this.userActive = null
    this.userActiveTurn = null
  }

  private applyUserEvent(
    type: string,
    data: Record<string, unknown>,
    seq: number,
    time?: number,
    surfaceOp?: unknown,
  ): void {
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
      this.results.applyToolCall(this.userActive, data, seq)
      return
    }
    if (type === 'tool/result') {
      this.results.applyToolResult(this.userActive, data, seq, surfaceOp)
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
    this.userClosedBuilders.length = 0
    this.userActive = null
    this.userActiveTurn = null
    this.userCounter = 0
    this.pendingUser.length = 0
    this.pendingUser.push(...pending)
    this.total = 0
    this.failed = 0
    this.byTool.clear()
    this.results.reset()
    this.mode = 'turn'
  }
}
