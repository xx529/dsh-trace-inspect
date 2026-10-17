/**
 * json-pretty.spec.tsx — the 参数 pane's formatted JSON (v0.6.0) and its
 * v0.7.0 long-value treatment (options B + C).
 *
 * Requirements pinned here:
 *  - the whole document is rendered at once (no collapse nodes),
 *  - a string >= LONG_VALUE_CHARS starts COLLAPSED as an `N 字符 · M 行` block,
 *  - expanding restores REAL newlines (JSON `\n` escapes become line breaks),
 *  - the block exposes copy + the centered single-value viewer,
 *  - short strings stay inline exactly like `JSON.stringify`.
 */
import { afterEach, describe, expect, it } from 'vitest'
import * as React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { JsonPretty, LONG_VALUE_CHARS } from '../src/client/json-pretty'

afterEach(() => { cleanup() })

describe('JsonPretty — structure', () => {
  it('renders the whole document fully expanded', () => {
    const value = { a: 1, b: { c: [1, 2, { d: true }] }, e: null, f: 'text' }
    render(React.createElement(JsonPretty, { value }))
    const view = screen.getByTestId('ttl-json-pretty')
    // Every nested key is present without any interaction.
    expect(view.textContent).toContain('"d": true')
    expect(view.textContent).toContain('"c": [')
    expect(view.textContent).toContain('"e": null')
    // No disclosure controls for the tree itself.
    expect(screen.queryAllByTestId('ttl-json-toggle')).toHaveLength(0)
    expect(screen.queryByTestId('ttl-json-long')).toBeNull()
  })

  it('colors keys, strings, numbers, booleans and null with the shared tokens', () => {
    render(React.createElement(JsonPretty, { value: { key: 'str', n: 3, t: true, z: null } }))
    const view = screen.getByTestId('ttl-json-pretty')
    expect(view.querySelectorAll('.ttl-jsonKey').length).toBe(4)
    expect(view.querySelectorAll('.ttl-jsonStr').length).toBe(1)
    expect(view.querySelectorAll('.ttl-jsonNum').length).toBe(1)
    expect(view.querySelectorAll('.ttl-jsonBool').length).toBe(1)
    expect(view.querySelectorAll('.ttl-jsonNull').length).toBe(1)
  })

  it('shows short strings inline, escaped exactly like JSON.stringify', () => {
    render(React.createElement(JsonPretty, { value: { cmd: 'ls -la', note: 'a\nb' } }))
    expect(screen.getByTestId('ttl-json-pretty').textContent).toContain('"cmd": "ls -la"')
    expect(screen.getByTestId('ttl-json-pretty').textContent).toContain('"note": "a\\nb"')
    expect(screen.queryByTestId('ttl-json-long')).toBeNull()
  })
})

describe('JsonPretty — long values (B)', () => {
  const longCommand = `cd /Users/lzx/Documents/GitHub/dsh-trace-inspect && python3 - <<'PY'\nimport re\n${'x'.repeat(200)}\nPY`
  const value = { command: longCommand, timeout: 120000 }

  it('collapses a long string by default behind a size/line meta block', () => {
    render(React.createElement(JsonPretty, { value, lang: 'zh' }))
    const block = screen.getByTestId('ttl-json-long')
    expect(block).toBeTruthy()
    // Default collapsed: the decoded text is not rendered yet.
    expect(screen.queryByTestId('ttl-json-long-body')).toBeNull()
    const meta = screen.getByTestId('ttl-json-long-meta').textContent ?? ''
    expect(meta).toContain('字符')
    expect(meta).toContain('行')
    // The short sibling keeps the inline JSON shape.
    expect(screen.getByTestId('ttl-json-pretty').textContent).toContain('"timeout": 120000')
  })

  it('expands into REAL newlines and collapses again', () => {
    render(React.createElement(JsonPretty, { value }))
    fireEvent.click(screen.getByTestId('ttl-json-long-toggle'))
    const body = screen.getByTestId('ttl-json-long-body')
    // The heredoc is restored as separate lines, not as `\n` escapes.
    expect(body.textContent).toBe(longCommand)
    expect(body.textContent).toContain('\nimport re\n')
    expect(body.textContent).not.toContain('\\n')
    fireEvent.click(screen.getByTestId('ttl-json-long-toggle'))
    expect(screen.queryByTestId('ttl-json-long-body')).toBeNull()
  })

  it('only folds strings at or above the documented threshold', () => {
    const short = 'y'.repeat(LONG_VALUE_CHARS - 1)
    render(React.createElement(JsonPretty, { value: { s: short } }))
    expect(screen.queryByTestId('ttl-json-long')).toBeNull()
    cleanup()
    const atLimit = 'y'.repeat(LONG_VALUE_CHARS)
    render(React.createElement(JsonPretty, { value: { s: atLimit } }))
    expect(screen.getByTestId('ttl-json-long')).toBeTruthy()
  })
})

describe('JsonPretty — centered value reader (C)', () => {
  const longCommand = `line one\n${'y'.repeat(200)}\nline three`
  const value = { nested: { command: longCommand } }

  it('opens the viewer for that single value, with the field path as label', () => {
    render(React.createElement(JsonPretty, { value }))
    fireEvent.click(screen.getByTestId('ttl-json-long-view'))
    expect(screen.getByTestId('ttl-value-viewer')).toBeTruthy()
    expect(screen.getByTestId('ttl-value-title').textContent).toContain('nested.command')
    // Newlines are real lines in the reader (line-numbered rows).
    const body = screen.getByTestId('ttl-value-body')
    expect(body.querySelectorAll('.ttl-valueLine').length).toBe(3)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('ttl-value-viewer')).toBeNull()
  })

  it('copies the decoded value from the block without throwing', () => {
    render(React.createElement(JsonPretty, { value }))
    // jsdom has no clipboard by default; the helper no-ops when unavailable.
    expect(() => { fireEvent.click(screen.getByTestId('ttl-json-long-copy')) }).not.toThrow()
  })
})
