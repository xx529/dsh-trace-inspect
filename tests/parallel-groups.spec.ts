/**
 * parallel-groups.spec.ts — v0.8.0 assistant-step batches.
 *
 * Evidence model: DSH journals one `tool/call` per assistant tool call with
 * `{turn, step}`; `step` identifies the assistant response, so calls sharing
 * the same identity were requested together. These tests lock
 *
 *   1. the fold keeps that identity on `TrailStep` (both fold implementations),
 *   2. `parallelGroupsOf` groups only CONSECUTIVE same-step tool rows (never
 *      by adjacency/timing, never across an output/compaction/error row),
 *   3. `groupParallelItems` preserves list order and renders a sliced run as
 *      its own group,
 *   4. logs without `step` degrade to the pre-v0.8.0 flat list.
 */
import { describe, expect, it } from 'vitest'
import {
  foldTurns,
  groupParallelItems,
  parallelGroupsOf,
  TrailFolder,
  type SessionEventLike,
  type TrailStep,
  type TurnItem,
} from '../src/trail-model'

interface Ev {
  type: string
  seq: number
  data?: Record<string, unknown>
}

const ev = (type: string, seq: number, data: Record<string, unknown> = {}): Ev => ({ type, seq, data })
const user = (seq: number, content: string): Ev => ev('user/message', seq, {
  content,
  message: { source: { kind: 'user' } },
})
const turnStart = (seq: number, turn: number): Ev => ev('turn/start', seq, { turn })
const turnEnd = (seq: number, turn: number): Ev => ev('turn/end', seq, { turn })
/** A model-issued call: the batch identity rides on `data.turn` / `data.step`. */
const call = (
  seq: number,
  name: string,
  identity?: { turn: number; step: number },
  callId = `c${seq}`,
): Ev => ev('tool/call', seq, {
  name,
  arguments: '{}',
  callId,
  ...(identity !== undefined ? { turn: identity.turn, step: identity.step } : {}),
})
const result = (seq: number, callId: string, text = 'ok'): Ev => ev('tool/result', seq, {
  callId,
  content: [{ type: 'text', text }],
})
const errorResult = (seq: number, callId: string, identity?: { turn: number; step: number }): Ev => ev('tool/result', seq, {
  callId,
  ...(identity !== undefined ? { turn: identity.turn, step: identity.step } : {}),
  error: { name: 'TimeoutError', code: 'ETIMEDOUT' },
  content: [{ type: 'text', text: 'timed out' }],
})

/** A turn whose tool events are `body` (turn 1), closed at seq 200. */
const turnWith = (body: Ev[]): Ev[] => [user(1, 'go'), turnStart(2, 1), ...body, turnEnd(200, 1)]

/** Synthetic tool steps, for order-only grouping tests. */
const stepOf = (
  seq: number,
  turn: number | undefined,
  step: number | undefined,
  kind: TrailStep['kind'] = 'tool',
  orphan = false,
): TrailStep => ({
  kind,
  seq,
  name: 'bash',
  argsPreview: '',
  callId: `c${seq}`,
  error: '',
  ...(turn !== undefined ? { turn } : {}),
  ...(step !== undefined ? { step } : {}),
  ...(orphan ? { orphan: true } : {}),
})
const toolItems = (...steps: TrailStep[]): TurnItem[] => steps.map((step) => ({ kind: 'tool', step }))
const toEvents = (events: Ev[]): SessionEventLike[] => events

describe('fold — assistant-step identity', () => {
  it('tool/call data.turn/step land on the step; legacy calls leave them absent', () => {
    const turns = foldTurns(toEvents(turnWith([
      call(3, 'read', { turn: 1, step: 1 }),
      result(4, 'c3'),
      call(5, 'bash'),
      result(6, 'c5'),
    ])))
    const steps = turns[0].items
      .filter((item): item is Extract<TurnItem, { kind: 'tool' }> => item.kind === 'tool')
    expect(steps.map((item) => ({ turn: item.step.turn, step: item.step.step }))).toEqual([
      { turn: 1, step: 1 },
      { turn: undefined, step: undefined },
    ])
  })

  it('error rows keep the result identity but never join a batch', () => {
    const turns = foldTurns(toEvents(turnWith([
      call(3, 'bash', { turn: 1, step: 1 }),
      errorResult(4, 'c3'),
    ])))
    const errorStep = turns[0].items.find(
      (item): item is Extract<TurnItem, { kind: 'tool' }> => item.kind === 'tool' && item.step.kind === 'error',
    )
    expect(errorStep).toBeDefined()
    expect(parallelGroupsOf(turns[0].items)).toEqual([])

    const withIdentity = foldTurns(toEvents(turnWith([
      call(3, 'bash', { turn: 1, step: 1 }),
      errorResult(4, 'c3', { turn: 1, step: 1 }),
    ])))
    const identities = withIdentity[0].items
      .filter((item): item is Extract<TurnItem, { kind: 'tool' }> => item.kind === 'tool')
      .map((item) => ({ kind: item.step.kind, turn: item.step.turn, step: item.step.step }))
    expect(identities).toEqual([
      { kind: 'tool', turn: 1, step: 1 },
      { kind: 'error', turn: 1, step: 1 },
    ])
    expect(parallelGroupsOf(withIdentity[0].items)).toEqual([])
  })

  it('TrailFolder (incremental) keeps the same identity as foldTurns', () => {
    const events = toEvents(turnWith([
      call(3, 'read', { turn: 1, step: 1 }),
      call(4, 'read', { turn: 1, step: 1 }),
      result(5, 'c3'),
      result(6, 'c4'),
    ]))
    const folder = new TrailFolder()
    for (const event of events) folder.push(event)
    const incremental = folder.snapshot()
    const batch = foldTurns(events)
    expect(incremental).toEqual(batch)
    expect(parallelGroupsOf(incremental[0].items).map((group) => group.key))
      .toEqual(parallelGroupsOf(batch[0].items).map((group) => group.key))
  })
})

describe('parallelGroupsOf — consecutive same-step runs', () => {
  it('two consecutive calls with one identity → one group of 2', () => {
    const groups = parallelGroupsOf(toolItems(stepOf(10, 1, 1), stepOf(20, 1, 1)))
    expect(groups).toHaveLength(1)
    expect(groups[0].turn).toBe(1)
    expect(groups[0].step).toBe(1)
    expect(groups[0].steps.map((step) => step.seq)).toEqual([10, 20])
    expect(groups[0].key).toBe('parallel:1:1:10')
  })

  it('three consecutive calls with one identity → one group of 3', () => {
    const groups = parallelGroupsOf(toolItems(stepOf(10, 2, 7), stepOf(20, 2, 7), stepOf(30, 2, 7)))
    expect(groups).toHaveLength(1)
    expect(groups[0].steps).toHaveLength(3)
    expect(groups[0].key).toBe('parallel:2:7:10')
  })

  it('different assistant steps never merge into one group', () => {
    const groups = parallelGroupsOf(toolItems(
      stepOf(10, 1, 1),
      stepOf(20, 1, 1),
      stepOf(30, 1, 2),
      stepOf(40, 1, 2),
    ))
    expect(groups.map((group) => group.steps.map((step) => step.seq))).toEqual([[10, 20], [30, 40]])
    expect(groups.map((group) => group.key)).toEqual(['parallel:1:1:10', 'parallel:1:2:30'])
  })

  it('a single-call step yields no group', () => {
    expect(parallelGroupsOf(toolItems(stepOf(10, 1, 1), stepOf(20, 1, 2)))).toEqual([])
  })

  it('an assistant output row breaks the run (calls re-issued next step)', () => {
    const outputItem: TurnItem = { kind: 'output', seq: 15, text: 'thinking', preview: 'thinking' }
    const groups = parallelGroupsOf([
      ...toolItems(stepOf(10, 1, 1)),
      outputItem,
      ...toolItems(stepOf(20, 1, 1)),
    ])
    expect(groups).toEqual([])
  })

  it('an error row between calls breaks the run', () => {
    const errorItem: TurnItem = { kind: 'tool', step: stepOf(15, 1, 1, 'error') }
    const groups = parallelGroupsOf([
      ...toolItems(stepOf(10, 1, 1)),
      errorItem,
      ...toolItems(stepOf(20, 1, 1)),
    ])
    expect(groups).toEqual([])
  })

  it('rows without turn/step (legacy logs) never group', () => {
    expect(parallelGroupsOf(toolItems(stepOf(10, undefined, undefined), stepOf(20, undefined, undefined)))).toEqual([])
    expect(parallelGroupsOf(toolItems(stepOf(10, 1, undefined), stepOf(20, 1, undefined)))).toEqual([])
    expect(parallelGroupsOf(toolItems(stepOf(10, undefined, 1), stepOf(20, undefined, 1)))).toEqual([])
  })

  it('orphan placeholder rows never group', () => {
    expect(parallelGroupsOf(toolItems(
      stepOf(10, 1, 1, 'tool', true),
      stepOf(20, 1, 1, 'tool', true),
    ))).toEqual([])
  })

  it('non-tool items around a run are ignored, not merged', () => {
    const groups = parallelGroupsOf([
      { kind: 'input', seq: 1, text: 'go', preview: 'go' },
      ...toolItems(stepOf(10, 1, 1), stepOf(20, 1, 1)),
      { kind: 'compaction', seq: 30, preview: 'compacted' },
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].steps.map((step) => step.seq)).toEqual([10, 20])
  })
})

describe('groupParallelItems — render entries', () => {
  it('preserves list order and wraps only the batch', () => {
    const items: TurnItem[] = [
      { kind: 'output', seq: 5, text: 'plan', preview: 'plan' },
      ...toolItems(stepOf(10, 1, 1), stepOf(20, 1, 1)),
      { kind: 'tool', step: stepOf(30, 1, 2) },
      { kind: 'compaction', seq: 40, preview: 'fold' },
    ]
    const entries = groupParallelItems(items)
    expect(entries.map((entry) => entry.kind)).toEqual(['item', 'group', 'item', 'item'])
    expect(entries[0]).toMatchObject({ kind: 'item', item: { kind: 'output' } })
    const grouped = groupParallelItems(items)[1]
    expect(grouped.kind).toBe('group')
    if (grouped.kind === 'group') {
      expect(grouped.group.steps.map((step) => step.seq)).toEqual([10, 20])
      expect(grouped.group.key).toBe('parallel:1:1:10')
    }
    expect(entries[2]).toMatchObject({ kind: 'item' })
    expect(entries[3]).toMatchObject({ kind: 'item' })
  })

  it('a sliced run renders as its own group (no key collision with the hidden half)', () => {
    const all = toolItems(stepOf(10, 1, 1), stepOf(20, 1, 1), stepOf(30, 1, 1))
    const slice = all.slice(1) // the first call is hidden by STEP_CAP
    const entries = groupParallelItems(slice)
    expect(entries).toHaveLength(1)
    const grouped = entries[0]
    expect(grouped.kind).toBe('group')
    if (grouped.kind === 'group') {
      expect(grouped.group.steps.map((step) => step.seq)).toEqual([20, 30])
      expect(grouped.group.key).toBe('parallel:1:1:20')
    }
    // A leftover single call after slicing is a plain row.
    expect(groupParallelItems(all.slice(2))).toMatchObject([{ kind: 'item' }])
  })
})
