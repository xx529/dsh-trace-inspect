/**
 * wire.ts — host-side response shaping for POST /turntrail/api/events.
 *
 * The client fold needs only a small, typed subset of each event. Every
 * response event is projected to that subset BEFORE serialization, so the
 * wire (and the client's retained state) never carries full tool results,
 * reasoning blocks, or unbounded message text.
 *
 * Projection is idempotent and lossless for the fold's needs:
 *   - `seq` / `type` / `time` are always preserved (the seq watermark and
 *     turn identity ride on them).
 *   - text fields are clipped to TEXT_CAP; tool arguments to ARGS_CAP.
 *   - content block arrays keep ONLY non-empty text blocks, in order (the
 *     fold reads exactly the first / last text block).
 *   - `tool/result` message content (the bulky part of real logs) is dropped
 *     entirely — the fold consumes only `error.name` / `error.code`.
 */
import type { SessionEventLike } from './context-types'

/** Max characters carried per text field (input / output / summary). */
export const TEXT_CAP = 2048

/** Max characters of tool-call arguments (the fold only previews 120). */
export const ARGS_CAP = 512

/** Max events per response page; the client loops while `hasMore` is true. */
export const PAGE_SIZE = 2000

/** Hard body cap for the route's request payload. */
export const MAX_BODY_BYTES = 64 * 1024

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
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Project one session event onto the fold-relevant wire subset.
 * See the module header for the field policy.
 */
export function projectEvent(event: SessionEventLike): SessionEventLike {
  const base: SessionEventLike = {
    type: event.type,
    seq: event.seq,
    ...(typeof event.time === 'number' ? { time: event.time } : {}),
  }
  const data = record(event.data)
  if (data === undefined) return base

  switch (event.type) {
    case 'turn/start':
    case 'turn/end':
      return typeof data.turn === 'number' ? { ...base, data: { turn: data.turn } } : base

    case 'user/message': {
      const out: Record<string, unknown> = {}
      const content = projectContent(data.content, TEXT_CAP)
      if (content !== undefined) out.content = content
      const message = record(data.message)
      if (message !== undefined) {
        const m: Record<string, unknown> = {}
        if (typeof message.content === 'string' && message.content.length > 0) {
          m.content = clipText(message.content, TEXT_CAP)
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
      return Object.keys(out).length > 0 ? { ...base, data: out } : base
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
      return Object.keys(out).length > 0 ? { ...base, data: out } : base
    }

    case 'tool/call': {
      const out: Record<string, unknown> = {}
      if (typeof data.name === 'string' && data.name.length > 0) out.name = data.name
      if (typeof data.arguments === 'string' && data.arguments.length > 0) {
        out.arguments = clipText(data.arguments, ARGS_CAP)
      }
      if (typeof data.callId === 'string' && data.callId.length > 0) out.callId = data.callId
      const source = sourceOf(data)
      if (source !== undefined) {
        const s = projectSourceFields(source)
        if (s !== undefined && typeof s.callId === 'string') out.message = { source: s }
      }
      return Object.keys(out).length > 0 ? { ...base, data: out } : base
    }

    case 'tool/result': {
      // The fold reads only error.name / error.code (plus call ids);
      // message.content — the bulky payload — is intentionally dropped.
      const out: Record<string, unknown> = {}
      const error = record(data.error)
      if (error !== undefined) {
        const e: Record<string, unknown> = {}
        if (typeof error.name === 'string' && error.name.length > 0) e.name = error.name
        if (typeof error.code === 'string' && error.code.length > 0) e.code = error.code
        if (Object.keys(e).length > 0) out.error = e
      }
      if (typeof data.callId === 'string' && data.callId.length > 0) out.callId = data.callId
      const source = sourceOf(data)
      if (source !== undefined) {
        const s = projectSourceFields(source)
        if (s !== undefined && typeof s.callId === 'string') out.message = { source: s }
      }
      return Object.keys(out).length > 0 ? { ...base, data: out } : base
    }

    case 'compaction/summary': {
      const summary = projectContent(data.summary, TEXT_CAP)
      return summary !== undefined ? { ...base, data: { summary } } : base
    }

    default:
      // command/run and unknown types: the fold ignores their data.
      return base
  }
}
