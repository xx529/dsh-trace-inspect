/**
 * trail-tab.spec.tsx — panel rendering coverage for the v0.9 shell:
 * header/search/overview, empty state, turn cards (three-line: head / preview /
 * body), chips with counts and failed filter, follow toggle, error + retry,
 * step rows, inline `StepDetail` (four tabs, layered summary → result → params
 * → raw), and the v0.5-v0.8 behaviours that must keep working: click-to-expand
 * vs ↗ locate, remembered rendered/raw view, arrow-key disclosure, filter
 * pruning, image thumbnails, on-demand full detail, F4 merged hint, overlay
 * entries, output rows and parallel tool-call batches.
 *
 * Updated 2026-11-06 for the v0.9 redesign (`docs/redesign-v09-impl.md` §2-3):
 * the assertions now follow the new DOM (`.ttl-stepName` / `.ttl-stepDesc` /
 * `.ttl-turnHead` / `.ttl-turnFoot`, `#N` tags, `N 轮 · M 步` count line,
 * always-on status bar) and the detail band moved from the shell to
 * `StepDetail.tsx` (tabs are `ttl-detail-tab-{summary,result,params,raw}`,
 * default `summary`; seq lives in the foot as `ttl-detail-foot-seq`).
 * The INTENT of every original test is preserved; only structure/copy moved.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { TrailTab, type FetchToolDetail } from '../src/client/TrailTab'
import { MAX_PULL_PAGES, type ToolDetailItem, type ToolDetailResult } from '../src/client/useTrail'
import { setPrimitivesForTest, type PrimitivesModule } from '../src/client/ui-primitives'
import type { SessionEventLike } from '../src/trail-model'

afterEach(() => {
  cleanup()
  setPrimitivesForTest(undefined)
})

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
const toolResult = (seq: number, callId: string, text: string): Ev => ev('tool/result', seq, {
  callId,
  content: [{ type: 'text', text }],
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
  ev('tool/result', 9, {
    callId: 'c8',
    error: { name: 'CommandError', code: 'E1' },
    content: [{ type: 'text', text: 'rollback failed: E1' }],
  }),
  assistant(10, 'rollback failed'),
  turnEnd(11, 2),
]

/** One `read` step whose result is prose-shaped Markdown (rendered by default). */
const readTurn = (): Ev[] => [
  user(1, 'read the doc'),
  turnStart(2, 1),
  toolCall(3, 'read', '{"path":"README.md"}'),
  toolResult(4, 'c3', '# Title\n\n- item'),
  turnEnd(5, 1),
]

/** Three tool steps so a filter can hide an expanded one. */
const threeSteps = (): Ev[] => [
  user(1, 'run tests'),
  turnStart(2, 1),
  toolCall(3, 'bash', 'npm test'),
  toolCall(4, 'bash', 'npm lint'),
  toolCall(5, 'read', 'package.json'),
  toolResult(6, 'c5', '# pkg\n\n- name'),
  assistant(7, 'all green'),
  turnEnd(8, 1),
]

function fakePrimitives(): PrimitivesModule {
  return {
    MarkdownText: (props) => <div data-testid="fake-md">{props.text}</div>,
    MarkdownDelegateProvider: (props) => <div>{props.children}</div>,
  }
}

/** One image result: `read_image` produced `a.png` (契约 §10.2/§10.5.1). */
const imageTurn = (): Ev[] => [
  user(1, 'look at the shot'),
  turnStart(2, 1),
  toolCall(3, 'read_image', '{"path":"a.png"}', 'c3'),
  ev('tool/result', 4, {
    callId: 'c3',
    content: [{
      type: 'image',
      attachment: {
        attachmentId: 'sha256:abc',
        mediaType: 'image/png',
        bytes: 2048,
        width: 100,
        height: 50,
        name: 'a.png',
      },
    }],
    contentBytes: 0,
  }),
  turnEnd(5, 1),
]

/** One clipped step: the wire preview is truncated on BOTH sides (§10.5.2). */
const truncatedTurn = (): Ev[] => [
  user(1, 'big file'),
  turnStart(2, 1),
  ev('tool/call', 3, {
    name: 'read',
    arguments: '{"path":"big.md"}',
    argsBytes: 99999,
    argsTruncated: true,
    callId: 'c3',
  }),
  ev('tool/result', 4, {
    callId: 'c3',
    content: [{ type: 'text', text: 'wire preview' }],
    contentBytes: 99999,
    contentTruncated: true,
  }),
  turnEnd(5, 1),
]

const FULL_DETAIL: ToolDetailItem = {
  seq: 3,
  callId: 'c3',
  name: 'read',
  arguments: '{"path":"big.md","full":true}',
  argsBytes: 99999,
  content: [{ type: 'text', text: 'full result body' }],
  contentBytes: 16,
  isError: false,
  error: null,
}

/** Two appends into the same call: `mergedFrom = 2`, no surfaceOp (F4). */
const mergedTurn = (): Ev[] => [
  user(1, 'stream'),
  turnStart(2, 1),
  toolCall(3, 'read', '{"path":"a.md"}', 'c3'),
  toolResult(4, 'c3', 'part one '),
  toolResult(5, 'c3', 'part two'),
  turnEnd(6, 1),
]

/** The same two appends, then a compaction replace → `mergedFrom` resets to 1. */
const replacedTurn = (): Ev[] => [
  user(1, 'stream'),
  turnStart(2, 1),
  toolCall(3, 'read', '{"path":"a.md"}', 'c3'),
  toolResult(4, 'c3', 'part one '),
  ev('tool/result', 5, {
    callId: 'c3',
    content: [{ type: 'text', text: '[compacted]' }],
    surfaceOp: { op: 'replace', startSeq: 4, endSeq: 4 },
    sourceEventSeqs: [4],
  }),
  turnEnd(6, 1),
]

// ── Shared DOM helpers for the v0.9 shell ───────────────────────────────

/** Wait until the header count line reports `count` turns (and return the cards). */
const readyTurns = async (count: number): Promise<HTMLElement[]> => {
  await waitFor(() => {
    expect(screen.getByTestId('ttl-count').textContent).toContain(`${count} turn`)
  })
  return screen.getAllByTestId('ttl-turn')
}

/** Click a step row (opening its band) and return the mounted `StepDetail`. */
const openStepDetail = async (index = 0): Promise<HTMLElement> => {
  const steps = await screen.findAllByTestId('ttl-step')
  fireEvent.click(steps[index])
  return screen.findByTestId('ttl-detail')
}

/** Switch the detail band to one of the four v0.9 tabs. */
const openDetailTab = (tab: 'summary' | 'result' | 'params' | 'raw'): void => {
  fireEvent.click(screen.getByTestId(`ttl-detail-tab-${tab}`))
}

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
      tab={{ id: 'trace-inspect' }}
      fetchEventsOverride={fetchEventsOverride}
    />,
  )
  return { fetchEventsOverride }
}

/** Mount the panel on the single clipped step, with an injected detail transport. */
const renderTruncatedTab = (fetchToolDetailOverride: FetchToolDetail): void => {
  render(
    <TrailTab
      ctx={{ get: () => undefined }}
      scope={{ sessionId: 's1' }}
      visible
      tab={{ id: 'trace-inspect' }}
      fetchEventsOverride={async (): Promise<{ events: SessionEventLike[] }> => ({ events: truncatedTurn() })}
      fetchToolDetailOverride={fetchToolDetailOverride}
    />,
  )
}

describe('TrailTab', () => {
  it('renders the empty state for a session without turns', async () => {
    renderTab([])
    const empty = await screen.findByTestId('ttl-empty')
    expect(empty.textContent).toContain('No foldable steps yet')
    expect(empty.textContent).toContain('Steps will appear here after you send a message')
    expect(within(empty).getByTestId('ttl-refresh').textContent).toBe('Refresh')
  })

  it('renders turn rows, the header count, and step numbers after load', async () => {
    renderTab(twoTurns())
    expect(screen.getByTestId('ttl-count').textContent).toContain('0 turn')
    const cards = await readyTurns(2)
    expect(cards).toHaveLength(2)
    // v0.9 header line: `N 轮 · M 步` (2 turns, 3 folded steps incl. the error row).
    expect(screen.getByTestId('ttl-count').textContent).toBe('2 turns · 3 steps')
    // Turn tags are the compact `#N` form.
    const tags = screen.getAllByTestId('ttl-turn-tag')
    expect(tags.map((el) => el.textContent)).toEqual(['#1', '#2'])
    // Input text appears in the header preview AND the expanded body's input row.
    expect(screen.getAllByText('deploy the service').length).toBeGreaterThan(0)
    expect(screen.getAllByText('rollback').length).toBeGreaterThan(0)
    const previews = screen.getAllByTestId('ttl-turn-preview')
    expect(previews.map((el) => el.textContent)).toEqual(['deploy the service', 'rollback'])
    // Latest turn (2) is expanded by default → its steps are visible.
    const steps = await screen.findAllByTestId('ttl-step')
    expect(steps.length).toBeGreaterThan(0)
    // Three-line card: the expanded turn carries a foot line (steps/failures).
    const foot = within(cards[1]).getByTestId('ttl-turn-foot')
    expect(foot.textContent).toContain('2 steps')
    expect(foot.textContent).toContain('1 failed')
    // The collapsed turn keeps the step count badge.
    expect(within(cards[0]).getByTestId('ttl-steps-count').textContent).toBe('1 step')
    expect(within(cards[1]).getByTestId('ttl-steps-count').textContent).toBe('2 steps')
  })

  it('summarises the session in the overview bar (steps/turns/failures/tool mix)', async () => {
    renderTab(twoTurns())
    await readyTurns(2)
    const summary = document.querySelector('.ttl-summary') as HTMLElement | null
    expect(summary).toBeTruthy()
    expect(summary?.querySelector('.ttl-summaryStat')?.textContent).toBe('3 steps · 2 turns')
    expect(summary?.querySelector('.ttl-summaryFail')?.textContent).toBe('1 failed')
    // Tool-family distribution: two bash calls → one shell segment + legend.
    expect(summary?.querySelectorAll('.ttl-distSeg')).toHaveLength(1)
    expect(summary?.querySelector('.ttl-legend')?.textContent).toContain('bash 2')
    // No wire timestamps in this fixture → no total duration is invented.
    expect(summary?.querySelector('.ttl-summaryDur')).toBeNull()
  })

  it('chips show counts; failed chip filters steps', async () => {
    renderTab(twoTurns())
    await readyTurns(2)
    const chips = screen.getByTestId('ttl-chips')
    expect(within(chips).getByText('All')).toBeTruthy()
    expect(within(chips).getByText('Failed')).toBeTruthy()
    expect(screen.getByTestId('ttl-chip-all').textContent).toBe('All3')
    expect(screen.getByTestId('ttl-chip-failed').textContent).toBe('Failed1')
    const failedChip = within(chips).getByTestId('ttl-chip-failed')
    fireEvent.click(failedChip)
    expect(failedChip.getAttribute('aria-pressed')).toBe('true')
    // After filtering to failed, only the error step remains visible.
    const steps = await screen.findAllByTestId('ttl-step')
    expect(steps.length).toBeGreaterThan(0)
    const errorSteps = steps.filter((el) => el.getAttribute('data-step-kind') === 'error')
    expect(errorSteps.length).toBeGreaterThan(0)
    // Failure is carried by the red family glyph inside the icon chip.
    expect(errorSteps[0].querySelector('.ttl-stepIcon .ttl-rowIcon.ttl-icon-red')).toBeTruthy()
    expect(steps.every((el) => el.getAttribute('data-step-kind') === 'error')).toBe(true)
  })

  it('failed chip only renders when failures exist', async () => {
    renderTab(oneTurn())
    await readyTurns(1)
    expect(within(screen.getByTestId('ttl-chips')).queryByTestId('ttl-chip-failed')).toBeNull()
  })

  it('failed turns are marked with a single error badge', async () => {
    renderTab(twoTurns())
    await readyTurns(2)
    const badges = screen.getAllByTestId('ttl-error-dot')
    expect(badges).toHaveLength(1)
    expect(badges[0].textContent).toBe('✗1')
  })

  it('keeps the input row in the expanded body and locates through the header', async () => {
    renderTab(oneTurn())
    const row = await screen.findByTestId('ttl-item-input')
    // v0.9 still renders the input row as the body's first element, but CSS
    // hides it while the turn is expanded
    // (`.ttl-turn[data-collapsed="false"] .ttl-itemInput { display: none }`),
    // so the visible locate entry point is the turn header's ↗ (ttl-locate).
    const body = row.parentElement as HTMLElement
    expect(body.firstElementChild).toBe(row)
    expect(row.textContent).toContain('deploy the service')
    fireEvent.click(screen.getByTestId('ttl-locate'))
    const bar = await screen.findByTestId('ttl-statusbar')
    await waitFor(() => { expect(bar.textContent).toContain('Could not locate that message') })
    // Under a tool filter the input row is not rendered at all.
    fireEvent.click(screen.getByTestId('ttl-chip-bash'))
    expect(screen.queryByTestId('ttl-item-input')).toBeNull()
  })

  it('follow-latest toggle flips aria-pressed and its label', async () => {
    renderTab(twoTurns())
    await readyTurns(2)
    const toggle = screen.getByTestId('ttl-follow-toggle')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(toggle.textContent).toBe('Follow')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    expect(toggle.textContent).toBe('Follow paused')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
  })

  it('moves the "new updates" button into the status bar while follow is paused', async () => {
    renderTab(twoTurns())
    await readyTurns(2)
    expect(screen.queryByTestId('ttl-to-bottom')).toBeNull()
    const list = screen.getByTestId('ttl-list') as HTMLElement
    // jsdom has no layout: fake a scrolled-away list so the scroll handler
    // marks follow as paused (v0.9 renders the button inside the status bar).
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1200 })
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: 400 })
    Object.defineProperty(list, 'scrollTop', { configurable: true, writable: true, value: 0 })
    fireEvent.scroll(list)
    const button = await screen.findByTestId('ttl-to-bottom')
    expect(screen.getByTestId('ttl-statusbar').contains(button)).toBe(true)
    expect(button.textContent).toBe('New updates ↓')
    fireEvent.click(button)
    await waitFor(() => { expect(screen.queryByTestId('ttl-to-bottom')).toBeNull() })
  })

  it('shows an error state with retry that recovers', async () => {
    renderTab(twoTurns(), true)
    const card = await screen.findByTestId('ttl-error')
    expect(card.textContent).toContain('Failed to load the trail')
    expect(card.textContent).toContain('network down')
    expect(card.textContent).toContain('Retrying only re-pulls events')
    expect(within(card).getByTestId('ttl-error-copy').textContent).toBe('Copy error')
    fireEvent.click(screen.getByTestId('ttl-retry'))
    await readyTurns(2)
  })

  it('flat tool steps render one row each with the v0.9 row anatomy', async () => {
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
    // Each row leads with its family tinted icon chip (ToolIcon inside).
    expect(steps[0].querySelector('.ttl-stepIcon .ttl-rowIcon')).toBeTruthy()
    expect(steps[0].querySelector('.ttl-stepName')?.textContent).toBe('bash')
    expect(steps[0].querySelector('.ttl-stepDesc')?.textContent).toBe('npm test')
    expect(steps[2].querySelector('.ttl-stepName')?.textContent).toBe('read')
    expect(steps[2].querySelector('.ttl-stepDesc')?.textContent).toBe('package.json')
    // Assistant messages render as output rows in the same body.
    expect(screen.getAllByTestId('ttl-item-output').length).toBeGreaterThan(0)
  })

  it('clicking a step row expands its inline detail band instead of jumping (AC8)', async () => {
    renderTab(oneTurn())
    const step = await screen.findByTestId('ttl-step')
    expect(step.getAttribute('aria-expanded')).toBe('false')
    // Collapsed row: the wrap holds the row + the locate affordance only.
    const wrap = step.parentElement as HTMLElement
    expect(wrap.getAttribute('data-testid')).toBe('ttl-step-wrap')
    expect(wrap.querySelector('[data-testid="ttl-detail"]')).toBeNull()
    fireEvent.click(step)
    const detail = await screen.findByTestId('ttl-detail')
    expect(step.getAttribute('aria-expanded')).toBe('true')
    // aria-controls really points at the mounted band.
    expect(document.getElementById(step.getAttribute('aria-controls') as string)).toBe(detail)
    expect(detail.getAttribute('role')).toBe('region')
    expect(detail.getAttribute('aria-label')).toBe('bash details')
    // The row click performs NO locate: the status bar keeps its sync copy.
    expect(screen.getByTestId('ttl-statusbar').textContent).toContain('Read-only · event stream synced')
    expect(screen.queryByText('Could not locate that message')).toBeNull()
    // Clicking the row again collapses it.
    fireEvent.click(step)
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
  })

  it('the detail band exposes the four v0.9 tabs and defaults to summary', async () => {
    renderTab(oneTurn())
    const detail = await openStepDetail()
    expect(detail.getAttribute('data-tab')).toBe('summary')
    const tabs = (['summary', 'result', 'params', 'raw'] as const).map((tab) => screen.getByTestId(`ttl-detail-tab-${tab}`))
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Summary', 'Result', 'Params', 'Raw'])
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('ttl-detail-body-summary')).toBeTruthy()
    // seq is visible twice: status row + footer.
    expect(screen.getByTestId('ttl-detail-seq').textContent).toBe('seq #3')
    expect(screen.getByTestId('ttl-detail-foot-seq').textContent).toBe('seq #3')
    openDetailTab('params')
    expect(screen.getByTestId('ttl-detail-tab-params').getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('ttl-detail-body-params')).toBeTruthy()
  })

  it('the row-end ↗ still locates the step in the conversation (AC8)', async () => {
    renderTab(oneTurn())
    const jump = await screen.findByTestId('ttl-step-jump')
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
    fireEvent.click(jump)
    const bar = await screen.findByTestId('ttl-statusbar')
    await waitFor(() => { expect(bar.textContent).toContain('Could not locate that message') })
    // Locating never opens the band.
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
  })

  it('plain click keeps one band open; Alt+click opens several (AC8)', async () => {
    renderTab(threeSteps())
    const steps = await screen.findAllByTestId('ttl-step')
    expect(steps.length).toBe(3)
    fireEvent.click(steps[0])
    expect(await screen.findAllByTestId('ttl-detail')).toHaveLength(1)
    fireEvent.click(steps[1])
    expect(screen.getAllByTestId('ttl-detail')).toHaveLength(1)
    expect(screen.getAllByTestId('ttl-step-wrap')[1].getAttribute('data-open')).toBe('true')
    fireEvent.click(steps[0], { altKey: true })
    expect(screen.getAllByTestId('ttl-detail')).toHaveLength(2)
  })

  it('ArrowRight expands and ArrowLeft collapses the step (AC18)', async () => {
    renderTab(oneTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.keyDown(step, { key: 'ArrowRight' })
    expect(await screen.findByTestId('ttl-detail')).toBeTruthy()
    expect(step.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(step, { key: 'ArrowLeft' })
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
    expect(step.getAttribute('aria-expanded')).toBe('false')
  })

  it('remembers the rendered/raw view per step across collapse (AC12)', async () => {
    setPrimitivesForTest(fakePrimitives())
    renderTab(readTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.click(step)
    await screen.findByTestId('ttl-detail')
    // v0.9 opens on 摘要; the rendered/raw switch lives in 结果.
    openDetailTab('result')
    expect(await screen.findByTestId('ttl-md')).toBeTruthy()
    const toggle = screen.getByTestId('ttl-view-toggle')
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(toggle)
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    expect(screen.getByTestId('ttl-md-raw').textContent).toContain('# Title')
    // Collapse + reopen: the switched view is remembered, not re-seeded.
    fireEvent.click(step)
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
    fireEvent.click(step)
    await screen.findByTestId('ttl-detail')
    expect(screen.getByTestId('ttl-detail').getAttribute('data-tab')).toBe('summary')
    openDetailTab('result')
    await waitFor(() => { expect(screen.getByTestId('ttl-view-toggle').getAttribute('aria-pressed')).toBe('false') })
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    expect(screen.getByTestId('ttl-md-raw').textContent).toContain('# Title')
  })

  it('an error step shows errorName · errorCode plus the raw text (AC14)', async () => {
    renderTab(twoTurns())
    await readyTurns(2)
    const steps = await screen.findAllByTestId('ttl-step')
    const errorStep = steps.find((el) => el.getAttribute('data-step-kind') === 'error') as HTMLElement
    expect(errorStep).toBeTruthy()
    // The error row leads with the red family glyph.
    expect(errorStep.querySelector('.ttl-stepIcon .ttl-rowIcon.ttl-icon-red')).toBeTruthy()
    fireEvent.click(errorStep)
    await screen.findByTestId('ttl-detail')
    openDetailTab('result')
    const block = await screen.findByTestId('ttl-error-block')
    expect(screen.getByTestId('ttl-error-name').textContent).toBe('CommandError · E1')
    expect(within(block).getByTestId('ttl-md-raw').textContent).toContain('rollback failed: E1')
  })

  it('a failed tool result leads with the prototype alert glyph, not its family glyph (v0.10.2)', async () => {
    renderTab([
      user(1, 'run tests'),
      turnStart(2, 1),
      toolCall(3, 'bash', 'npm test', 'c3'),
      // An isError tool/result keeps the step a `tool` step (no wire `error`),
      // which is exactly the case the prototype draws as ⚠ on the red chip.
      ev('tool/result', 4, {
        callId: 'c3',
        message: { isError: true },
        content: [{ type: 'text', text: 'exit 1' }],
      }),
      turnEnd(5, 1),
    ])
    const step = await screen.findByTestId('ttl-step')
    // The row still marks itself failed (red chip, ✗) but the leading glyph is
    // the prototype's ⚠ triangle — the terminal family glyph must be gone.
    expect(step.getAttribute('data-step-kind')).toBe('error')
    const glyph = step.querySelector('.ttl-stepIcon .ttl-rowIcon.ttl-icon-red svg path')
    expect(glyph?.getAttribute('d') ?? '').toContain('M10.29 3.86')
    expect(step.querySelector('.ttl-stepIcon svg polyline')).toBeNull()
  })

  it('an orphan result renders a placeholder row with the orphan hint', async () => {
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      toolResult(3, 'zz-unknown', 'orphan output'),
      turnEnd(4, 1),
    ])
    const step = await screen.findByTestId('ttl-step')
    expect(step.textContent).toContain('tool')
    fireEvent.click(step)
    await screen.findByTestId('ttl-detail')
    // The orphan warning lives on the 原始 pane (next to the raw payloads).
    openDetailTab('raw')
    expect(await screen.findByTestId('ttl-detail-orphan')).toBeTruthy()
    expect(screen.getByTestId('ttl-detail-pill')).toBeTruthy()
  })

  it('the params tab renders the JSON tree, else raw text with the hint', async () => {
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      toolCall(3, 'bash', '{"cmd":"ls"}', 'c3'),
      toolCall(4, 'bash', 'not json at all', 'c4'),
      turnEnd(5, 1),
    ])
    const steps = await screen.findAllByTestId('ttl-step')
    fireEvent.click(steps[0])
    await screen.findByTestId('ttl-detail')
    openDetailTab('params')
    expect(await screen.findByTestId('ttl-json')).toBeTruthy()
    expect(screen.getByTestId('ttl-json').textContent).toContain('cmd')
    expect(screen.getByTestId('ttl-json').textContent).toContain('ls')
    // Unparseable arguments degrade to the raw text plus the hint.
    fireEvent.click(steps[1])
    expect(screen.getAllByTestId('ttl-detail')).toHaveLength(1)
    openDetailTab('params')
    expect(await screen.findByTestId('ttl-detail-unparsable')).toBeTruthy()
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe('not json at all')
  })

  it('a filter that hides an expanded step drops its detail band', async () => {
    renderTab(threeSteps())
    const steps = await screen.findAllByTestId('ttl-step')
    const readStep = steps.find((el) => el.querySelector('.ttl-stepName')?.textContent === 'read') as HTMLElement
    expect(readStep).toBeTruthy()
    fireEvent.click(readStep)
    expect(await screen.findAllByTestId('ttl-detail')).toHaveLength(1)
    fireEvent.click(screen.getByTestId('ttl-chip-bash'))
    await waitFor(() => { expect(screen.queryByTestId('ttl-detail')).toBeNull() })
  })

  it('search filters steps across name/args/result and shows the empty-filtered state', async () => {
    renderTab(threeSteps())
    await readyTurns(1)
    const search = screen.getByTestId('ttl-search') as HTMLInputElement
    // ⌘F focuses the search field.
    fireEvent.keyDown(window, { key: 'f', metaKey: true })
    expect(document.activeElement).toBe(search)
    // Substring over the clipped arguments → only the `read` row survives.
    fireEvent.change(search, { target: { value: 'package' } })
    await waitFor(() => { expect(screen.getAllByTestId('ttl-step')).toHaveLength(1) })
    expect(screen.getByTestId('ttl-step').querySelector('.ttl-stepName')?.textContent).toBe('read')
    // No match → the dedicated empty state, with the search field still there.
    fireEvent.change(search, { target: { value: 'zzz-no-match' } })
    expect(await screen.findByTestId('ttl-empty-filtered')).toBeTruthy()
    expect(screen.getByTestId('ttl-search')).toBeTruthy()
    fireEvent.click(screen.getByTestId('ttl-clear-filter'))
    await waitFor(() => { expect(screen.getAllByTestId('ttl-step').length).toBeGreaterThan(0) })
    expect((screen.getByTestId('ttl-search') as HTMLInputElement).value).toBe('')
  })

  it('caps a huge expanded turn and offers a show-earlier affordance', async () => {
    // STEP_CAP = 250 rows mounted per expanded turn; the earlier rows stay
    // behind a single button instead of bloating the DOM.
    const events: Ev[] = [user(1, 'many calls'), turnStart(2, 1)]
    for (let index = 0; index < 260; index += 1) {
      events.push(toolCall(3 + index, 'bash', `echo ${index}`, `c${3 + index}`))
    }
    events.push(turnEnd(300, 1))
    renderTab(events as SessionEventLike[])
    expect(await screen.findAllByTestId('ttl-step')).toHaveLength(250)
    const earlier = await screen.findByTestId('ttl-show-earlier')
    expect(earlier.textContent).toBe('Show 10 earlier')
    fireEvent.click(earlier)
    await waitFor(() => { expect(screen.getAllByTestId('ttl-step')).toHaveLength(260) })
  })

  it('collapsing the latest turn does NOT expand the earlier turns', async () => {
    renderTab(twoTurns())
    const cards = await readyTurns(2)
    // Latest (turn 2) is expanded by default; turn 1 stays collapsed.
    expect(cards[1].getAttribute('data-collapsed')).toBe('false')
    expect(cards[0].getAttribute('data-collapsed')).toBe('true')
    // Fold the latest turn through its head tag.
    fireEvent.click(within(cards[1]).getByTestId('ttl-turn-tag'))
    const after = screen.getAllByTestId('ttl-turn')
    // Both collapsed — turn 1 must NOT have been force-expanded.
    expect(after[1].getAttribute('data-collapsed')).toBe('true')
    expect(after[0].getAttribute('data-collapsed')).toBe('true')
  })

  it('clicking an earlier turn expands it while the latest stays expanded', async () => {
    renderTab(twoTurns())
    const cards = await readyTurns(2)
    fireEvent.click(within(cards[0]).getByTestId('ttl-turn-tag'))
    const after = screen.getAllByTestId('ttl-turn')
    expect(after[0].getAttribute('data-collapsed')).toBe('false')
    expect(after[1].getAttribute('data-collapsed')).toBe('false')
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
        tab={{ id: 'trace-inspect' }}
        fetchEventsOverride={fetchEventsOverride}
      />,
    )
    const cards = await readyTurns(2)
    expect(cards).toHaveLength(2)
    expect(screen.getAllByTestId('ttl-turn-tag').map((el) => el.textContent)).toEqual(['#1', '#2'])
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
        tab={{ id: 'trace-inspect' }}
        fetchEventsOverride={fetchEventsOverride}
      />,
    )
    await readyTurns(total)
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
        tab={{ id: 'trace-inspect' }}
        fetchEventsOverride={fetchEventsOverride}
      />,
    )
    await readyTurns(1)
    // Wait past the throttle window: no third pull may fire.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(calls).toBe(MAX_PULL_PAGES * 2)
    // Duplicates were dropped by the watermark and the panel stays healthy.
    expect(screen.queryByTestId('ttl-error')).toBeNull()
  })

  // ── v0.5.0 · image thumbnails (契约 §10.5.1) ───────────────────────────

  it('renders an image block as a lazy session-authorized thumbnail plus its metadata', async () => {
    renderTab(imageTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.click(step)
    await screen.findByTestId('ttl-detail')
    // Image blocks live on the 结果 pane in v0.9.
    openDetailTab('result')

    const thumb = (await screen.findByTestId('ttl-img-thumb')) as HTMLImageElement
    expect(thumb.getAttribute('loading')).toBe('lazy')
    expect(thumb.className).toBe('ttl-imgThumb')
    expect(thumb.getAttribute('src')).toBe('/trace-inspect/api/attachment?sessionId=s1&attachmentId=sha256%3Aabc')
    expect(thumb.getAttribute('alt')).toBe('Image: a.png')
    expect(thumb.parentElement?.className).toBe('ttl-imgThumbWrap')
    // The metadata/chip row stays visible underneath the thumbnail.
    const chip = screen.getByTestId('ttl-img-chip')
    expect(chip.textContent).toContain('Image: a.png')
    expect(chip.textContent).toContain('image/png')
    expect(chip.textContent).toContain('100×50 · 2 KB')
    expect(screen.queryByTestId('ttl-img-failed')).toBeNull()
  })

  it('an image that fails to load hides the img, keeps the chip and warns', async () => {
    renderTab(imageTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.click(step)
    await screen.findByTestId('ttl-detail')
    openDetailTab('result')

    const thumb = await screen.findByTestId('ttl-img-thumb')
    fireEvent.error(thumb)
    expect(screen.queryByTestId('ttl-img-thumb')).toBeNull()
    expect(screen.queryByTestId('ttl-img-thumb-wrap')).toBeNull()
    expect(screen.getByTestId('ttl-img-chip').textContent).toContain('Image: a.png')
    expect(screen.getByTestId('ttl-img-failed').textContent).toBe('Image failed to load — metadata only')
  })

  // ── v0.5.0 · on-demand full detail (契约 §10.5.2) ──────────────────────

  it('loads the untruncated detail on open and swaps both panes over to it', async () => {
    const detail = vi.fn<FetchToolDetail>(async () => ({ ok: true, items: [FULL_DETAIL] }))
    renderTruncatedTab(detail)
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    openDetailTab('result')

    // Success: the footer pill flips to 已加载, the truncation banner is gone.
    await waitFor(() => { expect(screen.getByTestId('ttl-detail-pill').textContent).toBe('Loaded') })
    expect(screen.queryByTestId('ttl-detail-load')).toBeNull()
    expect(screen.getByTestId('ttl-md-raw').textContent).toContain('full result body')

    // 参数 now renders the complete arguments, not the clipped wire preview
    // (the wire value was `{"path":"big.md"}` — the `full` key proves the swap).
    openDetailTab('params')
    const params = screen.getByTestId('ttl-detail-body-params')
    expect(params.querySelector('[data-testid="ttl-json"]')).toBeTruthy()
    expect(params.textContent).toContain('full')

    expect(detail).toHaveBeenCalledTimes(1)
    expect(detail.mock.calls[0][0]).toBe('s1')
    expect(detail.mock.calls[0][1]).toEqual([3])
  })

  it('shows the loading strip while the full detail is in flight', async () => {
    let settle: (outcome: ToolDetailResult) => void = () => undefined
    const pending = new Promise<ToolDetailResult>((resolve) => { settle = resolve })
    renderTruncatedTab(() => pending)
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    // The truncation banner (and its load strip) is part of 结果 / 参数.
    openDetailTab('result')

    const strip = await screen.findByTestId('ttl-detail-load')
    expect(strip.textContent).toContain('Loading full content…')
    // The wire preview stays on screen during the load.
    expect(screen.getByTestId('ttl-md-raw').textContent).toContain('wire preview')

    await act(async () => { settle({ ok: true, items: [] }) })
    // An answer without a matching item degrades to the failure branch.
    expect(await screen.findByTestId('ttl-detail-retry')).toBeTruthy()
  })

  it('keeps the preview and offers one retry when the full detail fails', async () => {
    const detail = vi.fn(async (): Promise<ToolDetailResult> => ({ ok: false, reason: 'network' }))
    renderTruncatedTab(detail)
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    openDetailTab('result')

    const banner = await screen.findByTestId('ttl-bannerWarn')
    expect(banner.textContent).toContain('Result truncated to 32 KiB')
    expect(banner.textContent).toContain('Failed to load full content — showing the truncated preview')
    expect(screen.getByTestId('ttl-md-raw').textContent).toContain('wire preview')
    const retry = (await screen.findByTestId('ttl-detail-retry')) as HTMLButtonElement
    expect(retry.textContent).toBe('Retry')
    expect(retry.disabled).toBe(false)

    // The user's single retry goes through and the panes update.
    detail.mockResolvedValueOnce({ ok: true, items: [FULL_DETAIL] })
    fireEvent.click(retry)
    await waitFor(() => { expect(screen.getByTestId('ttl-detail-pill').textContent).toBe('Loaded') })
    expect(detail).toHaveBeenCalledTimes(2)
  })

  it('spends at most one user-triggered retry (no automatic re-fetch loop)', async () => {
    const detail = vi.fn(async (): Promise<ToolDetailResult> => ({ ok: false, reason: 'http' }))
    renderTruncatedTab(detail)
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    openDetailTab('result')

    fireEvent.click(await screen.findByTestId('ttl-detail-retry'))
    await waitFor(() => {
      expect((screen.getByTestId('ttl-detail-retry') as HTMLButtonElement).disabled).toBe(true)
    })
    // One automatic call + exactly one user retry.
    expect(detail).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByTestId('ttl-detail-retry'))
    expect(detail).toHaveBeenCalledTimes(2)
  })

  it('never asks for the full detail of a step that was not clipped', async () => {
    const detail = vi.fn(async (): Promise<ToolDetailResult> => ({ ok: true, items: [FULL_DETAIL] }))
    render(
      <TrailTab
        ctx={{ get: () => undefined }}
        scope={{ sessionId: 's1' }}
        visible
        tab={{ id: 'trace-inspect' }}
        fetchEventsOverride={async (): Promise<{ events: SessionEventLike[] }> => ({ events: oneTurn() })}
        fetchToolDetailOverride={detail}
      />,
    )
    fireEvent.click(await screen.findByTestId('ttl-step'))
    expect(await screen.findByTestId('ttl-detail')).toBeTruthy()
    expect(detail).not.toHaveBeenCalled()
    expect(screen.queryByTestId('ttl-detail-load')).toBeNull()
  })

  // ── v0.5.0 · F4 hint (契约 §10.5.3) ────────────────────────────────────

  it('flags merged content that never declared a surfaceOp (F4)', async () => {
    renderTab(mergedTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    openDetailTab('result')
    const note = await screen.findByTestId('ttl-detail-merged')
    expect(note.getAttribute('role')).toBe('note')
    expect(note.textContent).toBe('Merged from 2 results — the events declared no surfaceOp')
    expect(note.className).toContain('ttl-detailMerged')
  })

  it('does not flag merged content once a replace owns the result', async () => {
    renderTab(replacedTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    openDetailTab('raw')
    expect(await screen.findByTestId('ttl-detail-replaced')).toBeTruthy()
    expect(screen.queryByTestId('ttl-detail-merged')).toBeNull()
  })

  // ── v0.5.0 · zoom entries (契约 §10.5.4) ───────────────────────────────

  it('the detail footer ⤢ opens the overlay and Esc returns focus to the row', async () => {
    renderTab(threeSteps())
    const steps = await screen.findAllByTestId('ttl-step')
    fireEvent.click(steps[0])
    const zoomButton = await screen.findByTestId('ttl-detail-zoom')
    expect(zoomButton.getAttribute('title')).toBe('Open zoomed view')
    expect(zoomButton.getAttribute('aria-label')).toBe('Open zoomed view')

    fireEvent.click(zoomButton)
    const dialog = await screen.findByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-label')).toBe('bash · step details')
    // The outline is the whole current turn (3 steps), not just the open one.
    expect(screen.getAllByTestId('ttl-zoom-step')).toHaveLength(3)
    expect(screen.getByTestId('ttl-zoom-title').textContent).toBe('bash')

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => { expect(screen.queryByTestId('ttl-zoom')).toBeNull() })
    expect(document.activeElement).toBe(steps[0])
  })

  it('⌘⇧O on a focused step row opens the overlay on that step', async () => {
    renderTab(threeSteps())
    const steps = await screen.findAllByTestId('ttl-step')
    fireEvent.keyDown(steps[2], { key: 'O', shiftKey: true, metaKey: true })
    const dialog = await screen.findByRole('dialog')
    expect(dialog.getAttribute('aria-label')).toBe('read · step details')
    expect(screen.getByTestId('ttl-zoom-title').textContent).toContain('read')
    // The row itself never expanded (⌘⇧O is not a disclosure key).
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
  })
})

// ── v0.6.0: output rows expand, and the centered viewer is reachable ──────
describe('TrailTab — row semantics and centered viewer (v0.6.0)', () => {
  const markdownTurn = (): Ev[] => [
    user(1, 'read the readme'),
    turnStart(2, 1),
    toolCall(3, 'read', '{"file_path":"/Users/me/project/README.md"}', 'c3'),
    toolResult(4, 'c3', '# Title\n\nSome **bold** text'),
    turnEnd(5, 1),
  ]

  it('clicking an output row reveals the full text inline; ↗ keeps the locate action', async () => {
    const long = `first line\n${'detail '.repeat(300)}`
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      assistant(3, long),
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-item-output')
    expect(screen.queryByTestId('ttl-output-body')).toBeNull()
    fireEvent.click(row)
    const body = await screen.findByTestId('ttl-output-body')
    expect(body.textContent).toContain('detail detail')
    expect(row.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(row)
    expect(screen.queryByTestId('ttl-output-body')).toBeNull()
    // The locate affordance moved to its own sibling button.
    expect(screen.getByTestId('ttl-output-jump')).toBeTruthy()
  })

  it('the toolbar opens the centered viewer on the tab that is active', async () => {
    renderTab(oneTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    // v0.9 opens on 摘要.
    expect(screen.getByTestId('ttl-detail-tab-summary').getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByTestId('ttl-detail-view-center'))
    expect(await screen.findByTestId('ttl-zoom')).toBeTruthy()
    expect(screen.getByTestId('ttl-zoom-tab-summary').getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('ttl-zoom')).toBeNull()
  })

  it('clicking the pane opens the viewer, but a control inside the pane does not', async () => {
    renderTab(markdownTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    // Markdown result → the 结果 pane offers the 渲染/原文 switch.
    openDetailTab('result')
    fireEvent.click(await screen.findByTestId('ttl-view-toggle'))
    expect(screen.queryByTestId('ttl-zoom')).toBeNull() // a control click must not open the viewer
    fireEvent.click(screen.getByTestId('ttl-pane-clickable'))
    expect(await screen.findByTestId('ttl-zoom')).toBeTruthy()
    expect(screen.getByTestId('ttl-zoom-tab-result').getAttribute('aria-selected')).toBe('true')
  })

  it('renders the tool summary instead of the raw argument JSON', async () => {
    renderTab(markdownTurn())
    const row = await screen.findByTestId('ttl-step')
    expect(row.querySelector('.ttl-stepName')?.textContent).toBe('read')
    expect(row.querySelector('.ttl-stepDesc')?.textContent).toBe('README.md')
    expect(row.querySelector('.ttl-stepIcon .ttl-rowIcon')).toBeTruthy()
    expect(row.getAttribute('title')).toBe('{"file_path":"/Users/me/project/README.md"}')
  })
})

// ── v0.8.0: parallel tool-call batches (assistant-step grouping) ──────────
describe('TrailTab — parallel tool-call batches (v0.8.0)', () => {
  /** A model-issued call: `data.turn` + `data.step` carry the batch identity. */
  const stepCall = (
    seq: number,
    name: string,
    args: string,
    callId: string,
    turn: number,
    step: number,
  ): Ev => ev('tool/call', seq, { name, arguments: args, callId, turn, step })

  /** read + read in assistant step 1, then one bash in step 2. */
  const mixedTurn = (): Ev[] => [
    user(1, 'scan the repo'),
    turnStart(2, 1),
    stepCall(3, 'read', '{"file_path":"a.md"}', 'c3', 1, 1),
    stepCall(4, 'read', '{"file_path":"b.md"}', 'c4', 1, 1),
    toolResult(5, 'c3', 'A'),
    toolResult(6, 'c4', 'B'),
    stepCall(7, 'bash', '{"command":"ls"}', 'c7', 1, 2),
    toolResult(8, 'c7', 'files'),
    assistant(9, 'done'),
    turnEnd(10, 1),
  ]

  it('groups same-step calls under a ∥ caption (same level) and badges the header', async () => {
    renderTab(mixedTurn())
    const groups = await screen.findAllByTestId('ttl-parallel-group')
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-step')).toBe('1')
    // Same-level layout: the batch holds its rows directly (no nested wrapper indent).
    expect(groups[0].querySelector('.ttl-parallelBody')?.querySelectorAll('[data-testid="ttl-step"]')).toHaveLength(2)
    // v0.9.3: the batch has no visible caption row — semantics live on the
    // group itself (aria-label + title) and the amber bracket in styles.ts.
    expect(within(groups[0]).queryByTestId('ttl-parallel-head')).toBeNull()
    expect(groups[0].getAttribute('aria-label')).toBe('Parallel ×2')
    expect(groups[0].getAttribute('title')).toContain('2 tool calls issued in one assistant step')
    // The batch holds exactly its two rows; the later bash row is outside it.
    expect(within(groups[0]).getAllByTestId('ttl-step')).toHaveLength(2)
    expect(screen.getAllByTestId('ttl-step')).toHaveLength(3)
    // Header badge: one batch / two calls, visible while the turn is expanded.
    const badge = screen.getByTestId('ttl-turn-parallel')
    expect(badge.textContent).toBe('∥1')
    expect(badge.getAttribute('title')).toBe('1 parallel group · 2 calls')
  })

  it('counts every batch of a turn and separates them across an assistant output', async () => {
    renderTab([
      user(1, 'two rounds'),
      turnStart(2, 1),
      stepCall(3, 'read', '{"file_path":"a"}', 'c3', 1, 1),
      stepCall(4, 'read', '{"file_path":"b"}', 'c4', 1, 1),
      toolResult(5, 'c3', 'A'),
      toolResult(6, 'c4', 'B'),
      assistant(7, 'round 2'),
      stepCall(8, 'read', '{"file_path":"c"}', 'c8', 1, 2),
      stepCall(9, 'read', '{"file_path":"d"}', 'c9', 1, 2),
      toolResult(10, 'c8', 'C'),
      toolResult(11, 'c9', 'D'),
      turnEnd(12, 1),
    ])
    expect((await screen.findByTestId('ttl-turn-parallel')).textContent).toBe('∥2')
    const groups = await screen.findAllByTestId('ttl-parallel-group')
    expect(groups.map((group) => group.getAttribute('data-step'))).toEqual(['1', '2'])
    expect(groups.map((group) => within(group).getAllByTestId('ttl-step')).map((rows) => rows.length)).toEqual([2, 2])
  })

  it('keeps the badge on a collapsed turn (no rows mounted)', async () => {
    renderTab([
      ...mixedTurn(),
      user(20, 'next'),
      turnStart(21, 2),
      toolCall(22, 'bash', '{"command":"pwd"}', 'c22'),
      toolResult(23, 'c22', '/'),
      turnEnd(24, 2),
    ])
    const turns = await readyTurns(2)
    expect(turns[0].getAttribute('data-collapsed')).toBe('true')
    const badge = within(turns[0]).getByTestId('ttl-turn-parallel')
    expect(badge.textContent).toBe('∥1')
    expect(within(turns[0]).queryByTestId('ttl-parallel-group')).toBeNull()
  })

  it('no badge and no group on legacy logs without turn/step', async () => {
    renderTab(threeSteps())
    await readyTurns(1)
    expect(screen.getAllByTestId('ttl-turn-tag').map((el) => el.textContent)).toEqual(['#1'])
    expect(screen.queryByTestId('ttl-turn-parallel')).toBeNull()
    expect(screen.queryByTestId('ttl-parallel-group')).toBeNull()
  })

  it('tool chips re-group the visible rows: both reads stay grouped, bash alone is flat', async () => {
    renderTab(mixedTurn())
    await screen.findAllByTestId('ttl-step')
    fireEvent.click(screen.getByTestId('ttl-chip-read'))
    const group = await screen.findByTestId('ttl-parallel-group')
    expect(within(group).getAllByTestId('ttl-step').map((row) => row.textContent)).toHaveLength(2)
    expect(screen.getAllByTestId('ttl-step')).toHaveLength(2)
    fireEvent.click(screen.getByTestId('ttl-chip-bash'))
    expect(await screen.findByTestId('ttl-step')).toBeTruthy()
    expect(screen.queryByTestId('ttl-parallel-group')).toBeNull()
    expect(screen.getAllByTestId('ttl-step')).toHaveLength(1)
  })

  it('a grouped row keeps expand + locate behaviour', async () => {
    renderTab(mixedTurn())
    const group = await screen.findByTestId('ttl-parallel-group')
    const row = within(group).getAllByTestId('ttl-step')[0]
    fireEvent.click(row)
    const detail = await screen.findByTestId('ttl-detail')
    expect(detail).toBeTruthy()
    expect(within(group).getAllByTestId('ttl-step-jump')).toHaveLength(2)
  })

  it('renders the zh caption inside a Chinese host', async () => {
    const previous = document.documentElement.lang
    document.documentElement.lang = 'zh'
    try {
      renderTab(mixedTurn())
      const groups = await screen.findAllByTestId('ttl-parallel-group')
      expect(groups).toHaveLength(1)
      expect(groups[0].getAttribute('aria-label')).toBe('并行 ×2')
      expect(groups[0].getAttribute('title')).toContain('同一助手步骤内下发的 2 个工具调用')
      expect(screen.getByTestId('ttl-turn-parallel').getAttribute('title')).toBe('1 组并行调用 · 共 2 次')
    } finally {
      document.documentElement.lang = previous
    }
  })
})

/** A tool whose result is whole-document JSON (the interrupt_agent shape). */
const jsonOutputTurn = (): Ev[] => [
  user(1, 'check the agent'),
  turnStart(2, 1),
  toolCall(3, 'mcp__agent__interrupt_agent', '{"target":"x"}', 'c3'),
  toolResult(4, 'c3', '{"previousStatus":"running","id":7}'),
  turnEnd(5, 1),
]

describe('tool output formatting (JSON → Markdown → text)', () => {
  it('pretty-prints JSON in the summary preview and renders JsonPretty in 结果', async () => {
    renderTab(jsonOutputTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    const out = await screen.findByTestId('ttl-outBlock')
    // Pretty-printed: multiple rows with indented keys, not one raw JSON line.
    const rows = out.querySelectorAll('.ttl-outLine')
    expect(rows.length).toBeGreaterThan(1)
    expect(out.textContent).toContain('"previousStatus": "running"')
    openDetailTab('result')
    expect(document.querySelector('.ttl-jsonPretty')).not.toBeNull()
  })
})

describe('tab visibility (React #300 regression)', () => {
  it('keeps hook order when the tab is hidden and shown again', () => {
    const props = {
      ctx: { get: () => undefined },
      scope: { sessionId: 's1' },
      tab: { id: 'trace-inspect' },
      fetchEventsOverride: async (): Promise<{ events: SessionEventLike[] }> => ({ events: oneTurn() as SessionEventLike[] }),
    }
    const { rerender } = render(<TrailTab {...props} visible={false} />)
    // hidden tab renders nothing, but must not skip hooks
    expect(screen.queryByTestId('ttl-root')).toBeNull()
    rerender(<TrailTab {...props} visible />)
    expect(screen.getByTestId('ttl-root')).toBeTruthy()
  })
})
