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
import type { TurnItem, TrailTurn, TrailStep, TrailResult, SessionEventLike } from '../trail-model'
import { stepsOf } from '../trail-model'
import { detectLang, t, type Lang } from './locales'
import { fetchTrailEvents, useTrail, type SessionsServiceLike } from './useTrail'
import { jumpToItem, type ConversationTargetsLike, type JumpTarget, type SessionFace } from './trail-jump'
import { JsonTree, parseJsonLoose } from './json-tree'
import { MarkdownResult, RawText, defaultViewForTool, looksLikeMarkdown } from './markdown-result'
import { markdownLabels } from './markdown-labels'

export interface TrailTabProps {
  /** cordis client context (used only for ctx.get('sessions') / ctx.get('uiConversation')). */
  ctx?: { get(name: string): unknown }
  scope: { sessionId: string; cwd?: string }
  visible: boolean
  tab: { id: string }
  /** test seam: override the events transport. */
  fetchEventsOverride?: (sessionId: string, afterSeq: number) => Promise<{ events: SessionEventLike[]; hasMore?: boolean }>
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

/** Semantic dot tone for a tool name (native-restrained: 3 tones + neutral). */
function toolDotClass(name: string): 'success' | 'warn' | 'neutral' {
  const n = name.toLowerCase()
  if (n.includes('edit') || n.includes('write') || n.includes('patch')) return 'warn'
  if (n.includes('bash') || n.includes('command') || n.includes('exec') || n.includes('run')) return 'success'
  return 'neutral'
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

/** Which rendering the result pane shows for one step (remembered per seq). */
type ResultView = 'rendered' | 'raw'

/** Human-readable byte size for an image chip (`imageMeta` `{size}` slot). */
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}

/** Clipboard write through the optional API; silently ignored when absent. */
function copyToClipboard(text: string): void {
  if (typeof navigator === 'undefined') return
  const clipboard = navigator.clipboard
  if (clipboard === undefined || typeof clipboard.writeText !== 'function') return
  try {
    const pending: unknown = clipboard.writeText(text)
    if (pending !== null && typeof pending === 'object' && typeof (pending as Promise<void>).catch === 'function') {
      void (pending as Promise<void>).catch(() => undefined)
    }
  } catch {
    // Denied: the text is still selectable on screen.
  }
}

/** The three panes of the inline detail band (契约 §6). */
type DetailTab = 'params' | 'result' | 'raw'

interface StepDetailProps {
  /** DOM id the row points at with `aria-controls`. */
  id: string
  step: TrailStep
  lang: Lang
  view: ResultView
  onSetView: (seq: number, view: ResultView) => void
}

/**
 * Inline detail band under an expanded step: 参数 | 结果 | 原始 tabs, the
 * result pane with an optional 渲染/原文 switch, image placeholder chips and
 * a footer with the full/truncated pill, seq, replace and orphan hints.
 *
 * Untrusted content only ever reaches React children: results go through
 * `MarkdownResult`/`RawText`, arguments through `JsonTree`/`RawText`.
 */
const StepDetail = React.memo(function StepDetail(props: StepDetailProps): React.ReactElement {
  const { id, step, lang, view, onSetView } = props
  const result: TrailResult | undefined = step.result
  const args = step.args ?? ''
  const [tab, setTab] = React.useState<DetailTab>(result !== undefined ? 'result' : 'params')
  const [copied, setCopied] = React.useState(false)
  const labels = markdownLabels(lang)
  const parsed = React.useMemo(() => parseJsonLoose(args), [args])
  const truncated = step.argsTruncated === true || result?.truncated === true

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

  const imageRow = (images: NonNullable<TrailResult['images']>): React.ReactElement => (
    <div className="ttl-imgRow" data-testid="ttl-img-row">
      {images.map((image, index) => (
        <span className="ttl-imgChip" data-testid="ttl-img-chip" key={`${image.attachmentId}:${index}`}>
          <span>{(t(lang, 'imageLabel') as (name: string) => string)(image.name ?? image.mediaType)}</span>
          <span className="ttl-imgMeta">{image.mediaType}</span>
          {image.width !== undefined && image.height !== undefined
            ? (
              <span className="ttl-imgMeta">
                {(t(lang, 'imageMeta') as (w: number, h: number, size: string) => string)(
                  image.width, image.height, formatBytes(image.bytes),
                )}
              </span>
            )
            : null}
        </span>
      ))}
    </div>
  )

  const renderParams = (): React.ReactElement => (
    parsed.ok
      ? <JsonTree value={parsed.value} />
      : (
        <>
          <RawText text={args} />
          <div className="ttl-detailHint" data-testid="ttl-detail-unparsable">
            {t(lang, 'resultUnparsable') as string}
          </div>
        </>
      )
  )

  const renderResult = (): React.ReactElement => {
    if (result === undefined) {
      return <div className="ttl-detailHint" data-testid="ttl-detail-empty">{t(lang, 'resultEmpty') as string}</div>
    }
    const images = result.images ?? []
    const isError = result.isError || result.kind === 'error' || step.kind === 'error'
    if (isError) {
      const errorName = result.errorName ?? step.name
      const errorCode = result.errorCode ?? step.errorCode
      return (
        <div className="ttl-errorBlock" data-testid="ttl-error-block">
          <div className="ttl-errorName" data-testid="ttl-error-name">
            {errorCode !== undefined ? `${errorName} · ${errorCode}` : errorName}
          </div>
          {result.text.length > 0 ? <RawText text={result.text} /> : null}
          {images.length > 0 ? imageRow(images) : null}
        </div>
      )
    }
    if (result.text.length === 0 && images.length === 0) {
      return <div className="ttl-detailHint" data-testid="ttl-detail-empty">{t(lang, 'resultEmpty') as string}</div>
    }
    const markdown = looksLikeMarkdown(result.text)
    return (
      <>
        {markdown && view === 'rendered'
          ? <MarkdownResult text={result.text} labels={labels} />
          : result.text.length > 0 ? <RawText text={result.text} /> : null}
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
        {images.length > 0 ? imageRow(images) : null}
      </>
    )
  }

  const copyAll = (): void => {
    const text = result !== undefined && result.text.length > 0
      ? `${args.length > 0 ? `${args}\n\n` : ''}${result.text}`
      : args
    copyToClipboard(text)
    setCopied(true)
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
      <div className="ttl-detailBody" data-testid={`ttl-detail-body-${tab}`}>
        {tab === 'params' ? renderParams() : null}
        {tab === 'result' ? renderResult() : null}
        {tab === 'raw' ? <RawText text={args} /> : null}
      </div>
      <div className="ttl-detailFoot" data-testid="ttl-detail-foot">
        <span
          className={`ttl-pill${truncated ? ' ttl-pillWarn' : ' ttl-pillOk'}`}
          data-testid="ttl-detail-pill"
        >{t(lang, truncated ? 'truncatedPill' : 'fullPill') as string}</span>
        <span data-testid="ttl-detail-seq">{`seq #${step.seq}`}</span>
        <button
          type="button"
          className="ttl-dtab"
          data-testid="ttl-detail-copy"
          onClick={copyAll}
        >{t(lang, copied ? 'copiedDone' : 'copyDetail') as string}</button>
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
  onJump: (target: JumpTarget, turn: TrailTurn) => void
  onToggleStep: (step: TrailStep, multi: boolean) => void
  onStepOpen: (step: TrailStep) => void
  onStepClose: (step: TrailStep) => void
  onSetView: (seq: number, view: ResultView) => void
}

/**
 * One step row: the v0.3.1 anatomy (dot + name + args) plus the contract's
 * disclosure caret. The locate affordance is `position: absolute` (out of
 * flow) and the row keeps its 3px/18px line box, so list density is unchanged.
 * Clicking the row expands/collapses it; `↗` keeps the original locate action.
 * The detail band mounts ONLY for an open step, so a 1000-step list adds no
 * extra DOM.
 */
const StepRow = React.memo(function StepRow(props: StepRowProps): React.ReactElement {
  const { step, turn, open, view, lang, onJump, onToggleStep, onStepOpen, onStepClose, onSetView } = props
  const text = step.kind === 'error' ? step.error : step.argsPreview
  const tone = step.kind === 'error' || step.result?.isError === true ? 'red' : toolDotClass(step.name)
  const detailId = `ttl-detail-${step.kind}-${step.seq}`
  return (
    <div className="ttl-stepWrap" data-open={open ? 'true' : undefined} data-testid="ttl-step-wrap">
      <button
        type="button"
        className="ttl-row"
        data-testid="ttl-step"
        data-step-kind={step.kind}
        aria-expanded={open}
        aria-controls={detailId}
        title={text}
        onClick={(event) => { onToggleStep(step, event.altKey) }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            onStepOpen(step)
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault()
            onStepClose(step)
          }
        }}
      >
        <span className={`ttl-caret${open ? ' ttl-caretOpen' : ''}`} aria-hidden="true" />
        <span className={`ttl-rowDot ttl-dot-${tone}`} aria-hidden="true" />
        <span className="ttl-rowName ttl-rowNameMono">{step.name}</span>
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
        ? <StepDetail id={detailId} step={step} lang={lang} view={view} onSetView={onSetView} />
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
  openSeqs: ReadonlySet<number>
  resultView: ReadonlyMap<number, ResultView>
  onToggle: (id: string) => void
  onShowEarlier: (id: string) => void
  onJump: (target: JumpTarget, turn: TrailTurn) => void
  onToggleStep: (step: TrailStep, multi: boolean) => void
  onStepOpen: (step: TrailStep) => void
  onStepClose: (step: TrailStep) => void
  onSetView: (seq: number, view: ResultView) => void
}

const TurnRow = React.memo(function TurnRow(props: TurnRowProps): React.ReactElement {
  const {
    turn, index, expanded, active, showFull, filter, isToolFilter, lang, openSeqs, resultView,
    onToggle, onShowEarlier, onJump, onToggleStep, onStepOpen, onStepClose, onSetView,
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
      onJump={onJump}
      onToggleStep={onToggleStep}
      onStepOpen={onStepOpen}
      onStepClose={onStepClose}
      onSetView={onSetView}
    />
  )

  const renderItem = (item: TurnItem, key: string): React.ReactElement | null => {
    if (item.kind === 'tool') return renderStep(item.step, key)
    if (item.kind === 'input') return null // shown as the body's first row
    if (item.kind === 'output') {
      return (
        <button
          type="button"
          key={key}
          className="ttl-row"
          data-testid="ttl-item-output"
          title={clipTitle(item.text)}
          onClick={() => { onJump(targetFor(item), turn) }}
        >
          {dot('violet')}
          {name(t(lang, 'output') as string, false)}
          <span className="ttl-rowText ttl-rowText2">{item.text}</span>
        </button>
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
                  : shownItems.map((item) => renderItem(item, keyOfItem(item)))}
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

  // A different session starts from a clean slate; hiding the tab does too
  // (contract §6) so a re-shown panel never resurrects a stale open band.
  React.useEffect(() => {
    setOpenSeqs(new Set<number>())
    setResultView(new Map())
  }, [sessionId])
  React.useEffect(() => {
    if (visible) return
    setOpenSeqs(new Set<number>())
    setResultView(new Map())
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
            openSeqs={openSeqs}
            resultView={resultView}
            onToggle={toggleTurn}
            onShowEarlier={toggleShowFull}
            onJump={doJump}
            onToggleStep={toggleStep}
            onStepOpen={openStep}
            onStepClose={closeStep}
            onSetView={setView}
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
