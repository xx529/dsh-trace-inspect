/**
 * wire-detail.spec.ts — detail-contract-v1 §2 projection coverage:
 *
 *   AC1  tool/call arguments survive up to ARGS_CAP (32768) and are clipped
 *        (+ flagged) past it, with pre-clip byte accounting.
 *   AC2  tool/result message content (text AND image blocks) reaches the wire
 *        in order, with contentBytes / contentTruncated.
 *   AC3  `surfaceOp` (both frozen forms) and `sourceEventSeqs` pass through on
 *        EVERY event type; malformed forms are dropped.
 *
 * Real-log evidence for the shapes used here:
 *   /Users/lzx/.dsh/sessions/--Users-lzx-Documents-research--/
 *     session-8b8489a4-4a44-471d-8b3b-a292c8f5f72e/session.v4.jsonl.zstd
 *   seq=19 tool/call {turn,step,callId,name,arguments}
 *   seq=180 tool/result {turn,step,message:{source:{callId},content:[text],isError:false}}
 *                      + sourceEventSeqs:[179] + surfaceOp:'append'
 *   seq=182 tool/result + sourceEventSeqs:[20] + surfaceOp:{op:'replace',startSeq:20,endSeq:20}
 */
import { describe, expect, it } from 'vitest'
import {
  ARGS_CAP,
  MAX_BODY_BYTES,
  PAGE_BUDGET_BYTES,
  PAGE_SIZE,
  RESULT_CAP,
  TEXT_CAP,
  projectEvent,
} from '../src/wire'
import type { SessionEventLike } from '../src/context-types'

/** Feed raw log shapes (including keys outside the typed subset). */
function ev(value: Record<string, unknown>): SessionEventLike {
  return value as unknown as SessionEventLike
}

function dataOf(event: SessionEventLike): Record<string, unknown> {
  return (event.data ?? {}) as Record<string, unknown>
}

/** The two surface bookkeeping fields the projection may add to ANY event. */
interface WireEvent extends SessionEventLike {
  surfaceOp?: unknown
  sourceEventSeqs?: unknown
}

/** `projectEvent` widened by the surface fields (the typed subset omits them). */
function project(event: SessionEventLike): WireEvent {
  return projectEvent(event)
}

describe('frozen constants (§2)', () => {
  it('exports the contracted caps', () => {
    expect(TEXT_CAP).toBe(2048)
    expect(ARGS_CAP).toBe(32768)
    expect(RESULT_CAP).toBe(32768)
    expect(PAGE_SIZE).toBe(2000)
    expect(PAGE_BUDGET_BYTES).toBe(2 * 1024 * 1024)
    expect(MAX_BODY_BYTES).toBe(64 * 1024)
  })
})

describe('tool/call arguments (AC1)', () => {
  it('carries exactly ARGS_CAP characters untruncated', () => {
    const args = 'a'.repeat(ARGS_CAP)
    const out = project(ev({ type: 'tool/call', seq: 5, data: { name: 'read', arguments: args, callId: 'c5' } }))
    const data = dataOf(out)
    expect((data.arguments as string).length).toBe(ARGS_CAP)
    expect(data.arguments).toBe(args)
    expect(data.argsBytes).toBe(ARGS_CAP)
    expect(data.argsTruncated).toBe(false)
    expect(data.name).toBe('read')
    expect(data.callId).toBe('c5')
  })

  it('clips and flags ARGS_CAP + 1 characters', () => {
    const args = 'a'.repeat(ARGS_CAP + 1)
    const out = project(ev({ type: 'tool/call', seq: 5, data: { name: 'read', arguments: args, callId: 'c5' } }))
    const data = dataOf(out)
    expect(data.argsBytes).toBe(ARGS_CAP + 1)
    expect(data.argsTruncated).toBe(true)
    expect((data.arguments as string).length).toBe(ARGS_CAP + 1) // cap + ellipsis
    expect(data.arguments).toBe(`${'a'.repeat(ARGS_CAP)}…`)
  })

  it('passes turn / step / message.source and omits a missing arguments payload', () => {
    const out = project(ev({
      type: 'tool/call',
      seq: 19,
      time: 1791820322320,
      data: {
        turn: 1,
        step: 1,
        callId: 'call_00_XgbXmlEcbLkEPkwmqDZZ4842',
        name: 'bash',
        arguments: '{"command":"pwd"}',
      },
    }))
    expect(out.seq).toBe(19)
    expect(out.type).toBe('tool/call')
    expect(out.time).toBe(1791820322320)
    expect(dataOf(out)).toEqual({
      name: 'bash',
      arguments: '{"command":"pwd"}',
      argsBytes: 17,
      argsTruncated: false,
      callId: 'call_00_XgbXmlEcbLkEPkwmqDZZ4842',
      turn: 1,
      step: 1,
    })
    const noArgs = project(ev({ type: 'tool/call', seq: 20, data: { name: 'bash', callId: 'c20' } }))
    expect(dataOf(noArgs)).toEqual({ name: 'bash', callId: 'c20' })
  })

  it('carries the message.source callId face when the source lives there', () => {
    const out = project(ev({
      type: 'tool/call',
      seq: 21,
      data: { name: 'glob', arguments: '{}', message: { source: { kind: 'tool', callId: 'c21' } } },
    }))
    const data = dataOf(out)
    expect(data.callId).toBeUndefined()
    expect(data.message).toEqual({ source: { kind: 'tool', callId: 'c21' } })
  })
})

describe('tool/result content (AC2)', () => {
  it('keeps ordered text + image blocks, skipping empty text', () => {
    const out = project(ev({
      type: 'tool/result',
      seq: 30,
      data: {
        callId: 'c30',
        turn: 2,
        step: 1,
        message: {
          isError: false,
          source: { kind: 'tool', callId: 'c30' },
          content: [
            { type: 'text', text: 'head' },
            { type: 'text', text: '' },
            { type: 'image', attachment: { attachmentId: 'att-1', mediaType: 'image/png', bytes: 1234, width: 640, height: 480, name: 'shot.png' } },
            { type: 'reasoning', text: 'drop me' },
            { type: 'text', text: 'tail' },
          ],
        },
      },
    }))
    const data = dataOf(out)
    expect(data.content).toEqual([
      { type: 'text', text: 'head' },
      { type: 'image', attachment: { attachmentId: 'att-1', mediaType: 'image/png', bytes: 1234, width: 640, height: 480, name: 'shot.png' } },
      { type: 'text', text: 'tail' },
    ])
    expect(data.contentBytes).toBe(8) // 'head' + 'tail' (pre-clip)
    expect(data.contentTruncated).toBe(false)
    expect(data.callId).toBe('c30')
    expect(data.turn).toBe(2)
    expect(data.step).toBe(1)
    expect(data.message).toEqual({ source: { kind: 'tool', callId: 'c30' } })
  })

  it('clips each text block at RESULT_CAP and reports pre-clip bytes', () => {
    const long = 'z'.repeat(RESULT_CAP + 10)
    const out = project(ev({
      type: 'tool/result',
      seq: 31,
      data: { message: { content: [{ type: 'text', text: 'ab' }, { type: 'text', text: long }] } },
    }))
    const data = dataOf(out)
    const first = (data.content as Array<{ type: 'text'; text: string }>)[0]
    const second = (data.content as Array<{ type: 'text'; text: string }>)[1]
    expect(first.text).toBe('ab')
    expect(second.text.length).toBe(RESULT_CAP + 1)
    expect(second.text.endsWith('…')).toBe(true)
    expect(data.contentBytes).toBe(2 + RESULT_CAP + 10)
    expect(data.contentTruncated).toBe(true)
  })

  it('carries image-only content with zero text bytes', () => {
    const out = project(ev({
      type: 'tool/result',
      seq: 32,
      data: {
        message: {
          content: [{ type: 'image', attachment: { attachmentId: 'att-2', mediaType: 'image/jpeg' } }],
        },
      },
    }))
    const data = dataOf(out)
    expect(data.content).toEqual([
      { type: 'image', attachment: { attachmentId: 'att-2', mediaType: 'image/jpeg' } },
    ])
    expect(data.contentBytes).toBe(0)
    expect(data.contentTruncated).toBe(false)
  })

  it('omits content when nothing survives, and drops malformed image blocks', () => {
    const empty = project(ev({
      type: 'tool/result',
      seq: 33,
      data: { message: { content: [{ type: 'text', text: '' }, { type: 'image', attachment: { attachmentId: '', mediaType: 'image/png' } }, { type: 'image', attachment: { attachmentId: 'a' } }, { type: 'image' }] } },
    }))
    expect(dataOf(empty).content).toBeUndefined()
    expect(dataOf(empty).contentBytes).toBeUndefined()
    expect(dataOf(empty).contentTruncated).toBeUndefined()
    const noContent = project(ev({ type: 'tool/result', seq: 34, data: { callId: 'c34' } }))
    expect(dataOf(noContent).content).toBeUndefined()
    const badShape = project(ev({ type: 'tool/result', seq: 35, data: { message: { content: 42 } } }))
    expect(dataOf(badShape).content).toBeUndefined()
  })

  it('carries isError from either face and never forwards raw message.content', () => {
    const fromMessage = project(ev({
      type: 'tool/result',
      seq: 36,
      data: { message: { isError: true, content: [{ type: 'text', text: 'boom' }] } },
    }))
    expect(dataOf(fromMessage).isError).toBe(true)
    expect(dataOf(fromMessage).message).toBeUndefined()
    const fromData = project(ev({ type: 'tool/result', seq: 37, data: { isError: true, message: { content: [] } } }))
    expect(dataOf(fromData).isError).toBe(true)
    const ok = project(ev({ type: 'tool/result', seq: 38, data: { message: { isError: false, content: [{ type: 'text', text: 'fine' }] } } }))
    expect(dataOf(ok).isError).toBeUndefined()
  })

  it('keeps error name / code alongside the projected content', () => {
    const out = project(ev({
      type: 'tool/result',
      seq: 39,
      data: {
        callId: 'c39',
        message: { content: [{ type: 'text', text: 'partial output' }] },
        error: { name: 'TimeoutError', code: 'ETIMEDOUT', message: 'dropped' },
      },
    }))
    const data = dataOf(out)
    expect(data.error).toEqual({ name: 'TimeoutError', code: 'ETIMEDOUT' })
    expect(data.content).toEqual([{ type: 'text', text: 'partial output' }])
  })

  it('matches the real append event (seq 180) and the real replace event (seq 182)', () => {
    const append = project(ev({
      type: 'tool/result',
      seq: 180,
      time: 1791820667847,
      sourceEventSeqs: [179],
      surfaceOp: 'append',
      data: {
        turn: 2,
        step: 1,
        message: {
          role: 'tool',
          source: { kind: 'tool', callId: 'call_00_NDMNZW4PC5Ft2X2ccjcJ2085' },
          toolCallId: 'call_00_NDMNZW4PC5Ft2X2ccjcJ2085',
          content: [{ type: 'text', text: '78 docs/x.md\n570 total\n' }],
          isError: false,
        },
      },
    }))
    expect(append.surfaceOp).toBe('append')
    expect(append.sourceEventSeqs).toEqual([179])
    expect(dataOf(append).content).toEqual([{ type: 'text', text: '78 docs/x.md\n570 total\n' }])

    const replace = project(ev({
      type: 'tool/result',
      seq: 182,
      time: 1791820669234,
      sourceEventSeqs: [20],
      surfaceOp: { op: 'replace', startSeq: 20, endSeq: 20 },
      data: {
        turn: 1,
        step: 1,
        message: {
          role: 'tool',
          source: { kind: 'tool', callId: 'call_00_XgbXmlEcbLkEPkwmqDZZ4842' },
          toolCallId: 'call_00_XgbXmlEcbLkEPkwmqDZZ4842',
          content: [{ type: 'text', text: '[dsh-jev-compaction]\npruned\n' }],
          isError: false,
        },
      },
    }))
    expect(replace.surfaceOp).toEqual({ op: 'replace', startSeq: 20, endSeq: 20 })
    expect(replace.sourceEventSeqs).toEqual([20])
    expect(dataOf(replace).content).toEqual([{ type: 'text', text: '[dsh-jev-compaction]\npruned\n' }])
  })
})

describe('surface bookkeeping passthrough (AC3)', () => {
  const eventTypes = ['user/message', 'assistant/message', 'tool/call', 'tool/result', 'turn/start', 'compaction/summary', 'command/run', 'unknown/x']

  it("passes surfaceOp 'append' and sourceEventSeqs through on every event type", () => {
    for (const type of eventTypes) {
      const out = project(ev({ type, seq: 1, data: { turn: 1 }, surfaceOp: 'append', sourceEventSeqs: [7] }))
      expect(out.surfaceOp, type).toBe('append')
      expect(out.sourceEventSeqs, type).toEqual([7])
    }
  })

  it('passes the replace object through verbatim (not a copy of a whitelist)', () => {
    const surfaceOp = { op: 'replace', startSeq: 20, endSeq: 22, note: 'extra key survives' }
    const out = project(ev({ type: 'tool/result', seq: 9, data: {}, surfaceOp }))
    expect(out.surfaceOp).toEqual(surfaceOp)
    expect(out.surfaceOp).toBe(surfaceOp)
  })

  it('drops malformed surfaceOp forms', () => {
    for (const surfaceOp of ['replace', 'append ', '', 42, true, null, {}, { startSeq: 1, endSeq: 2 }, { op: 7 }]) {
      const out = project(ev({ type: 'tool/result', seq: 9, data: {}, surfaceOp }))
      expect(out.surfaceOp, JSON.stringify(surfaceOp)).toBeUndefined()
    }
  })

  it('drops empty / non-number sourceEventSeqs lists', () => {
    for (const sourceEventSeqs of [[], ['1'], [1, '2'], [null], 20, '20']) {
      const out = project(ev({ type: 'tool/result', seq: 9, data: {}, sourceEventSeqs }))
      expect(out.sourceEventSeqs, JSON.stringify(sourceEventSeqs)).toBeUndefined()
    }
  })

  it('keeps the surface fields even when the event has no data at all', () => {
    const out = project(ev({ type: 'step/end', seq: 181, surfaceOp: { op: 'replace', startSeq: 5, endSeq: 5 }, sourceEventSeqs: [5] }))
    expect(out).toEqual({
      type: 'step/end',
      seq: 181,
      surfaceOp: { op: 'replace', startSeq: 5, endSeq: 5 },
      sourceEventSeqs: [5],
    })
  })
})

describe('regression: fold-facing text fields stay text-only', () => {
  it('clips user/message content to TEXT_CAP', () => {
    const out = project(ev({ type: 'user/message', seq: 1, data: { content: 'u'.repeat(TEXT_CAP + 1) } }))
    const content = dataOf(out).content as string
    expect(content.length).toBe(TEXT_CAP + 1)
    expect(content.endsWith('…')).toBe(true)
  })

  it('keeps only text blocks for assistant/message (reasoning stays out)', () => {
    const out = project(ev({
      type: 'assistant/message',
      seq: 2,
      data: { message: { content: [{ type: 'reasoning', text: 'secret' }, { type: 'text', text: 'visible' }] } },
    }))
    expect(dataOf(out).message).toEqual({ content: [{ type: 'text', text: 'visible' }] })
  })
})
