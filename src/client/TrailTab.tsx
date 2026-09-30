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
import type { TurnItem, TrailTurn, TrailStep, SessionEventLike } from '../trail-model'
import { stepsOf } from '../trail-model'
import { detectLang, t, type Lang } from './locales'
import { fetchTrailEvents, useTrail, type SessionsServiceLike } from './useTrail'
import { jumpToItem, type ConversationTargetsLike, type JumpTarget, type SessionFace } from './trail-jump'

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
  onToggle: (id: string) => void
  onShowEarlier: (id: string) => void
  onJump: (target: JumpTarget, turn: TrailTurn) => void
}

const TurnRow = React.memo(function TurnRow(props: TurnRowProps): React.ReactElement {
  const { turn, index, expanded, active, showFull, filter, isToolFilter, lang, onToggle, onShowEarlier, onJump } = props
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

  const renderStep = (step: TrailStep, key: string): React.ReactElement => {
    const isError = step.kind === 'error'
    const text = isError ? step.error : step.argsPreview
    const tone = isError ? 'red' : toolDotClass(step.name)
    return (
      <button
        type="button"
        className="ttl-row"
        key={key}
        data-testid="ttl-step"
        data-step-kind={step.kind}
        title={text}
        onClick={() => { onJump(targetFor({ kind: 'tool', step }), turn) }}
      >
        {dot(tone)}
        {name(step.name, true)}
        <span className="ttl-rowArgs">{text}</span>
      </button>
    )
  }

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
            onToggle={toggleTurn}
            onShowEarlier={toggleShowFull}
            onJump={doJump}
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
