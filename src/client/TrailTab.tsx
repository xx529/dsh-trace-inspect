/**
 * TrailTab.tsx — the 「轮次轨迹」panel as a compact vertical turn timeline,
 * styled in the DSH-native design language (ink chrome, hairline separators,
 * flat rows — see styles.ts): a one-line header per turn (chevron + "轮次 N"
 * micro tag + input preview + bare tabular step count), an expanded flat list
 * of unified rows — [semantic dot] + [name] + [content] where the dot carries
 * the color channel (blue=input, violet=output, green/amber/neutral=tool
 * category, red=failure) — filter chips with matching category dots,
 * follow-latest auto-scroll, and click-to-locate (jump back into the main
 * conversation).
 *
 * Rendering cost model (v0.2.1): foldTurns ran over the WHOLE log and rebuilt
 * every TrailTurn object per poll, so every row re-rendered and index-based
 * keys + tail truncation remounted rows on each burst. Now:
 *   - useTrail reuses closed TrailTurn objects (identity stable) — each poll
 *     only the open turn's object changes;
 *   - rows are keyed by event seq (stable), so appended steps reconcile in
 *     place instead of shifting every key;
 *   - each turn renders as a memoized TurnRow, so closed turns are skipped
 *     entirely on the hot path.
 */
import * as React from 'react'
import type {
  TurnItem,
  TrailTurn,
  TrailStep,
  TrailResult,
  TrailResultImage,
  TrailParallelGroup,
  SessionEventLike,
} from '../trail-model'
import { groupParallelItems, parallelGroupsOf, stepsOf } from '../trail-model'
import { detectLang, t, type Lang } from './locales'
import {
  fetchToolDetail,
  fetchTrailEvents,
  useTrail,
  type SessionsServiceLike,
  type ToolDetailItem,
  type ToolDetailResult,
} from './useTrail'
import { jumpToItem, type ConversationTargetsLike, type JumpTarget, type SessionFace } from './trail-jump'
import { parseJsonLoose } from './json-tree'
import { JsonPretty } from './json-pretty'
import { summarizeToolCall, type ToolIconKind, type ToolTone } from './tool-summary'
import { ToolIcon } from './tool-icon'
import { MarkdownResult, RawText, defaultViewForTool, looksLikeMarkdown } from './markdown-result'
import { markdownLabels } from './markdown-labels'
import {
  TrailImages,
  ZoomOverlay,
  copyToClipboard,
  toolDotClass,
  type ResultView,
} from './ZoomOverlay'

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

type StepFilter = 'all' | 'failed' | string

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

/** Compact big counts: 1500 → "1.5k", 2200 → "2.2k", 384 → "384". */
function formatCount(n: number): string {
  if (n < 1000) return String(n)
  const k = n / 1000
  return `${k >= 10 ? String(Math.round(k)) : String(Math.round(k * 10) / 10)}k`
}

/** Max step/items rows mounted per expanded turn (bounds the DOM). */
const STEP_CAP = 250

/** Full tooltip text cap (server already trims to TEXT_CAP; belt and braces). */
const TITLE_CAP = 512

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

/** The three panes of the inline detail band (契约 §6). */
type DetailTab = 'params' | 'result' | 'raw'

/** One step's on-demand full detail, as delivered by `/tool-detail`. */
type DetailPhase = 'loading' | 'ready' | 'failed'

/** Full-detail pane values derived from one `ToolDetailItem` (§10.3.2). */
function detailTextOf(item: ToolDetailItem): string {
  if (item.content === null) return ''
  return item.content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}

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

interface StepDetailProps {
  /** DOM id the row points at with `aria-controls`. */
  id: string
  step: TrailStep
  sessionId: string
  lang: Lang
  view: ResultView
  onSetView: (seq: number, view: ResultView) => void
  /** Load (or join) the on-demand full detail of this step (§10.5.2). */
  onLoadDetail: (seq: number) => Promise<ToolDetailResult>
  /** Open the centered viewer for this step on a given pane (契约 §10.5.4). */
  onZoom: (step: TrailStep, trigger: HTMLElement | null, tab?: DetailTab) => void
}

/**
 * Inline detail band under an expanded step: 参数 | 结果 | 原始 tabs, the
 * result pane with an optional 渲染/原文 switch, image thumbnails and a
 * footer with the full/truncated pill, seq, replace and orphan hints.
 *
 * Untrusted content only ever reaches React children: results go through
 * `MarkdownResult`/`RawText`, arguments through `JsonTree`/`RawText`.
 *
 * v0.5.0: a step whose wire preview was clipped asks the host for the
 * untruncated detail once (per step, inflight-deduped by the panel) and swaps
 * the panes over to it; a failure keeps the preview plus a retry affordance.
 * `mergedFrom > 1` with no replace is the F4 hint (events never declared a
 * merge intent).
 */
const StepDetail = React.memo(function StepDetail(props: StepDetailProps): React.ReactElement {
  const { id, step, sessionId, lang, view, onSetView, onLoadDetail, onZoom } = props
  const result: TrailResult | undefined = step.result
  const args = step.args ?? ''
  const [tab, setTab] = React.useState<DetailTab>(result !== undefined ? 'result' : 'params')
  const [copied, setCopied] = React.useState(false)
  /** On-demand full detail of THIS step, plus how its one automatic load went. */
  const [detail, setDetail] = React.useState<ToolDetailItem | undefined>(undefined)
  const [loadFailed, setLoadFailed] = React.useState(false)
  /** Automatic loads are not retried; the user may spend exactly one retry. */
  const [retries, setRetries] = React.useState(0)
  const labels = markdownLabels(lang)
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
    })
    return () => { alive = false }
  }, [needsDetail, onLoadDetail, step.seq, retries])

  const detailPhase: DetailPhase = !needsDetail
    ? 'ready'
    : detail !== undefined ? 'ready' : loadFailed ? 'failed' : 'loading'
  const loaded = detail !== undefined
  const fullArgs = loaded && detail.arguments !== null ? detail.arguments : args
  const fullParsed = React.useMemo(() => parseJsonLoose(fullArgs), [fullArgs])
  const fullText = loaded ? detailTextOf(detail) : (result?.text ?? '')
  const fullImages = loaded ? detailImagesOf(detail) : (result?.images ?? [])
  const pillTruncated = loaded ? detail.truncated === true : truncated

  const tabButton = (value: DetailTab, label: string): React.ReactElement => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      className={`ttl-dtab${tab === value ? ' ttl-dtabSelected' : ''}`}
      data-testid={`ttl-dtab-${value}`}
      onClick={() => { setTab(value) }}
    >{label}</button>
  )

  const renderParams = (): React.ReactElement => (
    fullParsed.ok
      ? <JsonPretty value={fullParsed.value} lang={lang} />
      : (
        <>
          <RawText text={fullArgs} />
          <div className="ttl-detailHint" data-testid="ttl-detail-unparsable">
            {t(lang, 'resultUnparsable') as string}
          </div>
        </>
      )
  )

  /** F4 hint: several results merged in with no `surfaceOp` (§10.5.3). */
  const mergedNote = result !== undefined && (result.mergedFrom ?? 0) > 1 && result.replacedBy === undefined
    ? (
      <div className="ttl-detailMerged" role="note" data-testid="ttl-detail-merged">
        {(t(lang, 'mergedNoSurfaceOp') as (n: number) => string)(result.mergedFrom ?? 0)}
      </div>
    )
    : null

  /** The on-demand load strip: loading / failed + retry (§10.5.2). */
  const loadStrip = (): React.ReactElement | null => {
    if (detailPhase === 'loading') {
      return (
        <div className="ttl-detailLoad" data-testid="ttl-detail-load">
          {t(lang, 'detailLoading') as string}
        </div>
      )
    }
    if (detailPhase === 'failed') {
      return (
        <div className="ttl-detailLoad" data-testid="ttl-detail-load">
          <span>{t(lang, 'detailLoadFailed') as string}</span>
          <button
            type="button"
            className="ttl-detailRetry"
            data-testid="ttl-detail-retry"
            disabled={retries >= 1}
            onClick={retryDetail}
          >{t(lang, 'detailRetry') as string}</button>
        </div>
      )
    }
    return null
  }

  const renderResult = (): React.ReactElement => {
    const images = fullImages
    const text = fullText
    if (result === undefined && !loaded) {
      return <div className="ttl-detailHint" data-testid="ttl-detail-empty">{t(lang, 'resultEmpty') as string}</div>
    }
    const isError = detail?.isError === true || result?.isError === true
      || result?.kind === 'error' || step.kind === 'error'
    if (isError) {
      const errorName = detail?.error?.name ?? result?.errorName ?? step.name
      const errorCode = detail?.error?.code ?? result?.errorCode ?? step.errorCode
      return (
        <div className="ttl-errorBlock" data-testid="ttl-error-block">
          <div className="ttl-errorName" data-testid="ttl-error-name">
            {errorCode !== undefined ? `${errorName} · ${errorCode}` : errorName}
          </div>
          {text.length > 0 ? <RawText text={text} /> : null}
          {images.length > 0 ? <TrailImages images={images} sessionId={sessionId} lang={lang} /> : null}
          {mergedNote}
        </div>
      )
    }
    if (text.length === 0 && images.length === 0) {
      return (
        <>
          <div className="ttl-detailHint" data-testid="ttl-detail-empty">{t(lang, 'resultEmpty') as string}</div>
          {mergedNote}
        </>
      )
    }
    const markdown = looksLikeMarkdown(text)
    return (
      <>
        {markdown && view === 'rendered'
          ? <MarkdownResult text={text} labels={labels} />
          : text.length > 0 ? <RawText text={text} /> : null}
        {markdown
          ? (
            <div className="ttl-detailHint">
              <button
                type="button"
                className="ttl-dtab"
                data-testid="ttl-view-toggle"
                aria-pressed={view === 'rendered'}
                onClick={() => { onSetView(step.seq, view === 'rendered' ? 'raw' : 'rendered') }}
              >{t(lang, view === 'rendered' ? 'detailSource' : 'detailRender') as string}</button>
            </div>
          )
          : null}
        {images.length > 0 ? <TrailImages images={images} sessionId={sessionId} lang={lang} /> : null}
        {mergedNote}
      </>
    )
  }

  const copyAll = (): void => {
    const text = fullText.length > 0
      ? `${fullArgs.length > 0 ? `${fullArgs}\n\n` : ''}${fullText}`
      : fullArgs
    copyToClipboard(text)
    setCopied(true)
  }

  /** Open the centered viewer on `which` pane (footer ⤢ / pane click / toolbar). */
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

  return (
    <div
      className="ttl-detail"
      id={id}
      role="region"
      aria-label={(t(lang, 'detailAria') as (name: string) => string)(step.name)}
      data-testid="ttl-detail"
    >
      <div className="ttl-detailBar" role="tablist">
        {tabButton('params', t(lang, 'detailParams') as string)}
        {tabButton('result', t(lang, 'detailResult') as string)}
        {tabButton('raw', t(lang, 'detailRaw') as string)}
      </div>
      <div className="ttl-detailTools">
        <button
          type="button"
          className="ttl-dtab"
          data-testid="ttl-detail-view-center"
          title={t(lang, 'clickToViewFull') as string}
          onClick={(event) => { openZoomFor(tab, event.currentTarget) }}
        >{`⤢ ${t(lang, 'viewInCenter') as string}`}</button>
      </div>
      <div className="ttl-detailBody" data-testid={`ttl-detail-body-${tab}`}>
        {loadStrip()}
        <div className="ttl-clickablePane" data-testid="ttl-pane-clickable" onClick={openZoomFromPane} title={t(lang, 'clickToViewFull') as string}>
          {tab === 'params' ? renderParams() : null}
          {tab === 'result' ? renderResult() : null}
          {tab === 'raw' ? <RawText text={args} /> : null}
        </div>
      </div>
      <div className="ttl-detailFoot" data-testid="ttl-detail-foot">
        <span
          className={`ttl-pill${pillTruncated ? ' ttl-pillWarn' : ' ttl-pillOk'}`}
          data-testid="ttl-detail-pill"
        >{t(lang, pillTruncated ? 'truncatedPill' : 'fullPill') as string}</span>
        <span data-testid="ttl-detail-seq">{`seq #${step.seq}`}</span>
        {loaded
          ? <span className="ttl-pill ttl-pillOk" data-testid="ttl-detail-full">{t(lang, 'detailLoadedFull') as string}</span>
          : null}
        <button
          type="button"
          className="ttl-dtab"
          data-testid="ttl-detail-copy"
          onClick={copyAll}
        >{t(lang, copied ? 'copiedDone' : 'copyDetail') as string}</button>
        <button
          type="button"
          className="ttl-dtab"
          data-testid="ttl-detail-zoom"
          title={t(lang, 'zoomOpen') as string}
          aria-label={t(lang, 'zoomOpen') as string}
          onClick={(event) => { openZoomFor(tab, event.currentTarget) }}
        >⤢</button>
        {result?.replacedBy !== undefined
          ? (
            <span data-testid="ttl-detail-replaced">
              {(t(lang, 'resultReplaced') as (n: number) => string)(result.replacedBy)}
            </span>
          )
          : null}
        {step.orphan === true
          ? <span className="ttl-pill ttl-pillWarn" data-testid="ttl-detail-orphan">{t(lang, 'orphanResult') as string}</span>
          : null}
      </div>
    </div>
  )
})

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
 * One step row: the v0.3.1 anatomy (dot + name + args) plus the contract's
 * disclosure caret. The locate affordance is `position: absolute` (out of
 * flow) and the row keeps its 3px/18px line box, so list density is unchanged.
 * Clicking the row expands/collapses it; `↗` keeps the original locate action.
 * The detail band mounts ONLY for an open step, so a 1000-step list adds no
 * extra DOM.
 *
 * v0.5.0 adds the second zoom entry point: a focused row answers ⌘⇧O / Ctrl+Shift+O
 * (契约 §10.5.4). Nothing else about the folded row changed.
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
  const tone: ToolTone = step.kind === 'error' || step.result?.isError === true ? 'red' : toolDotClass(step.name)
  const text = step.kind === 'error' ? step.error : summary.detail
  const detailId = `ttl-detail-${step.kind}-${step.seq}`
  /** Keep the band's memo effective: a stable handler per (row, turn). */
  const openZoomForStep = React.useCallback(
    (target: TrailStep, trigger: HTMLElement | null, tab?: DetailTab) => { onZoom(target, turn, trigger, tab) },
    [onZoom, turn],
  )
  return (
    <div className="ttl-stepWrap" data-open={open ? 'true' : undefined} data-testid="ttl-step-wrap">
      <button
        type="button"
        className="ttl-row"
        data-testid="ttl-step"
        data-step-kind={step.kind}
        aria-expanded={open}
        aria-controls={detailId}
        title={step.kind === 'error' ? step.error : (step.argsPreview.length > 0 ? step.argsPreview : text)}
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
        <span className={`ttl-caret${open ? ' ttl-caretOpen' : ''}`} aria-hidden="true" />
        <ToolIcon kind={step.kind === 'error' ? 'generic' : summary.icon} tone={tone} />
        <span className="ttl-rowName ttl-rowNameMono">{summary.label}</span>
        <span className="ttl-rowArgs">{text}</span>
      </button>
      <button
        type="button"
        className="ttl-jump"
        data-testid="ttl-step-jump"
        title={t(lang, 'locateInChat') as string}
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
          />
        )
        : null}
    </div>
  )
})

interface TurnRowProps {
  turn: TrailTurn
  /** Position in the CURRENT visible list (drives default-latest semantics). */
  index: number
  expanded: boolean
  active: boolean
  showFull: boolean
  filter: StepFilter
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

const TurnRow = React.memo(function TurnRow(props: TurnRowProps): React.ReactElement {
  const {
    turn, index, expanded, active, showFull, filter, isToolFilter, lang, sessionId, openSeqs, resultView,
    onToggle, onShowEarlier, onJump, onToggleStep, onStepOpen, onStepClose, onSetView, onLoadDetail, onZoom,
  } = props
  const id = turnByIdentity(turn)

  const stepMatches = (step: TrailStep): boolean => {
    if (filter === 'all') return true
    if (filter === 'failed') return step.kind === 'error'
    return step.kind === 'tool' && step.name === filter
  }

  const items = turn.items.filter((item) => {
    if (item.kind === 'tool') return stepMatches(item.step)
    if (item.kind === 'input') return false
    return !isToolFilter
  })
  /**
   * Parallel batches of THIS turn, computed on the unfiltered items so the
   * header badge counts what the turn did, not what the active chip shows.
   * Cheap guard: a turn with fewer than two steps cannot hold a batch.
   */
  const parallelGroups = React.useMemo(
    () => (turn.stepsCount >= 2 ? parallelGroupsOf(turn.items) : []),
    // Open-turn items are APPENDED in place (same array identity), so length is
    // the structural signal; closed turns keep a frozen items array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turn.stepsCount, turn.items.length],
  )
  const parallelCalls = React.useMemo(
    () => parallelGroups.reduce((sum, group) => sum + group.steps.length, 0),
    [parallelGroups],
  )
  const parallelBadgeTitle = parallelGroups.length > 0
    ? (t(lang, 'parallelGroupsTitle') as (groups: number, calls: number) => string)(parallelGroups.length, parallelCalls)
    : ''
  const [openOutputs, setOpenOutputs] = React.useState<ReadonlySet<string>>(() => new Set<string>())
  const toggleOutput = React.useCallback((key: string): void => {
    setOpenOutputs((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])
  const turnTag = (t(lang, 'turnPrefix') as (n: number) => string)(turn.turn ?? index + 1)
  const preview = turn.inputPreview
  const hasError = turn.hasError
  /** The turn's user input; rendered as the first row of the expanded body. */
  const inputItem = turn.items.find((item): item is Extract<TurnItem, { kind: 'input' }> => item.kind === 'input')

  /** Unified row anatomy: [semantic dot] + [name] + [content]. */
  const dot = (tone: string): React.ReactElement => (
    <span className={`ttl-rowDot ttl-dot-${tone}`} aria-hidden="true" />
  )
  const name = (label: string, mono: boolean): React.ReactElement => (
    <span className={`ttl-rowName${mono ? ' ttl-rowNameMono' : ''}`}>{label}</span>
  )

  /** First row of the expanded body: full input (3-line clamp), click = locate. */
  const renderInputRow = (item: Extract<TurnItem, { kind: 'input' }>): React.ReactElement => (
    <button
      type="button"
      className="ttl-row"
      data-testid="ttl-item-input"
      title={clipTitle(item.text)}
      onClick={() => { onJump({ seq: item.seq, kind: 'input' }, turn) }}
    >
      {dot('blue')}
      {name(t(lang, 'input') as string, false)}
      <span className="ttl-rowText">{item.text}</span>
    </button>
  )

  const renderStep = (step: TrailStep, key: string): React.ReactElement => (
    <StepRow
      key={key}
      step={step}
      turn={turn}
      open={openSeqs.has(step.seq)}
      view={resultView.get(step.seq) ?? defaultViewForTool(step.name)}
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
   * One assistant-step batch: a compact `∥ 并行 ×N` caption plus a hairline
   * rail around its rows, so calls requested together read as one unit instead
   * of N unrelated steps. The caption is informational (no state); each row
   * keeps its own disclosure / locate / keyboard behaviour untouched.
   */
  const renderParallelGroup = (group: TrailParallelGroup): React.ReactElement => {
    const size = group.steps.length
    const label = (t(lang, 'parallelGroup') as (n: number) => string)(size)
    const hint = (t(lang, 'parallelGroupHint') as (n: number) => string)(size)
    return (
      <div
        className="ttl-parallel"
        key={group.key}
        role="group"
        aria-label={label}
        data-testid="ttl-parallel-group"
        data-step={group.step}
      >
        <div className="ttl-parallelHead" data-testid="ttl-parallel-head" title={hint}>
          <span className="ttl-parallelMark" aria-hidden="true">∥</span>
          <span className="ttl-parallelLabel">{label}</span>
        </div>
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
      // v0.6.0: clicking the output row reveals the FULL message inline (the
      // row itself stays a 2-line clamp); ↗ keeps the locate-in-conversation
      // action that used to live on the row click.
      const open = openOutputs.has(key)
      return (
        <div className="ttl-outputWrap" key={key} data-open={open ? 'true' : undefined} data-testid="ttl-output-wrap">
          <button
            type="button"
            className="ttl-row"
            data-testid="ttl-item-output"
            aria-expanded={open}
            title={clipTitle(item.text)}
            onClick={() => { toggleOutput(key) }}
          >
            {dot('violet')}
            {name(t(lang, 'output') as string, false)}
            <span className="ttl-rowText ttl-rowText2">{item.text}</span>
          </button>
          <button
            type="button"
            className="ttl-jump"
            data-testid="ttl-output-jump"
            title={t(lang, 'locateInChat') as string}
            onClick={() => { onJump(targetFor(item), turn) }}
          >↗</button>
          {open
            ? (
              <div className="ttl-outputBody" data-testid="ttl-output-body">
                {looksLikeMarkdown(item.text)
                  ? <MarkdownResult text={item.text} labels={markdownLabels(lang)} />
                  : <RawText text={item.text} />}
              </div>
            )
            : null}
        </div>
      )
    }
    return (
      <button
        type="button"
        key={key}
        className="ttl-row"
        data-testid="ttl-item-compaction"
        title={clipTitle(item.preview)}
        onClick={() => { onJump(targetFor(item), turn) }}
      >
        {dot('neutral')}
        {name(t(lang, 'compactionTag') as string, false)}
        <span className="ttl-rowText ttl-rowText2 ttl-rowTextMuted">{item.preview}</span>
      </button>
    )
  }

  return (
    <section
      className="ttl-turnRow"
      data-testid="ttl-turn"
      data-collapsed={expanded ? 'false' : 'true'}
      data-active={active ? 'true' : undefined}
      data-error={hasError ? 'true' : undefined}
    >
      <div className="ttl-turnHead">
        <button
          type="button"
          className="ttl-turnToggle"
          aria-expanded={expanded}
          onClick={() => { onToggle(id) }}
        >
          <span className={`ttl-chevron${expanded ? ' ttl-chevronOpen' : ''}`}>{chevronIcon()}</span>
          <span className="ttl-turnTag" data-testid="ttl-turn-tag">{turnTag}</span>
          {preview.length > 0
            ? <span className="ttl-turnPreview" title={clipTitle(preview)}>{preview}</span>
            : null}
        </button>
        <span className="ttl-turnMeta">
          {hasError ? <span className="ttl-errorDot" data-testid="ttl-error-dot" title={t(lang, 'error') as string} /> : null}
          {parallelGroups.length > 0
            ? (
              <span
                className="ttl-parallelBadge"
                data-testid="ttl-turn-parallel"
                title={parallelBadgeTitle}
                aria-label={parallelBadgeTitle}
              >{`∥${formatCount(parallelGroups.length)}`}</span>
            )
            : null}
          <span
            className="ttl-stepsNum"
            data-testid="ttl-steps-count"
            title={t(lang, 'stepsLabel') as string}
          >{formatCount(turn.stepsCount)}</span>
          <button
            type="button"
            className="ttl-locateBtn"
            data-testid="ttl-locate"
            title={t(lang, 'locate') as string}
            onClick={() => { onJump({ seq: turn.anchorSeq, kind: 'input' }, turn) }}
          >{targetIcon()}</button>
        </span>
      </div>
      {expanded
        ? (() => {
            // Bound the expanded body so a turn with thousands of steps
            // doesn't mount thousands of rows (and re-render them every
            // throttled update). Show the most recent STEP_CAP items plus a
            // "show earlier" affordance. Keys are seq-based, so appended
            // steps reconcile in place (rows keep their DOM nodes).
            const truncated = items.length > STEP_CAP && !showFull
            const shownItems = truncated ? items.slice(items.length - STEP_CAP) : items
            const hiddenCount = items.length - shownItems.length
            // Group AFTER filtering/slicing, so a chip keeps only the calls it
            // shows (a half-hidden batch renders as the visible run's own group).
            const shownEntries = groupParallelItems(shownItems)
            return (
              <div className="ttl-turnBody">
                {filter === 'all' && inputItem !== undefined ? renderInputRow(inputItem) : null}
                {hiddenCount > 0
                  ? <button
                      type="button"
                      className="ttl-showEarlier"
                      data-testid="ttl-show-earlier"
                      onClick={() => { onShowEarlier(id) }}
                    >{(t(lang, 'showEarlierSteps') as (n: number) => string)(hiddenCount)}</button>
                  : null}
                {items.length === 0
                  ? <div className="ttl-emptyInline">{t(lang, 'emptyFiltered') as string}</div>
                  : shownEntries.map((entry) => (
                    entry.kind === 'group'
                      ? renderParallelGroup(entry.group)
                      : renderItem(entry.item, keyOfItem(entry.item))
                  ))}
              </div>
            )
          })()
        : null}
    </section>
  )
})

export function TrailTab(props: TrailTabProps): React.ReactElement | null {
  const lang: Lang = detectLang()
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
  const listRef = React.useRef<HTMLDivElement | null>(null)
  const jumpingRef = React.useRef(false)

  // ── Follow-latest auto-scroll (rAF-coalesced; no forced reflow per burst) ─
  const onScroll = React.useCallback((): void => {
    const el = listRef.current
    if (el === null) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32
    setFollowPaused(!nearBottom)
  }, [])

  React.useEffect(() => {
    if (!followLatest || followPaused) return undefined
    const el = listRef.current
    if (el === null) return undefined
    if (typeof window.requestAnimationFrame === 'function') {
      const raf = window.requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
      return () => window.cancelAnimationFrame(raf)
    }
    const timeout = window.setTimeout(() => { el.scrollTop = el.scrollHeight }, 0)
    return () => window.clearTimeout(timeout)
  }, [turns, followLatest, followPaused])

  const scrollToBottom = React.useCallback((): void => {
    const el = listRef.current
    if (el === null) return
    el.scrollTop = el.scrollHeight
    setFollowPaused(false)
  }, [])

  // ── Expansion helpers ──────────────────────────────────────────────────
  const latestIdRef = React.useRef('')
  React.useEffect(() => {
    latestIdRef.current = turns.length > 0 ? turnByIdentity(turns[turns.length - 1]) : ''
  }, [turns])

  const isTurnExpanded = React.useCallback((id: string, index: number): boolean => {
    if (expandedTurns === null) return index === turns.length - 1
    return expandedTurns.has(id)
  }, [expandedTurns, turns.length])

  const toggleTurn = React.useCallback((id: string): void => {
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
      next.set(step.seq, defaultViewForTool(step.name))
      return next
    })
  }, [])

  /** Row click: toggle one step; without Alt only that step stays open. */
  const toggleStep = React.useCallback((step: TrailStep, multi: boolean): void => {
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
  /** The open overlay: which turn it was opened from and which step it shows. */
  const [zoom, setZoom] = React.useState<{ turnId: string; seq: number; tab?: DetailTab } | null>(null)
  /** The row to focus again once the dialog closes (契约: 焦点回到触发行). */
  const zoomReturnRef = React.useRef<HTMLElement | null>(null)

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

  // ── Filtered rendering helpers ─────────────────────────────────────────
  const stepMatches = (step: TrailStep): boolean => {
    if (filter === 'all') return true
    if (filter === 'failed') return step.kind === 'error'
    return step.kind === 'tool' && step.name === filter
  }

  const visibleTurns = React.useMemo(
    () => (filter === 'all' || filter === 'failed' ? turns : turns.filter((turn) => stepsOf(turn).some((step) => stepMatches(step)))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turns, filter],
  )

  const toolChips = stats.tools.slice(0, 4)
  const hasMoreTools = stats.tools.length > 4
  const isToolFilter = filter !== 'all' && filter !== 'failed'

  // A step hidden by the active filter must not keep its detail band "open"
  // underneath (contract §6): drop every open seq the filter no longer shows.
  React.useEffect(() => {
    if (filter === 'all') return
    setOpenSeqs((current) => {
      if (current.size === 0) return current
      const allowed = new Set<number>()
      for (const turn of turns) {
        for (const step of stepsOf(turn)) {
          if (stepMatches(step)) allowed.add(step.seq)
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
    // `stepMatches` closes over `filter`, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, turns])

  if (!visible) return null

  // ── Render pieces ──────────────────────────────────────────────────────
  const chipButton = (value: StepFilter, label: string, count: number, dot?: 'success' | 'warn' | 'neutral'): React.ReactElement => (
    <button
      type="button"
      key={value}
      className="ttl-chip"
      aria-pressed={filter === value ? 'true' : 'false'}
      data-testid={`ttl-chip-${value}`}
      onClick={() => { setFilter((current) => (current === value ? 'all' : value)) }}
    >
      {dot ? <span className={`ttl-chipDot ttl-dot-${dot}`} aria-hidden="true" /> : null}
      <span>{label}</span>
      {count > 0 ? <span className="ttl-chipNum">{String(count)}</span> : null}
    </button>
  )

  const header = (
    <div className="ttl-header">
      <h2 className="ttl-title">{t(lang, 'tabTitle') as string}</h2>
      <span className="ttl-count" data-testid="ttl-count">{(t(lang, 'turnsCount') as (n: number) => string)(turns.length)}</span>
      <span className="ttl-headerSpacer" />
      <button
        type="button"
        className="ttl-toggle"
        aria-pressed={followLatest ? 'true' : 'false'}
        data-testid="ttl-follow-toggle"
        onClick={() => { setFollowLatest((current) => !current) }}
      >
        <span className="ttl-toggleDot" aria-hidden="true" />
        {t(lang, 'followLatest') as string}
      </button>
    </div>
  )

  const chips = (
    <>
      <div className="ttl-filterRow" role="group" data-testid="ttl-chips">
        {chipButton('all', t(lang, 'filterAll') as string, stats.total)}
        {stats.failed > 0 ? chipButton('failed', t(lang, 'filterFailed') as string, stats.failed) : null}
        {toolChips.map((tool) => chipButton(tool.name, tool.name, tool.count, toolDotClass(tool.name)))}
        {hasMoreTools
          ? <button
              type="button"
              key="more"
              className="ttl-chip ttl-moreChip"
              aria-expanded={moreToolsOpen ? 'true' : 'false'}
              data-testid="ttl-chip-more"
              onClick={() => { setMoreToolsOpen((current) => !current) }}
            >
              {t(lang, moreToolsOpen ? 'filterCollapse' : 'filterMore') as string}
              <span className={`ttl-moreArrow${moreToolsOpen ? ' ttl-moreArrowOpen' : ''}`}>{chevronIcon()}</span>
            </button>
          : null}
      </div>
      {moreToolsOpen && hasMoreTools
        ? <div className="ttl-toolDropdown" data-testid="ttl-tool-dropdown">
            {stats.tools.map((tool) => chipButton(tool.name, tool.name, tool.count, toolDotClass(tool.name)))}
          </div>
        : null}
    </>
  )

  let body: React.ReactElement
  if (status === 'loading') {
    body = <div className="ttl-status" data-testid="ttl-status">{t(lang, 'loading') as string}</div>
  } else if (status === 'error' && turns.length === 0) {
    body = (
      <div>
        <div className="ttl-error" data-testid="ttl-error">{error ?? t(lang, 'loadFailed') as string}</div>
        <div className="ttl-filterRow">
          <button type="button" className="ttl-chip" onClick={refresh} data-testid="ttl-retry">{t(lang, 'retry') as string}</button>
        </div>
      </div>
    )
  } else if (turns.length === 0) {
    body = <div className="ttl-status" data-testid="ttl-empty">{t(lang, 'emptyNoTurns') as string}</div>
  } else if (visibleTurns.length === 0) {
    body = (
      <div className="ttl-status" data-testid="ttl-empty-filtered">
        {t(lang, 'emptyFiltered') as string}
        <button type="button" className="ttl-chip" style={{ marginLeft: 8 }} onClick={() => { setFilter('all') }}>{t(lang, 'clearFilter') as string}</button>
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
            active={activeTurnId === turnByIdentity(turn)}
            showFull={showFullTurn.has(turnByIdentity(turn))}
            filter={filter}
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
      </div>
    )
  }

  const statusBar = jumping !== null || jumpMessage !== null
    ? (
        <div className="ttl-statusBar" data-testid="ttl-statusbar">
          {jumping !== null ? <span className="ttl-spin">{spinnerIcon()}</span> : null}
          <span>
            {jumping !== null ? `${(t(lang, 'jumpProgress') as (n: number) => string)(jumpPages)} ` : ''}
            {jumpMessage ?? ''}
          </span>
        </div>
      )
    : null

  return (
    <div className="ttl-root" role="complementary" aria-label={t(lang, 'tabTitle') as string} data-testid="ttl-root">
      {header}
      {chips}
      {body}
      {statusBar}
      {jumping !== null
        ? <div className="ttl-jumpBanner" data-testid="ttl-jump-banner" role="status">
            <span className="ttl-spin">{spinnerIcon()}</span>
            {(t(lang, 'jumpProgress') as (n: number) => string)(jumpPages)}
          </div>
        : null}
      {followPaused && turns.length > 0
        ? <button type="button" className="ttl-toBottom" data-testid="ttl-to-bottom" onClick={scrollToBottom}>{t(lang, 'newUpdates') as string}</button>
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

function targetIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
    </svg>
  )
}
