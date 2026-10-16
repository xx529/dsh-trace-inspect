/**
 * trail-detail.spec.ts — T2 model contract (§3 of docs/detail-contract-v1.md):
 * full tool arguments, tool/result content (text + image), append merging by
 * seq, surfaceOp replace, orphan placeholders, and foldTurns ≡ TrailFolder
 * equivalence on detail fixtures.
 *
 * The replace fixture shape mirrors the REAL event verified in
 * /Users/lzx/.dsh/sessions/--Users-lzx-Documents-research--/session-8b8489a4-4a44-471d-8b3b-a292c8f5f72e/session.v4.jsonl.zstd
 * seq 182/183: the replacement text lives in `data.message.content[].text`,
 * `surfaceOp.startSeq/endSeq` point at the replaced `tool/result` seq (20/22),
 * and the event also carries `sourceEventSeqs:[seq]`. Those replaces arrive
 * while the NEXT turn is open (seq 172 ended turn 1, seq 174 started turn 2).
 */
import { describe, expect, it } from 'vitest'
import {
  foldTurns,
  stepsOf,
  TrailFolder,
  type SessionEventLike,
  type TrailResultImage,
  type TrailTurn,
} from '../src/trail-model'

interface Ev {
  type: string
  seq: number
  time?: number
  data?: Record<string, unknown>
  surfaceOp?: unknown
  sourceEventSeqs?: number[]
}

const ev = (type: string, seq: number, data: Record<string, unknown> = {}): Ev => ({ type, seq, data })

const user = (seq: number, content: unknown): Ev => ev('user/message', seq, {
  content,
  message: { source: { kind: 'user' } },
})
const assistant = (seq: number, content: unknown): Ev => ev('assistant/message', seq, { message: { content } })
const turnStart = (seq: number, turn: number): Ev => ev('turn/start', seq, { turn })
const turnEnd = (seq: number, turn: number): Ev => ev('turn/end', seq, { turn })

const toolCall = (seq: number, name: string, args = '', callId = `c${seq}`): Ev => ev('tool/call', seq, {
  name,
  ...(args.length > 0 ? { arguments: args } : {}),
  ...(callId !== '' ? { callId } : {}),
})

const text = (value: string): { type: 'text'; text: string } => ({ type: 'text', text: value })
const image = (attachmentId: string, extra: Record<string, unknown> = {}): unknown => ({
  type: 'image',
  attachment: { attachmentId, mediaType: 'image/png', bytes: 2048, ...extra },
})

/** wire shape (§2): content projected onto data.content. */
const wireResult = (seq: number, callId: string, content: unknown[], extra: Record<string, unknown> = {}): Ev =>
  ev('tool/result', seq, {
    callId,
    content,
    message: { source: { callId }, isError: false },
    ...extra,
  })

/** raw session shape: content only in data.message.content (what the real log holds). */
const rawResult = (seq: number, callId: string, content: unknown[], extra: Record<string, unknown> = {}): Ev =>
  ev('tool/result', seq, {
    callId,
    message: { source: { callId }, content, isError: false },
    ...extra,
  })

/**
 * A compact-replace event, wire/projected shape: `surfaceOp` and
 * `sourceEventSeqs` ride on the EVENT (host projection + real session log),
 * the replacement text on data.content.
 */
const wireReplace = (seq: number, callId: string, replacement: string, startSeq: number, endSeq: number): Ev => ({
  type: 'tool/result',
  seq,
  surfaceOp: { op: 'replace', startSeq, endSeq },
  sourceEventSeqs: [startSeq],
  data: {
    callId,
    content: [text(replacement)],
    message: { source: { callId }, isError: false },
  },
})

/** A compact-replace event, raw session shape (content in data.message.content). */
const rawReplace = (seq: number, callId: string, replacement: string, startSeq: number, endSeq: number): Ev => ({
  type: 'tool/result',
  seq,
  surfaceOp: { op: 'replace', startSeq, endSeq },
  sourceEventSeqs: [startSeq],
  data: {
    callId,
    message: { source: { callId }, content: [text(replacement)], isError: false },
  },
})

/** Reference stats: derive from turns exactly like TrailTab does. */
function referenceStats(turns: TrailTurn[]): { total: number; failed: number; tools: Array<{ name: string; count: number }> } {
  let total = 0
  let failed = 0
  const byTool = new Map<string, number>()
  for (const turn of turns) {
    total += turn.stepsCount
    for (const step of stepsOf(turn)) {
      if (step.kind === 'error') failed += 1
      if (step.kind === 'tool') byTool.set(step.name, (byTool.get(step.name) ?? 0) + 1)
    }
  }
  return {
    total,
    failed,
    tools: [...byTool.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
  }
}

/** Push each event and, after every prefix, compare against the batch fold. */
function assertIncrementalEqualsBatch(events: Ev[]): void {
  const folder = new TrailFolder()
  for (let i = 0; i <= events.length; i += 1) {
    const prefix = events.slice(0, i) as unknown as SessionEventLike[]
    const expected = foldTurns(prefix)
    const actual = folder.snapshot()
    expect(actual).toEqual(expected)
    if (i > 0) expect(folder.stats()).toEqual(referenceStats(actual))
    if (i < events.length) folder.push(events[i] as unknown as SessionEventLike)
  }
}

describe('tool/call — full arguments (§3.1)', () => {
  it('carries args, argsBytes and argsTruncated', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"pwd"}', 'c3'),
      turnEnd(4, 1),
    ])
    const step = stepsOf(turns[0])[0]
    expect(step.args).toBe('{"command":"pwd"}')
    expect(step.argsPreview).toBe('{"command":"pwd"}')
    expect(step.argsTruncated).toBe(false)
    expect(step.argsBytes).toBe(17)
    expect(step.callId).toBe('c3')
  })

  it('passes the wire clip flags through', () => {
    const clipped = 'a'.repeat(16)
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      ev('tool/call', 3, { name: 'read', arguments: clipped, callId: 'c3', argsBytes: 32769, argsTruncated: true }),
      turnEnd(4, 1),
    ])
    const step = stepsOf(turns[0])[0]
    expect(step.args).toBe(clipped)
    expect(step.argsTruncated).toBe(true)
    expect(step.argsBytes).toBe(32769)
  })

  it('keeps empty args when the call has no arguments', () => {
    const step = stepsOf(foldTurns([user(1, 'x'), turnStart(2, 1), toolCall(3, 'bash', '', 'c3'), turnEnd(4, 1)])[0])[0]
    expect(step.args).toBe('')
    expect(step.argsBytes).toBe(0)
    expect(step.argsTruncated).toBe(false)
  })

  it('registers the tool/call seq in seqIndex (a replace may target it)', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"pwd"}', 'c3'),
      wireReplace(20, 'c3', 'PRUNED', 3, 3),
      turnEnd(30, 1),
    ])
    const step = stepsOf(turns[0])[0]
    expect(step.result).toEqual({
      seq: 20,
      kind: 'text',
      text: 'PRUNED',
      truncated: false,
      isError: false,
      replacedBy: 20,
      replacedFrom: 3,
    })
    expect(step.args).toBe('PRUNED')
    expect(step.argsPreview).toBe('PRUNED')
    expect(step.argsBytes).toBe(6)
  })
})

describe('tool/result — append merging (§3.3)', () => {
  it('attaches a text TrailResult to the tool step', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(4, 'c3', [text('/Users/lzx')]),
      turnEnd(5, 1),
    ])
    const steps = stepsOf(turns[0])
    expect(steps).toHaveLength(1)
    expect(steps[0].kind).toBe('tool')
    expect(steps[0].result).toEqual({
      seq: 4,
      kind: 'text',
      text: '/Users/lzx',
      truncated: false,
      isError: false,
    })
    expect(steps[0].orphan).toBeUndefined()
  })

  it('merges several results of one callId by seq, even when they arrive out of order', () => {
    const ordered = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(10, 'c3', [text('A')]),
      wireResult(20, 'c3', [text('B')]),
      turnEnd(30, 1),
    ])
    const outOfOrder = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(20, 'c3', [text('B')]),
      wireResult(10, 'c3', [text('A')]),
      turnEnd(30, 1),
    ])
    expect(stepsOf(ordered[0])[0].result?.text).toBe('AB')
    expect(stepsOf(ordered[0])[0].result?.seq).toBe(20)
    expect(stepsOf(outOfOrder[0])[0].result).toEqual(stepsOf(ordered[0])[0].result)
  })

  it('keeps a single entry per seq', () => {
    // Duplicate seq cannot happen in a stream (and TrailFolder skips it via the
    // watermark); the batch fold keeps exactly one segment per seq.
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(4, 'c3', [text('first')]),
      wireResult(4, 'c3', [text('second')]),
      turnEnd(5, 1),
    ])
    expect(stepsOf(turns[0])[0].result?.text).toBe('second')
  })

  it('dedupes images by attachmentId in seq order and reports kind mixed', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'read', 'shot', 'c3'),
      wireResult(10, 'c3', [text('see'), image('i1', { width: 640, height: 480, name: 'shot.png' }), image('i2')]),
      wireResult(20, 'c3', [image('i1'), image('i3')]),
      turnEnd(30, 1),
    ])
    const result = stepsOf(turns[0])[0].result
    const expected: TrailResultImage[] = [
      { attachmentId: 'i1', mediaType: 'image/png', bytes: 2048, width: 640, height: 480, name: 'shot.png' },
      { attachmentId: 'i2', mediaType: 'image/png', bytes: 2048 },
      { attachmentId: 'i3', mediaType: 'image/png', bytes: 2048 },
    ]
    expect(result?.kind).toBe('mixed')
    expect(result?.text).toBe('see')
    expect(result?.images).toEqual(expected)
  })

  it('an image-only result has kind image', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'read', 'shot', 'c3'),
      wireResult(4, 'c3', [image('i1', { bytes: 12, width: 2, height: 3 })]),
      turnEnd(5, 1),
    ])
    const result = stepsOf(turns[0])[0].result
    const expected: TrailResultImage[] = [
      { attachmentId: 'i1', mediaType: 'image/png', bytes: 12, width: 2, height: 3 },
    ]
    expect(result?.kind).toBe('image')
    expect(result?.text).toBe('')
    expect(result?.images).toEqual(expected)
  })

  it('reads the raw data.message.content shape too', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      rawResult(4, 'c3', [text('raw shape')]),
      turnEnd(5, 1),
    ])
    expect(stepsOf(turns[0])[0].result?.text).toBe('raw shape')
  })

  it('merges the text of every text block of one event', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(4, 'c3', [text('stdout'), text(''), text('stderr')]),
      turnEnd(5, 1),
    ])
    expect(stepsOf(turns[0])[0].result?.text).toBe('stdout\nstderr')
  })

  it('skips malformed image blocks instead of throwing', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'read', 'x', 'c3'),
      wireResult(4, 'c3', [{ type: 'image' }, { type: 'image', attachment: {} }, { type: 'image', attachment: { mediaType: 'image/png' } }]),
      turnEnd(5, 1),
    ])
    const result = stepsOf(turns[0])[0].result
    expect(result?.kind).toBe('text')
    expect(result?.images).toBeUndefined()
  })

  it('still attaches a result when the event carries no content (resultEmpty)', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      ev('tool/result', 4, { callId: 'c3', message: { source: { callId: 'c3' }, isError: false } }),
      turnEnd(5, 1),
    ])
    const result = stepsOf(turns[0])[0].result
    expect(result).toEqual({ seq: 4, kind: 'text', text: '', truncated: false, isError: false })
  })

  it('passes contentTruncated through as truncated', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(4, 'c3', [text('big')], { contentBytes: 40000, contentTruncated: true }),
      turnEnd(5, 1),
    ])
    expect(stepsOf(turns[0])[0].result?.truncated).toBe(true)
  })

  it("treats surfaceOp 'append' and non-conforming surfaceOp shapes as an append", () => {
    const runs: Ev[] = [
      { type: 'tool/result', seq: 4, surfaceOp: 'append', data: { callId: 'c3', content: [text('a')] } },
      { type: 'tool/result', seq: 4, surfaceOp: { op: 'replace' }, data: { callId: 'c3', content: [text('a')] } },
      { type: 'tool/result', seq: 4, surfaceOp: { op: 'replace', startSeq: 'x' }, data: { callId: 'c3', content: [text('a')] } },
      { type: 'tool/result', seq: 4, surfaceOp: 42, data: { callId: 'c3', content: [text('a')] } },
      // data-level surfaceOp (raw/replayed logs) is accepted as well.
      ev('tool/result', 4, { callId: 'c3', content: [text('a')], surfaceOp: { op: 'append' } }),
    ]
    for (const result of runs) {
      const turns = foldTurns([user(1, 'x'), turnStart(2, 1), toolCall(3, 'bash', 'pwd', 'c3'), result, turnEnd(5, 1)])
      const step = stepsOf(turns[0])[0]
      expect(step.result?.text).toBe('a')
      expect(step.result?.replacedBy).toBeUndefined()
    }
  })

  it('honours the event-level surfaceOp (host projection) and the data-level fallback alike', () => {
    const eventLevel = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(4, 'c3', [text('OLD')]),
      wireReplace(20, 'c3', 'NEW', 4, 4),
      turnEnd(30, 1),
    ])
    const dataLevel = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(4, 'c3', [text('OLD')]),
      ev('tool/result', 20, {
        callId: 'c3',
        content: [text('NEW')],
        surfaceOp: { op: 'replace', startSeq: 4, endSeq: 4 },
      }),
      turnEnd(30, 1),
    ])
    expect(stepsOf(eventLevel[0])[0].result).toEqual(stepsOf(dataLevel[0])[0].result)
    expect(stepsOf(eventLevel[0])[0].result?.text).toBe('NEW')
  })
})

describe('tool/result — errors (§3.2)', () => {
  const errorEvents = (): Ev[] => [
    user(1, 'x'), turnStart(2, 1),
    toolCall(3, 'bash', 'sleep 60', 'c3'),
    ev('tool/result', 4, {
      callId: 'c3',
      error: { name: 'TimeoutError', code: 'ETIMEDOUT' },
      message: { source: { callId: 'c3' }, content: [text('command timed out')], isError: true },
    }),
  ]

  it('keeps the extra error row, with errorCode and its own error result', () => {
    const turns = foldTurns([...errorEvents(), turnEnd(5, 1)])
    const steps = stepsOf(turns[0])
    expect(steps).toHaveLength(2)
    expect(steps[0].kind).toBe('tool')
    expect(steps[0].result).toBeUndefined()
    expect(steps[1].kind).toBe('error')
    expect(steps[1].name).toBe('TimeoutError')
    expect(steps[1].error).toBe('TimeoutError · ETIMEDOUT')
    expect(steps[1].errorCode).toBe('ETIMEDOUT')
    expect(steps[1].result).toEqual({
      seq: 4,
      kind: 'error',
      text: 'command timed out',
      truncated: false,
      isError: true,
      errorName: 'TimeoutError',
      errorCode: 'ETIMEDOUT',
    })
    expect(turns[0].hasError).toBe(true)
    expect(turns[0].status).toBe('error')
    expect(turns[0].stepsCount).toBe(2)
  })

  it('registers the error row under the result seq so a replace hits it, not the tool call', () => {
    const turns = foldTurns([
      ...errorEvents(),
      wireReplace(9, 'c3', 'PRUNED', 4, 4),
      turnEnd(10, 1),
    ])
    const steps = stepsOf(turns[0])
    expect(steps[0].result).toBeUndefined()
    expect(steps[1].kind).toBe('error')
    expect(steps[1].result?.text).toBe('PRUNED')
    expect(steps[1].result?.isError).toBe(false)
    expect(steps[1].result?.kind).toBe('text')
    expect(steps[1].result?.replacedBy).toBe(9)
    expect(steps[1].result?.replacedFrom).toBe(4)
    // Contract §3.3 "kind 由新内容重算" is applied to result.kind; the row keeps
    // its event identity (an error row stays an error row → hasError stays true).
    expect(steps[1].errorCode).toBe('ETIMEDOUT')
    expect(turns[0].hasError).toBe(true)
  })

  it('an error result with no content still carries an empty error result', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      ev('tool/result', 4, { callId: 'c3', error: { name: 'Boom' } }),
      turnEnd(5, 1),
    ])
    const step = stepsOf(turns[0])[0]
    expect(step.kind).toBe('error')
    expect(step.error).toBe('Boom')
    expect(step.errorCode).toBeUndefined()
    expect(step.result).toEqual({ seq: 4, kind: 'error', text: '', truncated: false, isError: true, errorName: 'Boom' })
  })
})

describe('surfaceOp replace (§3.3)', () => {
  it('rewrites the target result and args, tagging replacedBy / replacedFrom', () => {
    const replacement = '[dsh-jev-compaction] pruned'
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"cat huge.log"}', 'c3'),
      wireResult(4, 'c3', [text('x'.repeat(5000)), image('i1')]),
      rawReplace(30, 'c3', replacement, 4, 4),
      turnEnd(40, 1),
    ])
    const step = stepsOf(turns[0])[0]
    expect(step.result).toEqual({
      seq: 30,
      kind: 'text',
      text: replacement,
      truncated: false,
      isError: false,
      replacedBy: 30,
      replacedFrom: 4,
    })
    expect(step.args).toBe(replacement)
    expect(step.argsPreview).toBe(replacement)
    expect(step.argsBytes).toBe(replacement.length)
    expect(step.argsTruncated).toBe(false)
  })

  it('rewrites every step whose seq falls inside [startSeq,endSeq]', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'a', 'c3'), wireResult(4, 'c3', [text('A')]),
      toolCall(5, 'read', 'b', 'c5'), wireResult(6, 'c5', [text('B')]),
      toolCall(7, 'glob', 'c', 'c7'), wireResult(8, 'c7', [text('C')]),
      wireReplace(50, 'c3', 'COMPACTED', 4, 6),
      turnEnd(60, 1),
    ])
    const steps = stepsOf(turns[0])
    expect(steps).toHaveLength(3)
    expect(steps[0].result?.text).toBe('COMPACTED')
    expect(steps[0].result?.replacedBy).toBe(50)
    expect(steps[1].result?.text).toBe('COMPACTED')
    expect(steps[1].result?.replacedBy).toBe(50)
    expect(steps[2].result?.text).toBe('C')
    expect(steps[2].result?.replacedBy).toBeUndefined()
  })

  it('gives the same result whether the replace is consumed before or after the append it covers', () => {
    const call = [user(1, 'x'), turnStart(2, 1), toolCall(3, 'bash', 'pwd', 'c3')]
    const tail = [turnEnd(30, 1)]
    const ordered = foldTurns([...call, wireResult(10, 'c3', [text('OLD')]), wireReplace(20, 'c3', 'NEW', 10, 10), ...tail])
    const replaceFirst = foldTurns([...call, wireReplace(20, 'c3', 'NEW', 10, 10), wireResult(10, 'c3', [text('OLD')]), ...tail])
    expect(stepsOf(replaceFirst[0])[0].result).toEqual(stepsOf(ordered[0])[0].result)
    expect(stepsOf(replaceFirst[0])[0].result?.text).toBe('NEW')
  })

  it('rewrites the whole step content, dropping an earlier append segment too', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(4, 'c3', [text('chunk-1')]),
      wireResult(5, 'c3', [text('chunk-2')]),
      wireReplace(20, 'c3', 'FINAL', 4, 4),
      turnEnd(30, 1),
    ])
    expect(stepsOf(turns[0])[0].result?.text).toBe('FINAL')
  })

  it('ignores an unresolvable replace instead of creating an orphan', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      wireReplace(3, 'ghost', 'NOTHING TO COVER', 40, 50),
      {
        type: 'tool/result',
        seq: 4,
        surfaceOp: { op: 'replace', startSeq: 90, endSeq: 91 },
        data: { content: [text('x')] },
      },
      turnEnd(5, 1),
    ])
    expect(stepsOf(turns[0])).toHaveLength(0)
    expect(turns[0].stepsCount).toBe(0)
    expect(turns[0].items.map((item) => item.kind)).toEqual(['input'])
  })

  it('applies a replace that arrives after turn/end (closed turn, seqIndex lookup)', () => {
    const events = [
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'), wireResult(4, 'c3', [text('OLD')]),
      turnEnd(5, 1),
    ]
    const turns = foldTurns([...events, wireReplace(6, 'c3', 'NEW', 4, 4)])
    expect(turns).toHaveLength(1)
    const step = stepsOf(turns[0])[0]
    expect(step.result?.text).toBe('NEW')
    expect(step.result?.replacedBy).toBe(6)
  })

  it('replaces turn 1 results while turn 2 is open (real-log shape)', () => {
    const events = [
      user(1, 'q1'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'call_1'), wireResult(4, 'call_1', [text('turn-1 output')]),
      assistant(5, 'answer 1'), turnEnd(6, 1),
      user(7, 'q2'), turnStart(8, 2),
      toolCall(9, 'bash', 'ls', 'call_2'), wireResult(10, 'call_2', [text('turn-2 output')]),
      // seq 182/183 in the real log: replace the OLD tool/result while turn 2 runs.
      rawReplace(11, 'call_1', 'pruned', 4, 4),
      turnEnd(12, 2),
    ]
    const turns = foldTurns(events)
    expect(turns).toHaveLength(2)
    expect(stepsOf(turns[0])[0].result?.text).toBe('pruned')
    expect(stepsOf(turns[0])[0].result?.replacedBy).toBe(11)
    expect(stepsOf(turns[1])[0].result?.text).toBe('turn-2 output')
    // and the incremental folder agrees after every prefix
    assertIncrementalEqualsBatch(events)
  })
})

describe('orphan results (§3.3)', () => {
  it('creates an orphan placeholder with the content attached', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      wireResult(3, 'no-such-call', [text('orphan body')]),
      turnEnd(4, 1),
    ])
    const steps = stepsOf(turns[0])
    expect(steps).toHaveLength(1)
    expect(steps[0].kind).toBe('tool')
    expect(steps[0].name).toBe('tool')
    expect(steps[0].orphan).toBe(true)
    expect(steps[0].callId).toBe('no-such-call')
    expect(steps[0].args).toBe('')
    expect(steps[0].result?.text).toBe('orphan body')
    expect(turns[0].stepsCount).toBe(1)
    expect(turns[0].hasError).toBe(false)
  })

  it('creates an orphan when the result carries no callId at all', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      ev('tool/result', 3, { content: [text('anonymous')] }),
      turnEnd(4, 1),
    ])
    const step = stepsOf(turns[0])[0]
    expect(step.orphan).toBe(true)
    expect(step.callId).toBeNull()
    expect(step.result?.text).toBe('anonymous')
  })

  it('an orphan result can be replaced through its own seq', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      wireResult(3, 'ghost', [text('before')]),
      wireReplace(9, 'ghost', 'after', 3, 3),
      turnEnd(10, 1),
    ])
    const step = stepsOf(turns[0])[0]
    expect(step.orphan).toBe(true)
    expect(step.result?.text).toBe('after')
    expect(step.result?.replacedBy).toBe(9)
  })
})

describe('foldTurns ≡ TrailFolder on detail fixtures (§3.7)', () => {
  const detailStream: Ev[] = [
    user(1, 'q1'),
    turnStart(2, 1),
    toolCall(3, 'bash', '{"command":"pwd"}', 'c3'),
    wireResult(4, 'c3', [text('/tmp'), image('i1', { width: 10, height: 20, name: 'shot.png' })]),
    wireResult(5, 'c3', [text(' more')]),
    ev('tool/result', 6, {
      callId: 'c3',
      error: { name: 'TimeoutError', code: 'ETIMEDOUT' },
      message: { source: { callId: 'c3' }, content: [text('boom')], isError: true },
    }),
    toolCall(7, 'read', '{"path":"a.ts"}', 'c7'),
    rawResult(8, 'c7', [text('file body')]),
    wireResult(9, 'ghost', [text('orphan body')]),
    assistant(10, 'first answer'),
    turnEnd(11, 1),
    user(12, 'q2'),
    turnStart(13, 2),
    toolCall(14, 'bash', 'ls', 'c14'),
    wireResult(15, 'c14', [text('OLD CONTENT')]),
    rawReplace(16, 'c14', 'PRUNED', 15, 15),
    wireReplace(17, 'c3', 'TURN-1 PRUNED', 4, 4),
    {
      type: 'tool/result',
      seq: 18,
      surfaceOp: { op: 'replace', startSeq: 900, endSeq: 901 },
      data: { callId: 'gone', content: [text('ignored')] },
    },
    assistant(19, 'second answer'),
    turnEnd(20, 2),
  ]

  it('the incremental folder equals the batch fold after every prefix, with equal stats', () => {
    assertIncrementalEqualsBatch(detailStream)
  })

  it('user-mode results before the first turn/start survive the mode flip exactly like replay', () => {
    assertIncrementalEqualsBatch([
      user(1, 'a'),
      toolCall(2, 'bash', 'pwd', 'c1'),
      wireResult(3, 'c1', [text('pre-turn body')]),
      turnStart(4, 1),
      toolCall(5, 'read', 'x', 'c2'),
      wireResult(6, 'c2', [text('turn body')]),
      turnEnd(7, 1),
    ])
  })

  it('foldTurns and TrailFolder produce the same detailed steps', () => {
    const folder = new TrailFolder()
    for (const event of detailStream) folder.push(event as unknown as SessionEventLike)
    const batch = foldTurns(detailStream as unknown as SessionEventLike[])
    const incremental = folder.snapshot()
    expect(incremental).toEqual(batch)
    expect(folder.stats()).toEqual(referenceStats(batch))

    const turn1 = stepsOf(batch[0])
    expect(turnsTexts(turn1)).toEqual(['TURN-1 PRUNED', 'boom', 'file body', 'orphan body'])
    expect(turn1[0].result?.kind).toBe('text')
    expect(turn1[0].result?.replacedBy).toBe(17)
    expect(turn1[0].result?.images).toBeUndefined()
    const turn2 = stepsOf(batch[1])
    expect(turnsTexts(turn2)).toEqual(['PRUNED'])
    expect(turn2[0].result?.replacedBy).toBe(16)
    expect(batch[1].stepsCount).toBe(1)
  })

  it('a late replace invalidates the frozen slot of a closed turn and rewrites the step in place', () => {
    const folder = new TrailFolder()
    const events: Ev[] = [
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      wireResult(4, 'c3', [text('OLD')]),
      turnEnd(5, 1),
    ]
    for (const event of events) folder.push(event as unknown as SessionEventLike)
    const before = folder.snapshot()
    expect(before[0].status).toBe('done')
    const stepBefore = stepsOf(before[0])[0]
    expect(stepBefore.result?.text).toBe('OLD')

    // The replace targets seq 4 (< the folder watermark) while no turn is open.
    const replace = wireReplace(6, 'c3', 'NEW', 4, 4)
    folder.push(replace as unknown as SessionEventLike)

    const after = folder.snapshot()
    expect(after[0]).not.toBe(before[0]) // frozen slot was invalidated (markDirty)
    expect(after).toEqual(foldTurns([...events, replace] as unknown as SessionEventLike[]))
    const stepAfter = stepsOf(after[0])[0]
    expect(stepAfter).toBe(stepBefore) // the same step object, rewritten in place
    expect(stepAfter.result?.text).toBe('NEW')
    expect(stepAfter.result?.replacedBy).toBe(6)
    expect(stepAfter.args).toBe('NEW')

    // A re-sent older page is still skipped by the watermark.
    folder.push(events[3] as unknown as SessionEventLike)
    expect(stepsOf(folder.snapshot()[0])[0].result?.text).toBe('NEW')
  })

  it('fallback (user) mode: a late replace re-materializes an already-closed turn', () => {
    const folder = new TrailFolder()
    const events: Ev[] = [
      user(1, 'a'),
      toolCall(2, 'bash', 'pwd', 'c1'),
      wireResult(3, 'c1', [text('OLD')]),
      // A second user message closes turn 1 (no turn/start anywhere → user mode).
      user(4, 'b'),
    ]
    for (const event of events) folder.push(event as unknown as SessionEventLike)
    const before = folder.snapshot()
    expect(before).toHaveLength(2)
    const stepBefore = stepsOf(before[0])[0]
    expect(stepBefore.result?.text).toBe('OLD')

    const replace = wireReplace(5, 'c1', 'NEW', 3, 3)
    folder.push(replace as unknown as SessionEventLike)
    const after = folder.snapshot()
    expect(after).toEqual(foldTurns([...events, replace] as unknown as SessionEventLike[]))
    expect(after[0]).not.toBe(before[0]) // closed user turn re-materialized (markDirty)
    const stepAfter = stepsOf(after[0])[0]
    expect(stepAfter).toBe(stepBefore)
    expect(stepAfter.result?.text).toBe('NEW')
    expect(stepAfter.result?.replacedBy).toBe(5)
  })
})

function turnsTexts(steps: ReturnType<typeof stepsOf>): string[] {
  return steps.map((step) => step.result?.text ?? '')
}
