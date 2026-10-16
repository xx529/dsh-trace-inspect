/**
 * zoom-overlay.spec.tsx — the v0.5.0 full-size step viewer (契约 §10.5.4).
 *
 * Covers the frozen behaviour: body portal + `role="dialog"`/`aria-modal`,
 * the current turn's steps in the left outline, Esc close, ↑/↓ step, ⌘F/Ctrl+F
 * focus + filter, ⌘C/Ctrl+C copy of the active pane, the export-JSON action
 * (Blob + `a.download`, with the data-URL fallback when the browser has no
 * `URL.createObjectURL`), the three panes and the footer hint/pill.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { ZoomOverlay } from '../src/client/ZoomOverlay'
import type { TrailResult, TrailStep } from '../src/trail-model'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/** A tool step; `result` (optional) is merged into a minimal TrailResult. */
const stepOf = (
  seq: number,
  name: string,
  args: string,
  result?: Partial<TrailResult>,
  extra: Partial<TrailStep> = {},
): TrailStep => ({
  kind: 'tool',
  seq,
  name,
  argsPreview: args.replace(/\s+/g, ' ').slice(0, 80),
  args,
  callId: `c${seq}`,
  error: '',
  ...(result !== undefined
    ? {
        result: {
          seq: seq + 1000,
          kind: 'text' as const,
          text: '',
          truncated: false,
          isError: false,
          ...result,
        },
      }
    : {}),
  ...extra,
})

const threeSteps = (): TrailStep[] => [
  stepOf(3, 'bash', '{"command":"ls -la"}', { text: 'total 0' }),
  stepOf(4, 'read', '{"path":"README.md"}', { text: '# Title\n\n- item' }),
  stepOf(5, 'grep', 'pattern', { text: '' }),
]

interface Harness {
  container: HTMLElement
  onClose: ReturnType<typeof vi.fn>
}

function renderOverlay(steps: TrailStep[], initialSeq = 3): Harness {
  const onClose = vi.fn()
  const { container } = render(
    <div data-testid="host">
      <ZoomOverlay steps={steps} initialSeq={initialSeq} sessionId="s1" lang="en" onClose={onClose} />
    </div>,
  )
  return { container, onClose }
}

/** The outline row the dialog currently marks as selected. */
const currentRow = (): HTMLElement => {
  const rows = screen.getAllByTestId('ttl-zoom-step')
  const selected = rows.find((row) => row.getAttribute('aria-current') === 'true')
  if (selected === undefined) throw new Error('no aria-current step in the outline')
  return selected
}

describe('ZoomOverlay', () => {
  it('opens as a modal dialog portaled out of the React container', () => {
    const { container } = renderOverlay(threeSteps())
    // Portaled into document.body, NOT inside the component's own tree.
    expect(container.querySelector('[data-testid="ttl-zoom"]')).toBeNull()
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-label')).toContain('bash')
    expect(screen.getByTestId('ttl-zoom-title').textContent).toBe('bash · step details')
    expect(screen.getByTestId('ttl-zoom').querySelector('.ttl-zoomBackdrop')).toBeTruthy()
    // The outline lists the whole current turn, with the initial step selected.
    expect(screen.getAllByTestId('ttl-zoom-step')).toHaveLength(3)
    expect(currentRow().textContent).toContain('bash')
    expect(screen.getByTestId('ttl-zoom-hint').textContent).toBe('Esc close · ↑↓ step · ⌘F search')
  })

  it('Esc closes the dialog (and nothing else does)', () => {
    const { onClose } = renderOverlay(threeSteps())
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('↑/↓ move the selection through the current turn, clamped at the ends', () => {
    renderOverlay(threeSteps(), 3)
    expect(screen.getByTestId('ttl-zoom-pane').textContent).toContain('total 0')

    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(currentRow().textContent).toContain('read')
    expect(screen.getByTestId('ttl-zoom-pane').textContent).toContain('# Title')

    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(currentRow().textContent).toContain('grep')
    // Last step: ArrowDown is a no-op (clamped, no wrap-around).
    fireEvent.keyDown(window, { key: 'ArrowDown' })
    expect(currentRow().textContent).toContain('grep')

    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(currentRow().textContent).toContain('read')
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    fireEvent.keyDown(window, { key: 'ArrowUp' })
    expect(currentRow().textContent).toContain('bash')
  })

  it('⌘F and Ctrl+F focus the search box, which filters the outline', () => {
    renderOverlay(threeSteps())
    const search = screen.getByTestId('ttl-zoom-search') as HTMLInputElement

    fireEvent.keyDown(window, { key: 'f', metaKey: true })
    expect(document.activeElement).toBe(search)

    fireEvent.change(search, { target: { value: 'read' } })
    expect(screen.getAllByTestId('ttl-zoom-step')).toHaveLength(1)
    expect(screen.getByTestId('ttl-zoom-step').textContent).toContain('read')
    // The pane follows the filtered selection.
    expect(screen.getByTestId('ttl-zoom-pane').textContent).toContain('# Title')

    fireEvent.change(search, { target: { value: 'nothing-matches-this' } })
    expect(screen.queryAllByTestId('ttl-zoom-step')).toHaveLength(0)
    expect(screen.getByTestId('ttl-zoom-nomatch').textContent).toBe('No matching step')

    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getAllByTestId('ttl-zoom-step')).toHaveLength(3)

    // Ctrl+F is the non-mac equivalent.
    ;(document.activeElement as HTMLElement | null)?.blur()
    fireEvent.keyDown(window, { key: 'f', ctrlKey: true })
    expect(document.activeElement).toBe(search)
  })

  it('leaves ↑/↓ to the caret while the search box has focus', () => {
    renderOverlay(threeSteps())
    const search = screen.getByTestId('ttl-zoom-search') as HTMLInputElement
    search.focus()
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    expect(currentRow().textContent).toContain('bash')
  })

  it('⌘C copies the active pane text through the clipboard API', () => {
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { language: 'en-US', clipboard: { writeText } })
    renderOverlay([stepOf(3, 'bash', '{"command":"ls -la"}')], 3)

    // No result → the default pane is 参数, whose text is the raw arguments.
    expect(screen.getByTestId('ttl-zoom-tab-params').getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(window, { key: 'c', metaKey: true })
    expect(writeText).toHaveBeenCalledWith('{"command":"ls -la"}')
    expect(screen.getByTestId('ttl-zoom-copy').textContent).toBe('Copied')

    // Ctrl+C does the same on non-mac hosts.
    writeText.mockClear()
    fireEvent.keyDown(window, { key: 'C', ctrlKey: true })
    expect(writeText).toHaveBeenCalledWith('{"command":"ls -la"}')
  })

  it('⌘C copies the result pane once the 结果 tab is active', () => {
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { language: 'en-US', clipboard: { writeText } })
    renderOverlay([stepOf(3, 'bash', 'cmd', { text: 'total 0' })], 3)
    expect(screen.getByTestId('ttl-zoom-tab-result').getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(window, { key: 'c', metaKey: true })
    expect(writeText).toHaveBeenCalledWith('total 0')
  })

  it('the export action downloads the selected step as JSON', async () => {
    const createObjectURL = vi.fn((_blob: Blob): string => 'blob:mock-object-url')
    const revokeObjectURL = vi.fn()
    const originalCreate = (URL as unknown as { createObjectURL?: unknown }).createObjectURL
    const originalRevoke = (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL
    ;(URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL
    ;(URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL

    const clicked: HTMLAnchorElement[] = []
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })

    try {
      renderOverlay(threeSteps())
      fireEvent.click(screen.getByTestId('ttl-zoom-export'))

      expect(createObjectURL).toHaveBeenCalledTimes(1)
      const blob = createObjectURL.mock.calls[0][0]
      expect(blob).toBeInstanceOf(Blob)
      expect((blob as Blob).type).toBe('application/json')
      expect(clicked).toHaveLength(1)
      expect(clicked[0].download).toBe('trace-step-3.json')
      expect(clicked[0].href).toBe('blob:mock-object-url')
      // jsdom's own click() would attempt a navigation; the spy replaced it.
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-object-url')
      // The anchor is cleaned up again.
      expect(document.querySelectorAll('a[download]')).toHaveLength(0)
    } finally {
      if (originalCreate === undefined) delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL
      else (URL as unknown as { createObjectURL: unknown }).createObjectURL = originalCreate
      if (originalRevoke === undefined) delete (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL
      else (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = originalRevoke
    }
  })

  it('falls back to a data URL when the browser has no URL.createObjectURL', () => {
    delete (URL as unknown as { createObjectURL?: unknown }).createObjectURL
    const clicked: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })

    renderOverlay([stepOf(7, 'read', '{"path":"a.md"}', { text: 'body' })], 7)
    fireEvent.click(screen.getByTestId('ttl-zoom-export'))

    expect(clicked).toHaveLength(1)
    const href = clicked[0].href
    expect(clicked[0].download).toBe('trace-step-7.json')
    expect(href.startsWith('data:application/json')).toBe(true)
    const payload = JSON.parse(decodeURIComponent(href.slice(href.indexOf(',') + 1))) as Record<string, unknown>
    expect(payload.seq).toBe(7)
    expect(payload.name).toBe('read')
    expect(payload.arguments).toBe('{"path":"a.md"}')
    expect(payload.result).toMatchObject({ text: 'body' })
  })

  it('switches panes: 参数/原始 render the arguments, 结果 the result text', () => {
    renderOverlay([stepOf(3, 'bash', '{"command":"ls"}', { text: 'total 0' })], 3)

    fireEvent.click(screen.getByTestId('ttl-zoom-tab-raw'))
    expect(screen.getByTestId('ttl-zoom-body-raw').textContent).toBe('{"command":"ls"}')

    fireEvent.click(screen.getByTestId('ttl-zoom-tab-params'))
    // Valid JSON arguments → the JSON tree.
    expect(screen.getByTestId('ttl-zoom-body-params').querySelector('.ttl-json')).toBeTruthy()

    fireEvent.click(screen.getByTestId('ttl-zoom-tab-result'))
    expect(screen.getByTestId('ttl-zoom-body-result').textContent).toContain('total 0')
  })

  it('shows the empty-result hint for a step whose result has no content', () => {
    renderOverlay([stepOf(3, 'bash', 'cmd', { text: '' })], 3)
    expect(screen.getByTestId('ttl-zoom-empty').textContent).toBe('This call returned no content')
  })

  it('an error result renders the name · code headline and the raw text', () => {
    renderOverlay([
      stepOf(3, 'bash', 'boom', { text: 'stack trace', isError: true, kind: 'error', errorName: 'TeamError', errorCode: 'E9' }),
    ], 3)
    const block = screen.getByTestId('ttl-zoom-error')
    expect(within(block).getByTestId('ttl-zoom-error-name').textContent).toBe('TeamError · E9')
    expect(within(block).getByTestId('ttl-md-raw').textContent).toContain('stack trace')
    expect(screen.getByTestId('ttl-zoom-pill').textContent).toBe('Full')
  })

  it('a truncated step is flagged in the footer pill', () => {
    renderOverlay([stepOf(3, 'bash', 'x'.repeat(50), { text: 't', truncated: true })], 3)
    expect(screen.getByTestId('ttl-zoom-pill').textContent).toBe('Truncated')
  })

  it('clicking an outline row selects it, the close button closes, the backdrop closes', () => {
    const { onClose } = renderOverlay(threeSteps())
    const rows = screen.getAllByTestId('ttl-zoom-step')
    fireEvent.click(rows[2])
    expect(currentRow().textContent).toContain('grep')

    fireEvent.click(screen.getByTestId('ttl-zoom-close'))
    expect(onClose).toHaveBeenCalledTimes(1)

    // A click on the backdrop (the flex area behind the panel) closes too.
    fireEvent.click(screen.getByTestId('ttl-zoom-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('renders nothing when there are no steps to show', () => {
    renderOverlay([], 3)
    expect(screen.queryByTestId('ttl-zoom')).toBeNull()
  })

  it('takes focus on open so the keyboard model works immediately', () => {
    renderOverlay(threeSteps())
    expect(document.activeElement).toBe(screen.getByTestId('ttl-zoom-panel'))
  })
})
