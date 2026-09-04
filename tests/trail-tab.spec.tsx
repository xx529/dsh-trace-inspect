/**
 * trail-tab.spec.tsx — panel rendering coverage (≈7 cases): empty state,
 * turn rendering + counts, chips with counts and failed filter, follow
 * toggle, error + retry, tool-group expansion, preview pane.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { TrailTab } from '../src/client/TrailTab'
import { MAX_PULL_PAGES } from '../src/client/useTrail'
import type { SessionEventLike } from '../src/trail-model'

afterEach(cleanup)

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
const assistant = (seq: number, text: string): Ev => ev('assistant/message', seq, {
  message: { content: [{ type: 'text', text }] },
})
const turnStart = (seq: number, turn: number): Ev => ev('turn/start', seq, { turn })
const turnEnd = (seq: number, turn: number): Ev => ev('turn/end', seq, { turn })
const toolCall = (seq: number, name: string, args = '', callId = `c${seq}`): Ev => ev('tool/call', seq, {
  name,
  ...(args.length > 0 ? { arguments: args } : {}),
  callId,
})

const oneTurn = (): Ev[] => [
  user(1, 'deploy the service'),
  turnStart(2, 1),
  toolCall(3, 'bash', 'kubectl apply'),
  assistant(4, 'deployed'),
  turnEnd(5, 1),
]

const twoTurns = (): Ev[] => [
  ...oneTurn(),
  user(6, 'rollback'),
  turnStart(7, 2),
  toolCall(8, 'bash', 'kubectl rollout undo'),
  ev('tool/result', 9, { callId: 'c8', error: { name: 'CommandError', code: 'E1' } }),
  assistant(10, 'rollback failed'),
  turnEnd(11, 2),
]

const renderTab = (events: SessionEventLike[], failFirst = false) => {
  let calls = 0
  const fetchEventsOverride = async (): Promise<{ events: SessionEventLike[] }> => {
    calls += 1
    if (failFirst && calls === 1) throw new Error('network down')
    return { events }
  }
  render(
    <TrailTab
      ctx={{ get: () => undefined }}
      scope={{ sessionId: 's1' }}
      visible
      tab={{ id: 'turn-outline' }}
      fetchEventsOverride={fetchEventsOverride}
    />,
  )
  return { fetchEventsOverride }
}

describe('TrailTab', () => {
  it('renders the empty state for a session without turns', async () => {
    renderTab([])
    expect(await screen.findByText('No turns in this session yet')).toBeTruthy()
  })

  it('renders turn rows, the turn count, and step numbers after load', async () => {
    renderTab(twoTurns())
    expect(await screen.findByText('2 turns')).toBeTruthy()
    const cards = await screen.findAllByTestId('ttl-turn')
    expect(cards).toHaveLength(2)
    // Turn header = "轮次 N" micro tag + input preview (split elements now).
    const tags = screen.getAllByTestId('ttl-turn-tag')
    expect(tags.map((el) => el.textContent)).toEqual(['Turn 1', 'Turn 2'])
    // Input text appears in the header preview AND the expanded body's input row.
    expect(screen.getAllByText('deploy the service').length).toBeGreaterThan(0)
    expect(screen.getAllByText('rollback').length).toBeGreaterThan(0)
    // Latest turn (2) is expanded by default → its steps are visible.
    const steps = await screen.findAllByTestId('ttl-step')
    expect(steps.length).toBeGreaterThan(0)
  })

  it('chips show counts; failed chip filters steps', async () => {
    renderTab(twoTurns())
    await screen.findByText('2 turns')
    const chips = screen.getByTestId('ttl-chips')
    expect(within(chips).getByText('All')).toBeTruthy()
    expect(within(chips).getByText('Failed')).toBeTruthy()
    const failedChip = within(chips).getByTestId('ttl-chip-failed')
    fireEvent.click(failedChip)
    // After filtering to failed, only the error step remains visible.
    const steps = await screen.findAllByTestId('ttl-step')
    expect(steps.length).toBeGreaterThan(0)
    const errorSteps = steps.filter((el) => el.getAttribute('data-step-kind') === 'error')
    expect(errorSteps.length).toBeGreaterThan(0)
    // Failure is carried by the red dot (no ✗ glyph anymore).
    expect(errorSteps[0].querySelector('.ttl-dot-red')).toBeTruthy()
    expect(steps.every((el) => el.getAttribute('data-step-kind') === 'error')).toBe(true)
  })

  it('failed chip only renders when failures exist', async () => {
    renderTab(oneTurn())
    await screen.findByText('1 turns')
    expect(within(screen.getByTestId('ttl-chips')).queryByTestId('ttl-chip-failed')).toBeNull()
  })

  it('failed turns are marked with a single error dot', async () => {
    renderTab(twoTurns())
    await screen.findByText('2 turns')
    expect(screen.getAllByTestId('ttl-error-dot')).toHaveLength(1)
  })

  it('expanded turn shows an input row (first row) that locates the input', async () => {
    renderTab(oneTurn())
    const row = await screen.findByTestId('ttl-item-input')
    // First row of the expanded body = input row (before the tool steps).
    const body = row.parentElement as HTMLElement
    expect(body.firstElementChild).toBe(row)
    expect(row.textContent).toContain('deploy the service')
    // Click = jump to the input (fails in tests: no sessions service).
    fireEvent.click(row)
    const bar = await screen.findByTestId('ttl-statusbar')
    expect(bar.textContent).toContain('Could not locate that message')
    // Under a tool filter the input row is hidden.
    fireEvent.click(screen.getByTestId('ttl-chip-bash'))
    expect(screen.queryByTestId('ttl-item-input')).toBeNull()
  })

  it('follow-latest toggle flips aria-pressed', async () => {
    renderTab(twoTurns())
    await screen.findByText('2 turns')
    const toggle = screen.getByTestId('ttl-follow-toggle')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
  })

  it('shows an error state with retry that recovers', async () => {
    renderTab(twoTurns(), true)
    expect(await screen.findByTestId('ttl-error')).toBeTruthy()
    fireEvent.click(screen.getByTestId('ttl-retry'))
    expect(await screen.findByText('2 turns')).toBeTruthy()
  })

  it('flat tool steps render one row each (no tool-group)', async () => {
    renderTab([
      user(1, 'run tests'),
      turnStart(2, 1),
      toolCall(3, 'bash', 'npm test'),
      toolCall(4, 'bash', 'npm lint'),
      toolCall(5, 'read', 'package.json'),
      assistant(6, 'all green'),
      turnEnd(7, 1),
    ])
    const steps = await screen.findAllByTestId('ttl-step')
    expect(steps).toHaveLength(3)
    expect(steps[0].getAttribute('data-step-kind')).toBe('tool')
    // Each row leads with its semantic category dot (green bash / amber edit).
    expect(steps[0].querySelector('.ttl-rowDot')).toBeTruthy()
    // Assistant messages render as output rows in the same row anatomy.
    expect(screen.getAllByTestId('ttl-item-output').length).toBeGreaterThan(0)
  })

  it('clicking a step without a sessions service reports a locate failure', async () => {
    renderTab(oneTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.click(step)
    const bar = await screen.findByTestId('ttl-statusbar')
    expect(bar.textContent).toContain('Could not locate that message')
  })

  it('collapsing the latest turn does NOT expand the earlier turns', async () => {
    renderTab(twoTurns())
    await screen.findByText('2 turns')
    // Latest (turn 2) is expanded by default; turn 1 stays collapsed.
    let cards = screen.getAllByTestId('ttl-turn')
    expect(cards[1].getAttribute('data-collapsed')).toBe('false')
    expect(cards[0].getAttribute('data-collapsed')).toBe('true')
    // Fold the latest turn.
    fireEvent.click(within(cards[1]).getByText(/Turn 2/))
    cards = screen.getAllByTestId('ttl-turn')
    // Both collapsed — turn 1 must NOT have been force-expanded.
    expect(cards[1].getAttribute('data-collapsed')).toBe('true')
    expect(cards[0].getAttribute('data-collapsed')).toBe('true')
  })

  it('clicking an earlier turn expands it while the latest stays expanded', async () => {
    renderTab(twoTurns())
    await screen.findByText('2 turns')
    fireEvent.click(within(screen.getAllByTestId('ttl-turn')[0]).getByText(/Turn 1/))
    const cards = screen.getAllByTestId('ttl-turn')
    expect(cards[0].getAttribute('data-collapsed')).toBe('false')
    expect(cards[1].getAttribute('data-collapsed')).toBe('false')
  })

  it('drains hasMore pages before settling on ready', async () => {
    const pageA = [user(1, 'first'), turnStart(2, 1), assistant(3, 'A'), turnEnd(4, 1)]
    const pageB = [user(5, 'second'), turnStart(6, 2), assistant(7, 'B'), turnEnd(8, 2)]
    let calls = 0
    const fetchEventsOverride = async (): Promise<{ events: SessionEventLike[]; hasMore?: boolean }> => {
      calls += 1
      return calls === 1 ? { events: pageA, hasMore: true } : { events: pageB }
    }
    render(
      <TrailTab
        ctx={{ get: () => undefined }}
        scope={{ sessionId: 's1' }}
        visible
        tab={{ id: 'turn-outline' }}
        fetchEventsOverride={fetchEventsOverride}
      />,
    )
    expect(await screen.findByText('2 turns')).toBeTruthy()
    expect(await screen.findByText('Turn 2')).toBeTruthy()
    expect(calls).toBe(2)
  })

  it('keeps draining past MAX_PULL_PAGES so a huge cold load is not truncated', async () => {
    // MAX_PULL_PAGES + 2 single-event pages: the first pull stops at the cap
    // with pages pending, the scheduled continuation must drain the rest.
    const total = MAX_PULL_PAGES + 2
    let calls = 0
    const fetchEventsOverride = async (_sid: string, afterSeq: number) => {
      calls += 1
      const seq = afterSeq + 1
      const hasMore = seq < total
      return { events: [user(seq, `msg ${seq}`)], hasMore }
    }
    render(
      <TrailTab
        ctx={{ get: () => undefined }}
        scope={{ sessionId: 's1' }}
        visible
        tab={{ id: 'turn-outline' }}
        fetchEventsOverride={fetchEventsOverride}
      />,
    )
    expect(await screen.findByText(`${total} turns`)).toBeTruthy()
    // The final page (beyond the cap) really arrived: it shows in the latest
    // turn's preview AND its expanded input row.
    const lastTexts = await screen.findAllByText(`msg ${total}`)
    expect(lastTexts.length).toBeGreaterThanOrEqual(1)
    expect(calls).toBe(total)
  })

  it('stops the cap-continuation chain when a pull makes no progress', async () => {
    // A misbehaving transport: always hasMore, always the same stale page.
    // The first pull advances seq once (page 1), schedules one continuation;
    // the stalled continuation must make zero progress and stop the chain.
    let calls = 0
    const fetchEventsOverride = async (): Promise<{ events: SessionEventLike[]; hasMore: boolean }> => {
      calls += 1
      return { events: [user(1, 'only')], hasMore: true }
    }
    render(
      <TrailTab
        ctx={{ get: () => undefined }}
        scope={{ sessionId: 's1' }}
        visible
        tab={{ id: 'turn-outline' }}
        fetchEventsOverride={fetchEventsOverride}
      />,
    )
    expect(await screen.findByText('1 turns')).toBeTruthy()
    // Wait past the throttle window: no third pull may fire.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(calls).toBe(MAX_PULL_PAGES * 2)
    // Duplicates were dropped by the watermark and the panel stays healthy.
    expect(screen.queryByTestId('ttl-error')).toBeNull()
  })
})
