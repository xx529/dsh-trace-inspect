/**
 * markdown-result.spec.tsx — AC11/AC13/AC17: read-shaped results render as
 * Markdown through the host renderer, shell logs stay literal, a missing host
 * renderer degrades to raw text (never throws), the render cap offers "show
 * all", table overflow has its wrapper, and every §4.5 class ships in the CSS.
 *
 * F8 (契约 §11.3): a `read` result is an XML envelope of line-numbered lines;
 * only a `.md`/`.markdown`/`.mdx` file body is unwrapped and rendered.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MarkdownResult, RawText, defaultViewForTool, looksLikeMarkdown, unwrapFileResult } from '../src/client/markdown-result'
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

/**
 * A host renderer stand-in that models the one thing GFM needs for a table: a
 * separator row shaped like a row, i.e. sitting at the start of its line. The
 * real `MarkdownText` behaves the same way (and refuses raw HTML), which is why
 * a line-numbered envelope could never produce a `<table>` (契约 §11.3 F8).
 */
const TABLE_SEPARATOR = /^\|?[\s:|-]*-{3,}[\s:|-]*\|[ \t]*$/m

function tableAwarePrimitives(): PrimitivesModule {
  return {
    MarkdownText: (props) => {
      captured.md.push({
        text: props.text,
        streaming: props.streaming === true,
        variant: props.variant,
        labels: props.labels,
      })
      return TABLE_SEPARATOR.test(props.text)
        ? <table data-testid="fake-table"><tbody><tr><td>cell</td></tr></tbody></table>
        : <div data-testid="fake-md">{props.text}</div>
    },
    MarkdownDelegateProvider: (props) => {
      captured.openFile = props.openFile
      return <div data-testid="fake-provider">{props.children}</div>
    },
  }
}

/** A wide-table Markdown body, the AC13 fixture shape. */
const MD_FILE_BODY = [
  '# AC13 宽表格 fixture',
  '',
  '| 模块 | 路径 | 说明 |',
  '| --- | --- | --- |',
  '| a | src/a.ts | 第一列 |',
  '| b | src/b.ts | 第二列 |',
  '',
  '```ts',
  'const a = 1',
  '```',
].join('\n')

/** Build the exact DSH `read` envelope: `<lineNumber>: <text>` lines, then `</content>`. */
function readEnvelope(path: string, type: string, body: string): string {
  const numbered = body.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n')
  return `<path>${path}</path>\n<type>${type}</type>\n<content>\n${numbered}\n</content>`
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

describe('unwrapFileResult (契约 §11.3 F8)', () => {
  it('parses the DSH read envelope and strips every line-number prefix', () => {
    const envelope = readEnvelope('/tmp/ac13-wide-table.md', 'file', MD_FILE_BODY)
    expect(unwrapFileResult(envelope)).toEqual({
      path: '/tmp/ac13-wide-table.md',
      type: 'file',
      body: MD_FILE_BODY,
    })
  })

  it('turns an empty numbered line (`12: `) into a real empty line', () => {
    const envelope = '<path>/tmp/gaps.md</path>\n<type>file</type>\n<content>\n1: # T\n2: \n12: \n30: tail\n</content>'
    expect(unwrapFileResult(envelope)).toEqual({
      path: '/tmp/gaps.md',
      type: 'file',
      body: '# T\n\n\ntail',
    })
  })

  it('drops the read tool footer (chrome, not file content)', () => {
    const eof = '<path>/tmp/a.md</path>\n<type>file</type>\n<content>\n1: # T\n2: body\n(End of file - total 2 lines)\n</content>'
    expect(unwrapFileResult(eof)).toEqual({ path: '/tmp/a.md', type: 'file', body: '# T\nbody' })
    const windowed =
      '<path>/tmp/a.md</path>\n<type>file</type>\n<content>\n1: # T\n2: body\n(Showing lines 1-2 of 576. Use offset=3 to continue.)\n</content>'
    expect(unwrapFileResult(windowed)).toEqual({ path: '/tmp/a.md', type: 'file', body: '# T\nbody' })
    // A footer-shaped line in the middle is real content and must survive.
    const middle = '<path>/tmp/a.md</path>\n<type>file</type>\n<content>\n1: (End of file - total 2 lines)\n2: body\n</content>'
    expect(unwrapFileResult(middle)?.body).toBe('(End of file - total 2 lines)\nbody')
  })

  it('returns null for anything that is not that envelope', () => {
    expect(unwrapFileResult('')).toBeNull()
    expect(unwrapFileResult('# Title')).toBeNull()
    expect(unwrapFileResult('<path>/a.md</path>')).toBeNull()
    // Missing `</content>`: a truncated result must not be half-parsed.
    expect(unwrapFileResult('<path>/a.md</path>\n<type>file</type>\n<content>\n1: x')).toBeNull()
    expect(unwrapFileResult('prose\n<content>\n1: x\n</content>')).toBeNull()
    expect(unwrapFileResult('<path>/a.md</path>\n<type>file</type>\n<content>\n1: x\n</content>\nextra')).toBeNull()
  })

  it('keeps a non-file envelope parseable but reports its type', () => {
    const envelope = '<path>/tmp/a.png</path>\n<type>image</type>\n<content>\nimage/png\n1440×860\n</content>'
    expect(unwrapFileResult(envelope)).toEqual({
      path: '/tmp/a.png',
      type: 'image',
      body: 'image/png\n1440×860',
    })
  })
})

describe('looksLikeMarkdown · read envelope (契约 §11.3 F8)', () => {
  it('judges the unwrapped body, not the envelope, for a Markdown file', () => {
    expect(looksLikeMarkdown(readEnvelope('/tmp/ac13-wide-table.md', 'file', MD_FILE_BODY))).toBe(true)
    expect(looksLikeMarkdown(readEnvelope('/tmp/notes.markdown', 'file', '```\ncode fence\n```'))).toBe(true)
    expect(looksLikeMarkdown(readEnvelope('/tmp/page.mdx', 'file', '# Title'))).toBe(true)
  })

  it('still answers false when the Markdown file body has no structure', () => {
    expect(looksLikeMarkdown(readEnvelope('/tmp/notes.md', 'file', 'just prose\nnothing structural'))).toBe(false)
  })

  it('forces machine files to literal text even with inline Markdown in the body', () => {
    expect(looksLikeMarkdown(readEnvelope('/tmp/a.ts', 'file', 'const a = `code`\n**not** prose'))).toBe(false)
    expect(looksLikeMarkdown(readEnvelope('/tmp/a.json', 'file', '- looks like a list\n> and a quote'))).toBe(false)
  })

  it('forces non-file envelopes to literal text', () => {
    expect(looksLikeMarkdown(readEnvelope('/tmp/a.png', 'image', '# not markdown\n| --- |'))).toBe(false)
  })

  it('leaves non-envelope text on the original rules', () => {
    expect(looksLikeMarkdown('# Title\ntext')).toBe(true)
    expect(looksLikeMarkdown('done')).toBe(false)
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

  it('shows the unwrapped body — not the read envelope — when a .md file has no Markdown signals', () => {
    // 契约 §11.4#5 (F-V6): the fallback must still drop the `<path>`/line-number
    // chrome, otherwise a plain-prose `.md` reads worse than the raw log did.
    const envelope =
      '<path>/tmp/plain.md</path>\n<type>file</type>\n<content>\n1: just prose\n2: no signals here\n(End of file - total 2 lines)\n</content>'
    render(<MarkdownResult text={envelope} labels={markdownLabels('en')} />)
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe('just prose\nno signals here')
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    expect(captured.md.length).toBe(0)
  })

  it('keeps the untouched payload for a non-.md envelope in the fallback', () => {
    const envelope = '<path>/tmp/a.ts</path>\n<type>file</type>\n<content>\n1: const a = 1\n</content>'
    render(<MarkdownResult text={envelope} labels={markdownLabels('en')} />)
    expect(screen.getByTestId('ttl-md-raw').textContent).toBe(envelope)
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

  it('renders the unwrapped .md body, so a real table can be produced', () => {
    setPrimitivesForTest(tableAwarePrimitives())
    const envelope = readEnvelope('/tmp/ac13-wide-table.md', 'file', MD_FILE_BODY)
    // The envelope as-is can never become a table: its separator row is numbered.
    expect(TABLE_SEPARATOR.test(envelope)).toBe(false)

    render(<MarkdownResult text={envelope} labels={markdownLabels('en')} />)

    expect(screen.getByTestId('ttl-md')).toBeTruthy()
    expect(screen.getByTestId('fake-table')).toBeTruthy()
    expect(screen.queryByTestId('ttl-md-raw')).toBeNull()
    expect(captured.md.length).toBe(1)
    expect(captured.md[0]!.text).toBe(MD_FILE_BODY)
    expect(captured.md[0]!.text).not.toContain('<path>')
    expect(captured.md[0]!.text).not.toContain('</content>')
    expect(/^\d+: /m.test(captured.md[0]!.text)).toBe(false)
  })

  it('keeps a non-Markdown read result (`.ts`) as literal text', () => {
    const envelope = readEnvelope('/tmp/a.ts', 'file', 'const a = `code`\n**not** prose')
    render(<MarkdownResult text={envelope} labels={markdownLabels('en')} />)

    expect(screen.getByTestId('ttl-md-raw').textContent).toBe(envelope)
    expect(screen.queryByTestId('ttl-md')).toBeNull()
    expect(captured.md.length).toBe(0)
  })

  it('caps and counts the unwrapped body, not the envelope', () => {
    const body = `# H\n${'x'.repeat(40)}`
    render(<MarkdownResult text={readEnvelope('/tmp/long.md', 'file', body)} labels={markdownLabels('en')} renderCap={10} />)

    expect(captured.md[0]!.text).toBe(body.slice(0, 10))
    expect(screen.getByTestId('ttl-md-truncated').querySelector('button')!.textContent)
      .toBe(`Show all (${body.length})`)
  })

  it('degrades an unwrapped .md envelope to the untouched original when the renderer is missing', () => {
    setPrimitivesForTest(null)
    const envelope = readEnvelope('/tmp/ac13-wide-table.md', 'file', MD_FILE_BODY)
    render(<MarkdownResult text={envelope} labels={markdownLabels('en')} />)

    expect(screen.getByTestId('ttl-md-raw').textContent).toBe(envelope)
    expect(screen.getByTestId('ttl-md-fallback').textContent)
      .toBe('Markdown renderer unavailable — showing raw text')
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
