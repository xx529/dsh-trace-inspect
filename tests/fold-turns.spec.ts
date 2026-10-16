/**
 * fold-turns.spec.ts — pure folding model coverage (≈20 cases).
 */
import { describe, expect, it } from 'vitest'
import { foldTurns, stepsOf, compact } from '../src/trail-model'

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
const turnStart = (seq: number, turn: number): Ev => ev('turn/start', seq, { turn })
const turnEnd = (seq: number, turn: number): Ev => ev('turn/end', seq, { turn })
const toolCall = (seq: number, name: string, args = '', callId = `c${seq}`): Ev => ev('tool/call', seq, {
  name,
  ...(args.length > 0 ? { arguments: args } : {}),
  ...(callId !== '' ? { callId } : {}),
})

describe('foldTurns — boundaries', () => {
  it('empty stream → no turns', () => {
    expect(foldTurns([])).toEqual([])
  })

  it('skips null / malformed events', () => {
    const events = [null, 42, 'x', user(1, 'hi'), turnStart(2, 1), turnEnd(3, 1)] as unknown as Ev[]
    const turns = foldTurns(events)
    expect(turns).toHaveLength(1)
    expect(turns[0].inputPreview).toBe('hi')
  })

  it('one full turn: input + tool + output, ordered', () => {
    const turns = foldTurns([
      user(1, 'hello'),
      turnStart(2, 1),
      toolCall(3, 'bash', 'pwd'),
      assistant(4, [{ type: 'text', text: 'done' }]),
      turnEnd(5, 1),
    ])
    expect(turns).toHaveLength(1)
    const turn = turns[0]
    expect(turn.turn).toBe(1)
    expect(turn.status).toBe('done')
    expect(turn.anchorSeq).toBe(1)
    expect(turn.inputPreview).toBe('hello')
    expect(turn.outputPreview).toBe('done')
    expect(turn.items.map((item) => item.kind)).toEqual(['input', 'tool', 'output'])
    expect(turn.stepsCount).toBe(1)
  })

  it('two sequential turns are separated', () => {
    const turns = foldTurns([
      user(1, 'a'), turnStart(2, 1), assistant(3, 'A'), turnEnd(4, 1),
      user(5, 'b'), turnStart(6, 2), assistant(7, 'B'), turnEnd(8, 2),
    ])
    expect(turns).toHaveLength(2)
    expect(turns[0].index).toBe(0)
    expect(turns[1].index).toBe(1)
    expect(turns[1].inputPreview).toBe('b')
    expect(turns[1].outputPreview).toBe('B')
  })

  it('turn identity comes from data.turn numbers, not stream order', () => {
    const turns = foldTurns([
      turnStart(1, 7),
      user(2, 'x'),
      assistant(3, 'ok'),
      turnEnd(4, 7),
    ])
    expect(turns[0].turn).toBe(7)
  })

  it('fallback mode: no turn/start events → user/message boundaries', () => {
    const turns = foldTurns([
      user(1, 'one'),
      assistant(2, 'resp1'),
      user(3, 'two'),
      assistant(4, 'resp2'),
    ])
    expect(turns).toHaveLength(2)
    expect(turns[0].inputPreview).toBe('one')
    expect(turns[1].inputPreview).toBe('two')
  })

  it('fallback mode counts each tool/error step once (no double push)', () => {
    const turns = foldTurns([
      user(1, 'one'),
      assistant(2, 'resp1'),
      toolCall(3, 'bash', 'npm test'),
      ev('tool/result', 4, { callId: 'c3', error: { name: 'TimeoutError' } }),
    ])
    expect(turns).toHaveLength(1)
    expect(turns[0].stepsCount).toBe(2)
    expect(stepsOf(turns[0])).toHaveLength(2)
    expect(stepsOf(turns[0])[1].kind).toBe('error')
  })
})

describe('foldTurns — fields', () => {
  it('user text from data.content (bare string)', () => {
    const turns = foldTurns([user(1, 'bare string'), turnStart(2, 1), turnEnd(3, 1)])
    expect(turns[0].inputPreview).toBe('bare string')
  })

  it('user text from data.content block array', () => {
    const turns = foldTurns([user(1, [{ type: 'text', text: 'block text' }]), turnStart(2, 1), turnEnd(3, 1)])
    expect(turns[0].inputPreview).toBe('block text')
  })

  it('assistant text from data.message.content (block array, last text wins)', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      assistant(3, [{ type: 'text', text: 'first' }, { type: 'tool_use', id: 't' }, { type: 'text', text: 'last' }]),
      turnEnd(4, 1),
    ])
    expect(turns[0].outputPreview).toBe('last')
  })

  it('assistant text from bare string content', () => {
    const turns = foldTurns([user(1, 'x'), turnStart(2, 1), assistant(3, 'plain'), turnEnd(4, 1)])
    expect(turns[0].outputPreview).toBe('plain')
  })

  it('callId from data.callId and from data.message.source.callId', () => {
    const viaDirect = foldTurns([user(1, 'x'), turnStart(2, 1), toolCall(3, 'read', '', 'direct-id'), turnEnd(4, 1)])
    expect(stepsOf(viaDirect[0])[0].callId).toBe('direct-id')
    const viaSource = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      ev('tool/call', 3, { name: 'read', message: { source: { callId: 'nested-id' } } }),
      turnEnd(4, 1),
    ])
    expect(stepsOf(viaSource[0])[0].callId).toBe('nested-id')
  })

  it('preview truncation at PREVIEW_MAX with ellipsis', () => {
    const long = 'x'.repeat(300)
    const turns = foldTurns([user(1, long), turnStart(2, 1), turnEnd(3, 1)])
    expect(turns[0].inputPreview.endsWith('…')).toBe(true)
    expect(turns[0].inputPreview.length).toBeLessThan(130)
    expect(compact(long)).toBe(turns[0].inputPreview)
  })
})

describe('foldTurns — tool steps', () => {
  it('consecutive tool/call steps stay flat (one row each)', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash'), toolCall(4, 'bash'), toolCall(5, 'read'),
      turnEnd(6, 1),
    ])
    expect(turns[0].items.map((item) => item.kind)).toEqual(['input', 'tool', 'tool', 'tool'])
    expect(turns[0].stepsCount).toBe(3)
  })

  it('single tool/call stays a plain row', () => {
    const turns = foldTurns([user(1, 'x'), turnStart(2, 1), toolCall(3, 'bash'), turnEnd(4, 1)])
    expect(turns[0].items.map((item) => item.kind)).toEqual(['input', 'tool'])
  })

  it('an assistant output keeps tools flat around it', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'a'), toolCall(4, 'b'), assistant(5, 'mid'), toolCall(6, 'c'),
      turnEnd(7, 1),
    ])
    expect(turns[0].items.map((item) => item.kind)).toEqual(['input', 'tool', 'tool', 'output', 'tool'])
  })

  it('a tool/result error produces an error step (flat)', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'a'), toolCall(4, 'b'),
      ev('tool/result', 5, { callId: 'c4', error: { name: 'TimeoutError', code: 'ETIMEDOUT' } }),
      toolCall(6, 'c'),
      turnEnd(7, 1),
    ])
    expect(turns[0].items.map((item) => item.kind)).toEqual(['input', 'tool', 'tool', 'tool', 'tool'])
    const steps = stepsOf(turns[0])
    expect(steps[2].kind).toBe('error')
    expect(steps[2].error).toContain('TimeoutError')
    expect(steps[2].error).toContain('ETIMEDOUT')
    expect(turns[0].hasError).toBe(true)
    expect(turns[0].status).toBe('error')
  })

  it('compaction/summary appears as a checkpoint row', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      ev('compaction/summary', 3, { summary: [{ type: 'text', text: 'earlier context' }] }),
      turnEnd(4, 1),
    ])
    expect(turns[0].items.map((item) => item.kind)).toEqual(['input', 'compaction'])
  })

  it('command/run is ignored', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      ev('command/run', 3, { args: '/plan' }),
      assistant(4, 'plan'),
      turnEnd(5, 1),
    ])
    expect(turns[0].items.map((item) => item.kind)).toEqual(['input', 'output'])
  })

  it('a successful tool/result attaches its content to the tool step', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      toolCall(3, 'bash', 'pwd', 'c3'),
      ev('tool/result', 4, { callId: 'c3', content: [{ type: 'text', text: 'ok' }] }),
      turnEnd(5, 1),
    ])
    const steps = stepsOf(turns[0])
    expect(steps).toHaveLength(1)
    expect(steps[0].result?.text).toBe('ok')
    expect(steps[0].result?.isError).toBe(false)
  })

  it('a tool/result with no matching call becomes an orphan placeholder', () => {
    const turns = foldTurns([
      user(1, 'x'), turnStart(2, 1),
      ev('tool/result', 3, { callId: 'missing', content: [{ type: 'text', text: 'body' }] }),
      turnEnd(4, 1),
    ])
    expect(turns[0].stepsCount).toBe(1)
    const step = stepsOf(turns[0])[0]
    expect(step.orphan).toBe(true)
    expect(step.result?.text).toBe('body')
  })
})

describe('foldTurns — pending and status', () => {
  it('a user message before the first turn/start attaches to that turn', () => {
    const turns = foldTurns([user(1, 'early'), turnStart(2, 1), assistant(3, 'ok'), turnEnd(4, 1)])
    expect(turns).toHaveLength(1)
    expect(turns[0].inputPreview).toBe('early')
    expect(turns[0].items[0].kind).toBe('input')
  })

  it('a trailing user message with no turn becomes its own turn', () => {
    const turns = foldTurns([user(1, 'solo')])
    expect(turns).toHaveLength(1)
    expect(turns[0].turn).toBeNull()
    expect(turns[0].inputPreview).toBe('solo')
  })

  it('status running when turn/end is missing; pending when empty', () => {
    const running = foldTurns([user(1, 'x'), turnStart(2, 1), toolCall(3, 'bash')])
    expect(running[0].status).toBe('running')
    const pending = foldTurns([turnStart(1, 1)])
    expect(pending[0].status).toBe('pending')
  })

  it('context (system-reminder) messages are counted, not rendered as rows', () => {
    const turns = foldTurns([
      user(1, 'real input'),
      turnStart(2, 1),
      ev('user/message', 3, { content: 'injected reminder', message: { source: { kind: 'context' } } }),
      ev('user/message', 4, { content: 'another reminder', message: { source: { kind: 'context' } } }),
      turnEnd(5, 1),
    ])
    expect(turns[0].inputPreview).toBe('real input')
    expect(turns[0].items.map((item) => item.kind)).toEqual(['input'])
    expect(turns[0].contextCount).toBe(2)
  })
})
