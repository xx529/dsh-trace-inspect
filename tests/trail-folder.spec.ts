/**
 * trail-folder.spec.ts — incremental TrailFolder equivalence: after EVERY
 * pushed prefix, snapshot() must deep-equal foldTurns(prefix) (the batch
 * reference), and stats() must match what TrailTab derives from turns.
 * Object identity of closed turns is asserted separately (the React.memo win).
 */
import { describe, expect, it } from 'vitest'
import { foldTurns, stepsOf, TrailFolder, type SessionEventLike, type TrailTurn } from '../src/trail-model'

interface Ev {
  type: string
  seq: number
  time?: number
  data?: Record<string, unknown>
}

const ev = (type: string, seq: number, data: Record<string, unknown> = {}): Ev => ({ type, seq, data })
const user = (seq: number, content: unknown): Ev => ev('user/message', seq, {
  content,
  message: { source: { kind: 'user' } },
})
const assistant = (seq: number, content: unknown): Ev => ev('assistant/message', seq, {
  message: { content },
})
const steering = (seq: number, content: string): Ev => ev('user/message', seq, {
  content,
  message: { source: { kind: 'context' } },
})
const turnStart = (seq: number, turn: number): Ev => ev('turn/start', seq, { turn })
const turnEnd = (seq: number, turn: number): Ev => ev('turn/end', seq, { turn })
const toolCall = (seq: number, name: string, args = '', callId = `c${seq}`): Ev => ev('tool/call', seq, {
  name,
  ...(args.length > 0 ? { arguments: args } : {}),
  ...(callId !== '' ? { callId } : {}),
})
const toolError = (seq: number, callId: string): Ev => ev('tool/result', seq, {
  callId,
  error: { name: 'TimeoutError', code: 'ETIMEDOUT' },
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
    if (i > 0) {
      expect(folder.stats()).toEqual(referenceStats(actual))
    }
    if (i < events.length) folder.push(events[i] as unknown as SessionEventLike)
  }
}

describe('TrailFolder ≡ foldTurns (batch reference)', () => {
  it('turn-mode: full multi-turn session with tools, errors, contexts', () => {
    assertIncrementalEqualsBatch([
      user(1, 'first'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd'), toolError(4, 'c3'),
      assistant(5, [{ type: 'text', text: 'failed' }]),
      turnEnd(6, 1),
      steering(7, 'reminder'),
      user(8, 'second'), turnStart(9, 2),
      toolCall(10, 'read', 'a.ts'), toolCall(11, 'edit', 'a.ts'),
      assistant(12, [{ type: 'text', text: 'ok' }]),
      turnEnd(13, 2),
    ])
  })

  it('user before the first turn/start attaches (mode flip at prefix 2)', () => {
    assertIncrementalEqualsBatch([
      user(1, 'early'), turnStart(2, 1), assistant(3, 'resp'), turnEnd(4, 1),
    ])
  })

  it('fallback mode: no turn/start anywhere', () => {
    assertIncrementalEqualsBatch([
      user(1, 'one'), assistant(2, 'r1'), toolCall(3, 'bash', 'x'), toolError(4, 'c3'),
      user(5, 'two'), assistant(6, 'r2'),
    ])
  })

  it('flip with pre-turn output and steps drops them exactly like replay', () => {
    assertIncrementalEqualsBatch([
      user(1, 'a'), assistant(2, 'A'), toolCall(3, 'bash'),
      turnStart(4, 1), assistant(5, 'B'), turnEnd(6, 1),
      user(7, 'b'), turnStart(8, 2), assistant(9, 'C'), turnEnd(10, 2),
    ])
  })

  it('two pending users before one turn/start: last input wins', () => {
    assertIncrementalEqualsBatch([
      user(1, 'one'), user(2, 'two'), turnStart(3, 7), assistant(4, 'ok'), turnEnd(5, 7),
    ])
  })

  it('trailing user message becomes its own turn', () => {
    assertIncrementalEqualsBatch([user(1, 'solo')])
    assertIncrementalEqualsBatch([user(1, 'a'), turnStart(2, 1), turnEnd(3, 1), user(4, 'tail')])
  })

  it('compaction and command/run rows', () => {
    assertIncrementalEqualsBatch([
      user(1, 'x'), turnStart(2, 1),
      ev('compaction/summary', 3, { summary: [{ type: 'text', text: 'earlier' }] }),
      ev('command/run', 4, { args: '/plan' }),
      assistant(5, 'ok'), turnEnd(6, 1),
    ])
  })

  it('malformed events are skipped like the batch fold', () => {
    const folder = new TrailFolder()
    const stream = [null, 42, 'x', user(1, 'hi'), turnStart(2, 1), turnEnd(3, 1)] as unknown as SessionEventLike[]
    for (const event of stream) folder.push(event)
    expect(folder.snapshot()).toEqual(foldTurns(stream))
  })

  it('late tool/result after turn/end is dropped (current is null)', () => {
    assertIncrementalEqualsBatch([
      user(1, 'x'), turnStart(2, 1), toolCall(3, 'bash'), turnEnd(4, 1),
      toolError(5, 'c3'), assistant(6, 'stray'),
    ])
  })

  it('detail fixtures: successful results, merged appends and a replace stay batch-equal', () => {
    const result = (seq: number, callId: string, value: string): Ev => ev('tool/result', seq, {
      callId,
      content: [{ type: 'text', text: value }],
      message: { source: { callId }, isError: false },
    })
    assertIncrementalEqualsBatch([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      result(4, 'c3', 'OLD'),
      result(5, 'c3', ' more'),
      turnEnd(6, 1),
      user(7, 'y'), turnStart(8, 2),
      toolCall(9, 'read', 'a.ts', 'c9'),
      result(10, 'c9', 'file'),
      // A compact-replace of turn 1's result, while turn 2 is open.
      ev('tool/result', 11, {
        callId: 'c3',
        content: [{ type: 'text', text: 'PRUNED' }],
        surfaceOp: { op: 'replace', startSeq: 4, endSeq: 4 },
        sourceEventSeqs: [4],
      }),
      turnEnd(12, 2),
    ])
  })
})

describe('TrailFolder identity reuse', () => {
  it('closed turns keep object identity across snapshots; the open turn does not', () => {
    const folder = new TrailFolder()
    const events: Ev[] = [
      user(1, 'a'), turnStart(2, 1), assistant(3, 'A'), turnEnd(4, 1),
      user(5, 'b'), turnStart(6, 2),
      toolCall(7, 'bash'),
    ]
    for (const event of events) folder.push(event as unknown as SessionEventLike)
    const first = folder.snapshot()
    const closedBefore = first[0]
    expect(first).toHaveLength(2)
    expect(first[0].status).toBe('done')
    expect(first[1].status).toBe('running')

    // A later burst touches only turn 2.
    folder.push(user(8, 'ignored-as-step?') as unknown as SessionEventLike)
    // (seq 8 user message with current open → becomes new input item on turn 2)
    folder.push(assistant(9, 'done!') as unknown as SessionEventLike)
    folder.push(turnEnd(10, 2) as unknown as SessionEventLike)
    const second = folder.snapshot()
    expect(second[0]).toBe(closedBefore) // identity stable → memo skips it
    expect(second[0]).toEqual(first[0])
    expect(second[1]).not.toBe(first[1])
    expect(second[1].status).toBe('done')
  })

  it('trailing pending users are folded into the next turn on arrival', () => {
    const folder = new TrailFolder()
    folder.push(user(1, 'early') as unknown as SessionEventLike)
    expect(folder.snapshot()).toHaveLength(1)
    folder.push(turnStart(2, 1) as unknown as SessionEventLike)
    const turns = folder.snapshot()
    expect(turns).toHaveLength(1)
    expect(turns[0].inputPreview).toBe('early')
  })
})

describe('TrailFolder transport robustness', () => {
  it('skips duplicate / re-sent events with non-increasing seq', () => {
    const folder = new TrailFolder()
    const evts: Ev[] = [user(1, 'a'), turnStart(2, 1), assistant(3, 'A'), turnEnd(4, 1)]
    for (const event of evts) folder.push(event as unknown as SessionEventLike)
    const before = folder.snapshot()
    // Re-send the whole page: nothing may change.
    for (const event of evts) folder.push(event as unknown as SessionEventLike)
    const after = folder.snapshot()
    expect(after).toEqual(before)
    expect(folder.stats()).toEqual(referenceStats(after))
  })

  it('skips events without a numeric seq', () => {
    const folder = new TrailFolder()
    folder.push({ type: 'user/message', data: { content: 'no-seq' } } as unknown as SessionEventLike)
    folder.push(user(1, 'real') as unknown as SessionEventLike)
    folder.push(turnStart(2, 1) as unknown as SessionEventLike)
    expect(folder.snapshot()).toEqual(foldTurns([
      user(1, 'real'),
      turnStart(2, 1),
    ]))
  })
})
