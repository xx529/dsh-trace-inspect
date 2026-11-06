/**
 * ZoomOverlay.tsx — the v0.9 「放大阅读浮层」 (契约 §4), plus the re-export
 * surface TrailTab / StepDetail / tests rely on.
 *
 * Why a body portal: the sidebar tab lives inside the host's own
 * scroll/overflow containers, so a `position: fixed` layer rendered in place
 * can still be clipped or mis-stacked by an ancestor with `transform` /
 * `overflow`. A `createPortal` into `document.body` plus `.ttl-zoom`
 * (`position: fixed; inset: 0`) needs no verified host slot key.
 *
 * v0.9 structure (all chrome from styles.ts, contract §4):
 *
 *   .ttl-zoom                        fixed layer + .ttl-zoomBackdrop
 *    └ .ttl-zoomPanel                1120×660, r14
 *       ├ header.ttl-zoomTop         brand + breadcrumb + status pill + search + actions
 *       ├ .ttl-zoomBody
 *       │  ├ aside.ttl-zoomOutline   256px:「步骤 M / total」+ turn header + step rows
 *       │  └ main.ttl-zoomMain       .ttl-zoomHead + .ttl-tabs + .ttl-zoomPane
 *       └ footer.ttl-zoomFoot        Esc/↑↓/⌘F/⌘C/⌘E + read-only sync status
 *
 * The four tabs are 摘要 / 结果 / 参数 / 原始 (`DetailTab`). 摘要 is the
 * redesigned default: a wide, line-numbered command block for shell tools
 * (segments + token spans come from `command-format.ts`, the same module the
 * inline detail band uses, so both surfaces read identically), a key/value
 * table for MCP/other tools, and an output preview.
 *
 * Behaviour kept from v0.5.0: Esc closes, ↑/↓ walk the (filtered) outline,
 * ⌘F/Ctrl+F focuses the search box, ⌘C/Ctrl+C copies the active pane, plus the
 * export-JSON action; ⌘E/Ctrl+E is the new keyboard binding for that export
 * (契约 §4 lists it in the footer). A value viewer opened from the params pane
 * owns Esc / ⌘F / ⌘C until it closes, so those keys are ignored while it is
 * open (otherwise one Esc would close both dialogs).
 *
 * Safety: untrusted tool output reaches React children only — results go
 * through `MarkdownResult` / `RawText`, arguments through `JsonTree` /
 * `JsonPretty`, commands through token spans, and the outline through plain
 * text. No innerHTML / dangerouslySetInnerHTML / eval.
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import type { TrailStep } from '../trail-model'
import { commandStats, splitCommand } from './command-format'
import { formatClock, formatDuration, toolFamily, type ToolFamily } from './format'
import { parseJsonLoose } from './json-tree'
import { JsonPretty } from './json-pretty'
import { t, type Lang } from './locales'
import { markdownLabels } from './markdown-labels'
import { MarkdownResult, RawText, defaultViewForTool, looksLikeMarkdown } from './markdown-result'
import { ToolIcon } from './tool-icon'
import { summarizeToolCall, type ToolIconKind, type ToolSummary, type ToolTone } from './tool-summary'
import {
  TrailImages,
  copyToClipboard,
  downloadJson,
  formatBytes,
} from './ui-shared'
import type { ResultView, DetailTab } from './detail-types'

// ── Re-export surface (TrailTab / tests import these from './ZoomOverlay') ──
// The implementations physically moved to ui-shared.tsx / detail-types.ts in
// v0.9; the re-exports keep the historical import path working.
export {
  TrailImages,
  copyToClipboard,
  downloadJson,
  formatBytes,
  toolDotClass,
  type TrailImagesProps,
} from './ui-shared'
export type { ResultView, DetailTab } from './detail-types'

// ── The overlay (契约 §4) ────────────────────────────────────────────────

/** Props of {@link ZoomOverlay}. */
export interface ZoomOverlayProps {
  /** Steps of the current turn, in trail order — the left outline. */
  steps: readonly TrailStep[]
  /** Step selected when the overlay opens. */
  initialSeq: number
  /** Pane to show first (the detail band passes its active tab). */
  initialTab?: DetailTab
  sessionId: string
  lang: Lang
  onClose: () => void
}

// ── New v0.9 copy ────────────────────────────────────────────────────────
//
// locales.ts is owned by the shell owner and only carries v0.5 copy; the
// overlay's redesigned chrome (breadcrumb, 摘要 tab, section labels, footer
// shortcuts) is localised here so this file stays self-contained. The handful
// of pre-existing keys are still read through `t()`.
interface OverlayCopy {
  brand: string
  turn: (n: number) => string
  step: (n: number) => string
  stepsShort: (n: number) => string
  stepsLabel: string
  success: string
  failed: string
  summary: string
  command: string
  commandHint: string
  segments: (n: number) => string
  softWrap: string
  copyCommand: string
  params: string
  argsLabel: string
  resultLabel: string
  allParams: (n: number) => string
  output: string
  expandAll: string
  collapse: string
  searchPlaceholder: string
  search: string
  close: string
  copy: string
  stepNav: string
  copyDone: string
  exportJson: string
  readOnlySynced: string
  fullContent: string
  truncatedContent: string
  emptyResult: string
  noParams: string
  unparsable: string
  chars: (n: number) => string
  lines: (n: number) => string
}

const COPY: Record<Lang, OverlayCopy> = {
  zh: {
    brand: '轮次轨迹',
    turn: (n) => `轮次 #${n}`,
    step: (n) => `步骤 ${n}`,
    stepsShort: (n) => `${n} 步`,
    stepsLabel: '步骤',
    success: '成功',
    failed: '失败',
    summary: '摘要',
    command: '命令',
    commandHint: '按 && / ; 分段 · 自动换行',
    segments: (n) => `${n} 段`,
    softWrap: '自动换行',
    copyCommand: '复制命令',
    params: '参数',
    argsLabel: '参数',
    resultLabel: '结果',
    allParams: (n) => `全部 ${n} 项`,
    output: '输出',
    expandAll: '展开全文',
    collapse: '收起',
    searchPlaceholder: '搜索命令或输出',
    search: '搜索',
    close: '关闭',
    copy: '复制',
    stepNav: '切换步骤',
    copyDone: '已复制',
    exportJson: '导出 JSON',
    readOnlySynced: '只读 · 事件流已同步',
    fullContent: '完整内容',
    truncatedContent: '已截断',
    emptyResult: '该调用没有返回内容',
    noParams: '该调用没有参数',
    unparsable: '参数无法解析，已按原文显示',
    chars: (n) => `${n} 字符`,
    lines: (n) => `${n} 行`,
  },
  en: {
    brand: 'Turn Outline',
    turn: (n) => `Turn #${n}`,
    step: (n) => `Step ${n}`,
    stepsShort: (n) => `${n} steps`,
    stepsLabel: 'Steps',
    success: 'Success',
    failed: 'Failed',
    summary: 'Summary',
    command: 'Command',
    commandHint: 'Split on && / ; · soft wrap',
    segments: (n) => `${n} segments`,
    softWrap: 'soft wrap',
    copyCommand: 'Copy command',
    params: 'Params',
    argsLabel: 'Args',
    resultLabel: 'Result',
    allParams: (n) => `All ${n}`,
    output: 'Output',
    expandAll: 'Show all',
    collapse: 'Collapse',
    searchPlaceholder: 'Search commands or output',
    search: 'Search',
    close: 'Close',
    copy: 'Copy',
    stepNav: 'Step',
    copyDone: 'Copied',
    exportJson: 'Export JSON',
    readOnlySynced: 'Read-only · event stream in sync',
    fullContent: 'Full content',
    truncatedContent: 'Truncated',
    emptyResult: 'This call returned no content',
    noParams: 'This call has no arguments',
    unparsable: 'Arguments could not be parsed — showing raw text',
    chars: (n) => `${n} chars`,
    lines: (n) => `${n} lines`,
  },
}

// ── Small pure helpers ───────────────────────────────────────────────────

/** One-line output preview cap, matching the inline detail band. */
/* Output preview lines before 「展开全部」 — same 20-line budget as the
   inline detail band (v0.10.11). */
const OUT_PREVIEW_LINES = 20
/** Long output lines are clipped in the preview only (the 结果 tab has everything). */
const OUT_LINE_MAX = 240
/** Title attribute cap: never put a multi-megabyte string on an attribute. */
const TITLE_CAP = 512

function isFailedStep(step: TrailStep): boolean {
  return step.kind === 'error' || step.result?.isError === true || step.result?.kind === 'error'
}

function familyOf(step: TrailStep): ToolFamily {
  return toolFamily(step.name, isFailedStep(step))
}

/**
 * Tone handed to `ToolIcon`; the family color itself comes from the wrapper
 * `ttl-tone-<family>` class (css: `.ttl-tone-*` wins over the legacy
 * `.ttl-icon-*` tone classes). ToolTone has no pink, so MCP falls back to
 * violet — the same mapping StepDetail uses.
 */
function toneOfFamily(family: ToolFamily): ToolTone {
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

function iconKindOf(step: TrailStep, summary: ToolSummary): ToolIconKind {
  return isFailedStep(step) ? 'generic' : summary.icon
}

function durationOf(step: TrailStep): string {
  if (step.startedAt === undefined || step.endedAt === undefined) return ''
  return formatDuration(step.endedAt - step.startedAt)
}

/** `TeamError · E9` headline of a failed call. */
function errorHeadlineOf(step: TrailStep): string {
  const result = step.result
  const name = result?.errorName ?? step.name
  const code = result?.errorCode ?? step.errorCode
  return code !== undefined ? `${name} · ${code}` : name
}

/** First non-empty line, trimmed (error text / one-line summaries). */
function firstLine(text: string): string {
  for (const line of text.split('\n')) {
    const value = line.trim()
    if (value.length > 0) return value
  }
  return ''
}

function clipInline(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

function titleOf(text: string): string {
  return text.length > TITLE_CAP ? `${text.slice(0, TITLE_CAP)}…` : text
}

/** UTF-8 byte length when the browser can compute it, otherwise char count. */
function byteLength(text: string): number {
  if (typeof TextEncoder === 'function') {
    try {
      return new TextEncoder().encode(text).length
    } catch {
      // Fall through to the char count.
    }
  }
  return text.length
}

function lineCount(text: string): number {
  if (text.length === 0) return 0
  return text.replace(/\r\n?/g, '\n').split('\n').length
}

function parseArgsObject(raw: string | undefined): Record<string, unknown> | null {
  if (raw === undefined || raw.trim().length === 0) return null
  const parsed = parseJsonLoose(raw)
  if (!parsed.ok) return null
  const value = parsed.value
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

/** The `bash`/`shell` command string: the JSON `command` arg, else the preview. */
function commandOf(step: TrailStep): string {
  const args = parseArgsObject(step.args)
  if (args !== null) {
    const command = args.command
    if (typeof command === 'string' && command.trim().length > 0) return command
  }
  return step.argsPreview
}

/** Text of the active pane, used by ⌘C / Ctrl+C (契约 §4). */
function paneTextOf(step: TrailStep, tab: DetailTab): string {
  if (tab === 'summary') {
    if (step.kind === 'error') {
      const text = step.result?.text ?? ''
      return text.length > 0 ? `${step.error}\n${text}` : step.error
    }
    return familyOf(step) === 'shell' ? commandOf(step) : step.args ?? ''
  }
  if (tab !== 'result') return step.args ?? ''
  const result = step.result
  if (result === undefined) return ''
  if (isFailedStep(step)) {
    const headline = errorHeadlineOf(step)
    return result.text.length > 0 ? `${headline}\n${result.text}` : headline
  }
  return result.text
}

/** Page-level selection shortcut: the overlay's own 8 MiB-safe JSON payload. */
function exportPayloadOf(step: TrailStep): Record<string, unknown> {
  return {
    seq: step.seq,
    callId: step.callId,
    name: step.name,
    kind: step.kind,
    arguments: step.args ?? null,
    argsBytes: step.argsBytes ?? null,
    argsTruncated: step.argsTruncated === true,
    error: step.error,
    errorCode: step.errorCode ?? null,
    result: step.result ?? null,
  }
}

// ── Key/value table (same leaf classes as StepDetail) ────────────────────

const KV_TEXT_CAP = 240

interface KvViewRow {
  key: string
  text: string
  full: string
  typeLabel: string
}

function valueSummary(value: unknown): { text: string; full: string; typeLabel: string } {
  if (value === null) return { text: 'null', full: 'null', typeLabel: 'null' }
  if (typeof value === 'string') {
    return { text: clipInline(value, KV_TEXT_CAP), full: value, typeLabel: 'string' }
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value)
    return { text, full: text, typeLabel: typeof value }
  }
  if (Array.isArray(value)) {
    const primitive = value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))
    if (primitive) {
      const items = value.map((item) => String(item))
      const head = items.slice(0, 3).join(' · ')
      const text = items.length > 3 ? `${head} +${items.length - 3}` : head
      return { text, full: items.join(', '), typeLabel: `array · ${items.length}` }
    }
    const json = JSON.stringify(value) ?? ''
    return { text: clipInline(json, KV_TEXT_CAP), full: json, typeLabel: `array · ${value.length}` }
  }
  const json = JSON.stringify(value) ?? ''
  return { text: clipInline(json, KV_TEXT_CAP), full: json, typeLabel: 'object' }
}

function kvRowsOf(args: Record<string, unknown>, omit: ReadonlySet<string>): KvViewRow[] {
  const rows: KvViewRow[] = []
  for (const key of Object.keys(args)) {
    if (omit.has(key)) continue
    const summary = valueSummary(args[key])
    rows.push({ key, ...summary })
  }
  return rows
}

// ── Chrome glyphs (stroke paths on a 24 grid, Lucide-derived) ────────────

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function routeIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
      <circle cx="6" cy="18" r="2.2" {...stroke} />
      <circle cx="18" cy="6" r="2.2" {...stroke} />
      <path d="M8.2 18H12a4 4 0 0 0 4-4V8.2" {...stroke} />
    </svg>
  )
}

function searchIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="7" {...stroke} />
      <line x1="21" y1="21" x2="16.65" y2="16.65" {...stroke} />
    </svg>
  )
}

function copyIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">
      <rect x="9" y="9" width="11" height="11" rx="2" {...stroke} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" {...stroke} />
    </svg>
  )
}

function downloadIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">
      <path d="M12 3v10" {...stroke} />
      <path d="M8 9l4 4 4-4" {...stroke} />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" {...stroke} />
    </svg>
  )
}

function closeIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" {...stroke} />
    </svg>
  )
}

// ── The component ────────────────────────────────────────────────────────

/**
 * The full-size step viewer: a body-portal dialog with the current turn's
 * steps on the left and a wide reading pane on the right (摘要 / 结果 / 参数 /
 * 原始). Keyboard: Esc close, ↑/↓ step, ⌘F search, ⌘C copy pane, ⌘E export.
 */
export function ZoomOverlay(props: ZoomOverlayProps): React.ReactPortal | null {
  const { steps, initialSeq, initialTab, sessionId, lang, onClose } = props
  const copy = COPY[lang]
  const [selectedSeq, setSelectedSeq] = React.useState(initialSeq)
  const [tab, setTab] = React.useState<DetailTab>(initialTab ?? 'summary')
  const [views, setViews] = React.useState<ReadonlyMap<number, ResultView>>(() => new Map<number, ResultView>())
  const [expandedOutputs, setExpandedOutputs] = React.useState<ReadonlySet<number>>(() => new Set<number>())
  const [query, setQuery] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const searchRef = React.useRef<HTMLInputElement | null>(null)
  const selectedRowRef = React.useRef<HTMLButtonElement | null>(null)

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length === 0) return steps
    return steps.filter((step) => {
      const preview = step.kind === 'error' ? step.error : step.argsPreview
      return step.name.toLowerCase().includes(needle)
        || preview.toLowerCase().includes(needle)
        || (step.result?.text.toLowerCase().includes(needle) ?? false)
    })
  }, [steps, query])

  /** Selected step: an outline row wins, then the first match, then any step. */
  const current: TrailStep | null = React.useMemo(() => {
    const inFiltered = filtered.find((step) => step.seq === selectedSeq)
    if (inFiltered !== undefined) return inFiltered
    if (filtered.length > 0) return filtered[0]
    return steps.find((step) => step.seq === selectedSeq) ?? steps[0] ?? null
  }, [filtered, steps, selectedSeq])

  const currentSummary = React.useMemo<ToolSummary | null>(
    () => (current === null ? null : summarizeToolCall(current.name, current.args, current.argsPreview, lang)),
    [current, lang],
  )

  /**
   * Typing a query that hides the selected step moves the selection to the
   * first match, so the outline and the right pane never disagree.
   */
  const onSearchChange = (value: string): void => {
    setQuery(value)
    const needle = value.trim().toLowerCase()
    if (needle.length === 0) return
    const matches = steps.filter((step) => {
      const preview = step.kind === 'error' ? step.error : step.argsPreview
      return step.name.toLowerCase().includes(needle)
        || preview.toLowerCase().includes(needle)
        || (step.result?.text.toLowerCase().includes(needle) ?? false)
    })
    if (matches.length > 0 && !matches.some((step) => step.seq === selectedSeq)) {
      setSelectedSeq(matches[0].seq)
    }
  }

  /** Focus the panel so Esc / arrows work before any mouse interaction. */
  React.useEffect(() => {
    const panel = panelRef.current
    if (panel !== null) panel.focus()
  }, [])

  /** Keep the keyboard-selected outline row visible inside the 256px rail. */
  React.useEffect(() => {
    const row = selectedRowRef.current
    if (row !== null && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ block: 'nearest' })
    }
  }, [current?.seq])

  const move = React.useCallback((delta: number): void => {
    const list = filtered.length > 0 ? filtered : steps
    if (list.length === 0) return
    const at = current === null ? -1 : list.findIndex((step) => step.seq === current.seq)
    const next = at === -1 ? 0 : Math.min(Math.max(at + delta, 0), list.length - 1)
    const target = list[next]
    if (target !== undefined) setSelectedSeq(target.seq)
  }, [current, filtered, steps])

  const copyPane = React.useCallback((): void => {
    if (current === null) return
    copyToClipboard(paneTextOf(current, tab))
    setCopied(true)
    if (typeof window !== 'undefined') {
      window.setTimeout(() => { setCopied(false) }, 1500)
    }
  }, [current, tab])

  /** Head action「复制命令」: the command (shell) or the raw arguments, regardless of the open tab. */
  const copyCommand = React.useCallback((): void => {
    if (current === null) return
    copyToClipboard(familyOf(current) === 'shell' ? commandOf(current) : current.args ?? '')
    setCopied(true)
    if (typeof window !== 'undefined') {
      window.setTimeout(() => { setCopied(false) }, 1500)
    }
  }, [current])

  const exportCurrent = React.useCallback((): void => {
    if (current === null) return
    downloadJson(`trace-step-${current.seq}.json`, JSON.stringify(exportPayloadOf(current), null, 2))
  }, [current])

  // One window-level listener (capture) owns the whole keyboard model: the
  // dialog is a portal, so nothing above it in the React tree sees these keys.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (typeof document !== 'undefined'
        && document.querySelector('[data-testid="ttl-value-viewer"]') !== null) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      const mod = event.metaKey || event.ctrlKey
      const target = event.target as HTMLElement | null
      const tag = target !== null && typeof target.tagName === 'string' ? target.tagName.toUpperCase() : ''
      if (mod && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault()
        const input = searchRef.current
        if (input !== null) {
          input.focus()
          if (typeof input.select === 'function') input.select()
        }
        return
      }
      if (mod && (event.key === 'e' || event.key === 'E')) {
        // In a text field ⌘E has a host meaning; never hijack it.
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        event.preventDefault()
        exportCurrent()
        return
      }
      if (mod && (event.key === 'c' || event.key === 'C')) {
        // Never steal a copy the user aimed at an input or a live selection.
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        if (typeof window.getSelection === 'function' && (window.getSelection()?.toString() ?? '').length > 0) return
        event.preventDefault()
        copyPane()
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        // Inside the search box the arrows belong to the caret.
        if (event.target !== null && event.target === searchRef.current) return
        event.preventDefault()
        move(event.key === 'ArrowDown' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => { window.removeEventListener('keydown', onKeyDown, true) }
  }, [copyPane, exportCurrent, move, onClose])

  // ── Derived view data ──────────────────────────────────────────────────

  const family: ToolFamily = current === null ? 'generic' : familyOf(current)
  const failed = current === null ? false : isFailedStep(current)
  const currentIndex = current === null ? -1 : steps.findIndex((step) => step.seq === current.seq)
  const stepPosition = currentIndex >= 0 ? currentIndex + 1 : 1
  const turnNo = steps.find((step) => typeof step.turn === 'number')?.turn ?? null
  const turnStartedAt = steps.reduce<number | undefined>(
    (min, step) => (step.startedAt === undefined ? min : min === undefined ? step.startedAt : Math.min(min, step.startedAt)),
    undefined,
  )
  const turnEndedAt = steps.reduce<number | undefined>(
    (max, step) => (step.endedAt === undefined ? max : max === undefined ? step.endedAt : Math.max(max, step.endedAt)),
    undefined,
  )
  const turnClock = formatClock(turnStartedAt)
  const turnDuration = turnStartedAt !== undefined && turnEndedAt !== undefined
    ? formatDuration(turnEndedAt - turnStartedAt)
    : ''
  const stepDuration = current === null ? '' : durationOf(current)
  const argsText = current?.args ?? ''
  const argsBytes = current?.argsBytes ?? byteLength(argsText)
  const resultText = current?.result?.text ?? ''
  const resultBytes = byteLength(resultText)
  const argsObj = React.useMemo(() => parseArgsObject(current?.args), [current])
  const commandText = current !== null && family === 'shell' ? commandOf(current) : ''
  const commandSegments = React.useMemo(
    () => (commandText.length > 0 ? splitCommand(commandText) : []),
    [commandText],
  )
  const commandStatsValue = React.useMemo(
    () => (commandText.length > 0 ? commandStats(commandText) : { segments: 0, chars: 0 }),
    [commandText],
  )
  const kvRows = React.useMemo(() => {
    if (argsObj === null) return []
    return kvRowsOf(argsObj, family === 'shell' ? new Set(['command']) : new Set<string>())
  }, [argsObj, family])
  const argKeys = argsObj === null ? 0 : Object.keys(argsObj).length
  const outputLines = React.useMemo(() => {
    const normalized = resultText.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
    return normalized.length === 0 ? [] : normalized.split('\n')
  }, [resultText])
  const outputExpanded = current !== null && expandedOutputs.has(current.seq)
  const shownOutputLines = outputExpanded ? outputLines : outputLines.slice(0, OUT_PREVIEW_LINES)

  const toggleExpandedOutput = React.useCallback((): void => {
    if (current === null) return
    setExpandedOutputs((set) => {
      const next = new Set(set)
      if (next.has(current.seq)) next.delete(current.seq)
      else next.add(current.seq)
      return next
    })
  }, [current])

  // ── Meta lines ─────────────────────────────────────────────────────────

  const headMeta: string[] = current === null ? [] : [`seq #${current.seq}`]
  if (stepDuration.length > 0) headMeta.push(stepDuration)
  const argChars = commandText.length > 0 ? commandStatsValue.chars : argsText.length
  if (argChars > 0) headMeta.push(`${copy.argsLabel} ${copy.chars(argChars)}`)
  else if (argsBytes > 0) headMeta.push(`${copy.argsLabel} ${formatBytes(argsBytes)}`)
  if (current?.result !== undefined) {
    headMeta.push(`${copy.resultLabel} ${formatBytes(resultBytes)}`)
    const truncated = current.result.truncated || current.argsTruncated === true
    headMeta.push(truncated ? copy.truncatedContent : copy.fullContent)
  }
  const statusText = failed ? copy.failed : copy.success
  // Prototype: breadcrumb pill reads 「成功 1.1s」, the head pill 「成功 · 1.1s」.
  const statusTop = stepDuration.length > 0 ? `${statusText} ${stepDuration}` : statusText
  const statusWithDuration = stepDuration.length > 0 ? `${statusText} · ${stepDuration}` : statusText

  // ── Panes ──────────────────────────────────────────────────────────────

  const renderCommandBlock = (step: TrailStep): React.ReactElement | null => {
    if (commandSegments.length === 0) return null
    return (
      <section className="ttl-section" data-testid="ttl-zoom-command">
        <div className="ttl-code">
          {commandSegments.map((segment, index) => {
            // v0.10.7: `&&` / `;` trail the previous line so every line starts
            // with a command word (same rule as the inline detail band).
            const trailing = commandSegments[index + 1]?.connector ?? null
            return (
              <div className="ttl-codeLine" key={index}>
                <span className="ttl-codeGutter" aria-hidden="true">{index + 1}</span>
                <span className="ttl-codeText">
                  {segment.tokens.map((token, tokenIndex) => (
                    <React.Fragment key={tokenIndex}>
                      {tokenIndex > 0 ? ' ' : null}
                      <span className={`ttl-tok-${token.kind}`}>{token.text}</span>
                    </React.Fragment>
                  ))}
                  {trailing !== null
                    ? (
                      <React.Fragment>
                        {'\u00A0'}
                        <span className="ttl-tok-op ttl-tok-tail" data-testid="ttl-cmd-connector">{trailing}</span>
                      </React.Fragment>
                    )
                    : null}
                </span>
              </div>
            )
          })}
          <div className="ttl-codeFoot" data-testid="ttl-zoom-command-foot">
            <span>
              {`${copy.segments(commandStatsValue.segments)} · ${copy.chars(commandStatsValue.chars)} · ${copy.softWrap}`}
            </span>
            <span className="ttl-codeTool">{step.name}</span>
          </div>
        </div>
      </section>
    )
  }

  const renderParamsSection = (): React.ReactElement | null => {
    if (argsObj === null) {
      if (argsText.trim().length === 0) return null
      return (
        <section className="ttl-section" data-testid="ttl-zoom-params">
          <div className="ttl-sectionHead">
            <span className="ttl-sectionLabel">{copy.params}</span>
          </div>
          <RawText text={argsText} />
          <div className="ttl-detailHint" data-testid="ttl-zoom-unparsable">{copy.unparsable}</div>
        </section>
      )
    }
    return (
      <section className="ttl-section" data-testid="ttl-zoom-params">
        <div className="ttl-sectionHead">
          <span className="ttl-sectionLabel">{copy.params}</span>
          <span className="ttl-sectionMeta">{copy.allParams(argKeys)}</span>
        </div>
        {kvRows.length === 0
          ? <div className="ttl-detailHint">{copy.noParams}</div>
          : (
            <div className="ttl-kv">
              {kvRows.map((row) => (
                <div className="ttl-kvRow" key={row.key}>
                  <span className="ttl-kvKey" title={row.key}>{row.key}</span>
                  <span className="ttl-kvVal" title={titleOf(row.full)}>{row.text}</span>
                  {family === 'mcp' ? <span className="ttl-kvType">{row.typeLabel}</span> : null}
                </div>
              ))}
            </div>
          )}
      </section>
    )
  }

  const renderOutputSection = (step: TrailStep): React.ReactElement => {
    const result = step.result
    const images = result?.images ?? []
    const hasText = outputLines.length > 0
    const hasOutput = hasText || images.length > 0
    const error = isFailedStep(step)
    const expandable = hasText && outputLines.length > OUT_PREVIEW_LINES
    const sizeHint = hasText
      ? [
        formatBytes(byteLength(resultText)),
        copy.lines(lineCount(resultText)),
        result?.truncated === true ? copy.truncatedContent : copy.fullContent,
      ].join(' · ')
      : ''
    return (
      <section className="ttl-section" data-testid="ttl-zoom-output">
        <div className="ttl-sectionHead">
          <span className="ttl-sectionLabel">{copy.output}</span>
          {sizeHint.length > 0 ? <span className="ttl-sectionMeta">{sizeHint}</span> : null}
          {expandable
            ? (
              <button
                type="button"
                className="ttl-sectionAction ttl-sectionActionText"
                data-testid="ttl-zoom-output-expand"
                aria-expanded={outputExpanded}
                onClick={toggleExpandedOutput}
              >{outputExpanded ? copy.collapse : copy.expandAll}</button>
            )
            : null}
        </div>
        {error
          ? (
            <div className={`ttl-outBlock${hasText ? ' ttl-outBlockError' : ''}`}>
              <div className="ttl-errorBlock" data-testid="ttl-zoom-error">
                <div className="ttl-errorName" data-testid="ttl-zoom-error-name">{errorHeadlineOf(step)}</div>
                {resultText.length > 0 ? <RawText text={resultText} /> : null}
              </div>
            </div>
          )
          : hasText
            ? (
              <div className="ttl-outBlock">
                {shownOutputLines.map((line, index) => {
                  const rendered = !outputExpanded && line.length > OUT_LINE_MAX
                    ? `${line.slice(0, OUT_LINE_MAX)}…`
                    : line
                  return <div className="ttl-outLine" key={index}>{rendered.length === 0 ? '\u00a0' : rendered}</div>
                })}
              </div>
            )
            : <div className="ttl-detailHint" data-testid="ttl-zoom-empty">{copy.emptyResult}</div>}
        {images.length > 0 ? <TrailImages images={images} sessionId={sessionId} lang={lang} /> : null}
      </section>
    )
  }

  const renderSummary = (step: TrailStep): React.ReactElement => (
    <>
      {family === 'shell' ? renderCommandBlock(step) : null}
      {renderParamsSection()}
      {renderOutputSection(step)}
    </>
  )

  function setViewsWithCurrent(step: TrailStep, view: ResultView): void {
    setViews((map) => {
      const next = new Map(map)
      next.set(step.seq, view)
      return next
    })
  }

  const renderResult = (step: TrailStep): React.ReactElement => {
    const result = step.result
    const images = result?.images ?? []
    const error = isFailedStep(step)
    const markdown = result !== undefined && looksLikeMarkdown(result.text)
    const view = views.get(step.seq) ?? defaultViewForTool(step.name)
    const resultMeta = result === undefined
      ? ''
      : `${formatBytes(byteLength(result.text))} · ${copy.lines(lineCount(result.text))}`
    return (
      <>
        <div className="ttl-resultBar" data-testid="ttl-zoom-result-bar">
          <span className="ttl-resultLabel">{t(lang, 'detailResult') as string}</span>
          {resultMeta.length > 0 ? <span className="ttl-resultMeta">{resultMeta}</span> : null}
          {markdown && !error
            ? (
              <span className="ttl-seg" role="group">
                <button
                  type="button"
                  className={`ttl-segBtn${view === 'rendered' ? ' ttl-segSelected' : ''}`}
                  data-testid="ttl-zoom-view-toggle"
                  aria-pressed={view === 'rendered'}
                  onClick={() => { setViewsWithCurrent(step, 'rendered') }}
                >{t(lang, 'detailRender') as string}</button>
                <button
                  type="button"
                  className={`ttl-segBtn${view === 'raw' ? ' ttl-segSelected' : ''}`}
                  data-testid="ttl-zoom-view-raw"
                  aria-pressed={view === 'raw'}
                  onClick={() => { setViewsWithCurrent(step, 'raw') }}
                >{t(lang, 'detailSource') as string}</button>
              </span>
            )
            : null}
        </div>
        {error
          ? (
            <div className="ttl-errorBlock" data-testid="ttl-zoom-error">
              <div className="ttl-errorName" data-testid="ttl-zoom-error-name">{errorHeadlineOf(step)}</div>
              {resultText.length > 0 ? <RawText text={resultText} /> : null}
            </div>
          )
          : result === undefined || (resultText.length === 0 && images.length === 0)
            ? <div className="ttl-detailHint" data-testid="ttl-zoom-empty">{copy.emptyResult}</div>
            : markdown && view === 'rendered'
              ? <MarkdownResult text={resultText} labels={markdownLabels(lang)} />
              : <RawText text={resultText} />}
        {images.length > 0 ? <TrailImages images={images} sessionId={sessionId} lang={lang} /> : null}
      </>
    )
  }

  const renderParams = (step: TrailStep): React.ReactElement => {
    const args = step.args ?? ''
    const parsed = parseJsonLoose(args)
    if (parsed.ok) return <JsonPretty value={parsed.value} lang={lang} />
    return (
      <>
        <RawText text={args} />
        <div className="ttl-detailHint" data-testid="ttl-zoom-unparsable">{copy.unparsable}</div>
      </>
    )
  }

  const renderPane = (): React.ReactElement | null => {
    if (current === null) return null
    if (tab === 'summary') return renderSummary(current)
    if (tab === 'raw') return <RawText text={current.args ?? ''} />
    if (tab === 'params') return renderParams(current)
    return renderResult(current)
  }

  if (current === null || typeof document === 'undefined') return null
  const title = (t(lang, 'zoomTitle') as (name: string) => string)(current.name)
  const truncated = current.argsTruncated === true || current.result?.truncated === true
  const stepLabel = current.kind === 'error' ? 'error' : currentSummary?.label ?? current.name
  const stepDesc = current.kind === 'error'
    ? current.error || firstLine(resultText)
    : failed
      ? errorHeadlineOf(current)
      : currentSummary?.detail ?? ''
  const headTool = currentSummary?.toolName ?? ''

  const tabButton = (value: DetailTab, label: string): React.ReactElement => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      className={`ttl-tab${tab === value ? ' ttl-tabSelected' : ''}`}
      data-testid={`ttl-zoom-tab-${value}`}
      onClick={() => { setTab(value) }}
    >{label}</button>
  )

  const shortcut = (key: string, label: string): React.ReactElement => (
    <span className="ttl-zoomShortcut" key={key}>
      <kbd className="ttl-kbd">{key}</kbd>
      <span>{label}</span>
    </span>
  )

  const outlineRow = (step: TrailStep): React.ReactElement => {
    const selected = step.seq === current.seq
    const rowFailed = isFailedStep(step)
    const rowFamily = familyOf(step)
    const summary = summarizeToolCall(step.name, step.args, step.argsPreview, lang)
    const rowLabel = step.kind === 'error' ? 'error' : summary.label
    const rowDesc = step.kind === 'error'
      ? step.error || firstLine(step.result?.text ?? '')
      : rowFailed
        ? errorHeadlineOf(step)
        : summary.detail
    const dur = durationOf(step)
    return (
      <button
        key={step.seq}
        ref={selected ? selectedRowRef : undefined}
        type="button"
        className="ttl-step ttl-zoomOutlineRow"
        data-testid="ttl-zoom-step"
        data-step-kind={step.kind}
        aria-current={selected ? 'true' : undefined}
        title={step.kind === 'error' ? step.error : titleOf(step.argsPreview.length > 0 ? step.argsPreview : rowDesc)}
        onClick={() => { setSelectedSeq(step.seq) }}
      >
        <span className="ttl-stepRail" aria-hidden="true" />
        <span className={`ttl-stepIcon ttl-tone-${rowFamily}`} aria-hidden="true">
          <ToolIcon kind={iconKindOf(step, summary)} tone={toneOfFamily(rowFamily)} />
        </span>
        <span className="ttl-stepName">{rowLabel}</span>
        <span className="ttl-stepDesc">{rowDesc}</span>
        <span className="ttl-stepStatus" data-failed={rowFailed ? 'true' : undefined}>{rowFailed ? '✗' : '✓'}</span>
        <span className="ttl-stepDur">{dur}</span>
      </button>
    )
  }

  return createPortal(
    <div className="ttl-zoom" data-testid="ttl-zoom">
      <div
        className="ttl-zoomBackdrop"
        data-testid="ttl-zoom-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="ttl-zoomPanel"
        data-testid="ttl-zoom-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="ttl-zoomTop">
          <span className="ttl-brandIcon" aria-hidden="true">{routeIcon()}</span>
          <nav className="ttl-zoomCrumb" data-testid="ttl-zoom-crumb" aria-label={copy.brand}>
            <span>{copy.brand}</span>
            {turnNo !== null
              ? (
                <>
                  <span className="ttl-zoomCrumbSep" aria-hidden="true">/</span>
                  <span>{copy.turn(turnNo)}</span>
                </>
              )
              : null}
            <span className="ttl-zoomCrumbSep" aria-hidden="true">/</span>
            <span>{copy.step(stepPosition)}</span>
          </nav>
          <span
            className={`ttl-pill ${failed ? 'ttl-pillErr' : 'ttl-pillOk'} ttl-zoomStatus`}
            data-testid="ttl-zoom-status"
          >
            <span className={`ttl-statusDot ${failed ? 'ttl-dot-red' : 'ttl-dot-green'}`} aria-hidden="true" />
            {statusTop}
          </span>
          <div className="ttl-search" role="search">
            {searchIcon()}
            <input
              ref={searchRef}
              type="search"
              className="ttl-searchInput"
              data-testid="ttl-zoom-search"
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              value={query}
              onChange={(event) => { onSearchChange(event.target.value) }}
            />
            <kbd className="ttl-kbd" aria-hidden="true">⌘F</kbd>
          </div>
          <div className="ttl-zoomTools" data-testid="ttl-zoom-tools">
            <button
              type="button"
              className="ttl-iconBtn"
              data-testid="ttl-zoom-copy"
              data-copied={copied ? 'true' : undefined}
              title={copied ? copy.copyDone : copy.copy}
              aria-label={copied ? copy.copyDone : copy.copy}
              onClick={copyPane}
            >{copied ? '✓' : copyIcon()}</button>
            <button
              type="button"
              className="ttl-iconBtn"
              data-testid="ttl-zoom-export"
              title={copy.exportJson}
              aria-label={copy.exportJson}
              onClick={exportCurrent}
            >{downloadIcon()}</button>
            <button
              type="button"
              className="ttl-iconBtn"
              data-testid="ttl-zoom-close"
              title={t(lang, 'zoomClose') as string}
              aria-label={t(lang, 'zoomClose') as string}
              onClick={onClose}
            >{closeIcon()}</button>
          </div>
        </header>
        <div className="ttl-zoomBody">
          <aside className="ttl-zoomOutline" data-testid="ttl-zoom-outline">
            <div className="ttl-zoomOutlineHead">
              <span className="ttl-zoomOutlineLabel">{copy.stepsLabel}</span>
              <span className="ttl-zoomOutlineCount">
                <em className="ttl-zoomOutlineCur">{stepPosition}</em>
                {` / ${steps.length}`}
              </span>
            </div>
            <div className="ttl-zoomOutlineTurn">
              {turnNo !== null ? <span className="ttl-turnTag">{`#${turnNo}`}</span> : null}
              {turnClock.length > 0 ? <span className="ttl-turnTime">{turnClock}</span> : null}
              <span className="ttl-turnMeta">
                {[copy.stepsShort(steps.length), turnDuration].filter((part) => part.length > 0).join(' · ')}
              </span>
            </div>
            {filtered.length === 0
              ? <div className="ttl-detailHint" data-testid="ttl-zoom-nomatch">{t(lang, 'zoomNoMatch') as string}</div>
              : filtered.map(outlineRow)}
          </aside>
          <main className="ttl-zoomMain" data-testid="ttl-zoom-pane" data-tab={tab}>
            <header className="ttl-zoomHead" data-testid="ttl-zoom-head">
              <span className={`ttl-detailIcon ttl-tone-${family}`} aria-hidden="true">
                <ToolIcon
                  kind={currentSummary === null ? 'generic' : iconKindOf(current, currentSummary)}
                  tone={toneOfFamily(family)}
                />
              </span>
              <div className="ttl-zoomHeadText">
                <div className="ttl-zoomHeadLine">
                  <span className="ttl-detailName" data-testid="ttl-zoom-title">{stepLabel}</span>
                  {currentSummary?.server !== undefined && headTool.length > 0
                    ? (
                      <>
                        <span className="ttl-detailSep" aria-hidden="true">/</span>
                        <span className="ttl-detailTool">{headTool}</span>
                      </>
                    )
                    : null}
                  <span
                    className={`ttl-pill ${failed ? 'ttl-pillErr' : 'ttl-pillOk'} ttl-zoomStatus`}
                    data-testid="ttl-zoom-head-status"
                  >
                    <span className={`ttl-statusDot ${failed ? 'ttl-dot-red' : 'ttl-dot-green'}`} aria-hidden="true" />
                    {statusWithDuration}
                  </span>
                </div>
                {stepDesc.length > 0 ? <p className="ttl-detailDesc" title={titleOf(stepDesc)}>{stepDesc}</p> : null}
                <div className="ttl-detailMeta" data-testid="ttl-zoom-meta">
                  {headMeta.map((part, index) => (
                    <React.Fragment key={`${index}:${part}`}>
                      {index > 0 ? <span className="ttl-detailSep" aria-hidden="true">·</span> : null}
                      <span>{part}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="ttl-detailAction"
                data-testid="ttl-zoom-copy-command"
                title={copy.copyCommand}
                onClick={copyCommand}
              >
                {copyIcon()}
                <span>{copy.copyCommand}</span>
              </button>
            </header>
            <div className="ttl-tabs" role="tablist" data-testid="ttl-zoom-tabs">
              {tabButton('summary', copy.summary)}
              {tabButton('result', t(lang, 'detailResult') as string)}
              {tabButton('params', t(lang, 'detailParams') as string)}
              {tabButton('raw', t(lang, 'detailRaw') as string)}
            </div>
            <div className="ttl-zoomPane">
              <div role="tabpanel" data-testid={`ttl-zoom-body-${tab}`}>{renderPane()}</div>
            </div>
          </main>
        </div>
        <footer className="ttl-zoomFoot" data-testid="ttl-zoom-foot">
          <span className="ttl-zoomShortcuts" data-testid="ttl-zoom-hint">
            {shortcut('Esc', copy.close)}
            {shortcut('↑↓', copy.stepNav)}
            {shortcut('⌘F', copy.search)}
            {shortcut('⌘C', copy.copy)}
            {shortcut('⌘E', copy.exportJson)}
          </span>
          <span className="ttl-zoomFootState">
            <span
              className={`ttl-pill ${truncated ? 'ttl-pillWarn' : 'ttl-pillOk'}`}
              data-testid="ttl-zoom-pill"
            >{t(lang, truncated ? 'truncatedPill' : 'fullPill') as string}</span>
            <span data-testid="ttl-zoom-seq">{`seq #${current.seq}`}</span>
            <span className="ttl-statusDot ttl-dot-green" aria-hidden="true" />
            <span>{copy.readOnlySynced}</span>
          </span>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
