/**
 * wire.ts — host-side response shaping for POST /trace-inspect/api/events.
 *
 * The client fold needs a bounded, typed subset of each event. Every response
 * event is projected to that subset BEFORE serialization, so the wire (and the
 * client's retained state) never carries unbounded message text, reasoning
 * blocks, or an entire multi-megabyte tool result.
 *
 * Projection is idempotent and lossless for the fold's needs:
 *   - `seq` / `type` / `time` are always preserved (the seq watermark and turn
 *     identity ride on them).
 *   - `surfaceOp` / `sourceEventSeqs` are passed through verbatim on EVERY
 *     event type (the fold replays append/replace bookkeeping from them).
 *   - text fields are clipped to TEXT_CAP; injected context messages (a
 *     `user/message` whose source is not `user`) to CONTEXT_CAP; tool
 *     arguments to ARGS_CAP and each tool-result text block to RESULT_CAP.
 *   - an injected message's `source` keeps the fields the panel renders:
 *     `form`, `sections`, `name`, `changes[].path`, `references[].label`.
 *   - `tool/call` carries the (clipped) full arguments plus argsBytes /
 *     argsTruncated, so the detail panel can render them without another trip.
 *   - `tool/result` message content is projected onto ordered blocks: text
 *     blocks (clipped, empty ones skipped) and image blocks (placeholder
 *     metadata only — no URL, no base64). The raw `message.content` array
 *     itself is never forwarded.
 */
import type { SessionEventLike } from './context-types'

/** Max characters carried per text field (input / output / summary). */
export const TEXT_CAP = 2048

/**
 * Max characters carried for one injected context message (v0.10.50).
 *
 * A context injection is material the model itself read (a skill catalog, an
 * instruction file, a runtime snapshot), so clipping it at TEXT_CAP truncated
 * the row mid-sentence and hid everything after 2 KiB. It is still bounded —
 * the page budget (`PAGE_BUDGET_BYTES`) protects the wire.
 */
export const CONTEXT_CAP = 64 * 1024

/** Max characters of tool-call arguments (the detail panel shows them in full). */
export const ARGS_CAP = 32768

/** Max characters per tool-result text block (the detail panel's result tab). */
export const RESULT_CAP = 32768

/** Max events per response page; the client loops while `hasMore` is true. */
export const PAGE_SIZE = 2000

/** Max serialized bytes per response page; one event is always delivered. */
export const PAGE_BUDGET_BYTES = 2 * 1024 * 1024

/** Hard body cap for the route's request payload. */
export const MAX_BODY_BYTES = 64 * 1024

/**
 * One image block of a tool result. Structural twin of trail-model's
 * `TrailResultImage` (contract §3) — kept local so the two workstreams compile
 * independently; `bytes` is optional HERE because the wire only carries the
 * fields the source event actually provides.
 */
export interface WireResultImage {
  attachmentId: string
  mediaType: string
  bytes?: number
  width?: number
  height?: number
  name?: string
}

/** One projected tool-result content block, in the source order. */
export type WireResultBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; attachment: WireResultImage }

function clipText(value: string, cap: number): string {
  return value.length > cap ? `${value.slice(0, cap)}…` : value
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

/**
 * Project one content value (bare string or block array) onto the fold's
 * needs: clipped text, or a text-blocks-only array. Returns undefined when
 * nothing foldable survives (the fold then treats the field as absent,
 * which matches its behavior for empty/non-text content).
 *
 * Fold-facing text fields (user/assistant messages) stay text-only; the
 * tool-result content path uses `projectResultContent` below.
 */
function projectContent(content: unknown, cap: number): string | Array<{ type: 'text'; text: string }> | undefined {
  if (typeof content === 'string') return content.length > 0 ? clipText(content, cap) : undefined
  if (!Array.isArray(content)) return undefined
  const out: Array<{ type: 'text'; text: string }> = []
  for (const block of content) {
    const b = record(block)
    if (b === undefined || b.type !== 'text' || typeof b.text !== 'string' || b.text.length === 0) continue
    out.push({ type: 'text', text: clipText(b.text, cap) })
  }
  return out.length > 0 ? out : undefined
}

/**
 * Project a tool result's message content onto ordered wire blocks.
 *
 *   - text block: empty strings are skipped; kept text is clipped to `cap`.
 *   - image block: needs a non-empty string `attachmentId` AND `mediaType`
 *     (trail-model's TrailResultImage requires both); `bytes` / `width` /
 *     `height` / `name` ride along only when the source provides them.
 *   - order is preserved; an empty result (no surviving block) returns
 *     undefined, which the caller maps to "no `content` field".
 *
 * `bytes` is the sum of the PRE-clip character counts of every kept text
 * block; `truncated` is true when any text block was clipped.
 */
function projectResultContent(
  content: unknown,
  cap: number,
): { blocks: WireResultBlock[]; bytes: number; truncated: boolean } | undefined {
  if (typeof content === 'string') {
    if (content.length === 0) return undefined
    return {
      blocks: [{ type: 'text', text: clipText(content, cap) }],
      bytes: content.length,
      truncated: content.length > cap,
    }
  }
  if (!Array.isArray(content)) return undefined
  const blocks: WireResultBlock[] = []
  let bytes = 0
  let truncated = false
  for (const block of content) {
    const b = record(block)
    if (b === undefined) continue
    if (b.type === 'text') {
      if (typeof b.text !== 'string' || b.text.length === 0) continue
      bytes += b.text.length
      if (b.text.length > cap) truncated = true
      blocks.push({ type: 'text', text: clipText(b.text, cap) })
      continue
    }
    if (b.type !== 'image') continue
    const attachment = record(b.attachment)
    if (attachment === undefined) continue
    const attachmentId = attachment.attachmentId
    const mediaType = attachment.mediaType
    if (typeof attachmentId !== 'string' || attachmentId.length === 0) continue
    if (typeof mediaType !== 'string' || mediaType.length === 0) continue
    const image: WireResultImage = { attachmentId, mediaType }
    if (typeof attachment.bytes === 'number') image.bytes = attachment.bytes
    if (typeof attachment.width === 'number') image.width = attachment.width
    if (typeof attachment.height === 'number') image.height = attachment.height
    if (typeof attachment.name === 'string') image.name = attachment.name
    blocks.push({ type: 'image', attachment: image })
  }
  return blocks.length > 0 ? { blocks, bytes, truncated } : undefined
}

function sourceOf(data: Record<string, unknown>): Record<string, unknown> | undefined {
  const message = record(data.message)
  if (message !== undefined) {
    const source = record(message.source)
    if (source !== undefined) return source
  }
  return record(data.source)
}

/** Copy only the source fields the fold reads (kind / callId). */
function projectSourceFields(source: Record<string, unknown>): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {}
  if (typeof source.kind === 'string') out.kind = source.kind
  if (typeof source.callId === 'string' && source.callId.length > 0) out.callId = source.callId
  // v0.10.50: the injected-context presentation the panel folds on. Without
  // these the client saw `kind` only, so every injection fell back to its
  // clipped raw text instead of its declared form.
  if (typeof source.form === 'string' && source.form.length > 0) out.form = source.form
  if (typeof source.name === 'string' && source.name.length > 0) out.name = source.name
  const sections = projectSections(source.sections)
  if (sections !== undefined) out.sections = sections
  const changes = projectMembers(source.changes, 'path', MEMBER_CAP)
  if (changes !== undefined) out.changes = changes
  const references = projectMembers(source.references, 'label', MEMBER_CAP)
  if (references !== undefined) out.references = references
  return Object.keys(out).length > 0 ? out : undefined
}

/** Max characters of one `changes[].path` / `references[].label` string. */
const MEMBER_CAP = 4096

/** `source.sections` → `[{name, text}]`, clipped per section; undefined when empty. */
function projectSections(value: unknown): Array<{ name: string; text: string }> | undefined {
  if (!Array.isArray(value)) return undefined
  const out: Array<{ name: string; text: string }> = []
  for (const entry of value) {
    const section = record(entry)
    if (section === undefined) continue
    if (typeof section.name !== 'string' || section.name.length === 0) continue
    if (typeof section.text !== 'string') continue
    out.push({ name: section.name, text: clipText(section.text, CONTEXT_CAP) })
  }
  return out.length > 0 ? out : undefined
}

/** One string field of every object in `source[member]`; undefined when empty. */
function projectMembers(value: unknown, field: string, cap: number): Array<Record<string, string>> | undefined {
  if (!Array.isArray(value)) return undefined
  const out: Array<Record<string, string>> = []
  for (const entry of value) {
    const item = record(entry)
    if (item === undefined) continue
    const fieldValue = item[field]
    if (typeof fieldValue !== 'string' || fieldValue.length === 0) continue
    out.push({ [field]: clipText(fieldValue, cap) })
  }
  return out.length > 0 ? out : undefined
}

/** `data.message.source.kind` (or `data.source.kind`), when present. */
function sourceKindOf(data: Record<string, unknown>): string | undefined {
  const message = record(data.message)
  const nested = message === undefined ? undefined : record(message.source)
  const source = nested ?? record(data.source)
  return source === undefined ? undefined : (typeof source.kind === 'string' ? source.kind : undefined)
}

/** The two frozen surface forms: the `'append'` tag, or `{op,startSeq?,endSeq?}`. */
function isSurfaceOp(value: unknown): boolean {
  if (value === 'append') return true
  const obj = record(value)
  // `op` must be a NON-EMPTY string: an empty tag names no surface operation
  // and must not pass as one (contract §9.2#4; verifier report F2).
  return obj !== undefined && typeof obj.op === 'string' && obj.op.length > 0
}

/** Non-empty number array guard for `sourceEventSeqs`. */
function isSeqList(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every((n) => typeof n === 'number')
}

/** The projected event face: the typed subset plus the surface fields. */
interface ProjectedEvent extends SessionEventLike {
  /** Frozen surface form: `'append'`, or `{op,startSeq?,endSeq?}` (verbatim). */
  surfaceOp?: unknown
  /** Seqs the surface operation refers to (verbatim, non-empty number list). */
  sourceEventSeqs?: unknown
}

/**
 * The base of every projected event: identity plus the surface bookkeeping
 * fields, which are forwarded verbatim for EVERY event type (append/replace
 * watermarks). Anything that is not one of the two frozen forms is dropped.
 */
function baseOf(event: SessionEventLike): ProjectedEvent {
  const extra = event as SessionEventLike & { surfaceOp?: unknown; sourceEventSeqs?: unknown }
  const base: ProjectedEvent = { type: event.type, seq: event.seq }
  if (typeof event.time === 'number') base.time = event.time
  if (isSurfaceOp(extra.surfaceOp)) base.surfaceOp = extra.surfaceOp
  if (isSeqList(extra.sourceEventSeqs)) base.sourceEventSeqs = extra.sourceEventSeqs
  return base
}

/** Merge projected data onto the base, omitting an empty/unset data object. */
function withData(base: ProjectedEvent, data: Record<string, unknown>): ProjectedEvent {
  return Object.keys(data).length > 0 ? { ...base, data } : base
}

/**
 * Project one session event onto the fold-relevant wire subset.
 * See the module header for the field policy.
 */
export function projectEvent(event: SessionEventLike): SessionEventLike {
  const base = baseOf(event)
  const data = record(event.data)
  if (data === undefined) return base

  switch (event.type) {
    case 'turn/start':
    case 'turn/end':
      return typeof data.turn === 'number' ? withData(base, { turn: data.turn }) : base

    case 'user/message': {
      const out: Record<string, unknown> = {}
      // Injected context is model-read material, not a chat bubble: it keeps
      // its whole text (bounded by CONTEXT_CAP, not TEXT_CAP).
      const kind = sourceKindOf(data)
      const cap = kind !== undefined && kind !== 'user' ? CONTEXT_CAP : TEXT_CAP
      const content = projectContent(data.content, cap)
      if (content !== undefined) out.content = content
      const message = record(data.message)
      if (message !== undefined) {
        const m: Record<string, unknown> = {}
        if (typeof message.content === 'string' && message.content.length > 0) {
          m.content = clipText(message.content, cap)
        }
        const source = record(message.source)
        if (source !== undefined) {
          const s = projectSourceFields(source)
          if (s !== undefined) m.source = s
        }
        if (Object.keys(m).length > 0) out.message = m
      }
      const source = record(data.source)
      if (source !== undefined) {
        const s = projectSourceFields(source)
        if (s !== undefined) out.source = s
      }
      return withData(base, out)
    }

    case 'assistant/message': {
      const out: Record<string, unknown> = {}
      const message = record(data.message)
      if (message !== undefined) {
        const content = projectContent(message.content, TEXT_CAP)
        if (content !== undefined) out.message = { content }
      }
      // The fold falls back to data.content when message.content is absent.
      const fallback = projectContent(data.content, TEXT_CAP)
      if (fallback !== undefined) out.content = fallback
      return withData(base, out)
    }

    case 'tool/call': {
      const out: Record<string, unknown> = {}
      if (typeof data.name === 'string' && data.name.length > 0) out.name = data.name
      // Full (clipped) arguments for the detail panel; byte accounting rides on
      // the PRE-clip length so truncation is visible on the wire.
      if (typeof data.arguments === 'string') {
        out.arguments = clipText(data.arguments, ARGS_CAP)
        out.argsBytes = data.arguments.length
        out.argsTruncated = data.arguments.length > ARGS_CAP
      }
      if (typeof data.callId === 'string' && data.callId.length > 0) out.callId = data.callId
      if (typeof data.turn === 'number') out.turn = data.turn
      if (typeof data.step === 'number') out.step = data.step
      const source = sourceOf(data)
      if (source !== undefined) {
        const s = projectSourceFields(source)
        if (s !== undefined && typeof s.callId === 'string') out.message = { source: s }
      }
      return withData(base, out)
    }

    case 'tool/result': {
      const out: Record<string, unknown> = {}
      const error = record(data.error)
      if (error !== undefined) {
        const e: Record<string, unknown> = {}
        if (typeof error.name === 'string' && error.name.length > 0) e.name = error.name
        if (typeof error.code === 'string' && error.code.length > 0) e.code = error.code
        if (Object.keys(e).length > 0) out.error = e
      }
      const message = record(data.message)
      if (message?.isError === true || data.isError === true) out.isError = true
      if (typeof data.callId === 'string' && data.callId.length > 0) out.callId = data.callId
      if (typeof data.turn === 'number') out.turn = data.turn
      if (typeof data.step === 'number') out.step = data.step
      // The result payload lives in message.content (contract §0); it is
      // re-shaped into ordered blocks — the raw array is never forwarded.
      const content = message !== undefined
        ? projectResultContent(message.content, RESULT_CAP)
        : undefined
      if (content !== undefined) {
        out.content = content.blocks
        out.contentBytes = content.bytes
        out.contentTruncated = content.truncated
      }
      const source = sourceOf(data)
      if (source !== undefined) {
        const s = projectSourceFields(source)
        if (s !== undefined && typeof s.callId === 'string') out.message = { source: s }
      }
      return withData(base, out)
    }

    case 'compaction/summary': {
      const summary = projectContent(data.summary, TEXT_CAP)
      return summary !== undefined ? withData(base, { summary }) : base
    }

    default:
      // command/run and unknown types: the fold ignores their data.
      return base
  }
}
