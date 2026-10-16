/**
 * markdown-result.spec.tsx — AC11/AC13/AC17: read-shaped results render as
 * Markdown through the host renderer, shell logs stay literal, a missing host
 * renderer degrades to raw text (never throws), the render cap offers "show
 * all", table overflow has its wrapper, and every §4.5 class ships in the CSS.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MarkdownResult, RawText, defaultViewForTool, looksLikeMarkdown } from '../src/client/markdown-result'
import { markdownLabels } from '../src/client/markdown-labels'
import { setPrimitivesForTest, loadPrimitives, type MarkdownLabels, type PrimitivesModule } from '../src/client/ui-primitives'
import { trailCss } from '../src/client/styles'

interface Captured {
  md: Array<{ text: string; streaming: boolean; variant: string | undefined; labels: MarkdownLabels }>
  openFile: unknown
}

const captured: Captured = { md: [], openFile: undefined }

function fakePrimitives(): PrimitivesModule {
  return {
    MarkdownText: (props) => {
      captured.md.push({
        text: props.text,
        streaming: props.streaming === true,
        variant: props.variant,
        labels: props.labels,
      })
      return <div data-testid="fake-md">{props.text}</div>
    },
    MarkdownDelegateProvider: (props) => {
      captured.openFile = props.openFile
      return <div data-testid="fake-provider">{props.children}</div>
    },
  }
}

beforeEach(() => {
  captured.md = []
  captured.openFile = undefined
  setPrimitivesForTest(fakePrimitives())
})

afterEach(() => {
  cleanup()
  setPrimitivesForTest(undefined)
  vi.unstubAllGlobals()
})

describe('looksLikeMarkdown', () => {
  it('accepts structural Markdown signals', () => {
    expect(looksLikeMarkdown('# Title\ntext')).toBe(true)
    expect(looksLikeMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |')).toBe(true)
    expect(looksLikeMarkdown('| --- |')).toBe(true)
    expect(looksLikeMarkdown('```ts\nconst a = 1\n```')).toBe(true)
    expect(looksLikeMarkdown('- one\n- two')).toBe(true)
    expect(looksLikeMarkdown('* one')).toBe(true)
    expect(looksLikeMarkdown('+ one')).toBe(true)
    expect(looksLikeMarkdown('1. one')).toBe(true)
    expect(looksLikeMarkdown('> quoted')).toBe(true)
    expect(looksLikeMarkdown('use **bold** here')).toBe(true)
    expect(looksLikeMarkdown('use `code` here')).toBe(true)
  })

  it('rejects prose without structure and machine output', () => {
    expect(looksLikeMarkdown('')).toBe(false)
    expect(looksLikeMarkdown('done')).toBe(false)
    expect(looksLikeMarkdown('$ npm test\nok 12 tests')).toBe(false)
    expect(looksLikeMarkdown('a | b | c')).toBe(false)
    expect(looksLikeMarkdown('a - b')).toBe(false)
  })

  it('rejects output dominated by ANSI escapes but accepts a stray one', () => {
    const heavy = '# Heading\n\u001b[31ma\u001b[0m\u001b[32mb\u001b[0m\u001b[33mc\u001b[0m'
    expect(looksLikeMarkdown(heavy)).toBe(false)
    const stray = '# Heading\n\u001b[31mbody\u001b[0m'
    expect(looksLikeMarkdown(stray)).toBe(true)
  })

  it('rejects error stacks even when Markdown follows', () => {
    expect(looksLikeMarkdown('Error: boom\n# not markdown')).toBe(false)
    expect(looksLikeMarkdown('Traceback (most recent call last):\n**bold**')).toBe(false)
    expect(looksLikeMarkdown('    at foo (bar.js:1)\n- list')).toBe(false)
  })
})

describe('defaultViewForTool', () => {
  it('seeds prose tools to rendered and everything else to raw', () => {
    for (const name of ['read', 'web_fetch', 'fetch', 'glob', 'grep']) {
      expect(defaultViewForTool(name)).toBe('rendered')
    }
    for (const name of ['bash', 'bash_output', 'pwsh']) {
      expect(defaultViewForTool(name)).toBe('raw')
    }
    expect(defaultViewForTool('edit')).toBe('raw')
    expect(defaultViewForTool('')).toBe('raw')
    expect(defaultViewForTool(' Read ')).toBe('rendered')
  })
})

describe('RawText', () => {
  it('preserves whitespace and merges an extra class', () => {
    render(<RawText text={'a\n  b'} className="extra" />)
    const pre = screen.getByTestId('ttl-md-raw')
    expect(pre.tagName).toBe('PRE')
    expect(pre.textContent).toBe('a\n  b')
    expect(pre.className).toBe('ttl-raw extra')
  })

  it('uses only the base class when none is given', () => {
    render(<RawText text="x" />)
    expect(screen.getByTestId('ttl-md-raw').className).toBe('ttl-raw')
  })
})

describe('MarkdownResult', () => {
  it('renders Markdown through the host renderer with stable labels', () => {
    const openFile = vi.fn()
    render(<MarkdownResult text={'# Title\n\nbody'} labels={markdownLabels('en')} openFile={openFile} />)

    expect(screen.getByTestId('ttl-md')).toBeTruthy()
    expect(screen.getByTestId('fake-md').textContent).toBe('# Title\n\nbody')
    expect(captured.md.length).toBe(1)
    expect(captured.md[0]!.streaming).toBe(false)
    expect(captured.md[0]!.variant).toBe('compact')
    expect(captured.md[0]!.labels).toBe(markdownLabels('en'))

    // Table overflow wrapper is the scroll container around `.ttl-md`.
    expect(screen.getByTestId('ttl-md').closest('.ttl-mdTableWrap')).toBeTruthy()

    // `openFile(path, line)` is bridged to the provider's options bag.
    expect(typeof captured.openFile).toBe('function')
    ;(captured.openFile as (path: string, options?: { line?: number }) => void)('src/a.ts', { line: 12 })
    expect(openFile).toHaveBeenCalledWith('src/a.ts', 12)
  })

  it('renders shell output as literal text without touching the renderer', () => {
    render(<MarkdownResult text={'$ npm test\nok 12 tests'} labels={markdownLabels('en')} />)
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe('$ npm test\nok 12 tests')
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    expect(screen.queryByTestId('ttl-md-fallback')).toBeNull()
    expect(captured.md.length).toBe(0)
  })

  it('falls back to raw text plus a hint when the host renderer is missing', () => {
    setPrimitivesForTest(null)
    render(<MarkdownResult text={'# Title'} labels={markdownLabels('en')} />)
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe('# Title')
    expect(screen.getByTestId('ttl-md-fallback').textContent)
      .toBe('Markdown renderer unavailable — showing raw text')
    expect(screen.queryByTestId('ttl-md')).toBeNull()
  })

  it('shows no renderer hint for raw-shaped output when the renderer is missing', () => {
    setPrimitivesForTest(null)
    render(<MarkdownResult text={'plain log'} labels={markdownLabels('en')} />)
    expect(screen.getByTestId('ttl-md-raw')).toBeTruthy()
    expect(screen.queryByTestId('ttl-md-fallback')).toBeNull()
  })

  it('never throws while resolving the host module', () => {
    setPrimitivesForTest(undefined)
    let resolved: PrimitivesModule | null = null
    expect(() => { resolved = loadPrimitives() }).not.toThrow()
    expect(resolved === null || typeof (resolved as PrimitivesModule).MarkdownText !== 'undefined').toBe(true)
    // Resolution is memoized: a second call returns the same answer.
    expect(loadPrimitives()).toBe(resolved)
  })

  it('caps the render and expands everything on demand', () => {
    const text = `# H\n${'x'.repeat(40)}`
    render(<MarkdownResult text={text} labels={markdownLabels('en')} renderCap={10} />)

    expect(captured.md[0]!.text).toBe(text.slice(0, 10))
    const bar = screen.getByTestId('ttl-md-truncated')
    const button = bar.querySelector('button')!
    expect(button.textContent).toBe(`Show all (${text.length})`)

    fireEvent.click(button)
    expect(captured.md[captured.md.length - 1]!.text).toBe(text)
    expect(screen.queryByTestId('ttl-md-truncated')).toBeNull()
  })

  it('does not cap text under the render cap', () => {
    render(<MarkdownResult text={'# H\nshort'} labels={markdownLabels('en')} renderCap={1024} />)
    expect(screen.queryByTestId('ttl-md-truncated')).toBeNull()
  })
})

describe('markdownLabels', () => {
  it('is reference-stable per language', () => {
    expect(markdownLabels('en')).toBe(markdownLabels('en'))
    expect(markdownLabels('zh')).toBe(markdownLabels('zh'))
    expect(markdownLabels('zh')).not.toBe(markdownLabels('en'))
  })

  it('localizes the fence toolbar and footnotes (AC17)', () => {
    const zh = markdownLabels('zh')
    expect(zh.code.copyLabel).toBe('复制')
    expect(zh.code.copiedLabel).toBe('已复制')
    expect(zh.code.toolbarLabels).toEqual({ codeLabel: '代码', wrapLabel: '自动换行', unwrapLabel: '不换行' })
    expect(zh.footnotes).toBe('脚注')

    const en = markdownLabels('en')
    expect(en.code.copyLabel).toBe('Copy')
    expect(en.code.copiedLabel).toBe('Copied')
    expect(en.code.toolbarLabels).toEqual({ codeLabel: 'Code', wrapLabel: 'Wrap', unwrapLabel: 'No wrap' })
    expect(en.footnotes).toBe('Footnotes')
  })
})

describe('detail stylesheet (契约 §4.5)', () => {
  const REQUIRED = [
    '.ttl-stepWrap',
    '.ttl-caret',
    '.ttl-caretOpen',
    '.ttl-jump',
    '.ttl-detail',
    '.ttl-detailBar',
    '.ttl-dtab',
    '.ttl-dtabSelected',
    '.ttl-detailBody',
    '.ttl-detailFoot',
    '.ttl-pill',
    '.ttl-pillWarn',
    '.ttl-pillOk',
    '.ttl-detailHint',
    '.ttl-json',
    '.ttl-jsonRow',
    '.ttl-jsonKey',
    '.ttl-jsonToggle',
    '.ttl-jsonStr',
    '.ttl-jsonNum',
    '.ttl-jsonBool',
    '.ttl-jsonNull',
    '.ttl-jsonMore',
    '.ttl-jsonCapped',
    '.ttl-strbox',
    '.ttl-md',
    '.ttl-mdTableWrap',
    '.ttl-mdTruncated',
    '.ttl-raw',
    '.ttl-imgRow',
    '.ttl-imgChip',
    '.ttl-errorBlock',
  ]

  it('ships every contracted class and the open-row rule', () => {
    for (const cls of REQUIRED) expect(trailCss).toContain(cls)
    expect(trailCss).toContain('.ttl-stepWrap[data-open="true"] .ttl-row')
  })

  it('uses no bare color literal: every hex sits in a DSW token fallback', () => {
    const offenders = trailCss
      .split('\n')
      .filter((line) => /#[0-9a-fA-F]{3,8}\b/.test(line) && !line.includes('var(--dsw-'))
    expect(offenders).toEqual([])
  })

  it('keeps untrusted output out of innerHTML / eval', () => {
    const sources = ['json-tree.tsx', 'markdown-result.tsx', 'ui-primitives.ts', 'markdown-labels.ts']
    const forbidden = [/dangerouslySetInnerHTML/, /\.innerHTML\b/, /\beval\s*\(/]
    for (const name of sources) {
      const raw = readFileSync(resolve(process.cwd(), 'src/client', name), 'utf8')
      // Strip comments: the headers legitimately NAME the forbidden APIs.
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      for (const pattern of forbidden) {
        expect(pattern.test(code), `${name} matches ${String(pattern)}`).toBe(false)
      }
    }
  })
})
