/**
 * json-tree.spec.tsx — AC10: the JSON tree collapses lazily, paginates large
 * collections, copies one long field, survives cycles, and refuses to render
 * an over-budget value (all behaviour frozen by docs/detail-contract-v1.md §4.2).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { JsonTree, parseJsonLoose } from '../src/client/json-tree'

beforeEach(() => {
  vi.stubGlobal('navigator', { language: 'en-US' })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('parseJsonLoose', () => {
  it('parses strict JSON, fenced JSON, and trailing-comma JSON', () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ ok: true, value: { a: 1 } })
    expect(parseJsonLoose('[1,2,3]')).toEqual({ ok: true, value: [1, 2, 3] })
    expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ ok: true, value: { a: 1 } })
    expect(parseJsonLoose('{"a":1,}')).toEqual({ ok: true, value: { a: 1 } })
    expect(parseJsonLoose('  {"a": [1, 2,]}  ')).toEqual({ ok: true, value: { a: [1, 2] } })
  })

  it('reports failure for empty, prose, and truncated payloads', () => {
    expect(parseJsonLoose('')).toEqual({ ok: false })
    expect(parseJsonLoose('   ')).toEqual({ ok: false })
    expect(parseJsonLoose('bash -lc "ls"')).toEqual({ ok: false })
    expect(parseJsonLoose('{"a": ')).toEqual({ ok: false })
  })
})

describe('JsonTree', () => {
  it('renders the root expanded and keeps nested containers lazy', () => {
    const { container } = render(<JsonTree value={{ a: 1, nested: { b: 2 } }} />)
    expect(screen.getByTestId('ttl-json')).toBeTruthy()
    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(3)
    expect(container.textContent).not.toContain('b')

    // Toggle order is document order: [root, nested].
    fireEvent.click(screen.getAllByTestId('ttl-json-toggle')[1]!)

    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(4)
    expect(container.textContent).toContain('b')
    expect(screen.getAllByTestId('ttl-json-toggle')[1]!.getAttribute('aria-expanded')).toBe('true')
  })

  it('collapses an expanded container again and can re-open it', () => {
    const { container } = render(<JsonTree value={{ nested: { b: 2 } }} />)
    fireEvent.click(screen.getAllByTestId('ttl-json-toggle')[1]!)
    expect(container.textContent).toContain('b')
    fireEvent.click(screen.getAllByTestId('ttl-json-toggle')[1]!)
    expect(container.textContent).not.toContain('b')
    fireEvent.click(screen.getAllByTestId('ttl-json-toggle')[1]!)
    expect(container.textContent).toContain('b')
  })

  it('stops at maxDepth and marks the cut with an ellipsis', () => {
    const { container } = render(<JsonTree value={{ a: { b: { c: 1 } } }} maxDepth={2} />)
    fireEvent.click(screen.getAllByTestId('ttl-json-toggle')[1]!)
    expect(container.textContent).toContain('b')
    expect(container.textContent).toContain('…')
    expect(container.textContent).not.toContain('c')
  })

  it('renders array indices and primitive types with their own classes', () => {
    const { container } = render(<JsonTree value={[1, 'two', true, null]} />)
    expect(container.querySelectorAll('.ttl-jsonNum').length).toBe(1)
    expect(container.querySelectorAll('.ttl-jsonStr').length).toBe(1)
    expect(container.querySelectorAll('.ttl-jsonBool').length).toBe(1)
    expect(container.querySelectorAll('.ttl-jsonNull').length).toBe(1)
    expect(container.textContent).toContain('0')
    expect(container.textContent).toContain('[4]')
  })

  it('breaks circular references instead of recursing', () => {
    const cyclic: Record<string, unknown> = { name: 'root' }
    cyclic.self = cyclic
    const { container } = render(<JsonTree value={cyclic} />)
    // The root is expanded, so the cycle is visible without any interaction.
    expect(container.textContent).toContain('[Circular]')
  })

  it('breaks a deeper cycle too', () => {
    const a: Record<string, unknown> = { label: 'a' }
    const b: Record<string, unknown> = { label: 'b', back: a }
    a.next = b
    const { container } = render(<JsonTree value={a} />)
    // Expand `next` (b); its `back` points at the root and must read as a cycle.
    fireEvent.click(screen.getAllByTestId('ttl-json-toggle')[1]!)
    expect(container.textContent).toContain('back')
    expect(container.textContent).toContain('[Circular]')
  })

  it('collapses a long string into a copyable, scrollable box', () => {
    const long = `head-${'x'.repeat(300)}`
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { language: 'en-US', clipboard: { writeText } })
    const { container } = render(<JsonTree value={{ blob: long }} />)

    expect(container.querySelector('.ttl-strbox')).toBeTruthy()
    expect(screen.getByTestId('ttl-strbox').textContent).toContain(long)
    const button = screen.getByTestId('ttl-strbox-copy')
    expect(button.textContent).toBe('Copy')

    fireEvent.click(button)
    expect(writeText).toHaveBeenCalledWith(long)
    expect(screen.getByTestId('ttl-strbox-copy').textContent).toBe('Copied')
  })

  it('keeps short strings inline and never touches the clipboard for them', () => {
    const writeText = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { language: 'en-US', clipboard: { writeText } })
    const { container } = render(<JsonTree value={{ short: 'x'.repeat(240) }} />)
    expect(container.querySelector('.ttl-strbox')).toBeNull()
    expect(container.textContent).toContain('x'.repeat(240))
    expect(writeText).not.toHaveBeenCalled()
  })

  it('silently ignores a missing clipboard API', () => {
    const { container } = render(<JsonTree value={{ blob: 'y'.repeat(300) }} />)
    expect(container.querySelector('.ttl-strbox')).toBeTruthy()
    expect(() => fireEvent.click(screen.getByTestId('ttl-strbox-copy'))).not.toThrow()
    expect(screen.getByTestId('ttl-strbox-copy').textContent).toBe('Copied')
  })

  it('paginates large collections with a load-more button', () => {
    const wide = Object.fromEntries(Array.from({ length: 120 }, (_, index) => [`k${index}`, index]))
    const { container } = render(<JsonTree value={wide} />)

    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(51)
    expect(screen.getByTestId('ttl-json-more').textContent).toBe('Load more')

    fireEvent.click(screen.getByTestId('ttl-json-more'))
    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(101)

    fireEvent.click(screen.getByTestId('ttl-json-more'))
    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(121)
    expect(screen.queryByTestId('ttl-json-more')).toBeNull()
  })

  it('honours an explicit pageSize', () => {
    const wide = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`k${index}`, index]))
    const { container } = render(<JsonTree value={wide} pageSize={2} />)
    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(3)
    fireEvent.click(screen.getByTestId('ttl-json-more'))
    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(5)
  })

  it('refuses to render a value above maxNodes and explains why', () => {
    const big = Object.fromEntries(Array.from({ length: 150 }, (_, index) => [`k${index}`, index]))
    const { container } = render(<JsonTree value={big} maxNodes={20} />)

    expect(screen.getByTestId('ttl-json-capped').textContent).toBe('Object too large, collapsed')
    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(0)
  })

  it('aborts the node count early for a huge value instead of walking it', () => {
    const huge = Object.fromEntries(Array.from({ length: 200000 }, (_, index) => [`k${index}`, index]))
    const started = Date.now()
    render(<JsonTree value={huge} maxNodes={100} />)
    expect(screen.getByTestId('ttl-json-capped')).toBeTruthy()
    expect(Date.now() - started).toBeLessThan(1500)
  })

  it('renders a bare primitive root without crashing', () => {
    const { container } = render(<JsonTree value={'just text'} />)
    expect(container.querySelectorAll('.ttl-jsonRow').length).toBe(1)
    expect(container.textContent).toContain('just text')
  })

  it('localizes the too-large notice (zh)', () => {
    vi.stubGlobal('navigator', { language: 'zh-CN' })
    render(<JsonTree value={Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, i]))} maxNodes={5} />)
    expect(screen.getByTestId('ttl-json-capped').textContent).toBe('对象过大，已折叠')
  })
})
