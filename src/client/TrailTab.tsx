/**
 * TrailTab.tsx — the 「轮次轨迹」sidebar shell (v0.9 redesign).
 *
 * Same data/interaction model as v0.8 (useTrail subscription → fold → turns /
 * steps / parallel batches; per-turn expansion; single-open inline detail;
 * remembered result view; filter chips; follow-latest; jump-to-conversation;
 * keyboard), but the STRUCTURE and presentation follow the v0.9 prototype
 * (`docs/prototype/1-01`, `2-02`, `2b`, `6-06`):
 *
 *   root
 *   ├ header.ttl-header          brand icon · 轮次轨迹 · 「7 轮 · 208 步」 · 搜索框 · 跟随
 *   │                            （v0.10.24：搜索从独立一行收进头部；⋯ 已移除）
 *   ├ div.ttl-filters            chips: 全部 / 失败 / top tools / ⋯ dropdown
 *   ├ div.ttl-summary            steps · turns · failures · duration + family bar + legend
 *   ├ div.ttl-list               turn cards (three-line: head / 2-line preview / body)
 *   │   └ section.ttl-turn       head: #N · HH:mm · dur · mix · ⚠n · ∥n · steps · ↗ · ⌄
 *   │       └ div.ttl-turnBody   input row → steps (parallel groups inline) → output → foot
 *   ├ div.ttl-statusbar          read-only sync dot · seq
 *   └ jump banner / to-bottom / zoom overlay
 *
 * Contracts honoured here (see `docs/redesign-v09-impl.md` §2):
 *  - search is an in-memory, case-insensitive substring filter over
 *    name / argsPreview / result.text (no extra network work);
 *  - durations render ONLY from the wire timestamps (`startedAt` / `endedAt`,
 *    `format.ts`); missing timestamps mean the slot is omitted, never faked;
 *  - parallel batches are same-level (no extra indent) with a full-width
 *    tinted row + 2px violet rail, sharing the step columns;
 *  - the inline detail band is the redesigned `StepDetail` (separate file);
 *    this file only plumbs view state, on-demand detail loading and zoom.
 *
 * Rendering cost model (kept from v0.2.1): closed turns keep object identity
 * across polls, rows are keyed by event seq and every turn is a memoized
 * component, so the hot path only re-renders the open turn.
 */
import * as React from 'react'
import type {
  SessionEventLike,
  TrailParallelGroup,
  TrailStep,
  TrailTurn,
  TurnItem,
} from '../trail-model'
import { groupParallelItems, parallelGroupsOf, stepsOf } from '../trail-model'
import { detectLang, t, type Lang } from './locales'
import {
  fetchToolDetail,
  fetchTrailEvents,
  useTrail,
  type SessionsServiceLike,
  type ToolDetailResult,
} from './useTrail'
import { jumpToItem, type ConversationTargetsLike, type JumpTarget, type SessionFace } from './trail-jump'
import { inkOf, splitMcpName, summarizeToolCall, toolIconKind, type ToolIconKind, type ToolInk } from './tool-summary'
import { ToolIcon } from './tool-icon'
import { MarkdownResult, RawText, defaultViewForTool, looksLikeMarkdown } from './markdown-result'
import { detectOutputKind } from './output-format'
import { markdownLabels } from './markdown-labels'
import { formatClock, formatDuration, toolFamily, turnDuration, type ToolFamily } from './format'
import { StepDetail } from './StepDetail'
import { ZoomOverlay } from './ZoomOverlay'
import { copyToClipboard } from './ui-shared'
import type { DetailTab, ResultView } from './detail-types'

/** Transport for the on-demand full tool detail (契约 §10.3.4). */
export type FetchToolDetail = (sessionId: string, seqs: number[], signal?: AbortSignal) => Promise<ToolDetailResult>

export interface TrailTabProps {
  /** cordis client context (used only for ctx.get('sessions') / ctx.get('uiConversation')). */
  ctx?: { get(name: string): unknown }
  scope: { sessionId: string; cwd?: string }
  visible: boolean
  tab: { id: string }
  /** test seam: override the events transport. */
  fetchEventsOverride?: (sessionId: string, afterSeq: number) => Promise<{ events: SessionEventLike[]; hasMore?: boolean }>
  /** test seam: override the on-demand full-detail transport. */
  fetchToolDetailOverride?: FetchToolDetail
}

/** `all` | `failed` | a raw tool name (the chips). */
/** Tiny chat-bubble glyph for the assistant message block (12px, currentColor). */
function messageIcon(): React.ReactElement {
  return React.createElement(
    'svg',
    { viewBox: '0 0 24 24', width: 12, height: 12, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
    React.createElement('path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }),
  )
}

/** Tiny user glyph for the input row (12px, currentColor). */
function inputIcon(): React.ReactElement {
  return React.createElement(
    'svg',
    { viewBox: '0 0 24 24', width: 12, height: 12, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
    React.createElement('circle', { cx: 12, cy: 8, r: 3.4 }),
    React.createElement('path', { d: 'M4.6 20a7.4 7.4 0 0 1 14.8 0' }),
  )
}

/** One-line character budget of the collapsed assistant-message row. */
const OUTPUT_PREVIEW_CHARS = 32

/**
 * One-line preview of an assistant message: flattened to a single line with the
 * noisiest Markdown markers removed, then cut to `OUTPUT_PREVIEW_CHARS` so the
 * row can show "first N chars + how many are left" like a tool step.
 */
function outputPreviewText(text: string): string {
  const flat = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)[#>*+-]\s+/g, '$1')
    .replace(/(^|\s)\d+[.)]\s+/g, '$1')
    .replace(/\*\*|__|~~|`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim()
  return flat.slice(0, OUTPUT_PREVIEW_CHARS).trimEnd()
}

/** `12345` → `12,345` (stable across environments; no Intl grouping). */
function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

type StepFilter = 'all' | 'failed' | string

/** Max step/items rows mounted per expanded turn (bounds the DOM). */
const STEP_CAP = 250

/** Full tooltip text cap (server already trims to TEXT_CAP; belt and braces). */
const TITLE_CAP = 512

// ── Copy the new shell needs that locales.ts does not hold yet ───────────
//
// The Lead owns `locales.ts`; these keys are local so this file can land
// without a cross-owner edit. Suggested dictionary entries are mirrored in
// the hand-off message: searchPlaceholder / emptyTitle / skeletonReading /
// synced / stepCount / parallelGroups / failCount / others / …
interface UiStrings {
  searchPlaceholder: string
  /** Short placeholder for the inline header search (v0.10.24). */
  searchPlaceholderShort: string
  clearSearch: string
  more: string
  reading: string
  emptyTitle: string
  emptyDesc: string
  refresh: string
  errorTitle: string
  errorNote: string
  copyError: string
  synced: string
  syncing: string
  syncFailed: string
  stepCount: (n: number) => string
  parallelGroups: (n: number) => string
  failCount: (n: number) => string
  calls: (n: number) => string
  parallelHint: string
  others: string
  totalDuration: string
  toolDist: string
  /** Trailing meta of a collapsed assistant message: how many chars are hidden. */
  charsLeft: (n: number) => string
  shownAll: (turns: number, steps: number) => string
  shownFiltered: (turns: number, steps: number) => string
}

const ZH_UI: UiStrings = {
  searchPlaceholder: '搜索步骤、文件或命令',
  searchPlaceholderShort: '搜索步骤…',
  clearSearch: '清除搜索',
  more: '更多',
  reading: '正在读取事件流…',
  emptyTitle: '还没有可折叠的步骤',
  emptyDesc: '发送一条消息后，轨迹会自动出现在这里',
  refresh: '刷新',
  errorTitle: '轨迹加载失败',
  errorNote: '重试只会重新拉取事件，不会打断当前会话。',
  copyError: '复制错误',
  synced: '只读 · 事件流已同步',
  syncing: '只读 · 同步中…',
  syncFailed: '只读 · 同步失败',
  stepCount: (n) => `${n} 步`,
  parallelGroups: (n) => `${n} 个并行组`,
  failCount: (n) => `${n} 失败`,
  calls: (n) => `${n} 个调用`,
  parallelHint: '同一助手步骤内并行下发',
  others: '其他',
  totalDuration: '总时长',
  toolDist: '工具分布',
  charsLeft: (n) => `还有 ${groupThousands(n)} 字符`,
  shownAll: (turns, steps) => `已显示全部 ${turns} 轮 · ${steps} 步`,
  shownFiltered: (turns, steps) => `已筛选 ${turns} 轮 · ${steps} 步`,
}

const EN_UI: UiStrings = {
  searchPlaceholder: 'Search steps, files or commands',
  searchPlaceholderShort: 'Search steps…',
  clearSearch: 'Clear search',
  more: 'More',
  reading: 'Reading the event stream…',
  emptyTitle: 'No foldable steps yet',
  emptyDesc: 'Steps will appear here after you send a message',
  refresh: 'Refresh',
  errorTitle: 'Failed to load the trail',
  errorNote: 'Retrying only re-pulls events; the current conversation is not interrupted.',
  copyError: 'Copy error',
  synced: 'Read-only · event stream synced',
  syncing: 'Read-only · syncing…',
  syncFailed: 'Read-only · sync failed',
  stepCount: (n) => `${n} step${n === 1 ? '' : 's'}`,
  parallelGroups: (n) => `${n} parallel group${n === 1 ? '' : 's'}`,
  failCount: (n) => `${n} failed`,
  calls: (n) => `${n} call${n === 1 ? '' : 's'}`,
  parallelHint: 'Issued together within one assistant step',
  others: 'Others',
  totalDuration: 'Total duration',
  toolDist: 'Tool distribution',
  charsLeft: (n) => `${groupThousands(n)} more chars`,
  shownAll: (turns, steps) => `Showing all ${turns} turns · ${steps} steps`,
  shownFiltered: (turns, steps) => `Filtered to ${turns} turns · ${steps} steps`,
}

function uiStrings(lang: Lang): UiStrings {
  return lang === 'en' ? EN_UI : ZH_UI
}

// ── Context / identity helpers (unchanged from v0.8) ────────────────────

function sessionsOf(ctx: TrailTabProps['ctx']): SessionsServiceLike | undefined {
  if (ctx === undefined || typeof ctx.get !== 'function') return undefined
  const service = ctx.get('sessions')
  return service !== undefined && service !== null && typeof (service as { binding?: unknown }).binding === 'function'
    ? service as SessionsServiceLike
    : undefined
}

/**
 * The 0.2.0 conversation view registry (`ctx.uiConversation`) — optional
 * peer: absent on older hosts, and `binding()` throws for sessions without a
 * retained generation, so every read is guarded and the jump degrades to the
 * legacy snapshot path.
 */
function conversationOf(ctx: TrailTabProps['ctx'], sessionId: string): ConversationTargetsLike | undefined {
  if (ctx === undefined || typeof ctx.get !== 'function') return undefined
  const service = ctx.get('uiConversation') as { binding?: unknown } | null | undefined
  if (service === undefined || service === null || typeof service.binding !== 'function') return undefined
  try {
    const targets = (service as { binding(source: string): ConversationTargetsLike }).binding(sessionId)
    return targets !== undefined && targets !== null && typeof targets.target === 'function'
      ? targets
      : undefined
  } catch {
    return undefined
  }
}

function turnByIdentity(turn: TrailTurn): string {
  return turn.turn !== null ? `turn:${turn.turn}` : `input:${turn.anchorSeq}`
}

function clipTitle(value: string): string {
  return value.length > TITLE_CAP ? `${value.slice(0, TITLE_CAP)}…` : value
}

/** Stable per-item key: event seq (never shifts when new steps arrive). */
function keyOfItem(item: TurnItem): string {
  return `seq:${item.kind === 'tool' ? item.step.seq : item.seq}`
}

/** The fold item a click targets (seq + kind + call id). */
function targetFor(item: TurnItem): JumpTarget {
  if (item.kind === 'tool') {
    return {
      seq: item.step.seq,
      kind: item.step.kind === 'error' ? 'error' : 'tool',
      ...(item.step.callId !== null ? { callId: item.step.callId } : {}),
    }
  }
  return { seq: item.seq, kind: item.kind }
}

// ── Filter / search predicates (shared by the list and the turn card) ────

function stepMatchesFilter(step: TrailStep, filter: StepFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'failed') return step.kind === 'error'
  return step.kind === 'tool' && step.name === filter
}

/** Case-insensitive substring search over name / argsPreview / result.text. */
function stepMatchesQuery(step: TrailStep, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return true
  if (step.name.toLowerCase().includes(needle)) return true
  if (step.argsPreview.toLowerCase().includes(needle)) return true
  if (step.result !== undefined && step.result.text.toLowerCase().includes(needle)) return true
  if (step.kind === 'error' && step.error.toLowerCase().includes(needle)) return true
  return false
}

function stepMatches(step: TrailStep, filter: StepFilter, query: string): boolean {
  return stepMatchesFilter(step, filter) && stepMatchesQuery(step, query)
}

// ── Family helpers (colors come from the chip class in styles.ts) ────────

/** Default pane: JSON/Markdown results prefer rendered, plain logs stay raw. */
function initialResultView(step: TrailStep): ResultView {
  if (step.result !== undefined && detectOutputKind(step.result.text) !== 'text') return 'rendered'
  return defaultViewForTool(step.name)
}

/** Glyph family for one tool family (reuse ToolIcon, no new icon sets). */
function familyIconKind(family: ToolFamily): ToolIconKind {
  switch (family) {
    case 'shell': return 'terminal'
    case 'read': return 'file-read'
    case 'edit': return 'file-edit'
    case 'mcp': return 'mcp'
    case 'skill': return 'skill'
    case 'figma': return 'generic'
    case 'todo': return 'todo'
    default: return 'generic'
  }
}

/** Statistics ink: the family's representative cluster carries the same ink as its rows. */
function familyInk(family: ToolFamily): ToolInk {
  return inkOf(familyIconKind(family))
}

/** Human name of a turn-head cluster chip (hover tooltip; zh / en). */
const CLUSTER_LABEL: Record<ToolIconKind, { zh: string; en: string }> = {
  terminal: { zh: '命令执行', en: 'shell' },
  'terminal-session': { zh: '长驻终端', en: 'terminal session' },
  jobs: { zh: '后台作业', en: 'jobs' },
  code: { zh: '代码执行', en: 'code' },
  'file-read': { zh: '读取文件', en: 'file read' },
  'file-write': { zh: '写入文件', en: 'file write' },
  'file-edit': { zh: '编辑文件', en: 'file edit' },
  search: { zh: '检索', en: 'search' },
  web: { zh: '联网', en: 'web' },
  todo: { zh: '计划清单', en: 'plan' },
  goal: { zh: '目标', en: 'goal' },
  schedule: { zh: '定时任务', en: 'schedule' },
  ask: { zh: '询问用户', en: 'ask' },
  present: { zh: '交付物', en: 'present' },
  subagent: { zh: '子代理', en: 'subagent' },
  team: { zh: '团队协作', en: 'team' },
  'team-task': { zh: '团队任务板', en: 'team tasks' },
  workflow: { zh: '工作流 / 循环', en: 'workflow' },
  skill: { zh: '技能', en: 'skill' },
  session: { zh: '会话回溯', en: 'session' },
  folder: { zh: '工作区', en: 'workspace' },
  plugin: { zh: '运行时插件', en: 'plugin' },
  mcp: { zh: 'MCP', en: 'MCP' },
  alert: { zh: '失败', en: 'failed' },
  generic: { zh: '其他工具', en: 'other tool' },
}

/** Cluster chip tooltip, e.g. `团队协作 2`. */
function clusterLabel(kind: ToolIconKind, lang: Lang): string {
  return CLUSTER_LABEL[kind][lang]
}

/** Legend / mix label per family (the prototype uses the representative tool). */
function familyLabel(family: ToolFamily, ui: UiStrings): string {
  switch (family) {
    case 'shell': return 'bash'
    case 'read': return 'read'
    case 'edit': return 'edit'
    case 'mcp': return 'mcp'
    case 'skill': return 'skill'
    case 'figma': return 'figma'
    case 'todo': return 'todo'
    case 'error': return 'error'
    default: return ui.others
  }
}

/** Short chip label: an MCP call shows its server (`figma`), not the wire name. */
function toolChipLabel(name: string): string {
  return summarizeToolCall(name, undefined, '').label
}

/** Span of one step from its wire timestamps — '' when either end is unknown. */
function stepDuration(step: TrailStep): string {
  if (step.startedAt === undefined || step.endedAt === undefined) return ''
  const span = step.endedAt - step.startedAt
  return span >= 0 ? formatDuration(span) : ''
}

// ── Step row ────────────────────────────────────────────────────────────

interface StepRowProps {
  step: TrailStep
  turn: TrailTurn
  open: boolean
  view: ResultView
  lang: Lang
  sessionId: string
  onJump: (target: JumpTarget, turn: TrailTurn) => void
  onToggleStep: (step: TrailStep, multi: boolean) => void
  onStepOpen: (step: TrailStep) => void
  onStepClose: (step: TrailStep) => void
  onSetView: (seq: number, view: ResultView) => void
  onLoadDetail: (seq: number) => Promise<ToolDetailResult>
  onZoom: (step: TrailStep, turn: TrailTurn, trigger: HTMLElement | null, tab?: DetailTab) => void
}

/**
 * One 32px timeline step row: rail + 18px neutral icon chip (ToolIcon, glyph
 * keeps its family ink; failing rows show the alert triangle on a red chip),
 * mono name, single-line description, ✓/✗ status and the wire duration.
 * Click toggles the inline `StepDetail`; `↗` keeps the locate action.
 * Error rows turn the whole line red (`data-kind="error"`); hover / open are
 * expressed on `.ttl-stepWrap` for the stylesheet.
 */
const StepRow = React.memo(function StepRow(props: StepRowProps): React.ReactElement {
  const {
    step, turn, open, view, lang, sessionId,
    onJump, onToggleStep, onStepOpen, onStepClose, onSetView, onLoadDetail, onZoom,
  } = props
  const summary = React.useMemo(
    () => summarizeToolCall(step.name, step.args, step.argsPreview, lang),
    [step.name, step.args, step.argsPreview, lang],
  )
  const errored = step.kind === 'error' || step.result?.isError === true
  const family = toolFamily(step.name, errored)
  // v0.10.2: every failing row leads with the prototype's alert triangle, not
  // with the tool's own glyph tinted red (prototype 2-02 / 6-06「失败」).
  const iconKind: ToolIconKind = errored ? 'alert' : summary.icon
  // v0.10.19: ink follows the work cluster, not the coarse statistics family.
  const ink = inkOf(iconKind)
  const desc = step.kind === 'error' ? step.error : summary.detail
  const status = errored ? '✗' : '✓'
  const duration = stepDuration(step)
  const detailId = `ttl-detail-${step.kind}-${step.seq}`
  const title = step.kind === 'error'
    ? step.error
    : (step.argsPreview.length > 0 ? step.argsPreview : desc)
  /** Keep the band's memo effective: a stable handler per (row, turn). */
  const openZoomForStep = React.useCallback(
    (target: TrailStep, trigger: HTMLElement | null, tab?: DetailTab) => { onZoom(target, turn, trigger, tab) },
    [onZoom, turn],
  )
  /** The band's own ✕ collapses exactly this step (Alt-multi keeps it valid). */
  const closeDetail = React.useCallback((): void => { onStepClose(step) }, [onStepClose, step])
  return (
    <div
      className="ttl-stepWrap"
      data-open={open ? 'true' : undefined}
      data-kind={errored ? 'error' : step.kind}
      data-testid="ttl-step-wrap"
    >
      <button
        type="button"
        className="ttl-step"
        data-testid="ttl-step"
        data-step-kind={errored ? 'error' : step.kind}
        aria-expanded={open}
        aria-controls={detailId}
        title={clipTitle(title)}
        onClick={(event) => { onToggleStep(step, event.altKey) }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            onStepOpen(step)
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault()
            onStepClose(step)
          } else if ((event.key === 'o' || event.key === 'O') && event.shiftKey && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            onZoom(step, turn, event.currentTarget)
          }
        }}
      >
        <span className="ttl-stepRail" aria-hidden="true" />
        <span className={`ttl-stepIcon ttl-ink-${ink}`} aria-hidden="true">
          <ToolIcon kind={iconKind} />
        </span>
        <span className="ttl-stepName">{summary.label}</span>
        <span className="ttl-stepDesc">{desc}</span>
        <span className="ttl-stepStatus" aria-hidden="true">{status}</span>
        {duration.length > 0 ? <span className="ttl-stepDur">{duration}</span> : null}
      </button>
      <button
        type="button"
        className="ttl-stepJump"
        data-testid="ttl-step-jump"
        title={t(lang, 'locateInChat') as string}
        aria-label={t(lang, 'locateInChat') as string}
        onClick={() => { onJump(targetFor({ kind: 'tool', step }), turn) }}
      >↗</button>
      {open
        ? (
          <StepDetail
            id={detailId}
            step={step}
            sessionId={sessionId}
            lang={lang}
            view={view}
            onSetView={onSetView}
            onLoadDetail={onLoadDetail}
            onZoom={openZoomForStep}
            onClose={closeDetail}
          />
        )
        : null}
    </div>
  )
})

// ── Turn card ───────────────────────────────────────────────────────────

interface TurnRowProps {
  turn: TrailTurn
  /** Position in the CURRENT visible list (drives default-latest semantics). */
  index: number
  expanded: boolean
  active: boolean
  showFull: boolean
  filter: StepFilter
  query: string
  isToolFilter: boolean
  lang: Lang
  sessionId: string
  openSeqs: ReadonlySet<number>
  resultView: ReadonlyMap<number, ResultView>
  onToggle: (id: string) => void
  onShowEarlier: (id: string) => void
  onJump: (target: JumpTarget, turn: TrailTurn) => void
  onToggleStep: (step: TrailStep, multi: boolean) => void
  onStepOpen: (step: TrailStep) => void
  onStepClose: (step: TrailStep) => void
  onSetView: (seq: number, view: ResultView) => void
  onLoadDetail: (seq: number) => Promise<ToolDetailResult>
  onZoom: (step: TrailStep, turn: TrailTurn, trigger: HTMLElement | null, tab?: DetailTab) => void
}

/**
 * One turn as the v0.9 three-line card: a head (tag/time/duration + family mix
 * + failure & parallel badges + step count + locate + chevron), a two-line
 * input preview, and the expanded body (input → steps/parallel → output →
 * foot). The whole head toggles the card; `↗` locates the turn input.
 */
const TurnRow = React.memo(function TurnRow(props: TurnRowProps): React.ReactElement {
  const {
    turn, index, expanded, active, showFull, filter, query, isToolFilter, lang, sessionId, openSeqs, resultView,
    onToggle, onShowEarlier, onJump, onToggleStep, onStepOpen, onStepClose, onSetView, onLoadDetail, onZoom,
  } = props
  const ui = uiStrings(lang)
  const id = turnByIdentity(turn)
  const searchActive = query.trim().length > 0
  const matches = (step: TrailStep): boolean => stepMatches(step, filter, query)

  const items = turn.items.filter((item) => {
    if (item.kind === 'tool') return matches(item.step)
    if (item.kind === 'input') return false
    return !isToolFilter && !searchActive
  })

  /**
   * Parallel batches of THIS turn, computed on the unfiltered items so the
   * header badge counts what the turn did, not what the active chip shows.
   */
  const parallelGroups = React.useMemo(
    () => (turn.stepsCount >= 2 ? parallelGroupsOf(turn.items) : []),
    // Open-turn items are APPENDED in place (same array identity), so length is
    // the structural signal; closed turns keep a frozen items array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turn.stepsCount, turn.items.length],
  )
  const parallelBadgeTitle = parallelGroups.length > 0
    ? (t(lang, 'parallelGroupsTitle') as (groups: number, calls: number) => string)(
      parallelGroups.length,
      parallelGroups.reduce((sum, group) => sum + group.steps.length, 0),
    )
    : ''

  /** Failed steps of the turn (the red `✗n` badge + the foot line). */
  /** A step row draws the alert triangle (instead of its cluster glyph) when failed. */
  const stepFailed = (step: TrailStep): boolean => step.kind === 'error' || step.result?.isError === true

  /** Failed rows = the rows that lead with the alert triangle (wire errors AND `isError` results). */
  const errorCount = React.useMemo(() => {
    let count = 0
    for (const item of items) {
      if (item.kind !== 'tool') continue
      if (stepFailed(item.step)) count += 1
    }
    return count
  }, [items])

  /**
   * Head mix (v0.10.22): tool steps by WORK CLUSTER — the exact glyph each row
   * draws — counted over the same filtered step list the expanded body renders,
   * so every `icon + N` chip can be counted 1:1 in the opened turn. Failed
   * steps are not chips: they all draw the alert triangle and are counted by
   * the red error badge instead. No cap: every cluster present gets a chip (the
   * row wraps when a narrow dock cannot fit them on one line).
   */
  const clusterMix = React.useMemo(() => {
    const counts = new Map<ToolIconKind, number>()
    for (const item of items) {
      if (item.kind !== 'tool') continue
      if (stepFailed(item.step)) continue
      const kind = toolIconKind(item.step.name)
      counts.set(kind, (counts.get(kind) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([kind, count]) => ({ kind, count }))
  }, [items])

  const [openOutputs, setOpenOutputs] = React.useState<ReadonlySet<string>>(() => new Set<string>())
  const toggleOutput = React.useCallback((key: string): void => {
    setOpenOutputs((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const turnNo = turn.turn ?? index + 1
  const turnTag = `#${turnNo}`
  const turnTagTitle = (t(lang, 'turnPrefix') as (n: number) => string)(turnNo)
  const clock = formatClock(turn.startedAt)
  const duration = turnDuration(turn.startedAt, turn.endedAt)
  const preview = turn.inputPreview
  const hasError = turn.hasError
  /** The turn's user input; rendered as the first row of the expanded body. */
  const inputItem = turn.items.find((item): item is Extract<TurnItem, { kind: 'input' }> => item.kind === 'input')
  /** The body's input row replaces the header preview while it is shown. */
  const inputRowShown = inputItem !== undefined && filter === 'all' && !searchActive

  /**
   * First row of the expanded body: the user's own message on the same 32px
   * grid as steps / outputs (icon + 输入 + one-line preview + char budget).
   * A click keeps the v0.4-v0.8 behaviour: locate the message in the chat.
   */
  const renderInputRow = (item: Extract<TurnItem, { kind: 'input' }>): React.ReactElement => {
    const text = item.text
    const flat = outputPreviewText(text)
    const rest = text.length > OUTPUT_PREVIEW_CHARS ? text.length - OUTPUT_PREVIEW_CHARS : 0
    return (
      <button
        type="button"
        className="ttl-itemInput ttl-msgRow"
        data-testid="ttl-item-input"
        title={clipTitle(text)}
        onClick={() => { onJump({ seq: item.seq, kind: 'input' }, turn) }}
      >
        <span className="ttl-stepIcon ttl-inputIcon" aria-hidden="true">{inputIcon()}</span>
        <span className="ttl-msgRole">{t(lang, 'input') as string}</span>
        <span className="ttl-msgPreview" data-testid="ttl-input-preview">{rest > 0 ? `${flat}…` : flat}</span>
        {rest > 0
          ? <span className="ttl-msgRest" data-testid="ttl-input-rest">{ui.charsLeft(rest)}</span>
          : null}
      </button>
    )
  }

  const renderStep = (step: TrailStep, key: string): React.ReactElement => (
    <StepRow
      key={key}
      step={step}
      turn={turn}
      open={openSeqs.has(step.seq)}
      view={resultView.get(step.seq) ?? initialResultView(step)}
      lang={lang}
      sessionId={sessionId}
      onJump={onJump}
      onToggleStep={onToggleStep}
      onStepOpen={onStepOpen}
      onStepClose={onStepClose}
      onSetView={onSetView}
      onLoadDetail={onLoadDetail}
      onZoom={onZoom}
    />
  )

  /**
   * One assistant-step batch: a compact `∥ 并行 ×N` caption (hint + call /
   * duration aggregate) over the same step columns — same level, no indent,
   * only a full-width tinted row and a violet rail (styles.ts).
   */
  const renderParallelGroup = (group: TrailParallelGroup): React.ReactElement => {
    const label = (t(lang, 'parallelGroup') as (n: number) => string)(group.steps.length)
    const hint = (t(lang, 'parallelGroupHint') as (n: number) => string)(group.steps.length)
    return (
      <div
        className="ttl-parallel"
        key={group.key}
        role="group"
        aria-label={label}
        title={hint}
        data-testid="ttl-parallel-group"
        data-step={group.step}
      >
        <div className="ttl-parallelBody">
          {group.steps.map((step) => renderStep(step, `seq:${step.seq}`))}
        </div>
      </div>
    )
  }

  const renderItem = (item: TurnItem, key: string): React.ReactElement | null => {
    if (item.kind === 'tool') return renderStep(item.step, key)
    if (item.kind === 'input') return null // shown as the body's first row
    if (item.kind === 'output') {
      // Assistant prose is a MESSAGE row on the same 32px grid as tool steps:
      // neutral chip + role label + one-line preview + `还有 N 字符` meta; a
      // click opens the full Markdown body right below the row.
      const open = openOutputs.has(key)
      const text = item.text
      const preview = outputPreviewText(text)
      const expandable = text.length > OUTPUT_PREVIEW_CHARS || text.includes('\n')
      const rest = expandable ? Math.max(0, text.length - OUTPUT_PREVIEW_CHARS) : 0
      return (
        <div
          className="ttl-msg"
          key={key}
          data-open={open ? 'true' : undefined}
          data-testid="ttl-output-wrap"
        >
          <button
            type="button"
            className="ttl-msgRow"
            data-testid="ttl-item-output"
            aria-expanded={expandable ? open : undefined}
            title={clipTitle(text)}
            onClick={() => { if (expandable) toggleOutput(key) }}
          >
            <span className="ttl-stepIcon ttl-msgIcon" aria-hidden="true">{messageIcon()}</span>
            <span className="ttl-msgRole">{t(lang, 'output') as string}</span>
            <span className="ttl-msgPreview" data-testid="ttl-output-preview">{rest > 0 ? `${preview}…` : preview}</span>
            {rest > 0
              ? <span className="ttl-msgRest" data-testid="ttl-output-rest">{ui.charsLeft(rest)}</span>
              : null}
            {expandable
              ? (
                <span
                  className={`ttl-msgChevron${open ? ' ttl-msgChevronOpen' : ''}`}
                  aria-hidden="true"
                >{chevronIcon()}</span>
              )
              : null}
          </button>
          {open && expandable
            ? (
              <div className="ttl-msgBody" data-testid="ttl-output-body">
                {looksLikeMarkdown(text)
                  ? <MarkdownResult text={text} labels={markdownLabels(lang)} />
                  : <div className="ttl-msgFull">{text}</div>}
              </div>
            )
            : null}
          <button
            type="button"
            className="ttl-msgJump"
            data-testid="ttl-output-jump"
            title={t(lang, 'locateInChat') as string}
            aria-label={t(lang, 'locateInChat') as string}
            onClick={() => { onJump(targetFor(item), turn) }}
          >↗</button>
        </div>
      )
    }
    return (
      <button
        type="button"
        key={key}
        className="ttl-item ttl-item-compaction"
        data-testid="ttl-item-compaction"
        title={clipTitle(item.preview)}
        onClick={() => { onJump(targetFor(item), turn) }}
      >
        <span className="ttl-itemDot ttl-dot-neutral" aria-hidden="true" />
        <span className="ttl-itemLabel">{t(lang, 'compactionTag') as string}</span>
        <span className="ttl-itemText ttl-itemText2 ttl-itemTextMuted">{item.preview}</span>
      </button>
    )
  }

  /**
   * v0.10.21: a collapsed card reads as one click target — the header is a real
   * button, and this handler lets the 2-line input preview (and the card's own
   * padding) open the turn too. Inner controls keep their own behaviour, and a
   * drag-select of the preview text is not treated as a click.
   */
  const onCardClick = React.useCallback((event: React.MouseEvent<HTMLElement>): void => {
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, textarea, select') !== null) return
    if ((window.getSelection()?.toString() ?? '').length > 0) return
    onToggle(id)
  }, [id, onToggle])

  const footParts = [ui.stepCount(turn.stepsCount)]
  if (parallelGroups.length > 0) footParts.push(ui.parallelGroups(parallelGroups.length))
  if (errorCount > 0) footParts.push(ui.failCount(errorCount))
  if (duration.length > 0) footParts.push(duration)

  return (
    <section
      className="ttl-turn"
      data-testid="ttl-turn"
      data-collapsed={expanded ? 'false' : 'true'}
      onClick={expanded ? undefined : onCardClick}
      data-active={active ? 'true' : undefined}
      data-error={hasError ? 'true' : undefined}
    >
      <div className="ttl-turnHead">
        <button
          type="button"
          className="ttl-turnToggle"
          aria-expanded={expanded}
          title={turnTagTitle}
          onClick={() => { onToggle(id) }}
        >
          <span className="ttl-turnTag" data-testid="ttl-turn-tag">{turnTag}</span>
          {clock.length > 0 ? <span className="ttl-turnTime">{clock}</span> : null}
          {duration.length > 0 ? <span className="ttl-turnDur">{duration}</span> : null}
          {/* v0.10.25: the cluster ledger sits on the duration side (left group),
              so the right edge only keeps the badges / 「N 步」 / chevron. */}
          {clusterMix.length > 0
            ? (
              <span className="ttl-mix" aria-hidden="true">
                {clusterMix.map((entry) => (
                  <i
                    key={entry.kind}
                    className={`ttl-mixItem ttl-ink-${inkOf(entry.kind)}`}
                    data-cluster={entry.kind}
                    title={`${clusterLabel(entry.kind, lang)} ${entry.count}`}
                  >
                    <ToolIcon kind={entry.kind} />
                    <span className="ttl-mixCount">{entry.count}</span>
                  </i>
                ))}
              </span>
            )
            : null}
          <span className="ttl-turnHeadSpacer" />
          <span className="ttl-turnMeta">
            {errorCount > 0
              ? (
                <span
                  className="ttl-badge ttl-badgeErr"
                  data-testid="ttl-error-dot"
                  title={(t(lang, 'error') as string)}
                >
                  {/* v0.10.16: same alert-triangle glyph as the failed rows. */}
                  <ToolIcon kind="alert" />
                  <span className="ttl-badgeCount" data-testid="ttl-error-count">{errorCount}</span>
                </span>
              )
              : null}
            {parallelGroups.length > 0
              ? (
                <span
                  className="ttl-badge ttl-badgeParallel"
                  data-testid="ttl-turn-parallel"
                  title={parallelBadgeTitle}
                  aria-label={parallelBadgeTitle}
                >{`∥${parallelGroups.length}`}</span>
              )
              : null}
            <span
              className="ttl-stepsNum"
              data-testid="ttl-steps-count"
              title={t(lang, 'stepsLabel') as string}
            >{ui.stepCount(turn.stepsCount)}</span>
            <span className={`ttl-chevron${expanded ? ' ttl-chevronOpen' : ''}`} aria-hidden="true">{chevronIcon()}</span>
          </span>
        </button>
        <button
          type="button"
          className="ttl-locateBtn"
          data-testid="ttl-locate"
          title={t(lang, 'locate') as string}
          aria-label={t(lang, 'locate') as string}
          onClick={() => { onJump({ seq: turn.anchorSeq, kind: 'input' }, turn) }}
        >{arrowIcon()}</button>
      </div>
      {preview.length > 0 && (!expanded || !inputRowShown)
        ? (
          <p
            className="ttl-turnPreview"
            data-testid="ttl-turn-preview"
            title={clipTitle(preview)}
          >{preview}</p>
        )
        : null}
      {expanded
        ? (() => {
            // Bound the expanded body so a turn with thousands of steps
            // doesn't mount thousands of rows. Show the most recent STEP_CAP
            // items plus a "show earlier" affordance; keys are seq-based, so
            // appended steps reconcile in place.
            const truncated = items.length > STEP_CAP && !showFull
            const shownItems = truncated ? items.slice(items.length - STEP_CAP) : items
            const hiddenCount = items.length - shownItems.length
            // Group AFTER filtering/slicing, so a chip keeps only the calls it
            // shows (a half-hidden batch renders as the visible run's own group).
            const shownEntries = groupParallelItems(shownItems)
            const showInput = inputRowShown
            const emptyBody = items.length === 0 && (filter !== 'all' || searchActive)
            return (
              <div className="ttl-turnBody">
                {showInput ? renderInputRow(inputItem) : null}
                {hiddenCount > 0
                  ? <button
                      type="button"
                      className="ttl-showEarlier"
                      data-testid="ttl-show-earlier"
                      onClick={() => { onShowEarlier(id) }}
                    >{(t(lang, 'showEarlierSteps') as (n: number) => string)(hiddenCount)}</button>
                  : null}
                {emptyBody
                  ? <div className="ttl-emptyInline" data-testid="ttl-empty-inline">{t(lang, 'emptyFiltered') as string}</div>
                  : shownEntries.map((entry) => (
                    entry.kind === 'group'
                      ? renderParallelGroup(entry.group)
                      : renderItem(entry.item, keyOfItem(entry.item))
                  ))}
                <div className="ttl-turnFoot" data-testid="ttl-turn-foot">{footParts.join(' · ')}</div>
              </div>
            )
          })()
        : null}
    </section>
  )
})

// ── The panel ───────────────────────────────────────────────────────────

export function TrailTab(props: TrailTabProps): React.ReactElement | null {
  const lang: Lang = detectLang()
  const ui = uiStrings(lang)
  const sessionId = props.scope?.sessionId ?? ''
  const visible = props.visible === true
  const sessionsService = React.useMemo(() => sessionsOf(props.ctx), [props.ctx])
  const fetchEvents = React.useMemo(
    () => props.fetchEventsOverride !== undefined
      ? props.fetchEventsOverride
      : (sid: string, afterSeq: number) => fetchTrailEvents(sid, afterSeq),
    [props.fetchEventsOverride],
  )

  const { turns, stats, status, error, refresh } = useTrail(sessionId, visible, fetchEvents, sessionsService)

  const [filter, setFilter] = React.useState<StepFilter>('all')
  const [query, setQuery] = React.useState('')
  const [expandedTurns, setExpandedTurns] = React.useState<Set<string> | null>(null)
  const [jumping, setJumping] = React.useState<number | null>(null)
  const [jumpPages, setJumpPages] = React.useState(0)
  const [jumpMessage, setJumpMessage] = React.useState<string | null>(null)
  const [activeTurnId, setActiveTurnId] = React.useState<string | null>(null)
  const [followLatest, setFollowLatest] = React.useState(true)
  const [followPaused, setFollowPaused] = React.useState(false)
  const [moreToolsOpen, setMoreToolsOpen] = React.useState(false)
  const [showFullTurn, setShowFullTurn] = React.useState<Set<string>>(new Set())
  /** Expanded step seqs (inline detail band). Plain click opens exactly one. */
  const [openSeqs, setOpenSeqs] = React.useState<ReadonlySet<number>>(() => new Set<number>())
  /** Per-step result rendering, seeded on first open and remembered after. */
  const [resultView, setResultView] = React.useState<ReadonlyMap<number, ResultView>>(() => new Map())
  /** The open overlay: which turn it was opened from and which step it shows. */
  const [zoom, setZoom] = React.useState<{ turnId: string; seq: number; tab?: DetailTab } | null>(null)
  const listRef = React.useRef<HTMLDivElement | null>(null)
  /**
   * v0.10.28: when a toggle makes the list shorter than the current scroll
   * offset (collapsing a turn near the end), the browser clamps `scrollTop`
   * and the whole list visibly jumps. `pendingScroll` remembers the offset at
   * click time; `holdExtra` is the temporary bottom padding that keeps the
   * scroll valid (blank space below, released as soon as the user scrolls
   * back into the real content).
   */
  const pendingScrollRef = React.useRef<number | null>(null)
  const holdExtraRef = React.useRef(0)
  const basePadRef = React.useRef('')
  const searchRef = React.useRef<HTMLInputElement | null>(null)
  const jumpingRef = React.useRef(false)
  /** The row to focus again once the dialog closes (契约: 焦点回到触发行). */
  const zoomReturnRef = React.useRef<HTMLElement | null>(null)

  // ── Derived: filtered turns ────────────────────────────────────────────
  const isToolFilter = filter !== 'all' && filter !== 'failed'
  const searchActive = query.trim().length > 0

  const visibleTurns = React.useMemo(() => {
    // `failed` used to keep every turn (the chips only narrow the rows inside),
    // so it stays that way unless a search narrows the list.
    if (filter === 'all' && !searchActive) return turns
    if (filter === 'failed' && !searchActive) return turns
    return turns.filter((turn) => stepsOf(turn).some((step) => stepMatches(step, filter, query)))
  }, [turns, filter, query, searchActive])

  /** Steps actually shown under the current filters (the list footer count). */
  const shownStepCount = React.useMemo(() => {
    if (filter === 'all' && !searchActive) return stats.total
    let count = 0
    for (const turn of visibleTurns) {
      for (const step of stepsOf(turn)) if (stepMatches(step, filter, query)) count += 1
    }
    return count
  }, [visibleTurns, filter, query, searchActive, stats.total])

  /** Latest event seq seen in the trail — the footer's sync watermark. */
  const latestSeq = React.useMemo(() => {
    let max = 0
    for (const turn of turns) {
      for (const item of turn.items) {
        const seq = item.kind === 'tool' ? item.step.seq : item.seq
        if (seq > max) max = seq
      }
    }
    return max
  }, [turns])

  /** Overview bar data: family distribution + summed turn duration. */
  const overview = React.useMemo(() => {
    const counts = new Map<ToolFamily, number>()
    for (const tool of stats.tools) {
      const family = toolFamily(tool.name, false)
      counts.set(family, (counts.get(family) ?? 0) + tool.count)
    }
    const order: ToolFamily[] = ['shell', 'read', 'edit', 'mcp', 'figma', 'skill', 'todo', 'generic']
    const families = order
      .filter((family) => (counts.get(family) ?? 0) > 0)
      .map((family) => ({ family, count: counts.get(family) ?? 0 }))
    const total = families.reduce((sum, entry) => sum + entry.count, 0)
    let durationMs: number | undefined
    for (const turn of turns) {
      if (turn.startedAt === undefined || turn.endedAt === undefined) continue
      const span = turn.endedAt - turn.startedAt
      if (span < 0) continue
      durationMs = (durationMs ?? 0) + span
    }
    return { families, total, durationMs }
  }, [stats, turns])

  const toolChips = stats.tools.slice(0, 3)
  const hiddenTools = stats.tools.slice(4)
  const hasMoreTools = hiddenTools.length > 0
  /** A tool filter living behind the ⋯ chip keeps the chip selected. */
  const hiddenToolSelected = isToolFilter && hiddenTools.some((tool) => tool.name === filter)

  // ── Follow-latest auto-scroll (rAF-coalesced; no forced reflow per burst) ─
  /** Drop the temporary bottom padding (never called while it would clamp). */
  const releaseScrollHold = React.useCallback((): void => {
    const el = listRef.current
    if (el === null) return
    if (holdExtraRef.current > 0) {
      el.style.paddingBottom = basePadRef.current
      holdExtraRef.current = 0
    }
  }, [])

  /** Remember where the list was scrolled before a toggle changes its height. */
  const captureScrollAnchor = React.useCallback((): void => {
    const el = listRef.current
    pendingScrollRef.current = el === null ? null : el.scrollTop
  }, [])

  // Layout effect (before paint): a toggle must not move the viewport. If the
  // resulting list is too short for the old offset, hold the scroll with a
  // temporary bottom pad instead of letting the browser clamp it.
  React.useLayoutEffect(() => {
    const desired = pendingScrollRef.current
    if (desired === null) return
    pendingScrollRef.current = null
    const el = listRef.current
    if (el === null) return
    const naturalMax = el.scrollHeight - el.clientHeight - holdExtraRef.current
    const need = desired - naturalMax
    if (need > 0.5) {
      if (basePadRef.current === '' && holdExtraRef.current === 0) {
        const computed = Number.parseFloat(window.getComputedStyle(el).paddingBottom)
        basePadRef.current = Number.isFinite(computed) && computed > 0 ? `${computed}px` : ''
      }
      holdExtraRef.current = need
      const base = Number.parseFloat(basePadRef.current)
      const basePx = Number.isFinite(base) ? base : 0
      el.style.paddingBottom = `${basePx + need}px`
      el.scrollTop = desired
    } else {
      releaseScrollHold()
    }
  })

  const onScroll = React.useCallback((): void => {
    const el = listRef.current
    if (el === null) return
    if (holdExtraRef.current > 0) {
      const naturalMax = el.scrollHeight - el.clientHeight - holdExtraRef.current
      if (el.scrollTop <= naturalMax + 0.5) releaseScrollHold()
    }
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32
    setFollowPaused(!nearBottom)
  }, [releaseScrollHold])

  React.useEffect(() => {
    if (!followLatest || followPaused) return undefined
    const el = listRef.current
    if (el === null) return undefined
    releaseScrollHold()
    if (typeof window.requestAnimationFrame === 'function') {
      const raf = window.requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
      return () => window.cancelAnimationFrame(raf)
    }
    const timeout = window.setTimeout(() => { el.scrollTop = el.scrollHeight }, 0)
    return () => window.clearTimeout(timeout)
  }, [turns, followLatest, followPaused, releaseScrollHold])

  const scrollToBottom = React.useCallback((): void => {
    const el = listRef.current
    if (el === null) return
    el.scrollTop = el.scrollHeight
    setFollowPaused(false)
  }, [])

  // ── ⌘F / Ctrl+F focuses the search field (unless the zoom dialog owns it) ─
  React.useEffect(() => {
    if (!visible) return undefined
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'f') return
      if (typeof document !== 'undefined' && document.querySelector('[data-testid="ttl-zoom"]') !== null) return
      const input = searchRef.current
      if (input === null) return
      event.preventDefault()
      input.focus()
      if (typeof input.select === 'function') input.select()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [visible])

  // ── Expansion helpers ──────────────────────────────────────────────────
  const latestIdRef = React.useRef('')
  React.useEffect(() => {
    latestIdRef.current = turns.length > 0 ? turnByIdentity(turns[turns.length - 1]) : ''
  }, [turns])

  // A search narrows the list: expand every matching turn once so the hits are
  // visible without a second click (the user can still collapse one after).
  React.useEffect(() => {
    if (!searchActive) return
    setExpandedTurns((current) => {
      const next = current === null
        ? new Set<string>(latestIdRef.current.length > 0 ? [latestIdRef.current] : [])
        : new Set(current)
      let changed = current === null
      for (const turn of visibleTurns) {
        const id = turnByIdentity(turn)
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [searchActive, visibleTurns])

  React.useEffect(() => {
    releaseScrollHold()
  }, [filter, query, releaseScrollHold])

  // Leaving search returns to the default expansion (latest turn only), so a
  // transient search does not leave every matched turn open afterwards.
  const prevSearchRef = React.useRef(false)
  React.useEffect(() => {
    if (prevSearchRef.current && !searchActive) setExpandedTurns(null)
    prevSearchRef.current = searchActive
  }, [searchActive])

  const isTurnExpanded = React.useCallback((id: string, index: number): boolean => {
    if (expandedTurns === null) return index === turns.length - 1
    return expandedTurns.has(id)
  }, [expandedTurns, turns.length])

  const toggleTurn = React.useCallback((id: string): void => {
    captureScrollAnchor()
    setExpandedTurns((current) => {
      if (current === null) {
        // Default state = only the latest turn expanded. Materialize THAT
        // single set, then toggle just the clicked turn — never "expand
        // every other turn" (that inverted the default on first click).
        const latestId = latestIdRef.current
        const next = new Set<string>()
        if (latestId.length > 0) next.add(latestId)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleShowFull = React.useCallback((id: string): void => {
    captureScrollAnchor()
    setShowFullTurn((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── Inline step detail (v0.4.0, 契约 §6) ───────────────────────────────
  /** Seed `resultView` for a step the first time it opens (read → rendered, bash → raw). */
  const seedView = React.useCallback((step: TrailStep): void => {
    setResultView((current) => {
      if (current.has(step.seq)) return current
      const next = new Map(current)
      next.set(step.seq, initialResultView(step))
      return next
    })
  }, [])

  /** Row click: toggle one step; without Alt only that step stays open. */
  const toggleStep = React.useCallback((step: TrailStep, multi: boolean): void => {
    captureScrollAnchor()
    setOpenSeqs((current) => {
      const next = new Set(current)
      if (next.has(step.seq)) {
        next.delete(step.seq)
        return next
      }
      if (!multi) next.clear()
      next.add(step.seq)
      return next
    })
    seedView(step)
  }, [seedView])

  /** ArrowRight: open (never close) this step, exclusive unless Alt is held. */
  const openStep = React.useCallback((step: TrailStep, multi = false): void => {
    captureScrollAnchor()
    setOpenSeqs((current) => {
      if (current.has(step.seq) && (multi || current.size === 1)) return current
      const next = new Set(current)
      if (!multi) next.clear()
      next.add(step.seq)
      return next
    })
    seedView(step)
  }, [seedView])

  /** ArrowLeft: collapse this step. */
  const closeStep = React.useCallback((step: TrailStep): void => {
    captureScrollAnchor()
    setOpenSeqs((current) => {
      if (!current.has(step.seq)) return current
      const next = new Set(current)
      next.delete(step.seq)
      return next
    })
  }, [])

  const setView = React.useCallback((seq: number, view: ResultView): void => {
    setResultView((current) => {
      if (current.get(seq) === view) return current
      const next = new Map(current)
      next.set(seq, view)
      return next
    })
  }, [])

  // ── On-demand full detail (v0.5.0, 契约 §10.5.2) ───────────────────────
  // `fetcherRef` (not a dependency) keeps `loadDetail` stable for the whole
  // session: a re-render must never re-trigger every open step's request.
  const fetcherRef = React.useRef<FetchToolDetail>(props.fetchToolDetailOverride ?? fetchToolDetail)
  fetcherRef.current = props.fetchToolDetailOverride ?? fetchToolDetail
  const detailInflight = React.useRef(new Map<number, Promise<ToolDetailResult>>())
  /** Load a step's full detail, joining an identical in-flight request. */
  const loadDetail = React.useCallback((seq: number): Promise<ToolDetailResult> => {
    const pending = detailInflight.current.get(seq)
    if (pending !== undefined) return pending
    const request = (async (): Promise<ToolDetailResult> => {
      try {
        return await fetcherRef.current(sessionId, [seq])
      } catch {
        // fetchToolDetail never rejects; a foreign override might.
        return { ok: false, reason: 'network' }
      } finally {
        detailInflight.current.delete(seq)
      }
    })()
    detailInflight.current.set(seq, request)
    return request
  }, [sessionId])

  // ── Zoom overlay (v0.5.0, 契约 §10.5.4) ────────────────────────────────
  const openZoom = React.useCallback((
    step: TrailStep,
    turn: TrailTurn,
    trigger: HTMLElement | null,
    tab?: DetailTab,
  ): void => {
    zoomReturnRef.current = trigger ?? (typeof document === 'undefined' ? null : document.activeElement as HTMLElement | null)
    setZoom({ turnId: turnByIdentity(turn), seq: step.seq, tab })
  }, [])

  const closeZoom = React.useCallback((): void => { setZoom(null) }, [])

  const zoomSteps = React.useMemo<readonly TrailStep[]>(() => {
    if (zoom === null) return []
    const turn = turns.find((entry) => turnByIdentity(entry) === zoom.turnId)
    return turn === undefined ? [] : stepsOf(turn)
  }, [zoom, turns])

  // A closed dialog returns focus to the row that opened it (if still mounted).
  React.useEffect(() => {
    if (zoom !== null) return
    const target = zoomReturnRef.current
    if (target === null) return
    zoomReturnRef.current = null
    if (target.isConnected !== false && typeof target.focus === 'function') target.focus()
  }, [zoom])

  // A turn that scrolled out of the trail (session switch, filter) closes it.
  React.useEffect(() => {
    if (zoom !== null && zoomSteps.length === 0) setZoom(null)
  }, [zoom, zoomSteps])

  // A different session starts from a clean slate; hiding the tab does too
  // (contract §6) so a re-shown panel never resurrects a stale open band.
  React.useEffect(() => {
    setOpenSeqs(new Set<number>())
    setResultView(new Map())
    setZoom(null)
    setQuery('')
    setExpandedTurns(null)
  }, [sessionId])
  React.useEffect(() => {
    if (visible) return
    setOpenSeqs(new Set<number>())
    setResultView(new Map())
    setZoom(null)
  }, [visible])

  // ── Locate (jump) ──────────────────────────────────────────────────────
  const sessionForJump = React.useMemo<SessionFace | null>(() => {
    if (sessionsService === undefined) return null
    const binding = sessionsService.binding(sessionId)
    const session = binding !== undefined && binding.session !== undefined ? binding.session : undefined
    if (session === undefined) return null
    const face = session as unknown as { loadOlder?: unknown; getSnapshot?: unknown }
    if (typeof face.loadOlder !== 'function' || typeof face.getSnapshot !== 'function') return null
    return session as unknown as SessionFace
  }, [sessionsService, sessionId])

  const conversationForJump = React.useMemo<ConversationTargetsLike | undefined>(
    () => conversationOf(props.ctx, sessionId),
    [props.ctx, sessionId],
  )

  const doJump = React.useCallback(async (target: JumpTarget, turn: TrailTurn): Promise<void> => {
    if (jumpingRef.current) return // ignore re-entry while a jump is in flight
    setActiveTurnId(turnByIdentity(turn))
    if (sessionForJump === null) {
      setJumpMessage(t(lang, 'jumpFailed') as string)
      return
    }
    jumpingRef.current = true
    setJumping(target.seq)
    setJumpPages(0)
    setJumpMessage(null)
    const outcome = await jumpToItem(sessionForJump, target, {
      document: window.document,
      onProgress: (pages) => setJumpPages(pages),
      ...(conversationForJump !== undefined ? { conversation: conversationForJump } : {}),
    })
    jumpingRef.current = false
    setJumping(null)
    if (outcome.ok) {
      setJumpMessage(t(lang, outcome.mode === 'trajectory' ? 'jumpTrajectory' : 'jumpDone') as string)
    } else {
      setJumpMessage(t(lang, 'jumpFailed') as string)
    }
  }, [sessionForJump, conversationForJump, lang])

  // The jump result is a transient hint on the status bar, not a new state.
  React.useEffect(() => {
    if (jumpMessage === null) return undefined
    const timer = window.setTimeout(() => { setJumpMessage(null) }, 3200)
    return () => window.clearTimeout(timer)
  }, [jumpMessage])

  // A step hidden by the active filter/search must not keep its detail band
  // "open" underneath (contract §6): drop every open seq it no longer shows.
  React.useEffect(() => {
    if (filter === 'all' && !searchActive) return
    setOpenSeqs((current) => {
      if (current.size === 0) return current
      const allowed = new Set<number>()
      for (const turn of turns) {
        for (const step of stepsOf(turn)) {
          if (stepMatches(step, filter, query)) allowed.add(step.seq)
        }
      }
      let changed = false
      const next = new Set<number>()
      for (const seq of current) {
        if (allowed.has(seq)) next.add(seq)
        else changed = true
      }
      return changed ? next : current
    })
  }, [filter, searchActive, query, turns])

  const clearFilters = React.useCallback((): void => {
    setFilter('all')
    setQuery('')
  }, [])

  /**
   * Width of the tool-name column, sized to the longest visible label so names
   * like `open-computer-use` render in full instead of `open-...`. MCP labels
   * are the server name (no JSON parsing here); everything else is the wire
   * tool name. Capped so the description keeps enough room.
   */
  const stepNameWidth = React.useMemo(() => {
    let max = 0
    for (const turn of turns) {
      for (const item of turn.items) {
        if (item.kind !== 'tool') continue
        const mcp = splitMcpName(item.step.name)
        const label = mcp !== null ? mcp.server : item.step.name
        if (label.length > max) max = label.length
      }
    }
    return Math.min(132, Math.max(52, Math.round(max * 6.5) + 8))
  }, [turns])

  if (!visible) return null

  // ── Render pieces ──────────────────────────────────────────────────────
  const chipButton = (
    value: StepFilter,
    label: React.ReactNode,
    count: number,
    dot?: string,
  ): React.ReactElement => (
    <button
      type="button"
      key={value}
      className={`ttl-chip${filter === value ? ' ttl-chipSelected' : ''}`}
      aria-pressed={filter === value}
      data-testid={`ttl-chip-${value}`}
      onClick={() => { setFilter((current) => (current === value ? 'all' : value)) }}
    >
      {dot !== undefined ? <span className={`ttl-chipDot ttl-dot-${dot}`} aria-hidden="true" /> : null}
      <span className="ttl-chipLabel">{label}</span>
      {count > 0 ? <span className="ttl-chipCount">{String(count)}</span> : null}
    </button>
  )

  const header = (
    <header className="ttl-header">
      <span className="ttl-brandIcon" aria-hidden="true">{brandIcon()}</span>
      <h2 className="ttl-title">{t(lang, 'tabTitle') as string}</h2>
      <span className="ttl-count" data-testid="ttl-count">
        {`${(t(lang, 'turnsCount') as (n: number) => string)(turns.length)} · ${ui.stepCount(stats.total)}`}
      </span>
      <span className="ttl-headerSpacer" />
      <button
        type="button"
        className="ttl-follow"
        aria-pressed={followLatest}
        data-testid="ttl-follow-toggle"
        data-paused={followPaused ? 'true' : undefined}
        title={t(lang, followLatest ? 'followLatest' : 'followPaused') as string}
        onClick={() => { setFollowLatest((current) => !current) }}
      >
        <span className="ttl-followDot" aria-hidden="true" />
        {t(lang, followLatest ? 'followLatest' : 'followPaused') as string}
      </button>
      {turns.length > 0
        ? (
          <div className="ttl-search" title={`${ui.searchPlaceholder} (⌘F)`}>
            <span className="ttl-searchIcon" aria-hidden="true">{searchIcon()}</span>
            <input
              ref={searchRef}
              type="search"
              className="ttl-searchInput"
              data-testid="ttl-search"
              value={query}
              placeholder={ui.searchPlaceholderShort}
              aria-label={ui.searchPlaceholder}
              onChange={(event) => { setQuery(event.target.value) }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setQuery('')
                }
              }}
            />
            {query.length > 0
              ? <button
                  type="button"
                  className="ttl-searchClear"
                  data-testid="ttl-search-clear"
                  aria-label={ui.clearSearch}
                  title={ui.clearSearch}
                  onClick={() => { setQuery('') }}
                >×</button>
              : null}
          </div>
        )
        : null}
    </header>
  )

  const chips = (
    <>
      <div className="ttl-filters" role="group" data-testid="ttl-chips">
        {chipButton('all', t(lang, 'filterAll') as string, stats.total)}
        {stats.failed > 0 ? chipButton('failed', t(lang, 'filterFailed') as string, stats.failed, 'red') : null}
        {toolChips.map((tool) => chipButton(tool.name, toolChipLabel(tool.name), tool.count))}
        {hasMoreTools
          ? <button
              type="button"
              className={`ttl-chip ttl-moreChip${moreToolsOpen || hiddenToolSelected ? ' ttl-chipSelected' : ''}`}
              aria-expanded={moreToolsOpen}
              aria-label={t(lang, moreToolsOpen ? 'filterCollapse' : 'filterMore') as string}
              title={hiddenToolSelected ? toolChipLabel(filter) : t(lang, moreToolsOpen ? 'filterCollapse' : 'filterMore') as string}
              data-testid="ttl-chip-more"
              onClick={() => { setMoreToolsOpen((current) => !current) }}
            >⋯</button>
          : null}
      </div>
      {moreToolsOpen && hasMoreTools
        ? <div className="ttl-toolDropdown" data-testid="ttl-tool-dropdown">
            {hiddenTools.map((tool) => chipButton(tool.name, toolChipLabel(tool.name), tool.count))}
          </div>
        : null}
    </>
  )

  const summaryBar = turns.length > 0
    ? (
      <div className="ttl-summary">
        <div className="ttl-summaryTop">
          <span className="ttl-summaryStat">
            {`${ui.stepCount(stats.total)} · ${(t(lang, 'turnsCount') as (n: number) => string)(turns.length)}`}
          </span>
          <span className="ttl-summarySpacer" />
          {stats.failed > 0 ? <span className="ttl-summaryFail">{ui.failCount(stats.failed)}</span> : null}
          {overview.durationMs !== undefined
            ? <span className="ttl-summaryDur" title={ui.totalDuration}>{formatDuration(overview.durationMs)}</span>
            : null}
        </div>
        {overview.families.length > 0
          ? (
            <>
              <div className="ttl-dist" role="img" aria-label={ui.toolDist}>
                {overview.families.map((entry) => (
                  <i
                    key={entry.family}
                    className={`ttl-distSeg ttl-dist-${entry.family} ttl-ink-${familyInk(entry.family)}`}
                    style={{ width: `${(entry.count / overview.total) * 100}%` }}
                  />
                ))}
              </div>
              <div className="ttl-legend">
                {overview.families.map((entry) => (
                  <span className="ttl-legendItem" key={entry.family}>
                    <i className={`ttl-legendDot ttl-dist-${entry.family} ttl-ink-${familyInk(entry.family)}`} aria-hidden="true" />
                    {`${familyLabel(entry.family, ui)} ${entry.count}`}
                  </span>
                ))}
              </div>
            </>
          )
          : null}
      </div>
    )
    : null

  let body: React.ReactElement
  if (turns.length === 0 && status === 'loading') {
    body = (
      <div className="ttl-skeleton" data-testid="ttl-status" role="status" aria-live="polite">
        {[0, 1, 2].map((index) => (
          <div className="ttl-skeletonRow" key={index}>
            <span className="ttl-skeletonDot" aria-hidden="true" />
            <span
              className="ttl-skeletonBar"
              style={{ width: index === 0 ? '56%' : index === 1 ? '72%' : '63%' }}
              aria-hidden="true"
            />
            <span className="ttl-skeletonBud" aria-hidden="true" />
          </div>
        ))}
        <div className="ttl-skeletonFoot">
          <span className="ttl-spin">{spinnerIcon()}</span>
          {ui.reading}
        </div>
      </div>
    )
  } else if (turns.length === 0 && status === 'error') {
    const message = error ?? (t(lang, 'loadFailed') as string)
    body = (
      <div className="ttl-errorCard" data-testid="ttl-error" role="alert">
        <div className="ttl-errorHead">
          <span className="ttl-errorIcon" aria-hidden="true">{warningIcon()}</span>
          <span className="ttl-errorTitle">{ui.errorTitle}</span>
        </div>
        <p className="ttl-errorCode">{message}</p>
        <div className="ttl-errorActions">
          <button type="button" className="ttl-chip ttl-errorRetry" data-testid="ttl-retry" onClick={refresh}>
            {t(lang, 'retry') as string}
          </button>
          <button
            type="button"
            className="ttl-chip"
            data-testid="ttl-error-copy"
            onClick={() => { copyToClipboard(message) }}
          >{ui.copyError}</button>
        </div>
        <p className="ttl-errorNote">{ui.errorNote}</p>
      </div>
    )
  } else if (turns.length === 0) {
    body = (
      <div className="ttl-empty" data-testid="ttl-empty" role="status">
        <span className="ttl-emptyIcon" aria-hidden="true">{brandIcon(26)}</span>
        <p className="ttl-emptyTitle">{ui.emptyTitle}</p>
        <p className="ttl-emptyDesc">{ui.emptyDesc}</p>
        <button type="button" className="ttl-chip ttl-emptyAction" data-testid="ttl-refresh" onClick={refresh}>
          {ui.refresh}
        </button>
      </div>
    )
  } else if (visibleTurns.length === 0) {
    body = (
      <div className="ttl-emptyFiltered ttl-empty-filtered" data-testid="ttl-empty-filtered" role="status">
        <p className="ttl-emptyFilteredText">{t(lang, 'emptyFiltered') as string}</p>
        <button type="button" className="ttl-chip" data-testid="ttl-clear-filter" onClick={clearFilters}>
          {t(lang, 'clearFilter') as string}
        </button>
      </div>
    )
  } else {
    body = (
      <div className="ttl-list" ref={listRef} onScroll={onScroll} data-testid="ttl-list">
        {visibleTurns.map((turn, index) => (
          <TurnRow
            key={turnByIdentity(turn)}
            turn={turn}
            index={index}
            expanded={isTurnExpanded(turnByIdentity(turn), index)}
            active={activeTurnId === turnByIdentity(turn) || (activeTurnId === null && index === visibleTurns.length - 1)}
            showFull={showFullTurn.has(turnByIdentity(turn))}
            filter={filter}
            query={query}
            isToolFilter={isToolFilter}
            lang={lang}
            sessionId={sessionId}
            openSeqs={openSeqs}
            resultView={resultView}
            onToggle={toggleTurn}
            onShowEarlier={toggleShowFull}
            onJump={doJump}
            onToggleStep={toggleStep}
            onStepOpen={openStep}
            onStepClose={closeStep}
            onSetView={setView}
            onLoadDetail={loadDetail}
            onZoom={openZoom}
          />
        ))}
        <div className="ttl-listFoot" data-testid="ttl-list-foot">
          {filter === 'all' && !searchActive
            ? ui.shownAll(turns.length, stats.total)
            : ui.shownFiltered(visibleTurns.length, shownStepCount)}
        </div>
      </div>
    )
  }

  const showStatusBar = turns.length > 0 || jumping !== null
  const syncText = status === 'loading'
    ? ui.syncing
    : error !== null ? ui.syncFailed : ui.synced


  const statusBar = showStatusBar
    ? (
      <div className="ttl-statusbar" data-testid="ttl-statusbar">
        <span className="ttl-statusDot" aria-hidden="true" />
        <span className="ttl-statusText">{syncText}</span>
        {jumping !== null
          ? (
            <span className="ttl-statusMsg">
              <span className="ttl-spin">{spinnerIcon()}</span>
              {(t(lang, 'jumpProgress') as (n: number) => string)(jumpPages)}
            </span>
          )
          : jumpMessage !== null ? <span className="ttl-statusMsg">{jumpMessage}</span> : null}
        <span className="ttl-statusSpacer" />
        {followPaused && turns.length > 0
          ? (
            <button
              type="button"
              className="ttl-toBottom ttl-toBottomInline"
              data-testid="ttl-to-bottom"
              onClick={scrollToBottom}
            >{t(lang, 'newUpdates') as string}</button>
          )
          : null}
        {latestSeq > 0
          ? <span className="ttl-statusSeq" data-testid="ttl-status-seq">{`seq #${latestSeq}`}</span>
          : null}
      </div>
    )
    : null

  return (
    <div
      className="ttl-root"
      role="complementary"
      aria-label={t(lang, 'tabTitle') as string}
      data-testid="ttl-root"
      style={{ ['--ttl-step-name-w' as string]: `${stepNameWidth}px` }}
    >
      {header}
      {turns.length > 0 ? chips : null}
      {summaryBar}
      {body}
      {statusBar}
      {jumping !== null
        ? <div className="ttl-jumpBanner" data-testid="ttl-jump-banner" role="status">
            <span className="ttl-spin">{spinnerIcon()}</span>
            {(t(lang, 'jumpProgress') as (n: number) => string)(jumpPages)}
          </div>
        : null}
      {zoom !== null && zoomSteps.length > 0
        ? (
          <ZoomOverlay
            steps={zoomSteps}
            initialSeq={zoom.seq}
            initialTab={zoom.tab}
            sessionId={sessionId}
            lang={lang}
            onClose={closeZoom}
          />
        )
        : null}
    </div>
  )
}

// ── Inline glyphs (hand-drawn, currentColor) ────────────────────────────

function chevronIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function spinnerIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Locate affordance (↗ = jump back into the conversation). */
function arrowIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M5 11l6-6M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Brand mark: the Lucide `route` glyph (same family as the tab icon). */
function brandIcon(size = 15): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  )
}

function searchIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function warningIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path
        d="M8 2.5l6 10.5H2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 6v4M8 11.6v.1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
