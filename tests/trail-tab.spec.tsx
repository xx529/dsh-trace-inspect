/**
 * trail-tab.spec.tsx — panel rendering coverage: empty state, turn rendering +
 * counts, chips with counts and failed filter, follow toggle, error + retry,
 * tool-group expansion, preview pane, plus the v0.4.0 inline step detail
 * (AC8 click-to-expand vs ↗ locate, AC12 remembered render/raw view, AC14
 * error name/code + raw text, AC18 arrow-key disclosure, filter pruning).
 *
 * v0.5.0 additions (契约 §10.5): image thumbnails with the `onError` chip
 * fallback, the on-demand full detail (loading / success / failure + one user
 * retry), the F4 `mergedNoSurfaceOp` note and the full-size overlay entries.
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
    // Each row leads with its semantic glyph: v0.6.0 draws a per-tool icon
    // (terminal/file/search/plug) and only unknown tools keep the legacy dot.
    expect(steps[0].querySelector('.ttl-rowIcon')).toBeTruthy()
    expect(steps[0].querySelector('.ttl-rowArgs')?.textContent).toBe('npm test')
    // Assistant messages render as output rows in the same row anatomy.
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
    // The row click performs NO locate: no status bar appears.
    expect(screen.queryByTestId('ttl-statusbar')).toBeNull()
    // Clicking the row again collapses it.
    fireEvent.click(step)
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
  })

  it('the row-end ↗ still locates the step in the conversation (AC8)', async () => {
    renderTab(oneTurn())
    const jump = await screen.findByTestId('ttl-step-jump')
    expect(screen.queryByTestId('ttl-detail')).toBeNull()
    fireEvent.click(jump)
    const bar = await screen.findByTestId('ttl-statusbar')
    expect(bar.textContent).toContain('Could not locate that message')
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
    // read → rendered by default.
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
    await waitFor(() => { expect(screen.getByTestId('ttl-view-toggle').getAttribute('aria-pressed')).toBe('false') })
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    expect(screen.getByTestId('ttl-md-raw').textContent).toContain('# Title')
  })

  it('an error step shows errorName · errorCode plus the raw text (AC14)', async () => {
    renderTab(twoTurns())
    await screen.findByText('2 turns')
    const steps = await screen.findAllByTestId('ttl-step')
    const errorStep = steps.find((el) => el.getAttribute('data-step-kind') === 'error') as HTMLElement
    expect(errorStep).toBeTruthy()
    // The error row leads with the red dot.
    expect(errorStep.querySelector('.ttl-dot-red')).toBeTruthy()
    fireEvent.click(errorStep)
    const block = await screen.findByTestId('ttl-error-block')
    expect(screen.getByTestId('ttl-error-name').textContent).toBe('CommandError · E1')
    expect(within(block).getByTestId('ttl-md-raw').textContent).toContain('rollback failed: E1')
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
    // A step without a result opens on 参数 by default.
    expect(screen.getByTestId('ttl-dtab-params').getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByTestId('ttl-dtab-params'))
    expect(await screen.findByTestId('ttl-json-pretty')).toBeTruthy()
    expect(screen.getByTestId('ttl-json-pretty').textContent).toContain('"cmd": "ls"')
    // Unparseable arguments degrade to the raw text plus the hint.
    fireEvent.click(steps[1])
    expect(screen.getAllByTestId('ttl-detail')).toHaveLength(1)
    fireEvent.click(screen.getByTestId('ttl-dtab-params'))
    expect(await screen.findByTestId('ttl-detail-unparsable')).toBeTruthy()
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe('not json at all')
  })

  it('a filter that hides an expanded step drops its detail band', async () => {
    renderTab(threeSteps())
    const steps = await screen.findAllByTestId('ttl-step')
    const readStep = steps.find((el) => el.textContent?.includes('read')) as HTMLElement
    expect(readStep).toBeTruthy()
    fireEvent.click(readStep)
    expect(await screen.findAllByTestId('ttl-detail')).toHaveLength(1)
    fireEvent.click(screen.getByTestId('ttl-chip-bash'))
    await waitFor(() => { expect(screen.queryByTestId('ttl-detail')).toBeNull() })
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
        tab={{ id: 'trace-inspect' }}
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
        tab={{ id: 'trace-inspect' }}
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
        tab={{ id: 'trace-inspect' }}
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

  // ── v0.5.0 · image thumbnails (契约 §10.5.1) ───────────────────────────

  it('renders an image block as a lazy session-authorized thumbnail plus its metadata', async () => {
    renderTab(imageTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))

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
    fireEvent.click(await screen.findByTestId('ttl-step'))

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

    // Success: the footer says the full content is in, and the pill flips.
    expect(await screen.findByTestId('ttl-detail-full')).toBeTruthy()
    expect(screen.getByTestId('ttl-detail-pill').textContent).toBe('Full')
    expect(screen.queryByTestId('ttl-detail-load')).toBeNull()
    expect(screen.getByTestId('ttl-md-raw').textContent).toContain('full result body')

    // 参数 now renders the complete arguments, not the clipped wire preview
    // (the wire value was `{"path":"big.md"}` — the `full` key proves the swap).
    fireEvent.click(screen.getByTestId('ttl-dtab-params'))
    const params = screen.getByTestId('ttl-detail-body-params')
    expect(params.querySelector('[data-testid="ttl-json-pretty"]')).toBeTruthy()
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

    const strip = await screen.findByTestId('ttl-detail-load')
    expect(strip.textContent).toContain('Failed to load full content — showing the truncated preview')
    expect(screen.getByTestId('ttl-md-raw').textContent).toContain('wire preview')
    const retry = (await screen.findByTestId('ttl-detail-retry')) as HTMLButtonElement
    expect(retry.textContent).toBe('Retry')
    expect(retry.disabled).toBe(false)

    // The user's single retry goes through and the panes update.
    detail.mockResolvedValueOnce({ ok: true, items: [FULL_DETAIL] })
    fireEvent.click(retry)
    expect(await screen.findByTestId('ttl-detail-full')).toBeTruthy()
    expect(screen.getByTestId('ttl-detail-pill').textContent).toBe('Full')
    expect(detail).toHaveBeenCalledTimes(2)
  })

  it('spends at most one user-triggered retry (no automatic re-fetch loop)', async () => {
    const detail = vi.fn(async (): Promise<ToolDetailResult> => ({ ok: false, reason: 'http' }))
    renderTruncatedTab(detail)
    fireEvent.click(await screen.findByTestId('ttl-step'))

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
    const note = await screen.findByTestId('ttl-detail-merged')
    expect(note.getAttribute('role')).toBe('note')
    expect(note.textContent).toBe('Merged from 2 results — the events declared no surfaceOp')
    expect(note.className).toContain('ttl-detailMerged')
  })

  it('does not flag merged content once a replace owns the result', async () => {
    renderTab(replacedTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
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
    // The outline is the whole current turn (3 steps), not just the open one.
    expect(screen.getAllByTestId('ttl-zoom-step')).toHaveLength(3)
    expect(screen.getByTestId('ttl-zoom-title').textContent).toBe('bash · step details')

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
    // No result → the params pane is the default.
    expect(screen.getByTestId('ttl-dtab-params').getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByTestId('ttl-detail-view-center'))
    expect(await screen.findByTestId('ttl-zoom')).toBeTruthy()
    expect(screen.getByTestId('ttl-zoom-tab-params').getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('ttl-zoom')).toBeNull()
  })

  it('clicking the pane opens the viewer, but a control inside the pane does not', async () => {
    renderTab(markdownTurn())
    fireEvent.click(await screen.findByTestId('ttl-step'))
    // Markdown result → the 结果 pane offers the 渲染/原文 switch.
    fireEvent.click(await screen.findByTestId('ttl-view-toggle'))
    expect(screen.queryByTestId('ttl-zoom')).toBeNull() // a control click must not open the viewer
    fireEvent.click(screen.getByTestId('ttl-pane-clickable'))
    expect(await screen.findByTestId('ttl-zoom')).toBeTruthy()
    expect(screen.getByTestId('ttl-zoom-tab-result').getAttribute('aria-selected')).toBe('true')
  })

  it('renders the tool summary instead of the raw argument JSON', async () => {
    renderTab(markdownTurn())
    const row = await screen.findByTestId('ttl-step')
    expect(row.querySelector('.ttl-rowName')?.textContent).toBe('read')
    expect(row.querySelector('.ttl-rowArgs')?.textContent).toBe('README.md')
    expect(row.querySelector('.ttl-rowIcon')).toBeTruthy()
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

  it('groups same-step calls under a ∥ caption and badges the collapsed-ready header', async () => {
    renderTab(mixedTurn())
    const groups = await screen.findAllByTestId('ttl-parallel-group')
    expect(groups).toHaveLength(1)
    expect(groups[0].getAttribute('data-step')).toBe('1')
    const head = within(groups[0]).getByTestId('ttl-parallel-head')
    expect(head.textContent).toBe('∥Parallel ×2')
    expect(head.getAttribute('title')).toContain('2 tool calls issued in one assistant step')
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
    const turns = await screen.findAllByTestId('ttl-turn')
    expect(turns[0].getAttribute('data-collapsed')).toBe('true')
    const badge = within(turns[0]).getByTestId('ttl-turn-parallel')
    expect(badge.textContent).toBe('∥1')
    expect(within(turns[0]).queryByTestId('ttl-parallel-group')).toBeNull()
  })

  it('no badge and no group on legacy logs without turn/step', async () => {
    renderTab(threeSteps())
    await screen.findByText('Turn 1')
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
      const head = await screen.findByTestId('ttl-parallel-head')
      expect(head.textContent).toBe('∥并行 ×2')
      expect(screen.getByTestId('ttl-turn-parallel').getAttribute('title')).toBe('1 组并行调用 · 共 2 次')
    } finally {
      document.documentElement.lang = previous
    }
  })
})
