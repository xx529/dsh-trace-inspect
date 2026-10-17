/**
 * value-viewer.spec.tsx — the centered single-value reader (v0.7.0, option C).
 *
 * Pins the contract the params block relies on: real newlines with line
 * numbers, soft wrapping (CSS, not asserted), find-in-value with highlighting,
 * Esc/⌘C behaviour, full-text copy, and focus returning to the trigger.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ValueViewer } from '../src/client/value-viewer'

afterEach(() => { cleanup() })

const text = 'cd /repo && python3 - <<PY\nimport re\nprint("hi")\nPY'

const renderViewer = (overrides: Partial<React.ComponentProps<typeof ValueViewer>> = {}) => {
  const onClose = vi.fn()
  render(React.createElement(ValueViewer, { label: 'command', text, lang: 'zh', onClose, ...overrides }))
  return { onClose }
}

describe('ValueViewer', () => {
  it('renders one numbered row per real line', () => {
    renderViewer()
    expect(screen.getByTestId('ttl-value-viewer')).toBeTruthy()
    const rows = screen.getByTestId('ttl-value-body').querySelectorAll('.ttl-valueLine')
    expect(rows).toHaveLength(4)
    expect(rows[0]!.textContent).toContain('cd /repo && python3 - <<PY')
    expect(rows[1]!.textContent).toContain('import re')
    // Line numbers are rendered.
    expect(rows[0]!.querySelector('.ttl-valueLn')?.textContent).toBe('1')
    expect(rows[3]!.querySelector('.ttl-valueLn')?.textContent).toBe('4')
  })

  it('shows the label and size meta in the header', () => {
    renderViewer()
    const title = screen.getByTestId('ttl-value-title').textContent ?? ''
    expect(title).toContain('command')
    expect(title).toContain('4 行')
    expect(title).toContain('字符')
  })

  it('highlights matches and reports the count; no match says so', () => {
    renderViewer()
    const search = screen.getByTestId('ttl-value-search')
    fireEvent.change(search, { target: { value: 'import' } })
    expect(screen.getByTestId('ttl-value-hits').textContent).toContain('1')
    expect(screen.getByTestId('ttl-value-body').querySelectorAll('mark.ttl-valueHit')).toHaveLength(1)
    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByTestId('ttl-value-hits').textContent).toBe('无匹配')
  })

  it('closes on Esc and on the close button', () => {
    const { onClose } = renderViewer()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('ttl-value-close'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('copies the FULL decoded text (not a truncated view)', () => {
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderViewer()
    fireEvent.click(screen.getByTestId('ttl-value-copy'))
    expect(writeText).toHaveBeenCalledWith(text)
    delete (navigator as { clipboard?: unknown }).clipboard
  })

  it('returns focus to the element that was focused before it opened', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
    const { rerender } = render(React.createElement(ValueViewer, { label: 'x', text, lang: 'zh', onClose: () => {} }))
    expect(document.activeElement).not.toBe(trigger)
    rerender(React.createElement(React.Fragment, null))
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('caps very long values but keeps the full copy', () => {
    const big = Array.from({ length: 4200 }, (_, i) => `line ${i + 1}`).join('\n')
    renderViewer({ text: big })
    expect(screen.getByTestId('ttl-value-clipped')).toBeTruthy()
    expect(screen.getByTestId('ttl-value-body').querySelectorAll('.ttl-valueLine')).toHaveLength(4000)
  })
})
