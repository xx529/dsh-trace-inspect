/**
 * json-pretty.spec.tsx — the 参数 pane's formatted, fully-expanded JSON (v0.6.0).
 *
 * The owner asked for "格式化的 json ... 点开后就应该连嵌套的也一并展开", so the
 * component must render the whole document at once (no collapse nodes) while
 * keeping the syntax coloring and a cap for pathological payloads.
 */
import { afterEach, describe, expect, it } from 'vitest'
import * as React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { JsonPretty } from '../src/client/json-pretty'

afterEach(() => { cleanup() })

describe('JsonPretty', () => {
  it('renders the whole document, nested values included', () => {
    const value = { a: 1, b: { c: [1, 2, { d: true }] }, e: null, f: 'text' }
    render(React.createElement(JsonPretty, { value }))
    const pre = screen.getByTestId('ttl-json-pretty')
    expect(pre.textContent).toBe(JSON.stringify(value, null, 2))
    // Nested keys are present without any interaction (fully expanded).
    expect(pre.textContent).toContain('"d": true')
    // No disclosure controls at all — that is the point of the pretty view.
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('colors keys, strings, numbers, booleans and null with the shared tokens', () => {
    render(React.createElement(JsonPretty, { value: { key: 'str', n: 3, t: true, z: null } }))
    const pre = screen.getByTestId('ttl-json-pretty')
    expect(pre.querySelectorAll('.ttl-jsonKey').length).toBe(4)
    expect(pre.querySelectorAll('.ttl-jsonStr').length).toBe(1)
    expect(pre.querySelectorAll('.ttl-jsonNum').length).toBe(1)
    expect(pre.querySelectorAll('.ttl-jsonBool').length).toBe(1)
    expect(pre.querySelectorAll('.ttl-jsonNull').length).toBe(1)
  })

  it('caps oversized documents and expands them on demand', () => {
    const value = { blob: 'x'.repeat(500) }
    render(React.createElement(JsonPretty, { value, cap: 120 }))
    const pre = screen.getByTestId('ttl-json-pretty')
    expect(pre.textContent!.length).toBe(120)
    const more = screen.getByTestId('ttl-json-pretty-more')
    fireEvent.click(more)
    expect(screen.getByTestId('ttl-json-pretty').textContent).toBe(JSON.stringify(value, null, 2))
    expect(screen.queryByTestId('ttl-json-pretty-more')).toBeNull()
  })

  it('falls back to a string for values JSON cannot represent', () => {
    render(React.createElement(JsonPretty, { value: undefined }))
    expect(screen.getByTestId('ttl-json-pretty').textContent).toBe('undefined')
  })
})
