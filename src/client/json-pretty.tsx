/**
 * json-pretty.tsx — formatted JSON, fully expanded (v0.6.0) plus the v0.7.0
 * long-value treatment (options B + C from the readability review).
 *
 * Rendering is structural (not a tokenizer): every object/array is emitted as
 * one row per entry, so the tree is always fully expanded. Values are rendered
 * differently by size:
 *
 * | value                        | rendering                                    |
 * | ---------------------------- | -------------------------------------------- |
 * | short primitive              | inline, colored with the shared JSON tokens  |
 * | string longer than 160 chars | a collapsed block: `1,240 字符 · 6 行` +      |
 * |                              | 展开 / 复制 / ⤢（中央单值查看器）              |
 * | expanded block               | the decoded text with REAL newlines (`pre`)   |
 *
 * The block exists because `JSON.stringify` escapes newlines: a 1 KB `bash`
 * command used to become one clipped line in a 600 px sidebar. Defaults follow
 * the owner's decision — long values start collapsed.
 */
import * as React from 'react'
import { t, detectLang, type Lang } from './locales'
import { copyToClipboard } from './ui-shared'
import { ValueViewer } from './value-viewer'

/** A string at least this long is folded into a long-value block. */
export const LONG_VALUE_CHARS = 160

/** Rendered rows before the "show all" affordance appears. */
export const RENDER_LINE_CAP = 2000

export interface JsonPrettyProps {
  value: unknown
  /** UI language for the block/viewer labels (defaults to the host detector). */
  lang?: Lang
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  const thousands = Math.floor(n / 1000)
  const rest = n % 1000
  return rest === 0 ? `${thousands},000` : `${thousands},${String(rest).padStart(3, '0')}`
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Join a possibly multi-line value into a single `label` for the viewer. */
function joinLabel(prefix: string, key: string): string {
  return prefix.length === 0 ? key : `${prefix}.${key}`
}

interface EmitCtx {
  lang: Lang
  rows: React.ReactNode[]
  budget: number
  seq: number
  onView: (label: string, text: string) => void
}

function pushRow(ctx: EmitCtx, depth: number, content: React.ReactNode, testid?: string): void {
  if (ctx.budget <= 0) return
  ctx.budget -= 1
  ctx.seq += 1
  ctx.rows.push(
    React.createElement(
      'div',
      { className: 'ttl-jpLine', style: { paddingLeft: `${depth * 14}px` }, 'data-testid': testid, key: ctx.seq },
      content,
    ),
  )
}

/**
 * One long string value, kept INLINE as JSON (v0.10.32): the value renders as
 * a normal string token — quotes, text, trailing comma — clipped to one line.
 * The only chrome is the 「…」 tail, tinted blue to read as "click to read the
 * whole value"; it opens the single-value reader. No card, no meta row, no
 * buttons: the document keeps its original JSON shape.
 */
function LongValue(props: {
  label: string
  text: string
  ctx: EmitCtx
  /** The JSON comma that belonged after the value. */
  trailingComma?: boolean
}): React.ReactElement {
  const { label, text, ctx, trailingComma = false } = props
  const lineCount = text.includes('\n') ? text.split('\n').length : 1
  const meta = (t(ctx.lang, 'valueMeta') as (chars: string, lines: number) => string)(formatCount(text.length), lineCount)
  const viewLabel = t(ctx.lang, 'viewInCenter') as string
  /** First line only; the CSS mask fades the clipped tail and 「…」 follows it. */
  const firstLine = (text.split('\n')[0] ?? '').trim()
  const title = `${viewLabel} · ${meta}`
  return (
    <span
      className="ttl-jpLong"
      data-testid="ttl-json-long"
      onClick={(event) => { event.stopPropagation() }}
    >
      <span className="ttl-jpLongQuote" aria-hidden="true">&quot;</span>
      <span className="ttl-jpLongText" data-testid="ttl-json-long-preview">{firstLine}</span>
      <button
        type="button"
        className="ttl-jpLongMore"
        data-testid="ttl-json-long-view"
        title={title}
        aria-label={title}
        onClick={() => { ctx.onView(label, text) }}
      >…</button>
      <span className="ttl-jpLongQuote" aria-hidden="true">&quot;</span>
      {trailingComma ? <span className="ttl-jsonPunct">,</span> : null}
    </span>
  )
}

function emitValue(
  ctx: EmitCtx,
  value: unknown,
  depth: number,
  key: string | null,
  path: string,
  trailingComma: boolean,
): void {
  const comma = trailingComma ? ',' : ''
  const prefix = key === null
    ? null
    : React.createElement(React.Fragment, null,
      React.createElement('span', { className: 'ttl-jsonKey' }, JSON.stringify(key)),
      ': ')

  if (typeof value === 'string') {
    if (value.length >= LONG_VALUE_CHARS) {
      // A flex line keeps the key fixed and lets the long value take the rest,
      // so the trailing 「…」 is always visible inside the panel width.
      pushRow(ctx, depth, React.createElement('span', { className: 'ttl-jpLineFlex' },
        prefix,
        React.createElement(LongValue, { label: path, text: value, ctx, trailingComma: trailingComma })))
      return
    }
    pushRow(ctx, depth, React.createElement(React.Fragment, null, prefix,
      React.createElement('span', { className: 'ttl-jsonStr' }, JSON.stringify(value)), comma))
    return
  }
  if (typeof value === 'number') {
    pushRow(ctx, depth, React.createElement(React.Fragment, null, prefix,
      React.createElement('span', { className: 'ttl-jsonNum' }, String(value)), comma))
    return
  }
  if (typeof value === 'boolean') {
    pushRow(ctx, depth, React.createElement(React.Fragment, null, prefix,
      React.createElement('span', { className: 'ttl-jsonBool' }, String(value)), comma))
    return
  }
  if (value === null) {
    pushRow(ctx, depth, React.createElement(React.Fragment, null, prefix,
      React.createElement('span', { className: 'ttl-jsonNull' }, 'null'), comma))
    return
  }
  if (Array.isArray(value)) {
    emitContainer(ctx, value.map((entry, index) => [String(index), entry] as const), depth, key, path, '[', false, comma)
    return
  }
  if (isPlainObject(value)) {
    emitContainer(ctx, Object.entries(value), depth, key, path, '{', true, comma)
    return
  }
  // `undefined` and functions cannot appear through JSON.parse; keep a readable
  // placeholder instead of throwing.
  pushRow(ctx, depth, React.createElement(React.Fragment, null, prefix,
    React.createElement('span', { className: 'ttl-jsonNull' }, String(value)), comma))
}

function emitContainer(
  ctx: EmitCtx,
  entries: ReadonlyArray<readonly [string, unknown]>,
  depth: number,
  key: string | null,
  path: string,
  brace: '{' | '[',
  showKeys: boolean,
  trailingComma: string,
): void {
  const close = brace === '{' ? '}' : ']'
  const prefix = key === null
    ? null
    : React.createElement(React.Fragment, null,
      React.createElement('span', { className: 'ttl-jsonKey' }, JSON.stringify(key)),
      ': ')
  pushRow(ctx, depth, React.createElement(React.Fragment, null, prefix,
    React.createElement('span', { className: 'ttl-jsonPunct' }, brace)))
  entries.forEach(([entryKey, entryValue], index) => {
    emitValue(
      ctx,
      entryValue,
      depth + 1,
      showKeys ? entryKey : null,
      showKeys ? joinLabel(path, entryKey) : `${path}[${entryKey}]`,
      index < entries.length - 1,
    )
  })
  pushRow(ctx, depth, React.createElement(React.Fragment, null,
    React.createElement('span', { className: 'ttl-jsonPunct' }, close), trailingComma))
}

/**
 * Pretty-printed, fully-expanded, syntax-colored JSON with long-value blocks.
 * @param props - The parsed value and the UI language.
 * @returns The JSON view; long values open a centered single-value viewer.
 */
export function JsonPretty(props: JsonPrettyProps): React.ReactElement {
  const { value } = props
  const lang = props.lang ?? detectLang()
  const [showAll, setShowAll] = React.useState(false)
  const [viewer, setViewer] = React.useState<{ label: string; text: string } | null>(null)
  const onView = React.useCallback((label: string, text: string): void => {
    setViewer({ label, text })
  }, [])

  const built = React.useMemo(() => {
    const ctx: EmitCtx = {
      lang,
      rows: [],
      budget: showAll ? Number.MAX_SAFE_INTEGER : RENDER_LINE_CAP,
      seq: 0,
      onView,
    }
    emitValue(ctx, value, 0, null, '', false)
    return { rows: ctx.rows, exhausted: ctx.budget <= 0 }
  }, [lang, onView, showAll, value])

  return (
    <div className="ttl-jsonPrettyWrap">
      <div className="ttl-jsonPretty" data-testid="ttl-json-pretty">{built.rows}</div>
      {built.exhausted && !showAll
        ? (
          <button
            type="button"
            className="ttl-dtab ttl-jsonMore"
            data-testid="ttl-json-pretty-more"
            onClick={() => { setShowAll(true) }}
          >{(t(lang, 'jsonShowAll') as (n: number) => string)(RENDER_LINE_CAP)}</button>
        )
        : null}
      {viewer !== null
        ? (
          <ValueViewer
            label={viewer.label}
            text={viewer.text}
            lang={lang}
            onClose={() => { setViewer(null) }}
          />
        )
        : null}
    </div>
  )
}
