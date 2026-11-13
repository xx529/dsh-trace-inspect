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
 * `StepDetail.tsx` (tabs are `ttl-detail-tab-{summary,raw}` — v0.10.29 merged
 * 结果 / 参数 into 摘要,
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
import { projectEvent } from '../src/wire'

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
const openDetailTab = (tab: 'summary' | 'raw'): void => {
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
    // Collapsed cards keep the 2-line preview; the expanded card swaps it for
    // the body's input row (v0.10.5), so it has no preview text of its own.
    const previews = screen.getAllByTestId('ttl-turn-preview')
    expect(previews.map((el) => el.textContent)).toEqual(['deploy the service'])
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
    // v0.10.20: the stats paint from the same cluster ink as the rows.
    expect(summary?.querySelectorAll('.ttl-distSeg')).toHaveLength(1)
    expect(summary?.querySelector('.ttl-distSeg')?.className).toContain('ttl-ink-violet')
    expect(summary?.querySelector('.ttl-legendDot')?.className).toContain('ttl-ink-violet')
    // v0.10.37: the legend IS the clickable chip row now (one row, no duplicate).
    const bashChip = screen.getByTestId('ttl-chip-bash')
    expect(bashChip.textContent).toContain('bash')
    expect(bashChip.querySelector('.ttl-chipCount')?.textContent).toBe('2')
    // No wire timestamps in this fixture → no total duration is invented.
    expect(summary?.querySelector('.ttl-summaryDur')).toBeNull()
  })

  it('global failure stats use the row predicate (v0.10.36)', async () => {
    renderTab([
      user(1, 'mixed failures'),
      turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"ok"}', 'c3'),
      toolResult(4, 'c3', 'fine'),
      toolCall(5, 'bash', '{"command":"bad"}', 'c5'),
      ev('tool/result', 6, { callId: 'c5', message: { isError: true, content: [{ type: 'text', text: 'boom' }] } }),
      toolCall(7, 'custom_tool', '{"x":1}', 'c7'),
      ev('tool/result', 8, { callId: 'c7', error: { name: 'ToolNotFoundError', code: 'UNKNOWN_TOOL' } }),
      turnEnd(9, 1),
    ])
    const turn = (await screen.findAllByTestId('ttl-turn'))[0]
    // Turn badge counts both failures…
    expect(turn.querySelector('[data-testid="ttl-error-count"]')?.textContent).toBe('2')
    // …and the global chip / summary must agree (was 1: only the wire error).
    expect((await screen.findByTestId('ttl-chip-failed')).textContent).toContain('2')
    const summary = document.querySelector('.ttl-summary') as HTMLElement | null
    expect(summary?.querySelector('.ttl-summaryFail')?.textContent).toBe('2 failed')
    // Failed rows are not double-counted in the tool distribution.
    expect(screen.getByTestId('ttl-chip-bash').querySelector('.ttl-chipCount')?.textContent).toBe('1')
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
    expect(errorSteps[0].querySelector('.ttl-stepIcon.ttl-ink-red .ttl-rowIcon')).toBeTruthy()
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
    // v0.10.16: the stat is the alert triangle + count, not a "✗" text glyph.
    expect(badges[0].textContent).toBe('1')
    expect(badges[0].querySelector('.ttl-rowIcon svg path')?.getAttribute('d') ?? '').toContain('M10.29 3.86')
  })

  it('shows the input as the expanded body\'s first row on the step grid and locates on click', async () => {
    renderTab(oneTurn())
    const row = await screen.findByTestId('ttl-item-input')
    // v0.10.5: the expanded body renders the input as a first-class row
    // (icon + 输入 + preview), replacing the header preview text.
    const body = row.parentElement as HTMLElement
    expect(body.firstElementChild).toBe(row)
    expect(screen.queryByTestId('ttl-turn-preview')).toBeNull()
    expect(row.textContent).toContain('deploy the service')
    // Click = the v0.4–v0.8 locate behaviour (no conversation binding in tests).
    fireEvent.click(row)
    const bar = await screen.findByTestId('ttl-statusbar')
    await waitFor(() => { expect(bar.textContent).toContain('Could not locate that message') })
    // Under a tool filter the input row is not rendered at all.
    fireEvent.click(screen.getByTestId('ttl-chip-bash'))
    expect(screen.queryByTestId('ttl-item-input')).toBeNull()
  })

  it('a long user input also collapses to one line with a char budget (v0.10.5)', async () => {
    const long = `这是很长的用户输入，用来验证输入行也走前 32 字 + 还有 N 字符的同一套行式。${'补充说明 '.repeat(40)}`
    renderTab([
      user(1, long),
      turnStart(2, 1),
      toolCall(3, 'bash', 'ls', 'c3'),
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-item-input')
    const preview = within(row).getByTestId('ttl-input-preview')
    expect(preview.textContent?.endsWith('…')).toBe(true)
    expect(preview.textContent?.length ?? 0).toBeLessThanOrEqual(33)
    const rest = within(row).getByTestId('ttl-input-rest')
    expect(Number((rest.textContent ?? '').replace(/[^\d]/g, ''))).toBe(long.length - 32)
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

  it('the detail band exposes 摘要 / 原始 only and defaults to summary (v0.10.29)', async () => {
    renderTab(oneTurn())
    const detail = await openStepDetail()
    expect(detail.getAttribute('data-tab')).toBe('summary')
    const tabs = (['summary', 'raw'] as const).map((tab) => screen.getByTestId(`ttl-detail-tab-${tab}`))
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Summary', 'Raw'])
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('ttl-detail-body-summary')).toBeTruthy()
    // The merged panes are gone (结果 / 参数 were folded into 摘要).
    expect(screen.queryByTestId('ttl-detail-tab-result')).toBeNull()
    expect(screen.queryByTestId('ttl-detail-tab-params')).toBeNull()
    // seq is visible twice: status row + footer.
    expect(screen.getByTestId('ttl-detail-seq').textContent).toBe('seq #3')
    expect(screen.getByTestId('ttl-detail-foot-seq').textContent).toBe('seq #3')
    openDetailTab('raw')
    expect(screen.getByTestId('ttl-detail-tab-raw').getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('ttl-detail-body-raw')).toBeTruthy()
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

  it('renders a Markdown result in 摘要 and keeps the wire text on 原始 (v0.10.29)', async () => {
    setPrimitivesForTest(fakePrimitives())
    renderTab(readTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.click(step)
    await screen.findByTestId('ttl-detail')
    // The 结果 tab's rendered view lives in 摘要 now.
    expect(await screen.findByTestId('ttl-md')).toBeTruthy()
    expect(screen.queryByTestId('ttl-view-toggle')).toBeNull()
    openDetailTab('raw')
    expect(screen.getByTestId('ttl-raw-result').textContent).toContain('# Title')
  })

  it('an error step shows errorName · errorCode plus the raw text (AC14)', async () => {
    renderTab(twoTurns())
    await readyTurns(2)
    const steps = await screen.findAllByTestId('ttl-step')
    const errorStep = steps.find((el) => el.getAttribute('data-step-kind') === 'error') as HTMLElement
    expect(errorStep).toBeTruthy()
    // The error row leads with the red family glyph.
    expect(errorStep.querySelector('.ttl-stepIcon.ttl-ink-red .ttl-rowIcon')).toBeTruthy()
    fireEvent.click(errorStep)
    await screen.findByTestId('ttl-detail')
    const block = await screen.findByTestId('ttl-error-block')
    expect(screen.getByTestId('ttl-error-name').textContent).toBe('CommandError · E1')
    expect(within(block).getByTestId('ttl-md-raw').textContent).toContain('rollback failed: E1')
  })

  it('cluster counters are SVG text, scaled with the glyph (v0.10.34)', async () => {
    renderTab([
      user(1, 'mixed'),
      turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"a"}', 'c3'),
      toolCall(4, 'read', '{"file_path":"a.ts"}', 'c4'),
      turnEnd(5, 1),
    ])
    const turn = (await screen.findAllByTestId('ttl-turn'))[0]
    for (const chip of [...turn.querySelectorAll('.ttl-mixItem')]) {
      const count = chip.querySelector('.ttl-mixCount') as HTMLElement
      const glyph = chip.querySelector('svg') as SVGSVGElement
      expect(count).toBeTruthy()
      // The digits live inside a 13px SVG text node, not an HTML line box, so
      // they scale exactly like the icon under fractional zoom.
      const svg = count.querySelector('svg')
      expect(svg).toBeTruthy()
      expect(svg?.getAttribute('height')).toBe('13')
      expect(count.querySelector('svg text')?.textContent).toBe(count.textContent)
      expect(glyph).toBeTruthy()
    }
  })

  it('collapsed-turn mix counts work clusters 1:1 with the opened rows (v0.10.22)', async () => {
    renderTab([
      user(1, 'mixed turn'),
      turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"a"}', 'c3'),
      toolCall(4, 'bash', '{"command":"b"}', 'c4'),
      toolCall(5, 'read', '{"file_path":"a.ts"}', 'c5'),
      toolCall(6, 'read', '{"file_path":"b.ts"}', 'c6'),
      toolCall(7, 'edit', '{"file_path":"c.ts"}', 'c7'),
      toolCall(8, 'edit', '{"file_path":"d.ts"}', 'c8'),
      toolCall(9, 'custom_tool', '{"x":1}', 'c9'),
      toolCall(10, 'skill', '{"name":"figma-workbench"}', 'c10'),
      turnEnd(11, 1),
      user(12, 'next'),
      turnStart(13, 2),
      toolCall(14, 'bash', '{"command":"c"}', 'c14'),
      turnEnd(15, 2),
    ])
    const turns = await readyTurns(2)
    const mix = turns[0].querySelector('.ttl-mix')
    expect(mix).toBeTruthy()
    // One chip per WORK CLUSTER (same glyph the rows draw) — not per family and
    // not capped at four any more: file-edit 2, file-read 2, terminal 2,
    // generic 1, skill 1 (bash×2 / read×2 / edit×2 / custom / skill).
    const chips = [...(mix?.querySelectorAll('.ttl-mixItem') ?? [])].map((el) => ({
      kind: el.getAttribute('data-cluster'),
      count: Number(el.querySelector('.ttl-mixCount')?.textContent ?? '0'),
      ink: /ttl-ink-(\w+)/.exec(String(el.className))?.[1],
    }))
    expect(chips).toEqual([
      { kind: 'file-edit', count: 2, ink: 'green' },
      { kind: 'file-read', count: 2, ink: 'blue' },
      { kind: 'terminal', count: 2, ink: 'violet' },
      { kind: 'generic', count: 1, ink: 'gray' },
      { kind: 'skill', count: 1, ink: 'teal' },
    ])
    // v0.10.20 chrome stays: no legacy family tone classes on the chips.
    expect(mix?.querySelector('[class*="ttl-tone-"]')).toBeNull()
    // Open the turn and prove every chip is countable 1:1 by its own glyph.
    fireEvent.click(within(turns[0]).getByTestId('ttl-turn-tag'))
    await waitFor(() => { expect(turns[0].querySelectorAll('.ttl-step').length).toBeGreaterThan(0) })
    const glyphs = [...turns[0].querySelectorAll('.ttl-step .ttl-stepIcon svg')].map((svg) => svg.innerHTML)
    for (const chip of mix?.querySelectorAll('.ttl-mixItem') ?? []) {
      const glyph = chip.querySelector('svg')?.innerHTML ?? ''
      expect(glyphs.filter((html) => html === glyph)).toHaveLength(
        Number(chip.querySelector('.ttl-mixCount')?.textContent),
      )
    }
  })

  it('MCP calls keep the plug chip in the mix (v0.10.33)', async () => {
    renderTab([
      user(1, 'figma'),
      turnStart(2, 1),
      toolCall(3, 'mcp__figma__use_figma', '{"code":"x"}', 'c3'),
      toolCall(4, 'mcp__figma__create_session', '{}', 'c4'),
      toolCall(5, 'bash', '{"command":"ls"}', 'c5'),
      turnEnd(6, 1),
    ])
    const turn = (await screen.findAllByTestId('ttl-turn'))[0]
    const chips = [...turn.querySelectorAll('.ttl-mixItem')].map((el) => ({
      kind: el.getAttribute('data-cluster'),
      count: Number(el.querySelector('.ttl-mixCount')?.textContent ?? '0'),
    }))
    // The two MCP calls are one pink plug chip — the same glyph their rows draw.
    expect(chips).toEqual([{ kind: 'mcp', count: 2 }, { kind: 'terminal', count: 1 }])
    const mcpChip = turn.querySelector('.ttl-mixItem[data-cluster="mcp"]') as HTMLElement
    expect(mcpChip.className).toContain('ttl-ink-pink')
  })

  it('the failure badge follows the cluster chips in the left group (v0.10.33)', async () => {
    renderTab([
      user(1, 'fail'),
      turnStart(2, 1),
      toolCall(3, 'bash', 'npm test', 'c3'),
      ev('tool/result', 4, { callId: 'c3', message: { isError: true }, content: [{ type: 'text', text: 'exit 1' }] }),
      turnEnd(5, 1),
    ])
    const turn = (await screen.findAllByTestId('ttl-turn'))[0]
    const toggle = turn.querySelector('.ttl-turnToggle') as HTMLElement
    const badge = turn.querySelector('[data-testid="ttl-error-dot"]') as HTMLElement
    const spacer = toggle.querySelector('.ttl-turnHeadSpacer') as HTMLElement
    const meta = toggle.querySelector('.ttl-turnMeta') as HTMLElement
    expect(badge).toBeTruthy()
    // Left group: … chips → alert badge → spacer → right meta.
    expect(badge.parentElement).toBe(toggle)
    const children = [...toggle.children]
    expect(children.indexOf(badge)).toBeLessThan(children.indexOf(spacer))
    expect(meta.querySelector('[data-testid="ttl-error-dot"]')).toBeNull()
  })

  it('failed steps are counted by the error badge, never by a cluster chip (v0.10.22)', async () => {
    renderTab([
      user(1, 'agents'),
      turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"ok"}', 'c3'),
      toolCall(4, 'bash', 'npm test', 'c4'),
      ev('tool/result', 5, { callId: 'c4', message: { isError: true }, content: [{ type: 'text', text: 'exit 1' }] }),
      toolCall(6, 'read', '{"file_path":"a.ts"}', 'c6'),
      toolCall(7, 'wait_agent', '{"target":"a"}', 'c7'),
      toolCall(8, 'wait_agent', '{"target":"b"}', 'c8'),
      toolCall(9, 'team_task_create', '{"subject":"audit"}', 'c9'),
      toolCall(10, 'figma_status', '{}', 'c10'),
      turnEnd(11, 1),
    ])
    const turn = (await screen.findAllByTestId('ttl-turn'))[0]
    const chips = [...turn.querySelectorAll('.ttl-mixItem')].map((el) => ({
      kind: el.getAttribute('data-cluster'),
      count: Number(el.querySelector('.ttl-mixCount')?.textContent ?? '0'),
    }))
    // 6 healthy steps → 6 chips (terminal loses its failed sibling), and the
    // failed bash row is only in the red error badge.
    expect(chips).toEqual([
      { kind: 'team', count: 2 },
      { kind: 'file-read', count: 1 },
      { kind: 'generic', count: 1 },
      { kind: 'team-task', count: 1 },
      { kind: 'terminal', count: 1 },
    ])
    const badge = turn.querySelector('[data-testid="ttl-error-dot"]')
    expect(badge?.querySelector('[data-testid="ttl-error-count"]')?.textContent).toBe('1')
    // Every chip count equals the rows that draw that exact glyph; the alert
    // rows equal the error badge — nothing is counted twice, nothing is lost.
    const icons = [...turn.querySelectorAll('.ttl-step .ttl-stepIcon svg')].map((svg) => svg.innerHTML)
    for (const chip of turn.querySelectorAll('.ttl-mixItem')) {
      const glyph = chip.querySelector('svg')?.innerHTML ?? ''
      expect(icons.filter((html) => html === glyph)).toHaveLength(
        Number(chip.querySelector('.ttl-mixCount')?.textContent),
      )
    }
    const alertRows = [...turn.querySelectorAll('.ttl-step')].filter((row) =>
      (row.querySelector('.ttl-stepIcon svg')?.innerHTML ?? '').includes('M10.29 3.86'),
    )
    expect(alertRows).toHaveLength(1)
    const chipTotal = chips.reduce((sum, chip) => sum + chip.count, 0)
    expect(chipTotal + alertRows.length).toBe(icons.length)
  })

  it('figma plugin + todo tools get their own coloured families, no grey glyph (v0.10.10)', async () => {
    renderTab([
      user(1, 'figma + todo'),
      turnStart(2, 1),
      toolCall(3, 'figma_reconnect', '{}', 'c3'),
      toolCall(4, 'todo_write', JSON.stringify({ todos: [{ id: 1 }, { id: 2 }] }), 'c4'),
      turnEnd(5, 1),
    ])
    const rows = await screen.findAllByTestId('ttl-step')
    const figmaRow = rows.find((row) => row.querySelector('.ttl-stepName')?.textContent === 'figma_reconnect')
    const todoRow = rows.find((row) => row.querySelector('.ttl-stepName')?.textContent === 'todo_write')
    // v0.10.19: figma_* is a plugin tool, not a built-in — grey wrench.
    expect(figmaRow?.querySelector('.ttl-stepIcon')?.className).toContain('ttl-ink-gray')
    expect(todoRow?.querySelector('.ttl-stepIcon')?.className).toContain('ttl-ink-amber')
    expect(figmaRow?.querySelector('.ttl-stepIcon svg path')?.getAttribute('d') ?? '').toContain('M14.7 6.3')
    expect(todoRow?.querySelector('.ttl-stepIcon svg path')?.getAttribute('d') ?? '').toContain('m3 17 2 2 4-4')
    expect(todoRow?.querySelector('.ttl-stepDesc')?.textContent).toBe('2 项')
  })

  it('every work cluster draws its own glyph and ink (v0.10.19)', async () => {
    renderTab([
      user(1, 'clusters'),
      turnStart(2, 1),
      toolCall(3, 'create_goal', '{"objective":"ship"}', 'c3'),
      toolCall(4, 'subagent', '{"prompt":"x"}', 'c4'),
      toolCall(5, 'session_search', '{"query":"icon"}', 'c5'),
      toolCall(6, 'job_list', '{}', 'c6'),
      toolCall(7, 'terminal_open', '{}', 'c7'),
      toolCall(8, 'acme_deploy', '{"url":"https://example.com"}', 'c8'),
      turnEnd(9, 1),
    ])
    const rows = await screen.findAllByTestId('ttl-step')
    const clusterOf = (name: string): Element | null =>
      rows.find((row) => row.querySelector('.ttl-stepName')?.textContent === name)?.querySelector('.ttl-stepIcon') ?? null
    // goal → amber target (three rings, no path)
    expect(clusterOf('create_goal')?.className).toContain('ttl-ink-amber')
    expect(clusterOf('create_goal')?.querySelectorAll('svg circle')).toHaveLength(3)
    // subagent → pink robot head
    expect(clusterOf('subagent')?.className).toContain('ttl-ink-pink')
    expect(clusterOf('subagent')?.querySelector('svg path')?.getAttribute('d') ?? '').toContain('M12 8V4H8')
    // session_search → teal history dial
    expect(clusterOf('session_search')?.className).toContain('ttl-ink-teal')
    expect(clusterOf('session_search')?.querySelector('svg path')?.getAttribute('d') ?? '').toContain('M3 12a9 9 0 1 0 9-9')
    // job_list → violet stacked layers
    expect(clusterOf('job_list')?.className).toContain('ttl-ink-violet')
    expect(clusterOf('job_list')?.querySelector('svg path')?.getAttribute('d') ?? '').toContain('m12.83 2.18')
    // terminal_open → violet square terminal
    expect(clusterOf('terminal_open')?.className).toContain('ttl-ink-violet')
    expect(clusterOf('terminal_open')?.querySelector('svg rect')).toBeTruthy()
    // non-built-in, non-MCP → grey wrench
    expect(clusterOf('acme_deploy')?.className).toContain('ttl-ink-gray')
    expect(clusterOf('acme_deploy')?.querySelector('svg path')?.getAttribute('d') ?? '').toContain('M14.7 6.3')
  })

  it('draws && / ; at the end of the previous command line (v0.10.7)', async () => {
    renderTab([
      user(1, 'run it'),
      turnStart(2, 1),
      toolCall(3, 'bash', JSON.stringify({ command: 'cd /tmp && sed -n 1p a.ts ; echo done' }), 'c3'),
      turnEnd(4, 1),
    ])
    await openStepDetail(0)
    const code = await screen.findByTestId('ttl-code')
    const lines = [...code.querySelectorAll('.ttl-codeLine')]
      .map((line) => (line.querySelector('.ttl-codeText')?.textContent ?? '').replace(/\u00A0/g, ' ').trim())
    expect(lines).toEqual(['cd /tmp &&', 'sed -n 1p a.ts ;', 'echo done'])
    // No line may start with a connector any more.
    expect(lines.every((line) => !/^(?:&&|;)/.test(line))).toBe(true)
    // Exactly two trailing connectors, in command order.
    const tails = [...code.querySelectorAll('[data-testid="ttl-cmd-connector"]')].map((el) => el.textContent)
    expect(tails).toEqual(['&&', ';'])
  })

  it('a skill call reads as its skill name and draws the sparkle family glyph (v0.10.6)', async () => {
    renderTab([
      user(1, 'load the skills'),
      turnStart(2, 1),
      toolCall(3, 'skill', '{"name":"figma-workbench"}', 'c3'),
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-step')
    expect(row.querySelector('.ttl-stepName')?.textContent).toBe('skill')
    expect(row.querySelector('.ttl-stepDesc')?.textContent).toBe('figma-workbench')
    expect(row.querySelector('.ttl-stepDesc')?.textContent).not.toContain('name ')
    expect(row.querySelector('.ttl-stepIcon')?.className).toContain('ttl-ink-teal')
    // v0.10.14: open-book glyph (the spine line) replaced the sparkle.
    const path = row.querySelector('.ttl-stepIcon .ttl-rowIcon svg path')
    expect(path?.getAttribute('d') ?? '').toContain('M12 7v14')
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
    const glyph = step.querySelector('.ttl-stepIcon.ttl-ink-red .ttl-rowIcon svg path')
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
    // v0.10.29: the 参数 JSON lives in 摘要 (the 参数 tab is gone).
    expect(await screen.findByTestId('ttl-params')).toBeTruthy()
    expect(screen.getByTestId('ttl-params').textContent).toContain('cmd')
    expect(screen.getByTestId('ttl-params').textContent).toContain('ls')
    // Unparseable arguments degrade to the raw text plus the hint.
    fireEvent.click(steps[1])
    expect(screen.getAllByTestId('ttl-detail')).toHaveLength(1)
    expect(await screen.findByTestId('ttl-detail-unparsable')).toBeTruthy()
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe('not json at all')
  })

  it('the summary 参数 block is the FULL argument object as formatted JSON for every family (v0.10.18)', async () => {
    renderTab([
      user(1, 'mixed'),
      turnStart(2, 1),
      toolCall(3, 'bash', JSON.stringify({ command: 'ls -la', description: 'list files' }), 'c3'),
      toolCall(4, 'ask_user_question', JSON.stringify({
        questions: [{ id: 'release2', header: '发版', options: ['main'] }],
      }), 'c4'),
      toolCall(5, 'read', JSON.stringify({ file_path: 'README.md', limit: 10 }), 'c5'),
      toolCall(6, 'mcp__figma__get_metadata', JSON.stringify({ nodeIds: ['1:2'], format: 'PNG' }), 'c6'),
      turnEnd(7, 1),
    ])
    const steps = await screen.findAllByTestId('ttl-step')
    const openStep = async (index: number): Promise<HTMLElement> => {
      fireEvent.click(steps[index])
      const band = await screen.findByTestId('ttl-detail')
      expect(within(band).getByTestId('ttl-params')).toBeTruthy()
      return band
    }

    // shell: the command block stays, and the 参数 block shows the same JSON.
    const shell = await openStep(0)
    expect(within(shell).getByTestId('ttl-code')).toBeTruthy()
    const shellJson = within(shell).getByTestId('ttl-params').querySelector('[data-testid="ttl-json-pretty"]')
    expect(shellJson).toBeTruthy()
    expect(shellJson?.textContent).toContain('"command"')
    expect(shellJson?.textContent).toContain('ls -la')
    expect(shellJson?.textContent).toContain('"description"')
    // v0.10.18: no folded key/value table (or array chips) anywhere in the band.
    expect(shell.querySelector('[data-testid="ttl-kv"]')).toBeNull()
    expect(shell.querySelector('.ttl-kv')).toBeNull()

    // Unknown tool (ask_user_question): the array is real JSON, not a chip.
    const generic = await openStep(1)
    const genericParams = within(generic).getByTestId('ttl-params')
    expect(genericParams.textContent).toContain('"questions"')
    expect(genericParams.textContent).toContain('"release2"')
    expect(genericParams.textContent).not.toContain('array · 1 项')
    expect(generic.querySelector('.ttl-chipTag')).toBeNull()

    // read: the path block stays; the path is also visible inside the JSON.
    const read = await openStep(2)
    expect(within(read).getByTestId('ttl-fileBlock')).toBeTruthy()
    expect(within(read).getByTestId('ttl-params').textContent).toContain('"file_path"')
    expect(within(read).getByTestId('ttl-params').textContent).toContain('README.md')

    // MCP: the badge stays; the args render as JSON, not a typed table.
    const mcp = await openStep(3)
    expect(within(mcp).getByTestId('ttl-mcpBlock')).toBeTruthy()
    expect(within(mcp).getByTestId('ttl-params').textContent).toContain('"nodeIds"')
    // v0.10.29: the 参数 JSON lives in 摘要; the separate tree tab is gone.
    expect(within(mcp).getByTestId('ttl-params').querySelector('[data-testid="ttl-json-pretty"]')).toBeTruthy()
    expect(screen.queryByTestId('ttl-detail-tab-params')).toBeNull()
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

  it('clicking the collapsed input preview opens the turn (v0.10.21)', async () => {
    renderTab(twoTurns())
    const cards = await readyTurns(2)
    expect(cards[0].getAttribute('data-collapsed')).toBe('true')
    // v0.10.21: the preview line is part of the card's click target, not dead text.
    fireEvent.click(within(cards[0]).getByTestId('ttl-turn-preview'))
    expect(screen.getAllByTestId('ttl-turn')[0].getAttribute('data-collapsed')).toBe('false')
  })

  it('clicking the card padding also opens the collapsed turn (v0.10.21)', async () => {
    renderTab(twoTurns())
    const cards = await readyTurns(2)
    fireEvent.click(cards[0])
    expect(screen.getAllByTestId('ttl-turn')[0].getAttribute('data-collapsed')).toBe('false')
  })

  it('a drag-select of the preview text does not toggle the card (v0.10.21)', async () => {
    renderTab(twoTurns())
    const cards = await readyTurns(2)
    const selection = window.getSelection
    const spy = vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'deploy' } as unknown as Selection)
    fireEvent.click(within(cards[0]).getByTestId('ttl-turn-preview'))
    expect(screen.getAllByTestId('ttl-turn')[0].getAttribute('data-collapsed')).toBe('true')
    spy.mockRestore()
    expect(selection).toBeTypeOf('function')
  })

  it('collapsing near the list end keeps the clicked card in place (v0.10.28)', async () => {
    renderTab(twoTurns())
    const turns = await readyTurns(2)
    const list = document.querySelector('[data-testid="ttl-list"]') as HTMLElement
    expect(list).toBeTruthy()

    // jsdom has no layout: emulate a scroll box whose content shrinks when the
    // expanded turn below the viewport collapses (1000 → 700 px).
    let baseHeight = 1000
    let scrollTop = 600 // = old max (1000 − 400)
    Object.defineProperty(list, 'scrollHeight', {
      configurable: true,
      get: () => baseHeight + (Number.parseFloat(list.style.paddingBottom) || 0),
    })
    Object.defineProperty(list, 'clientHeight', { configurable: true, get: () => 400 })
    Object.defineProperty(list, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => { scrollTop = value },
    })

    baseHeight = 700 // the collapsed card removed 300px of content
    fireEvent.click(within(turns[1]).getByTestId('ttl-turn-tag'))
    // The layout effect holds the scroll with temporary bottom padding instead
    // of letting the browser clamp 600 → 300 (which would jump the list).
    expect(scrollTop).toBe(600)
    expect(list.style.paddingBottom).toBe('300px')

    // Scrolling back into the real content releases the hold without a jump.
    scrollTop = 200
    fireEvent.scroll(list)
    expect(list.style.paddingBottom).toBe('')
    expect(scrollTop).toBe(200)
  })

  it('a click inside the expanded body does not collapse the turn (v0.10.21)', async () => {
    renderTab(twoTurns())
    const cards = await readyTurns(2)
    // Latest turn is expanded; clicking its foot / blank body must not fold it.
    fireEvent.click(within(cards[1]).getByTestId('ttl-turn-foot'))
    expect(screen.getAllByTestId('ttl-turn')[1].getAttribute('data-collapsed')).toBe('false')
  })

  it('the header holds the search inline and drops the idle ⋯ button (v0.10.24)', async () => {
    renderTab(twoTurns())
    await readyTurns(2)
    const header = document.querySelector('.ttl-header') as HTMLElement | null
    expect(header).toBeTruthy()
    const search = header?.querySelector('[data-testid="ttl-search"]')
    const follow = header?.querySelector('[data-testid="ttl-follow-toggle"]')
    expect(search).toBeTruthy()
    expect(follow).toBeTruthy()
    // The search sits immediately right of the follow toggle (one compact row).
    const children = [...(header?.children ?? [])]
    expect(children.indexOf(search?.parentElement as Element)).toBeGreaterThan(
      children.indexOf(follow as Element),
    )
    // …and is the last item, i.e. flush against the right edge.
    expect(children[children.length - 1]).toBe(search?.parentElement)
    // The old full-width row and the no-op 「⋯」 are gone.
    expect(header?.querySelector('[data-testid="ttl-more"]')).toBeNull()
    expect(document.querySelector('.ttl-searchRow')).toBeNull()
    // Searching still works from the header field.
    fireEvent.change(search as Element, { target: { value: 'kubectl' } })
    await waitFor(() => {
      const names = screen.queryAllByTestId('ttl-step').map((el) => el.querySelector('.ttl-stepName')?.textContent)
      expect(names.length).toBeGreaterThan(0)
      expect(names.every((name) => name === 'bash')).toBe(true)
    })
  })

  it('the turn-head mix sits on the duration side, before the spacer (v0.10.25)', async () => {
    renderTab(twoTurns())
    const turns = await readyTurns(2)
    const toggle = turns[0].querySelector('.ttl-turnToggle') as HTMLElement | null
    expect(toggle).toBeTruthy()
    const mix = toggle?.querySelector('.ttl-mix')
    const meta = toggle?.querySelector('.ttl-turnMeta') as HTMLElement | null
    const spacer = toggle?.querySelector('.ttl-turnHeadSpacer') as HTMLElement | null
    expect(mix).toBeTruthy()
    // v0.10.25: the ledger is a direct child of the toggle, right before the
    // flexible spacer — next to time / duration instead of the right edge.
    expect(mix?.parentElement).toBe(toggle)
    const children = [...(toggle?.children ?? [])]
    expect(children.indexOf(mix as Element)).toBeGreaterThanOrEqual(0)
    expect(children.indexOf(mix as Element)).toBeLessThan(children.indexOf(spacer as Element))
    expect(children.indexOf(meta as Element)).toBeGreaterThan(children.indexOf(spacer as Element))
    // The right group no longer owns the chips.
    expect(meta?.querySelector('.ttl-mix')).toBeNull()
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

  it('the command expander sits centred under the code block (v0.10.43)', async () => {
    const command = Array.from({ length: 20 }, (_, i) => `echo ${i}`).join(' && ')
    renderTab([
      user(1, 'run'),
      turnStart(2, 1),
      toolCall(3, 'bash', JSON.stringify({ command }), 'c3'),
      toolResult(4, 'c3', 'ok'),
      turnEnd(5, 1),
    ])
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    const code = await screen.findByTestId('ttl-code')
    const toggle = await screen.findByTestId('ttl-code-toggle')
    expect(toggle.parentElement?.className).toBe('ttl-sectionExpand')
    // …and after the code block (readers find it where the content is cut).
    expect(code.compareDocumentPosition(toggle) & 4).toBe(4)
  })

  it('a long single-line failure is shown completely, without a duplicate 输出 block (v0.10.40)', async () => {
    const longError = `Error: rw_exec: this session is LOCAL — ${'detail '.repeat(40)}END-OF-ERROR`
    renderTab([
      user(1, 'docker ps'),
      turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"docker ps"}', 'c3'),
      ev('tool/result', 4, {
        callId: 'c3',
        message: { isError: true, content: [{ type: 'text', text: longError }] },
      }),
      turnEnd(5, 1),
    ])
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    const errorBlock = await screen.findByTestId('ttl-error-block')
    // The single place for the failure message carries the whole text…
    expect(errorBlock.textContent).toContain(longError)
    expect(errorBlock.textContent).toContain('END-OF-ERROR')
    // …and the old 输出 preview that cut it off is not rendered for failures.
    expect(screen.queryByTestId('ttl-outBlock')).toBeNull()
  })

  it('the failure block sits AFTER the params, not above them (v0.10.42)', async () => {
    renderTab([
      user(1, 'docker ps'),
      turnStart(2, 1),
      toolCall(3, 'rv_exec', '{"command":"docker ps"}', 'c3'),
      ev('tool/result', 4, {
        callId: 'c3',
        message: { isError: true, content: [{ type: 'text', text: 'Error: no remote workspace' }] },
      }),
      turnEnd(5, 1),
    ])
    fireEvent.click(await screen.findByTestId('ttl-step'))
    const detail = await screen.findByTestId('ttl-detail')
    const params = await screen.findByTestId('ttl-params')
    const errorBlock = await screen.findByTestId('ttl-error-block')
    // DOCUMENT_POSITION_FOLLOWING === 4: the error block follows the params.
    expect(params.compareDocumentPosition(errorBlock) & 4).toBe(4)
    expect(detail.textContent).toContain('Error: no remote workspace')
  })

  it('a single-line output longer than the preview budget can be expanded in full (v0.10.40)', async () => {
    const line = `start ${'y'.repeat(300)} TAIL-OF-OUTPUT`
    renderTab([
      user(1, 'run'),
      turnStart(2, 1),
      toolCall(3, 'bash', '{"command":"x"}', 'c3'),
      toolResult(4, 'c3', line),
      turnEnd(5, 1),
    ])
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    const out = await screen.findByTestId('ttl-outBlock')
    expect(out.textContent).not.toContain('TAIL-OF-OUTPUT')
    // The old toggle only appeared when there were >20 lines; one long line
    // was silently cut. It must be expandable now.
    const toggle = await screen.findByTestId('ttl-out-toggle')
    // v0.10.43: the expander lives centred below the block, not in the header.
    expect(toggle.parentElement?.className).toBe('ttl-sectionExpand')
    expect(out.compareDocumentPosition(toggle) & 4).toBe(4)
    fireEvent.click(toggle)
    await waitFor(() => {
      expect(screen.getByTestId('ttl-outBlock').textContent).toContain('TAIL-OF-OUTPUT')
    })
    expect(screen.getByTestId('ttl-outBlock').textContent).not.toContain('…')
  })

  // ── v0.5.0 · image thumbnails (契约 §10.5.1) ───────────────────────────

  it('renders an image block as a lazy session-authorized thumbnail plus its metadata', async () => {
    renderTab(imageTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.click(step)
    await screen.findByTestId('ttl-detail')
    // v0.10.26/29: images render directly in the 摘要 pane.
    const thumb = (await screen.findByTestId('ttl-img-thumb')) as HTMLImageElement
    expect(thumb.getAttribute('loading')).toBe('lazy')
    expect(thumb.className).toBe('ttl-imgThumb')
    expect(thumb.getAttribute('src')).toBe('/trace-inspect/api/attachment?sessionId=s1&attachmentId=sha256%3Aabc')
    expect(thumb.getAttribute('alt')).toBe('Image: a.png')
    expect(thumb.parentElement?.className).toContain('ttl-imgThumbWrap')
    expect(thumb.parentElement?.className).toContain('ttl-imgThumbBtn')
    // The metadata/chip row stays visible underneath the thumbnail.
    const chip = screen.getByTestId('ttl-img-chip')
    expect(chip.textContent).toContain('Image: a.png')
    expect(chip.textContent).toContain('image/png')
    expect(chip.textContent).toContain('100×50 · 2 KB')
    expect(screen.queryByTestId('ttl-img-failed')).toBeNull()
  })

  it('read_image shows the actual picture in the default 摘要 pane (v0.10.26)', async () => {
    renderTab(imageTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.click(step)
    const detail = await screen.findByTestId('ttl-detail')
    // No tab switch: the summary pane itself must show the image block.
    expect(detail.getAttribute('data-tab')).toBe('summary')
    expect(await screen.findByTestId('ttl-img-row')).toBeTruthy()
    const thumb = (await screen.findByTestId('ttl-img-thumb')) as HTMLImageElement
    expect(thumb.getAttribute('loading')).toBe('lazy')
    expect(thumb.getAttribute('src')).toBe('/trace-inspect/api/attachment?sessionId=s1&attachmentId=sha256%3Aabc')
    expect(thumb.getAttribute('alt')).toBe('Image: a.png')
    // The caption / metadata chip stays under the thumbnail.
    expect(screen.getByTestId('ttl-img-chip').textContent).toContain('image/png')
    expect(screen.getByTestId('ttl-img-chip').textContent).toContain('100×50 · 2 KB')
  })

  it('an image that fails to load hides the img, keeps the chip and warns', async () => {
    renderTab(imageTurn())
    const step = await screen.findByTestId('ttl-step')
    fireEvent.click(step)
    await screen.findByTestId('ttl-detail')

    const thumb = await screen.findByTestId('ttl-img-thumb')
    fireEvent.error(thumb)
    expect(screen.queryByTestId('ttl-img-thumb')).toBeNull()
    expect(screen.queryByTestId('ttl-img-thumb-wrap')).toBeNull()
    expect(screen.getByTestId('ttl-img-chip').textContent).toContain('Image: a.png')
    expect(screen.getByTestId('ttl-img-failed').textContent).toBe('Image failed to load — metadata only')
  })

  it('clicking the thumbnail opens the full-size image lightbox (v0.10.35)', async () => {
    renderTab(imageTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    const thumb = (await screen.findByTestId('ttl-img-thumb')) as HTMLImageElement
    fireEvent.click(thumb)
    const lightbox = await screen.findByTestId('ttl-img-lightbox')
    expect(lightbox.getAttribute('role')).toBe('dialog')
    expect(lightbox.getAttribute('aria-modal')).toBe('true')
    expect(document.body.contains(lightbox)).toBe(true)
    const big = screen.getByTestId('ttl-img-lightbox-img') as HTMLImageElement
    expect(big.getAttribute('src')).toBe('/trace-inspect/api/attachment?sessionId=s1&attachmentId=sha256%3Aabc')
    expect(screen.getByTestId('ttl-img-lightbox').textContent).toContain('image/png')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('ttl-img-lightbox')).toBeNull()
  })

  it('the lightbox closes on backdrop click but not on clicking the image', async () => {
    renderTab(imageTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')
    fireEvent.click(await screen.findByTestId('ttl-img-thumb'))
    await screen.findByTestId('ttl-img-lightbox')
    fireEvent.click(screen.getByTestId('ttl-img-lightbox-img'))
    expect(screen.getByTestId('ttl-img-lightbox')).toBeTruthy()
    fireEvent.click(screen.getByTestId('ttl-img-lightbox-backdrop'))
    expect(screen.queryByTestId('ttl-img-lightbox')).toBeNull()
    // The close button does the same.
    fireEvent.click(screen.getByTestId('ttl-img-thumb'))
    await screen.findByTestId('ttl-img-lightbox')
    fireEvent.click(screen.getByTestId('ttl-img-lightbox-close'))
    expect(screen.queryByTestId('ttl-img-lightbox')).toBeNull()
  })

  // ── v0.5.0 · on-demand full detail (契约 §10.5.2) ──────────────────────

  it('loads the untruncated detail on open and swaps both panes over to it', async () => {
    const detail = vi.fn<FetchToolDetail>(async () => ({ ok: true, items: [FULL_DETAIL] }))
    renderTruncatedTab(detail)
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')

    // Success: the footer pill flips to 已加载, the truncation banner is gone.
    await waitFor(() => { expect(screen.getByTestId('ttl-detail-pill').textContent).toBe('Loaded') })
    expect(screen.queryByTestId('ttl-detail-load')).toBeNull()
    expect(screen.getByTestId('ttl-outBlock').textContent).toContain('full result body')

    // 摘要 renders the complete arguments, not the clipped wire preview
    // (the wire value was `{"path":"big.md"}` — the `full` key proves the swap).
    expect(screen.getByTestId('ttl-params').textContent).toContain('full')

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
    const strip = await screen.findByTestId('ttl-detail-load')
    expect(strip.textContent).toContain('Loading full content…')
    // The wire preview stays on screen during the load.
    expect(screen.getByTestId('ttl-outBlock').textContent).toContain('wire preview')

    await act(async () => { settle({ ok: true, items: [] }) })
    // An answer without a matching item degrades to the failure branch.
    expect(await screen.findByTestId('ttl-detail-retry')).toBeTruthy()
  })

  it('keeps the preview and offers one retry when the full detail fails', async () => {
    const detail = vi.fn(async (): Promise<ToolDetailResult> => ({ ok: false, reason: 'network' }))
    renderTruncatedTab(detail)
    fireEvent.click(await screen.findByTestId('ttl-step'))
    await screen.findByTestId('ttl-detail')

    const banner = await screen.findByTestId('ttl-bannerWarn')
    expect(banner.textContent).toContain('Result truncated to 32 KiB')
    expect(banner.textContent).toContain('Failed to load full content — showing the truncated preview')
    expect(screen.getByTestId('ttl-outBlock').textContent).toContain('wire preview')
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

  // ── output rows + tool summaries ───────────────────────────────────────

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

  it('an injected context message renders as its own row and expands to snapshot sections (v0.10.46)', async () => {
    const line = 'Time sampled while preparing turn 1, step 1: 2026-11-13T16:38:48+08:00[Asia/Shanghai]'
    const text = `${line}\nBrowser time zone for this request: Asia/Shanghai.`
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      ev('user/message', 3, {
        content: [{ type: 'text', text }],
        source: {
          kind: 'time-context',
          form: 'snapshot',
          sections: [{ name: 'time-context', text }],
        },
      }),
      toolCall(4, 'bash', 'ls'),
      turnEnd(5, 1),
    ])
    const row = await screen.findByTestId('ttl-item-context')
    // v0.10.53: the row reads `context <name>` in the two tool columns.
    expect(screen.getByTestId('ttl-context-role').textContent).toBe('context')
    expect(screen.getByTestId('ttl-context-name').textContent).toBe('time-context')
    expect(row.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByTestId('ttl-context-body')).toBeNull()
    fireEvent.click(row)
    expect(row.getAttribute('aria-expanded')).toBe('true')
    const body = await screen.findByTestId('ttl-context-body')
    expect(body.textContent).toContain('Supersedes earlier snapshots')
    expect(body.textContent).toContain('Browser time zone')
    fireEvent.click(row)
    expect(screen.queryByTestId('ttl-context-body')).toBeNull()
  })

  it('a context row falls back to the model-facing text when it declares no form', async () => {
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      ev('user/message', 3, { content: 'injected reminder body', source: { kind: 'context' } }),
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-item-context')
    expect(screen.getByTestId('ttl-context-role').textContent).toBe('context')
    expect(screen.getByTestId('ttl-context-name').textContent).toBe('context')
    fireEvent.click(row)
    const body = await screen.findByTestId('ttl-context-body')
    // No snapshot captions for an opaque form — just the text the model read.
    expect(body.textContent).not.toContain('Supersedes earlier snapshots')
    expect(body.textContent).toContain('injected reminder body')
    // Machine/plain text keeps the raw renderer (no Markdown block).
    expect(within(body).queryByTestId('ttl-md')).toBeNull()
  })

  it('injections are counted in the summary chips and the turn-head mix (v0.10.48)', async () => {
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      ev('user/message', 3, {
        content: [{ type: 'text', text: 'injected a' }],
        source: { kind: 'time-context', form: 'snapshot', sections: [{ name: 'time-context', text: 'injected a' }] },
      }),
      toolCall(4, 'bash', 'ls'),
      toolResult(5, 'c4', 'ok'),
      ev('user/message', 6, {
        content: [{ type: 'text', text: 'injected b' }],
        source: { kind: 'runtime-context', form: 'snapshot', sections: [{ name: 'runtime', text: 'injected b' }] },
      }),
      turnEnd(7, 1),
    ])
    // The summary row owns the injection count beside the tool families.
    const chip = await screen.findByTestId('ttl-chip-inject')
    expect(chip.textContent).toContain('Injections')
    expect(chip.textContent).toContain('2')
    // 全部 / tools keep counting tool steps; injections are the second dimension.
    expect(screen.getByTestId('ttl-chip-all').textContent).toContain('1')
    // The turn head accounts for the injection rows too, same inbox glyph.
    const mix = document.querySelectorAll('[data-cluster="context"]')
    expect(mix.length).toBe(1)
    expect(mix[0].textContent).toContain('2')
    // Clicking the chip narrows the body to the injection rows.
    fireEvent.click(chip)
    expect(screen.getAllByTestId('ttl-item-context').length).toBe(2)
    expect(screen.queryByTestId('ttl-step')).toBeNull()
    // Clicking again returns to every row.
    fireEvent.click(chip)
    expect(await screen.findByTestId('ttl-step')).toBeTruthy()
  })

  it('an injection keeps its full text and form through the wire projection (v0.10.50)', async () => {
    // The real client only ever sees projectEvent() output: the injection used
    // to arrive clipped at TEXT_CAP and with `source` reduced to {kind}, which
    // made every row a truncated raw-text block. Feed the projected event.
    const long = `要点：\n${'x'.repeat(3000)}\n尾部标记 TAIL`
    const injected = ev('user/message', 3, {
      content: [{ type: 'text', text: long }],
      source: { kind: 'time-context', form: 'snapshot', sections: [{ name: 'time-context', text: long }] },
    })
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      projectEvent(injected as unknown as SessionEventLike) as unknown as Ev,
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-item-context')
    fireEvent.click(row)
    const body = await screen.findByTestId('ttl-context-body')
    // The name column measures injection titles too, not only tool names.
    const rootStyle = screen.getByTestId('ttl-root').getAttribute('style') ?? ''
    const width = Number(/--ttl-step-name-w: (\d+)px/.exec(rootStyle)?.[1] ?? 0)
    expect(width).toBeGreaterThanOrEqual(80)
    // The declared form survived the wire, so the snapshot body renders.
    expect(body.textContent).toContain('Supersedes earlier snapshots')
    // Nothing was clipped: the tail past TEXT_CAP is present.
    expect(body.textContent).toContain('尾部标记 TAIL')
  })

  it('renders injection prose through Markdown instead of raw markers (v0.10.49)', async () => {
    setPrimitivesForTest(fakePrimitives())
    const md = '# 搜索规范\n\n1. **定位**：以 MCP 为主\n- 列表项'
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      ev('user/message', 3, {
        content: [{ type: 'text', text: md }],
        source: { kind: 'agent-instructions', form: 'instructions', changes: [{ path: '/tmp/AGENTS.md' }] },
      }),
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-item-context')
    fireEvent.click(row)
    const body = await screen.findByTestId('ttl-context-body')
    // The prose goes through the Markdown renderer, not a raw text node.
    expect(within(body).getByTestId('ttl-md')).toBeTruthy()
    expect(within(body).getByTestId('fake-md').textContent).toContain('**定位**')
  })

  it('a long injection folds with a char budget and opens the whole text (v0.10.47)', async () => {
    const long = `要点：\n${'1. **定位**：以 MCP 为主，内置工具是兜底。\n'.repeat(40)}尾部标记 TAIL`
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      ev('user/message', 3, {
        content: [{ type: 'text', text: long }],
        source: { kind: 'agent-instructions', form: 'instructions', changes: [{ path: '/Users/lzx/.dsh/AGENTS.md' }] },
      }),
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-item-context')
    // The row reads `context <producer>`; the body carries the content.
    expect(screen.getByTestId('ttl-context-role').textContent).toBe('context')
    expect(screen.getByTestId('ttl-context-name').textContent).toBe('/Users/lzx/.dsh/AGENTS.md')
    fireEvent.click(row)
    const body = await screen.findByTestId('ttl-context-body')
    // The opened body carries the whole injection, tail included.
    expect(body.textContent).toContain('尾部标记 TAIL')
    expect(body.textContent?.length ?? 0).toBeGreaterThan(long.length * 0.9)
  })

  it('a long output collapses to one row: first chars + 「还有 N 字符」, click opens the full text (v0.10.3)', async () => {
    const long = `第一段：这是一条比较长的助手消息，用来验证单行输出行。\n${'细节内容 '.repeat(80)}`
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      assistant(3, long),
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-item-output')
    expect(row.getAttribute('aria-expanded')).toBe('false')
    const preview = screen.getByTestId('ttl-output-preview')
    expect(preview.textContent?.length ?? 0).toBeLessThanOrEqual(33)
    expect(preview.textContent).toContain('第一段')
    expect(preview.textContent?.endsWith('…')).toBe(true)
    const rest = screen.getByTestId('ttl-output-rest')
    expect(Number((rest.textContent ?? '').replace(/[^\d]/g, ''))).toBe(long.length - 32)
    expect(screen.queryByTestId('ttl-output-body')).toBeNull()
    fireEvent.click(row)
    expect(row.getAttribute('aria-expanded')).toBe('true')
    const body = await screen.findByTestId('ttl-output-body')
    expect(body.textContent?.length ?? 0).toBeGreaterThan(long.length * 0.9)
  })

  it('a short single-line output stays one plain row (no expand affordance)', async () => {
    renderTab([
      user(1, 'go'),
      turnStart(2, 1),
      assistant(3, 'all green'),
      turnEnd(4, 1),
    ])
    const row = await screen.findByTestId('ttl-item-output')
    expect(row.getAttribute('aria-expanded')).toBeNull()
    expect(screen.queryByTestId('ttl-output-rest')).toBeNull()
    expect(screen.getByTestId('ttl-output-preview').textContent).toBe('all green')
    fireEvent.click(row)
    expect(screen.queryByTestId('ttl-output-body')).toBeNull()
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
  it('pretty-prints JSON in the summary output', async () => {
    renderTab(jsonOutputTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    const out = await screen.findByTestId('ttl-outBlock')
    // Pretty-printed: multiple rows with indented keys, not one raw JSON line.
    const rows = out.querySelectorAll('.ttl-outLine')
    expect(rows.length).toBeGreaterThan(1)
    expect(out.textContent).toContain('"previousStatus": "running"')
    // 结果 tab is gone (v0.10.29): the summary output is the only text view.
    expect(screen.queryByTestId('ttl-detail-tab-result')).toBeNull()
  })
})

describe('output preview length (v0.10.11)', () => {
  it('the summary 输出 preview shows the first 20 lines by default, 展开全文 shows all', async () => {
    const text = Array.from({ length: 55 }, (_, i) => `line ${i + 1}`).join('\n')
    renderTab([
      user(1, 'run'),
      turnStart(2, 1),
      toolCall(3, 'bash', JSON.stringify({ command: 'x', description: 'long output' }), 'c3'),
      toolResult(4, 'c3', text),
      turnEnd(5, 1),
    ])
    await openStepDetail(0)
    const out = await screen.findByTestId('ttl-outBlock')
    expect(out.querySelectorAll('.ttl-outLine')).toHaveLength(20)
    expect(out.textContent).toContain('line 20')
    expect(out.textContent).not.toContain('line 21')
    fireEvent.click(screen.getByTestId('ttl-out-toggle'))
    expect(document.querySelectorAll('.ttl-outLine')).toHaveLength(55)
  })
})

describe('MCP result file-list heuristic (v0.10.13)', () => {
  const mcpTurn = (resultText: string): Ev[] => [
    user(1, 'figma'),
    turnStart(2, 1),
    toolCall(3, 'mcp__figma__use_figma', '{"code":"x"}', 'c3'),
    toolResult(4, 'c3', resultText),
    turnEnd(5, 1),
  ]

  it('a JSON object with escaped quotes is not mistaken for a one-file list', async () => {
    const text = JSON.stringify({
      stage: 'line',
      err: 'Error: in resize: Property "width" failed validation: Required value missing',
      info: { band0: { w: 372, h: 100 } },
    })
    renderTab(mcpTurn(text))
    await openStepDetail(0)
    expect(screen.queryByTestId('ttl-files')).toBeNull()
    // The value still shows up as the normal 输出 preview.
    expect(await screen.findByTestId('ttl-outBlock')).toBeTruthy()
  })

  it('a docker ps table is not mistaken for a file list (v0.10.45)', async () => {
    const text = [
      'NAMES                                   IMAGE              STATUS   PORTS',
      'htdot-cloud-production-app-1            263830cbca3f       Up 14 hours (healthy)   127.0.0.1:3000->4320/tcp',
      'htdot-cloud-production-dingtalk-1       263830cbca3f       Up 14 hours (healthy)   4320/tcp',
      'htdot-cloud-production-db-1             224550956756       Up 14 hours (healthy)   5432/tcp',
      'nginx                                   m.daocloud.io/docker.io/library/nginx:stable   Up 3 weeks',
    ].join('\n')
    renderTab(mcpTurn(text))
    await openStepDetail(0)
    // `4320/tcp` / host:port cells are not paths — the summary must keep the
    // table as text, not turn every port into a file named tcp.
    expect(screen.queryByTestId('ttl-files')).toBeNull()
    const out = await screen.findByTestId('ttl-outBlock')
    expect(out.textContent).toContain('PORTS')
    expect(out.textContent).toContain('4320/tcp')
  })

  it('a MIME list is not a file list either (v0.10.45)', async () => {
    renderTab(mcpTurn('image/png\ntext/plain\napplication/json'))
    await openStepDetail(0)
    expect(screen.queryByTestId('ttl-files')).toBeNull()
  })

  it('a genuine path list still renders file rows', async () => {
    renderTab(mcpTurn('/tmp/assets/01.png  74 KB\n/tmp/assets/02.png  12 KB'))
    await openStepDetail(0)
    const files = await screen.findByTestId('ttl-files')
    expect(files.textContent).toContain('01.png')
    expect(files.textContent).toContain('02.png')
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
