/**
 * StepDetail.tsx — the v0.9 inline step-detail band (契约 §3).
 *
 * Extracted from TrailTab (v0.8 was an internal function there) so the shell
 * only imports it, css-foundation can style it by contract class, and the
 * overlay can reuse the same types. The band is the primary reading surface:
 *
 *   head    tool-family chip + name + human description + copy/zoom/close
 *   status  success/failure dot + text + duration + seq + contextual meta
 *   tabs    摘要 / 结果 / 参数 / 原始
 *   body    one pane per tab (see below)
 *   foot    完整度 pill + seq + 「在中央查看」
 *
 * The 摘要 pane is the redesigned default (契约 §3.3) and is tool-family
 * specific:
 *   - shell:  `args.command` split into `&&` / `;` / newline segments (pipes
 *     stay inline as `op` tokens), syntax-highlighted (command-format.ts),
 *     soft-wrapped, plus the argument key/value table and a collapsed output
 *     preview;
 *   - mcp:    MCP badge + connection line, typed key/value table (arrays fold
 *     into chips + `+N`) and a path-list result, else a text preview;
 *   - file:   path block with line/diff chips, key/value table, output preview;
 *   - other:  key/value table + output preview.
 *
 * Data/behaviour is unchanged from the v0.5-v0.8 band: a clipped preview asks
 * the host for the untruncated detail once (retry allowed once), results go
 * through MarkdownResult / RawText, arguments through JsonTree / RawText, and
 * every value reaches React children only (no innerHTML).
 *
 * Note: the few labels this file introduces that are not in `locales.ts` yet
 * live in `labelsFor()` below (Lead owns locales.ts); migrate them there when
 * convenient — the public surface stays the same.
 */
import * as React from 'react'
import type { TrailResult, TrailResultImage, TrailStep } from '../trail-model'
import { formatDuration, toolFamily, type ToolFamily } from './format'
import { t, type Lang } from './locales'
import { markdownLabels } from './markdown-labels'
import { MarkdownResult, RawText, looksLikeMarkdown, unwrapFileResult } from './markdown-result'
import { JsonTree, parseJsonLoose } from './json-tree'
import { fileBaseName, splitMcpName, summarizeToolCall, type ToolSummary, type ToolTone } from './tool-summary'
import { ToolIcon } from './tool-icon'
import { TrailImages, copyToClipboard } from './ui-shared'
import { commandStats, splitCommand } from './command-format'
import type { DetailTab, ResultView } from './detail-types'
import type { ToolDetailItem, ToolDetailResult } from './useTrail'

/** Wire-side caps of the preview (src/wire.ts ARGS_CAP / RESULT_CAP = 32 KiB). */
const CAP_KIB = 32
/** Rendered output preview lines before 「展开全文」. */
const OUT_PREVIEW_LINES = 3
/** Result rows shown in the MCP/file list before the fold note. */
const MAX_FILE_ROWS = 3
/** Array chips shown before `+N`. */
const MAX_CHIPS = 3
/** Strings longer than this fold into `N 字符 · M 行`. */
const LONG_VALUE_CHARS = 160
/** Long commands (heredoc etc.) render only this many segments until expanded. */
const MAX_CODE_SEGMENTS = 12
/** One path-list line is only accepted when the token looks like a file. */
const FILE_EXT = /\.(?:png|jpe?g|gif|webp|svg|json|md|txt|pdf|csv|ts|tsx|js|jsx|html|css|yml|yaml|zip|tgz|log|toml)$/i
/** Trailing size of one file row: `(74 KB)` / `74 KB` / `1.6 MB`. */
const SIZE_TAIL = /\s*\(?(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)\)?\s*$/i
/** A preview line longer than this is clipped (the full text stays on demand). */
const OUT_LINE_MAX = 240

// ── Labels (`locales.ts` is Lead-owned; the new v0.9 strings live here) ──

interface StepLabels {
  summary: string
  params: string
  result: string
  raw: string
  render: string
  source: string
  command: string
  commandHint: string
  output: string
  mcpCall: string
  mcpProto: string
  connected: string
  copy: string
  copyAll: string
  zoomTitle: string
  closeTitle: string
  viewInCenter: string
  clickToView: string
  showFull: string
  collapse: string
  collapseAll: string
  showAllSegments: (n: number) => string
  ok: string
  failed: string
  loadingFull: string
  loadFailed: string
  retry: string
  fullPill: string
  truncatedPill: string
  loadedPill: string
  unparsable: string
  empty: string
  markdownKind: string
  textKind: string
  segments: (n: number) => string
  chars: (n: number) => string
  allItems: (n: number) => string
  lines: (n: number) => string
  charsLines: (chars: number, lines: number) => string
  items: (n: number) => string
  files: (n: number) => string
  moreFiles: (n: number) => string
  truncatedResult: (cap: string) => string
  truncatedArgs: (cap: string) => string
  linesTotal: (n: number) => string
  metaArgsChars: (n: number) => string
  metaArgsItems: (n: number) => string
  metaResult: (size: string) => string
  merged: (n: number) => string
  replaced: (n: number) => string
  orphan: string
}

/** Build the label table for one UI language. Existing keys come from locales. */
function labelsFor(lang: Lang): StepLabels {
  const zh = lang === 'zh'
  return {
    summary: zh ? '摘要' : 'Summary',
    params: t(lang, 'detailParams') as string,
    result: t(lang, 'detailResult') as string,
    raw: t(lang, 'detailRaw') as string,
    render: t(lang, 'detailRender') as string,
    source: t(lang, 'detailSource') as string,
    command: zh ? '命令' : 'Command',
    commandHint: zh ? '按 && / ; 分段 · 自动换行' : 'Split on && / ; · wrapped',
    output: zh ? '输出' : 'Output',
    mcpCall: zh ? '调用' : 'Call',
    mcpProto: zh ? 'MCP 协议 · 连接状态' : 'MCP protocol · connection',
    connected: zh ? '已连接' : 'Connected',
    copy: t(lang, 'copyField') as string,
    copyAll: t(lang, 'copyDetail') as string,
    zoomTitle: t(lang, 'zoomOpen') as string,
    closeTitle: t(lang, 'zoomClose') as string,
    viewInCenter: t(lang, 'viewInCenter') as string,
    clickToView: t(lang, 'clickToViewFull') as string,
    showFull: zh ? '展开全文' : 'Show full',
    collapse: t(lang, 'collapseLabel') as string,
    collapseAll: zh ? '收起' : 'Collapse',
    showAllSegments: (n) => (zh ? `展开全部 ${n} 段` : `Show all ${n} segments`),
    ok: zh ? '成功' : 'Success',
    failed: zh ? '失败' : 'Failed',
    loadingFull: t(lang, 'detailLoading') as string,
    loadFailed: t(lang, 'detailLoadFailed') as string,
    retry: t(lang, 'detailRetry') as string,
    fullPill: t(lang, 'fullPill') as string,
    truncatedPill: t(lang, 'truncatedPill') as string,
    loadedPill: zh ? '已加载' : 'Loaded',
    unparsable: t(lang, 'resultUnparsable') as string,
    empty: t(lang, 'resultEmpty') as string,
    markdownKind: 'Markdown',
    textKind: zh ? '文本' : 'Text',
    segments: (n) => (zh ? `${n} 段` : `${n} segments`),
    chars: (n) => (zh ? `${n} 字符` : `${n} chars`),
    allItems: (n) => (zh ? `全部 ${n} 项` : `All ${n}`),
    lines: (n) => (zh ? `${n} 行` : `${n} lines`),
    charsLines: (chars, lines) => (zh ? `${chars} 字符 · ${lines} 行` : `${chars} chars · ${lines} lines`),
    items: (n) => (zh ? `${n} 项` : `${n} items`),
    files: (n) => (zh ? `${n} 个文件` : `${n} files`),
    moreFiles: (n) => (zh ? `+${n} 个文件已折叠` : `+${n} more files`),
    truncatedResult: (cap) => (zh ? `结果被截断至 ${cap}` : `Result truncated to ${cap}`),
    truncatedArgs: (cap) => (zh ? `参数被截断至 ${cap}` : `Arguments truncated to ${cap}`),
    linesTotal: (n) => (zh ? `共 ${n} 行` : `${n} lines total`),
    metaArgsChars: (n) => (zh ? `参数 ${n} 字符` : `${n} chars`),
    metaArgsItems: (n) => (zh ? `参数 ${n} 项` : `${n} items`),
    metaResult: (size) => (zh ? `结果 ${size}` : `Result ${size}`),
    merged: (n) => (t(lang, 'mergedNoSurfaceOp') as (count: number) => string)(n),
    replaced: (n) => (t(lang, 'resultReplaced') as (seq: number) => string)(n),
    orphan: t(lang, 'orphanResult') as string,
  }
}

// ── Small pure helpers ──────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** UTF-8 byte size without TextEncoder (jsdom-safe). */
function utf8Bytes(text: string): number {
  let bytes = 0
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4
      index += 1
    } else bytes += 3
  }
  return bytes
}

/** `0.9 KB` / `12 KB` / `2.4 MB` — one decimal only below 10 KB. */
function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes)
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 10) return `${Math.round(kb * 10) / 10} KB`
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${Math.round((kb / 1024) * 10) / 10} MB`
}

/** Line count of a text (`'a\nb'` → 2; `''` → 0). */
function lineCount(text: string): number {
  if (text.length === 0) return 0
  let lines = 1
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') lines += 1
  }
  return lines
}

/** Tone handed to `ToolIcon`; the family color itself comes from `ttl-tone-*`. */
function iconToneOf(family: ToolFamily): ToolTone {
  switch (family) {
    case 'shell': return 'violet'
    case 'read': return 'blue'
    case 'edit': return 'success'
    case 'mcp': return 'violet'
    case 'todo': return 'warn'
    case 'error': return 'red'
    default: return 'neutral'
  }
}

/** Human labels of well-known argument keys (unknown keys keep their wire name). */
const KEY_LABELS: Record<string, { zh: string; en: string }> = {
  cwd: { zh: '工作目录', en: 'Working dir' },
  description: { zh: '描述', en: 'Description' },
  command: { zh: '命令', en: 'Command' },
  file_path: { zh: '文件路径', en: 'File path' },
  path: { zh: '路径', en: 'Path' },
  content: { zh: '内容', en: 'Content' },
  old_string: { zh: '原内容', en: 'Old text' },
  new_string: { zh: '新内容', en: 'New text' },
  timeout: { zh: '超时', en: 'Timeout' },
  offset: { zh: '起始行', en: 'Offset' },
  limit: { zh: '行数上限', en: 'Limit' },
  append: { zh: '追加', en: 'Append' },
  pattern: { zh: '模式', en: 'Pattern' },
  query: { zh: '查询', en: 'Query' },
  url: { zh: '地址', en: 'URL' },
  encoding: { zh: '编码', en: 'Encoding' },
}

function keyLabel(key: string, lang: Lang): string {
  const known = KEY_LABELS[key]
  return known === undefined ? key : known[lang]
}

/** One wrapped chip text of an array value. */
function chipText(value: unknown): string {
  const text = typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'boolean' ? String(value) : '…'
  return text.length > 20 ? `${text.slice(0, 19)}…` : text
}

/** Does a token look like a file path (used only by the MCP result heuristic)? */
function looksLikeFilePath(token: string): boolean {
  if (token.includes('/') || token.includes('\\')) return true
  return FILE_EXT.test(token)
}

/** One result row of a path-shaped MCP result. */
interface FileEntry {
  path: string
  name: string
  /** Size as written by the tool (`74 KB`), when it parsed. */
  size?: string
}

function fileEntryOfPath(path: string, size: string | undefined): FileEntry {
  const entry: FileEntry = { path, name: fileBaseName(path) }
  if (size !== undefined) entry.size = size
  return entry
}

/** `1.6 MB` → bytes; `null` for an unrecognized suffix. */
function sizeToBytes(size: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i.exec(size.trim())
  if (match === null) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null
  const unit = (match[2] ?? 'B').toUpperCase()
  const factor = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : unit === 'KB' ? 1024 : 1
  return amount * factor
}

/** Sum of the parsed row sizes; `null` when any row has no usable size. */
function totalSizeOf(entries: readonly FileEntry[]): string | null {
  let bytes = 0
  for (const entry of entries) {
    if (entry.size === undefined) return null
    const size = sizeToBytes(entry.size)
    if (size === null) return null
    bytes += size
  }
  return formatSize(bytes)
}

/**
 * Read an MCP result as a file list (契约 §3.3: 结果像路径列表时按文件行渲染).
 * Accepts a JSON array of path strings / `{path,size}` objects, or line-oriented
 * tool output whose lines are mostly paths (`… .figma/assets/01.png  74 KB`).
 * A prose result that merely mentions a path stays a text preview.
 */
function fileEntriesOf(text: string): FileEntry[] | null {
  const trimmed = text.trim()
  if (trimmed.length === 0 || trimmed.length > 20_000) return null
  if (trimmed.startsWith('[')) {
    const parsed = parseJsonLoose(trimmed)
    if (!parsed.ok || !Array.isArray(parsed.value)) return null
    const entries: FileEntry[] = []
    for (const item of parsed.value) {
      if (typeof item === 'string') {
        entries.push(fileEntryOfPath(item, undefined))
        continue
      }
      if (!isPlainObject(item)) continue
      const path = item.path ?? item.file ?? item.name
      if (typeof path !== 'string' || path.length === 0) continue
      const rawSize = item.size
      const size = typeof rawSize === 'string'
        ? rawSize
        : typeof rawSize === 'number' && Number.isFinite(rawSize) ? formatSize(rawSize) : undefined
      entries.push(fileEntryOfPath(path, size))
    }
    return entries.length > 0 ? entries : null
  }
  const lines = trimmed.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
  if (lines.length === 0) return null
  const entries: FileEntry[] = []
  for (const line of lines.slice(0, 60)) {
    const cleaned = line.replace(/^[-*•]\s+/, '')
    // Sizes are written with a space (`(74 KB)`), so strip them from the line
    // before tokenizing instead of matching them per whitespace token.
    let body = cleaned
    let size: string | undefined
    const sizeMatch = SIZE_TAIL.exec(cleaned)
    if (sizeMatch !== null) {
      size = `${sizeMatch[1]} ${(sizeMatch[2] ?? 'B').toUpperCase()}`
      body = cleaned.slice(0, sizeMatch.index)
    }
    let path: string | null = null
    for (const token of body.split(/\s+/)) {
      if (token.length === 0) continue
      if (path === null && looksLikeFilePath(token)) path = token.replace(/[,:]$/, '')
    }
    if (path !== null) entries.push(fileEntryOfPath(path, size))
  }
  if (entries.length === 0) return null
  if (entries.length / lines.length < 0.6) return null
  return entries
}

/** Text blocks of an on-demand `ToolDetailItem`. */
function detailTextOf(item: ToolDetailItem): string {
  if (item.content === null) return ''
  return item.content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}

/** Image blocks of an on-demand `ToolDetailItem`. */
function detailImagesOf(item: ToolDetailItem): TrailResultImage[] {
  if (item.content === null) return []
  const out: TrailResultImage[] = []
  for (const block of item.content) {
    if (block.type !== 'image') continue
    const ref = block.attachment
    const image: TrailResultImage = {
      attachmentId: ref.attachmentId,
      mediaType: ref.mediaType,
      bytes: ref.bytes ?? 0,
    }
    if (ref.width !== undefined) image.width = ref.width
    if (ref.height !== undefined) image.height = ref.height
    if (ref.name !== undefined) image.name = ref.name
    out.push(image)
  }
  return out
}

// ── Shared small primitives ─────────────────────────────────────────────

/** Icon-sized copy button with its own 「已复制」 state. */
function CopyButton(props: {
  text: string
  testid: string
  label: string
  className: string
}): React.ReactElement {
  const { text, testid, label, className } = props
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      type="button"
      className={className}
      data-testid={testid}
      title={label}
      aria-label={label}
      onClick={() => {
        copyToClipboard(text)
        setCopied(true)
      }}
    >{copied ? '✓' : '⧉'}</button>
  )
}

/** Key/value table of one call's arguments (契约 §3.3 `ttl-kv`). */
function ParamSection(props: {
  entries: ReadonlyArray<readonly [string, unknown]>
  total: number
  lang: Lang
  labels: StepLabels
  showTypes: boolean
}): React.ReactElement | null {
  const { entries, total, lang, labels, showTypes } = props
  if (entries.length === 0) return null
  return (
    <section className="ttl-section">
      <div className="ttl-sectionHead">
        <span className="ttl-sectionLabel">{labels.params}</span>
        <span className="ttl-sectionMeta">{labels.allItems(total)}</span>
      </div>
      <div className="ttl-kv" data-testid="ttl-kv">
        {entries.map(([key, value]) => (
          <div className="ttl-kvRow" key={key}>
            <span className="ttl-kvKey" title={key}>{keyLabel(key, lang)}</span>
            <KvValue value={value} labels={labels} showTypes={showTypes} />
          </div>
        ))}
      </div>
    </section>
  )
}

/** One argument value: typed badge, array chips or folded long-string meta. */
function KvValue(props: { value: unknown; labels: StepLabels; showTypes: boolean }): React.ReactElement {
  const { value, labels, showTypes } = props
  if (Array.isArray(value)) {
    const chips = value.slice(0, MAX_CHIPS)
    const rest = value.length - chips.length
    return (
      <>
        <span className="ttl-kvVal ttl-kvChips">
          {chips.map((item, index) => (
            <span className="ttl-chipTag" key={index}>{chipText(item)}</span>
          ))}
          {rest > 0 ? <span className="ttl-chipTag ttl-chipMore">{`+${rest}`}</span> : null}
        </span>
        <span className="ttl-kvType">{`array · ${labels.items(value.length)}`}</span>
      </>
    )
  }
  if (isPlainObject(value)) {
    const count = Object.keys(value).length
    return (
      <>
        <span className="ttl-kvVal">{`{${count}}`}</span>
        <span className="ttl-kvType">{`object · ${labels.items(count)}`}</span>
      </>
    )
  }
  if (value === null) {
    return (
      <>
        <span className="ttl-kvVal ttl-kvMuted">null</span>
        {showTypes ? <span className="ttl-kvType">null</span> : null}
      </>
    )
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return (
      <>
        <span className="ttl-kvVal">{String(value)}</span>
        <span className="ttl-kvType">{typeof value}</span>
      </>
    )
  }
  const text = typeof value === 'string' ? value : String(value)
  if (text.includes('\n') || text.length > LONG_VALUE_CHARS) {
    return (
      <>
        <span className="ttl-kvVal ttl-kvLong" title={text}>
          {labels.charsLines(text.length, lineCount(text))}
        </span>
        {showTypes ? <span className="ttl-kvType">string</span> : null}
      </>
    )
  }
  return (
    <>
      <span className="ttl-kvVal" title={text}>{text}</span>
      {showTypes ? <span className="ttl-kvType">string</span> : null}
    </>
  )
}

/** The soft-wrapped, syntax-highlighted command block (契约 §3.3 `ttl-code`). */
function CommandSection(props: {
  command: string
  toolName: string
  labels: StepLabels
}): React.ReactElement | null {
  const { command, toolName, labels } = props
  const segments = React.useMemo(() => splitCommand(command), [command])
  const [allSegments, setAllSegments] = React.useState(false)
  if (segments.length === 0) return null
  const stats = commandStats(command)
  const shown = allSegments ? segments : segments.slice(0, MAX_CODE_SEGMENTS)
  return (
    <section className="ttl-section">
      <div className="ttl-sectionHead">
        <span className="ttl-sectionLabel">{labels.command}</span>
        <span className="ttl-sectionHint">{labels.commandHint}</span>
        {segments.length > MAX_CODE_SEGMENTS
          ? (
            <button
              type="button"
              className="ttl-sectionAction ttl-sectionActionText"
              data-testid="ttl-code-toggle"
              aria-expanded={allSegments}
              onClick={() => { setAllSegments(!allSegments) }}
            >{allSegments ? labels.collapseAll : labels.showAllSegments(segments.length)}</button>
          )
          : null}
        <CopyButton text={command} testid="ttl-cmd-copy" label={labels.copy} className="ttl-sectionAction" />
      </div>
      <div className="ttl-code" data-testid="ttl-code">
        {shown.map((segment, index) => (
          <div className="ttl-codeLine" key={index}>
            <span className="ttl-codeGutter" aria-hidden="true">{index + 1}</span>
            <span className="ttl-codeText">
              {segment.connector !== null
                ? (
                  <React.Fragment>
                    <span className="ttl-tok-op">{segment.connector}</span>
                    {' '}
                  </React.Fragment>
                )
                : null}
              {segment.tokens.map((token, tokenIndex) => (
                <React.Fragment key={tokenIndex}>
                  {tokenIndex > 0 ? ' ' : null}
                  <span className={`ttl-tok-${token.kind}`}>{token.text}</span>
                </React.Fragment>
              ))}
            </span>
          </div>
        ))}
        <div className="ttl-codeFoot" data-testid="ttl-code-foot">
          <span>{`${labels.segments(stats.segments)} · ${labels.chars(stats.chars)}`}</span>
          <span className="ttl-codeTool">{toolName}</span>
        </div>
      </div>
    </section>
  )
}

/** Collapsed output preview with an explicit 「展开全文」 (契约 §3.3 `ttl-outBlock`). */
function OutputSection(props: {
  text: string
  labels: StepLabels
  error: boolean
}): React.ReactElement | null {
  const { text, labels, error } = props
  const [expanded, setExpanded] = React.useState(false)
  const lines = React.useMemo(() => {
    const normalized = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
    return normalized.length === 0 ? [] : normalized.split('\n')
  }, [text])
  if (lines.length === 0) return null
  const shown = expanded ? lines : lines.slice(0, OUT_PREVIEW_LINES)
  return (
    <section className="ttl-section">
      <div className="ttl-sectionHead">
        <span className="ttl-sectionLabel">{labels.output}</span>
        <span className="ttl-sectionMeta">
          {`${formatSize(utf8Bytes(text))} · ${labels.lines(lines.length)}`}
        </span>
        {lines.length > OUT_PREVIEW_LINES
          ? (
            <button
              type="button"
              className="ttl-sectionAction ttl-sectionActionText"
              data-testid="ttl-out-toggle"
              aria-expanded={expanded}
              onClick={() => { setExpanded(!expanded) }}
            >{expanded ? labels.collapse : labels.showFull}</button>
          )
          : null}
      </div>
      <div className={`ttl-outBlock${error ? ' ttl-outBlockError' : ''}`} data-testid="ttl-outBlock">
        {shown.map((line, index) => {
          const rendered = !expanded && line.length > OUT_LINE_MAX ? `${line.slice(0, OUT_LINE_MAX)}…` : line
          return <div className="ttl-outLine" key={index}>{rendered.length === 0 ? '\u00a0' : rendered}</div>
        })}
      </div>
    </section>
  )
}

/** MCP banner: badge + local connection state (契约 §3.3 `ttl-mcpBlock`). */
function McpSection(props: { labels: StepLabels }): React.ReactElement {
  const { labels } = props
  return (
    <section className="ttl-section">
      <div className="ttl-sectionHead">
        <span className="ttl-sectionLabel">{labels.mcpCall}</span>
        <span className="ttl-sectionHint">{labels.mcpProto}</span>
      </div>
      <div className="ttl-mcpBlock" data-testid="ttl-mcpBlock">
        <span className="ttl-mcpBadge">MCP</span>
        <span className="ttl-mcpDot" aria-hidden="true" />
        <span className="ttl-mcpState">{labels.connected}</span>
      </div>
    </section>
  )
}

/** File path block of a read/write/edit call (契约 §3.3 `ttl-fileBlock`). */
function FileSection(props: {
  path: string
  stats: readonly string[]
  labels: StepLabels
}): React.ReactElement {
  const { path, stats, labels } = props
  return (
    <section className="ttl-section">
      <div className="ttl-fileBlock" data-testid="ttl-fileBlock">
        <span className="ttl-filePath" title={path}>{path}</span>
        <span className="ttl-fileStats">
          {stats.map((stat) => <span className="ttl-chipTag ttl-fileChip" key={stat}>{stat}</span>)}
        </span>
      </div>
    </section>
  )
}

/** Path-list result of an MCP call (契约 §3.3 `ttl-files`). */
function FilesSection(props: { entries: readonly FileEntry[]; labels: StepLabels }): React.ReactElement {
  const { entries, labels } = props
  const shown = entries.slice(0, MAX_FILE_ROWS)
  const more = entries.length - shown.length
  const total = totalSizeOf(entries)
  const meta = total === null ? labels.files(entries.length) : `${labels.files(entries.length)} · ${total}`
  return (
    <section className="ttl-section">
      <div className="ttl-sectionHead">
        <span className="ttl-sectionLabel">{labels.result}</span>
        <span className="ttl-sectionMeta">{meta}</span>
      </div>
      <div className="ttl-files" data-testid="ttl-files">
        {shown.map((entry, index) => (
          <div className="ttl-fileRow" key={`${entry.path}:${index}`}>
            <span className="ttl-fileIcon" aria-hidden="true"><ToolIcon kind="file-read" tone="neutral" /></span>
            <span className="ttl-fileName" title={entry.path}>{entry.name}</span>
            {entry.size !== undefined ? <span className="ttl-fileSize">{entry.size}</span> : null}
          </div>
        ))}
        {more > 0 ? <div className="ttl-fileMore">{labels.moreFiles(more)}</div> : null}
      </div>
    </section>
  )
}

// ── The detail band ─────────────────────────────────────────────────────

/** Props of {@link StepDetail} (契约 §3.1; `onClose` added for the v0.9 head). */
export interface StepDetailProps {
  /** DOM id the step row points at with `aria-controls`. */
  id: string
  step: TrailStep
  sessionId: string
  lang: Lang
  /** Markdown result: rendered or literal source (owned by the shell, per seq). */
  view: ResultView
  onSetView(seq: number, view: ResultView): void
  /** Load (or join) the on-demand full detail of this step (契约 §10.5.2). */
  onLoadDetail(seq: number): Promise<ToolDetailResult>
  /** Open the centered viewer for this step on a given pane (契约 §10.5.4). */
  onZoom(step: TrailStep, trigger: HTMLElement | null, tab?: DetailTab): void
  /** Collapse the band. Optional: without it the close button is not rendered. */
  onClose?: () => void
}

/** How the automatic on-demand load of a clipped step went. */
type DetailPhase = 'loading' | 'ready' | 'failed'

const TABS: ReadonlyArray<{ value: DetailTab; key: keyof Pick<StepLabels, 'summary' | 'result' | 'params' | 'raw'> }> = [
  { value: 'summary', key: 'summary' },
  { value: 'result', key: 'result' },
  { value: 'params', key: 'params' },
  { value: 'raw', key: 'raw' },
]

/**
 * The inline detail band under an expanded step (契约 §3).
 * @param props - Step, session, view/tab plumbing and the zoom/close callbacks.
 * @returns The band element.
 */
export function StepDetail(props: StepDetailProps): React.ReactElement {
  const { id, step, sessionId, lang, view, onSetView, onLoadDetail, onZoom, onClose } = props
  const labels = React.useMemo(() => labelsFor(lang), [lang])
  const result: TrailResult | undefined = step.result
  const args = step.args ?? ''
  const [tab, setTab] = React.useState<DetailTab>('summary')
  /** On-demand full detail of THIS step, plus how its one automatic load went. */
  const [detail, setDetail] = React.useState<ToolDetailItem | undefined>(undefined)
  const [loadFailed, setLoadFailed] = React.useState(false)
  /** Automatic loads are not retried; the user may spend exactly one retry. */
  const [retries, setRetries] = React.useState(0)

  const truncated = step.argsTruncated === true || result?.truncated === true
  const needsDetail = truncated

  const retryDetail = React.useCallback((): void => {
    setRetries((current) => (current >= 1 ? current : current + 1))
  }, [])

  React.useEffect(() => {
    if (!needsDetail) return undefined
    let alive = true
    setLoadFailed(false)
    void onLoadDetail(step.seq).then((outcome) => {
      if (!alive) return
      const item = outcome.ok ? (outcome.items.find((entry) => entry.seq === step.seq) ?? outcome.items[0]) : undefined
      if (item !== undefined) setDetail(item)
      else setLoadFailed(true)
    }, () => {
      if (alive) setLoadFailed(true)
    })
    return () => { alive = false }
  }, [needsDetail, onLoadDetail, step.seq, retries])

  const loaded = detail !== undefined
  const fullArgs = loaded && detail.arguments !== null ? detail.arguments : args
  const parsed = React.useMemo(() => parseJsonLoose(fullArgs), [fullArgs])
  const parsedArgs: Record<string, unknown> | null = parsed.ok && isPlainObject(parsed.value) ? parsed.value : null
  const fullText = loaded ? detailTextOf(detail) : (result?.text ?? '')
  const fullImages = loaded ? detailImagesOf(detail) : (result?.images ?? [])
  const pillTruncated = loaded ? detail.truncated === true : truncated
  const detailPhase: DetailPhase = !needsDetail
    ? 'ready'
    : loaded ? 'ready' : loadFailed ? 'failed' : 'loading'

  const isError = loaded
    ? (detail.isError || result?.isError === true || result?.kind === 'error' || step.kind === 'error')
    : (result?.isError === true || result?.kind === 'error' || step.kind === 'error')
  const family = toolFamily(step.name, isError)
  const summary: ToolSummary = React.useMemo(
    () => summarizeToolCall(step.name, step.args, step.argsPreview, lang),
    [step.name, step.args, step.argsPreview, lang],
  )
  const isMcp = family === 'mcp' || summary.icon === 'mcp'
  /** Shell command string, when the call carries one in its JSON arguments. */
  const commandText = parsedArgs !== null && typeof parsedArgs.command === 'string' ? parsedArgs.command : ''
  const mcpName = splitMcpName(step.name)
  const serverName = mcpName !== null ? mcpName.server : summary.label
  const toolName = mcpName !== null ? mcpName.tool : (summary.toolName ?? '')
  /** MCP rows already name the tool; do not repeat it in the description. */
  let desc = summary.detail
  if (isMcp && toolName.length > 0) {
    if (desc === toolName) desc = ''
    else if (desc.startsWith(`${toolName} · `)) desc = desc.slice(toolName.length + 3)
  }

  const titleOf = (name: string): string => (t(lang, 'detailAria') as (tool: string) => string)(name)
  const openZoomFor = (which: DetailTab, element: HTMLElement): void => {
    const wrap = element.closest('.ttl-stepWrap')
    const row = wrap !== null ? wrap.querySelector('[data-testid="ttl-step"]') : null
    onZoom(step, row instanceof HTMLElement ? row : null, which)
  }
  /** A click inside the pane opens the wide viewer — unless it hit a control. */
  const openZoomFromPane = (event: React.MouseEvent<HTMLDivElement>): void => {
    const target = event.target as HTMLElement | null
    if (target !== null && typeof target.closest === 'function'
      && target.closest('button, a, input, textarea, select') !== null) return
    if (typeof window !== 'undefined' && (window.getSelection?.()?.toString() ?? '').length > 0) return
    openZoomFor(tab, event.currentTarget)
  }

  /** Contextual right-hand meta of the status row (参数 N 字符 / 参数 N 项 / 结果 N KB). */
  const statusMeta = (): string => {
    if (tab === 'result' || tab === 'raw') {
      return fullText.length > 0 ? labels.metaResult(formatSize(utf8Bytes(fullText))) : ''
    }
    if (isMcp && parsedArgs !== null) return labels.metaArgsItems(Object.keys(parsedArgs).length)
    // 文件类调用：结果大小比参数长度更有信息量。
    if ((family === 'read' || family === 'edit') && fullText.length > 0) {
      return labels.metaResult(formatSize(utf8Bytes(fullText)))
    }
    // 原型 03/04 帧：参数计数按命令正文（= code foot 的字符数）而不是 JSON 包裹。
    if (family === 'shell' && commandText.length > 0) return labels.metaArgsChars(commandStats(commandText).chars)
    return args.length > 0 ? labels.metaArgsChars(args.length) : ''
  }

  const copiedAll = (): void => {
    copyToClipboard(fullText.length > 0 ? `${fullArgs.length > 0 ? `${fullArgs}\n\n` : ''}${fullText}` : fullArgs)
  }

  /** F4 hint: several results merged in with no `surfaceOp` (契约 §10.5.3). */
  const mergedNote = result !== undefined && (result.mergedFrom ?? 0) > 1 && result.replacedBy === undefined
    ? (
      <div className="ttl-detailMerged" role="note" data-testid="ttl-detail-merged">
        {labels.merged(result.mergedFrom ?? 0)}
      </div>
    )
    : null

  /** The truncation banner + on-demand load/retry affordance (契约 §3.4). */
  const loadBanner = (): React.ReactElement | null => {
    if (!needsDetail) return null
    if (detailPhase === 'ready' && !pillTruncated) return null
    const title = result?.truncated === true
      ? labels.truncatedResult(`${CAP_KIB} KiB`)
      : labels.truncatedArgs(`${CAP_KIB} KiB`)
    const sub = detailPhase === 'loading'
      ? labels.loadingFull
      : detailPhase === 'failed'
        ? labels.loadFailed
        : `${labels.linesTotal(lineCount(fullText))}`
    return (
      <div className="ttl-bannerWarn" data-testid="ttl-bannerWarn" role="note">
        <span className="ttl-bannerIcon" aria-hidden="true">⚠</span>
        <span className="ttl-bannerText">
          <span className="ttl-bannerTitle">{title}</span>
          <span className="ttl-bannerSub">{sub}</span>
        </span>
        {detailPhase === 'loading'
          ? <span className="ttl-bannerAction" data-testid="ttl-detail-load">{labels.loadingFull}</span>
          : detailPhase === 'failed'
            ? (
              <span className="ttl-bannerAction" data-testid="ttl-detail-load">
                <button
                  type="button"
                  className="ttl-detailRetry"
                  data-testid="ttl-detail-retry"
                  disabled={retries >= 1}
                  onClick={retryDetail}
                >{labels.retry}</button>
              </span>
            )
            : null}
      </div>
    )
  }

  const renderParams = (): React.ReactElement => (
    <>
      {parsed.ok
        ? <JsonTree value={parsed.value} />
        : (
          <>
            {fullArgs.length > 0 ? <RawText text={fullArgs} /> : null}
            <div className="ttl-detailHint" data-testid="ttl-detail-unparsable">{labels.unparsable}</div>
          </>
        )}
      {loadBanner()}
    </>
  )

  const renderResult = (): React.ReactElement => {
    if (result === undefined && !loaded) {
      return <div className="ttl-detailHint" data-testid="ttl-detail-empty">{labels.empty}</div>
    }
    if (isError) {
      const errorName = detail?.error?.name ?? result?.errorName ?? step.name
      const errorCode = detail?.error?.code ?? result?.errorCode ?? step.errorCode
      return (
        <>
          <div className="ttl-errorBlock" data-testid="ttl-error-block">
            <div className="ttl-errorName" data-testid="ttl-error-name">
              {errorCode !== undefined ? `${errorName} · ${errorCode}` : errorName}
            </div>
            {fullText.length > 0 ? <RawText text={fullText} /> : null}
            {fullImages.length > 0 ? <TrailImages images={fullImages} sessionId={sessionId} lang={lang} /> : null}
            {mergedNote}
          </div>
          {loadBanner()}
        </>
      )
    }
    if (fullText.length === 0 && fullImages.length === 0) {
      return (
        <>
          <div className="ttl-detailHint" data-testid="ttl-detail-empty">{labels.empty}</div>
          {loadBanner()}
          {mergedNote}
        </>
      )
    }
    const markdown = looksLikeMarkdown(fullText)
    return (
      <>
        {markdown && view === 'rendered'
          ? <MarkdownResult text={fullText} labels={markdownLabels(lang)} />
          : fullText.length > 0 ? <RawText text={fullText} /> : null}
        {fullImages.length > 0 ? <TrailImages images={fullImages} sessionId={sessionId} lang={lang} /> : null}
        {loadBanner()}
        {mergedNote}
      </>
    )
  }

  const renderRaw = (): React.ReactElement => (
    <>
      {result?.replacedBy !== undefined
        ? (
          <div className="ttl-detailHint" data-testid="ttl-detail-replaced">
            {labels.replaced(result.replacedBy)}
          </div>
        )
        : null}
      {step.orphan === true
        ? <span className="ttl-pill ttl-pillWarn" data-testid="ttl-detail-orphan">{labels.orphan}</span>
        : null}
      {fullArgs.length > 0
        ? (
          <div className="ttl-rawSection">
            <div className="ttl-sectionHead"><span className="ttl-sectionLabel">{labels.params}</span></div>
            <pre className="ttl-raw" data-testid="ttl-raw-args">{fullArgs}</pre>
          </div>
        )
        : null}
      {fullText.length > 0
        ? (
          <div className="ttl-rawSection">
            <div className="ttl-sectionHead"><span className="ttl-sectionLabel">{labels.result}</span></div>
            <pre className="ttl-raw" data-testid="ttl-raw-result">{fullText}</pre>
          </div>
        )
        : null}
    </>
  )

  /** The 摘要 pane: tool-family specific composition (契约 §3.3). */
  const renderSummary = (): React.ReactElement => {
    const entries = parsedArgs !== null ? Object.entries(parsedArgs) : []
    const total = entries.length
    const sections: React.ReactElement[] = []
    const outputText = ((): string => {
      if (isError && fullText.length === 0) return step.error
      if (family === 'read' || family === 'edit') {
        const envelope = unwrapFileResult(fullText)
        if (envelope !== null) return envelope.body
      }
      return fullText
    })()
    const output = (): React.ReactElement | null => (
      <OutputSection key="output" text={outputText} labels={labels} error={isError} />
    )

    if (family === 'shell') {
      const command = commandText
      if (command.length > 0) {
        sections.push(
          <CommandSection key="command" command={command} toolName={summary.label} labels={labels} />,
        )
        const rest = entries.filter(([key]) => key !== 'command')
        sections.push(
          <ParamSection
            key="params"
            entries={rest}
            total={total}
            lang={lang}
            labels={labels}
            showTypes={false}
          />,
        )
        const out = output()
        if (out !== null) sections.push(out)
        return <>{sections}{loadBanner()}</>
      }
    }

    if (isMcp) {
      sections.push(<McpSection key="mcp" labels={labels} />)
      sections.push(
        <ParamSection
          key="params"
          entries={entries}
          total={total}
          lang={lang}
          labels={labels}
          showTypes
        />,
      )
      const files = fileEntriesOf(fullText)
      if (files !== null) sections.push(<FilesSection key="files" entries={files} labels={labels} />)
      else {
        const out = output()
        if (out !== null) sections.push(out)
      }
      return <>{sections}{loadBanner()}</>
    }

    if (family === 'read' || family === 'edit' || family === 'todo') {
      const filePath = parsedArgs !== null && typeof parsedArgs.file_path === 'string'
        ? parsedArgs.file_path
        : parsedArgs !== null && typeof parsedArgs.path === 'string' ? parsedArgs.path : ''
      const stats: string[] = []
      if (family === 'read' && outputText.length > 0) stats.push(labels.lines(lineCount(outputText)))
      if (family === 'edit' && parsedArgs !== null) {
        const nextText = typeof parsedArgs.new_string === 'string' ? parsedArgs.new_string : ''
        const prevText = typeof parsedArgs.old_string === 'string' ? parsedArgs.old_string : ''
        const content = typeof parsedArgs.content === 'string' ? parsedArgs.content : ''
        if (nextText.length > 0) stats.push(`+${lineCount(nextText)}`)
        if (prevText.length > 0) stats.push(`−${lineCount(prevText)}`)
        // `write` carries the whole file: its line count is the `+N` chip.
        if (nextText.length === 0 && prevText.length === 0 && content.length > 0) {
          stats.push(`+${lineCount(content)}`)
        }
      }
      if (filePath.length > 0) {
        sections.push(<FileSection key="file" path={filePath} stats={stats} labels={labels} />)
      }
      const rest = entries.filter(([key]) => key !== 'file_path' && key !== 'path')
      sections.push(
        <ParamSection
          key="params"
          entries={rest}
          total={total}
          lang={lang}
          labels={labels}
          showTypes={false}
        />,
      )
      const out = output()
      if (out !== null) sections.push(out)
      return <>{sections}{loadBanner()}</>
    }

    sections.push(
      <ParamSection
        key="params"
        entries={entries}
        total={total}
        lang={lang}
        labels={labels}
        showTypes={false}
      />,
    )
    const out = output()
    if (out !== null) sections.push(out)
    return <>{sections}{loadBanner()}</>
  }

  const duration = formatDuration(
    step.startedAt !== undefined && step.endedAt !== undefined ? step.endedAt - step.startedAt : undefined,
  )
  const meta = statusMeta()
  const markdown = looksLikeMarkdown(fullText)
  const resultMeta = fullText.length > 0
    ? [markdown ? labels.markdownKind : labels.textKind, formatSize(utf8Bytes(fullText)), labels.lines(lineCount(fullText))].join(' · ')
    : ''
  const pillText = pillTruncated ? labels.truncatedPill : loaded ? labels.loadedPill : labels.fullPill

  return (
    <div
      className="ttl-detail"
      id={id}
      role="region"
      aria-label={titleOf(step.name)}
      data-testid="ttl-detail"
      data-tab={tab}
    >
      <div className="ttl-detailHead">
        <span className={`ttl-detailIcon ttl-tone-${family}`} aria-hidden="true">
          <ToolIcon kind={summary.icon} tone={iconToneOf(family)} />
        </span>
        <span className="ttl-detailName">{serverName}</span>
        {isMcp && toolName.length > 0
          ? (
            <>
              <span className="ttl-detailSep" aria-hidden="true">/</span>
              <span className="ttl-detailTool">{toolName}</span>
            </>
          )
          : null}
        {desc.length > 0 ? <span className="ttl-detailDesc" title={desc}>{desc}</span> : null}
        <CopyButton
          text={fullText.length > 0 ? `${fullArgs.length > 0 ? `${fullArgs}\n\n` : ''}${fullText}` : fullArgs}
          testid="ttl-detail-copy"
          label={labels.copyAll}
          className="ttl-detailAction"
        />
        <button
          type="button"
          className="ttl-detailAction"
          data-testid="ttl-detail-zoom"
          title={labels.zoomTitle}
          aria-label={labels.zoomTitle}
          onClick={(event) => { openZoomFor(tab, event.currentTarget) }}
        >⤢</button>
        {onClose !== undefined
          ? (
            <button
              type="button"
              className="ttl-detailAction"
              data-testid="ttl-detail-close"
              title={labels.closeTitle}
              aria-label={labels.closeTitle}
              onClick={() => { onClose() }}
            >✕</button>
          )
          : null}
      </div>

      <div className="ttl-detailStatus">
        <span className={`ttl-statusDot ${isError ? 'ttl-dot-red' : 'ttl-dot-green'}`} aria-hidden="true" />
        <span className="ttl-statusText">{isError ? labels.failed : labels.ok}</span>
        {duration.length > 0
          ? (
            <>
              <span className="ttl-detailDur">{duration}</span>
              <span className="ttl-detailSep" aria-hidden="true">·</span>
            </>
          )
          : null}
        <span className="ttl-detailSeq" data-testid="ttl-detail-seq">{`seq #${step.seq}`}</span>
        {meta.length > 0 ? <span className="ttl-detailMeta">{meta}</span> : null}
      </div>

      <div className="ttl-tabs" role="tablist">
        {TABS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            role="tab"
            aria-selected={tab === entry.value}
            className={`ttl-tab${tab === entry.value ? ' ttl-tabSelected' : ''}`}
            data-testid={`ttl-detail-tab-${entry.value}`}
            onClick={() => { setTab(entry.value) }}
          >{labels[entry.key]}</button>
        ))}
      </div>

      <div className="ttl-detailBody" data-testid={`ttl-detail-body-${tab}`}>
        <div
          className="ttl-clickablePane"
          data-testid="ttl-pane-clickable"
          title={labels.clickToView}
          onClick={openZoomFromPane}
        >
          {tab === 'summary' ? renderSummary() : null}
          {tab === 'result'
            ? (
              <>
                <div className="ttl-resultBar" data-testid="ttl-resultBar">
                  <span className="ttl-resultLabel">{labels.result}</span>
                  {resultMeta.length > 0 ? <span className="ttl-resultMeta">{resultMeta}</span> : null}
                  {markdown
                    ? (
                      <span className="ttl-seg" role="group">
                        <button
                          type="button"
                          className={`ttl-segBtn${view === 'rendered' ? ' ttl-segSelected' : ''}`}
                          data-testid="ttl-view-toggle"
                          aria-pressed={view === 'rendered'}
                          onClick={() => { onSetView(step.seq, view === 'rendered' ? 'raw' : 'rendered') }}
                        >{labels.render}</button>
                        <button
                          type="button"
                          className={`ttl-segBtn${view === 'raw' ? ' ttl-segSelected' : ''}`}
                          data-testid="ttl-view-raw"
                          aria-pressed={view === 'raw'}
                          onClick={() => { onSetView(step.seq, 'raw') }}
                        >{labels.source}</button>
                      </span>
                    )
                    : null}
                  <CopyButton
                    text={fullText}
                    testid="ttl-result-copy"
                    label={labels.copy}
                    className="ttl-resultCopy"
                  />
                </div>
                {renderResult()}
              </>
            )
            : null}
          {tab === 'params' ? renderParams() : null}
          {tab === 'raw' ? renderRaw() : null}
        </div>
      </div>

      <div className="ttl-detailFoot" data-testid="ttl-detail-foot">
        <span
          className={`ttl-pill${pillTruncated ? ' ttl-pillWarn' : ' ttl-pillOk'}`}
          data-testid="ttl-detail-pill"
        >{pillText}</span>
        <span className="ttl-detailSeq" data-testid="ttl-detail-foot-seq">{`seq #${step.seq}`}</span>
        <button
          type="button"
          className="ttl-detailViewCenter"
          data-testid="ttl-detail-view-center"
          onClick={(event) => { openZoomFor(tab, event.currentTarget) }}
        >
          {labels.viewInCenter}
          <span className="ttl-detailViewIcon" aria-hidden="true">⤢</span>
        </button>
      </div>
    </div>
  )
}
