/**
 * ZoomOverlay.tsx — the v0.5.0 full-size step viewer (契约 §10.5.4), plus the
 * small view primitives TrailTab and the overlay must render IDENTICALLY.
 *
 * Why the shared primitives live here: the inline detail band (TrailTab) and
 * this overlay both draw an image block, a semantic dot tone, a clipboard
 * write and a JSON download. TrailTab already imports this module, so keeping
 * them here makes the dependency one-way (TrailTab → ZoomOverlay); splitting
 * them across the two files would either duplicate them or create an import
 * cycle (TrailTab ⇄ ZoomOverlay) that breaks under ESM hoisting.
 *
 * The overlay is a React portal into `document.body`: the sidebar tab lives
 * inside the host's own scroll/overflow containers, so a `position: fixed`
 * layer rendered in place can still be clipped by an ancestor with
 * `transform` / `overflow`. A body portal plus `.ttl-zoom` (fixed, inset 0)
 * needs no unverified host slot key; the fixed layer, backdrop and panel
 * chrome all come from styles.ts (§10.4.1).
 *
 * Safety: untrusted tool output reaches React children only — results go
 * through `MarkdownResult` / `RawText`, arguments through `JsonTree` and the
 * outline through plain text. No innerHTML / dangerouslySetInnerHTML / eval.
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import type { TrailResultImage, TrailStep } from '../trail-model'
import { attachmentUrl } from './attachment-url'
import { parseJsonLoose } from './json-tree'
import { JsonPretty } from './json-pretty'
import { t, type Lang } from './locales'
import { markdownLabels } from './markdown-labels'
import { MarkdownResult, RawText, defaultViewForTool, looksLikeMarkdown } from './markdown-result'

// ── Shared view primitives (TrailTab imports these) ──────────────────────

/** Which rendering the result pane shows for one step (契约 §6). */
export type ResultView = 'rendered' | 'raw'

/** The three panes of a step viewer (契约 §6). */
export type DetailTab = 'params' | 'result' | 'raw'

/** Human-readable byte size for an image chip (`imageMeta` `{size}` slot). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return String(bytes)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}

/** Semantic dot tone for a tool name (native-restrained: 3 tones + neutral). */
export function toolDotClass(name: string): 'success' | 'warn' | 'neutral' {
  const n = name.toLowerCase()
  if (n.includes('edit') || n.includes('write') || n.includes('patch')) return 'warn'
  if (n.includes('bash') || n.includes('command') || n.includes('exec') || n.includes('run')) return 'success'
  return 'neutral'
}

/** Clipboard write through the optional API; silently ignored when absent. */
export function copyToClipboard(text: string): void {
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

/**
 * Hand one JSON payload to the browser as a download (契约 §10.5.4): a Blob
 * plus an `a[download]` click. `URL.createObjectURL` is an optional browser
 * API (jsdom has no implementation), so the same bytes fall back to a data
 * URL instead of throwing.
 */
export function downloadJson(filename: string, text: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([text], { type: 'application/json' })
  const urlApi: typeof URL | undefined = typeof URL === 'undefined' ? undefined : URL
  const objectUrl = urlApi !== undefined && typeof urlApi.createObjectURL === 'function'
    ? urlApi.createObjectURL(blob)
    : null
  const href = objectUrl ?? `data:application/json;charset=utf-8,${encodeURIComponent(text)}`
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  try {
    anchor.click()
  } finally {
    if (anchor.parentNode !== null) anchor.parentNode.removeChild(anchor)
    if (objectUrl !== null && urlApi !== undefined && typeof urlApi.revokeObjectURL === 'function') {
      try {
        urlApi.revokeObjectURL(objectUrl)
      } catch {
        // Revoking is best effort.
      }
    }
  }
}

/** Props of {@link TrailImages}. */
export interface TrailImagesProps {
  images: readonly TrailResultImage[]
  sessionId: string
  lang: Lang
}

/**
 * The image blocks of one tool result (契约 §10.5.1): each block is a
 * session-authorized thumbnail (`attachmentUrl`) when the route URL is
 * usable, otherwise the v0.4.0 placeholder chip. A load failure (`onError`)
 * hides the `<img>`, keeps the chip and adds the `imageLoadFailed` warning.
 *
 * The chip row doubles as the caption / metadata line under the thumbnail
 * (`name · mediaType · WxH · bytes`), which is also why it stays visible once
 * the image loads — it is the `imageMeta` row the contract keeps.
 */
export function TrailImages(props: TrailImagesProps): React.ReactElement {
  const { images, sessionId, lang } = props
  return (
    <div className="ttl-imgRow" data-testid="ttl-img-row">
      {images.map((image, index) => (
        <ImageBlock key={`${image.attachmentId}:${index}`} image={image} sessionId={sessionId} lang={lang} />
      ))}
    </div>
  )
}

const ImageBlock = React.memo(function ImageBlock(props: {
  image: TrailResultImage
  sessionId: string
  lang: Lang
}): React.ReactElement {
  const { image, sessionId, lang } = props
  const [loadFailed, setLoadFailed] = React.useState(false)
  const url = attachmentUrl(sessionId, image)
  const name = image.name ?? image.mediaType
  const label = (t(lang, 'imageLabel') as (name: string) => string)(name)
  const meta = (
    <>
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
    </>
  )
  const showThumb = url !== null && !loadFailed
  return (
    <div className="ttl-imgItem" data-testid="ttl-img-item">
      {showThumb
        ? (
          <div className="ttl-imgThumbWrap" data-testid="ttl-img-thumb-wrap">
            <img
              data-testid="ttl-img-thumb"
              className="ttl-imgThumb"
              loading="lazy"
              src={url}
              alt={label}
              onError={() => { setLoadFailed(true) }}
            />
          </div>
        )
        : null}
      <span className="ttl-imgChip" data-testid="ttl-img-chip">
        <span>{label}</span>
        {meta}
      </span>
      {loadFailed
        ? (
          <span className="ttl-pill ttl-pillWarn" data-testid="ttl-img-failed">
            {t(lang, 'imageLoadFailed') as string}
          </span>
        )
        : null}
    </div>
  )
})

// ── The overlay (契约 §10.5.4) ───────────────────────────────────────────

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

/** Text of the active pane, used by ⌘C / Ctrl+C (契约 §10.5.4). */
function paneTextOf(step: TrailStep, tab: DetailTab): string {
  const args = step.args ?? ''
  if (tab !== 'result') return args
  const result = step.result
  if (result === undefined) return ''
  if (result.isError || result.kind === 'error' || step.kind === 'error') {
    const errorName = result.errorName ?? step.name
    const errorCode = result.errorCode ?? step.errorCode
    const headline = errorCode !== undefined ? `${errorName} · ${errorCode}` : errorName
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

/**
 * The full-size step viewer: a body-portal dialog with the current turn's
 * steps on the left, the selected step's 参数 / 结果 / 原始 panes on the
 * right, and the contract's keyboard model — Esc close, ↑/↓ step, ⌘F/Ctrl+F
 * search, ⌘C/Ctrl+C copy the pane, plus an export-JSON action.
 */
export function ZoomOverlay(props: ZoomOverlayProps): React.ReactPortal | null {
  const { steps, initialSeq, initialTab, sessionId, lang, onClose } = props
  const initial: TrailStep | null = steps.find((step) => step.seq === initialSeq) ?? steps[0] ?? null
  const [selectedSeq, setSelectedSeq] = React.useState(initialSeq)
  const [tab, setTab] = React.useState<DetailTab>(
    initialTab ?? (initial !== null && initial.result !== undefined ? 'result' : 'params'),
  )
  const [views, setViews] = React.useState<ReadonlyMap<number, ResultView>>(() => new Map<number, ResultView>())
  const [query, setQuery] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const searchRef = React.useRef<HTMLInputElement | null>(null)

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length === 0) return steps
    return steps.filter((step) => {
      const preview = step.kind === 'error' ? step.error : step.argsPreview
      return step.name.toLowerCase().includes(needle) || preview.toLowerCase().includes(needle)
    })
  }, [steps, query])

  /** Selected step: an outline row wins, then the first match, then any step. */
  const current: TrailStep | null = React.useMemo(() => {
    const inFiltered = filtered.find((step) => step.seq === selectedSeq)
    if (inFiltered !== undefined) return inFiltered
    if (filtered.length > 0) return filtered[0]
    return steps.find((step) => step.seq === selectedSeq) ?? steps[0] ?? null
  }, [filtered, steps, selectedSeq])

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
      return step.name.toLowerCase().includes(needle) || preview.toLowerCase().includes(needle)
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
  }, [current, tab])

  const exportCurrent = React.useCallback((): void => {
    if (current === null) return
    downloadJson(`trace-step-${current.seq}.json`, JSON.stringify(exportPayloadOf(current), null, 2))
  }, [current])

  // One window-level listener (capture) owns the whole keyboard model: the
  // dialog is a portal, so nothing above it in the React tree sees these keys.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // A value viewer opened from the params pane is a modal on top of this
      // one; it owns Esc / ⌘F / ⌘C until it closes (otherwise one Esc would
      // close both dialogs).
      if (typeof document !== 'undefined'
        && document.querySelector('[data-testid="ttl-value-viewer"]') !== null) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      const mod = event.metaKey || event.ctrlKey
      if (mod && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault()
        const input = searchRef.current
        if (input !== null) {
          input.focus()
          if (typeof input.select === 'function') input.select()
        }
        return
      }
      if (mod && (event.key === 'c' || event.key === 'C')) {
        // Never steal a copy the user aimed at an input or a live selection.
        const target = event.target as HTMLElement | null
        const tag = target !== null && typeof target.tagName === 'string' ? target.tagName.toUpperCase() : ''
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
  }, [copyPane, move, onClose])

  const renderPane = (): React.ReactElement | null => {
    if (current === null) return null
    if (tab === 'raw') return <RawText text={current.args ?? ''} />
    if (tab === 'params') {
      const args = current.args ?? ''
      const parsed = parseJsonLoose(args)
      if (parsed.ok) return <JsonPretty value={parsed.value} lang={lang} />
      return (
        <>
          <RawText text={args} />
          <div className="ttl-detailHint" data-testid="ttl-zoom-unparsable">
            {t(lang, 'resultUnparsable') as string}
          </div>
        </>
      )
    }
    const result = current.result
    if (result === undefined) {
      return <div className="ttl-detailHint" data-testid="ttl-zoom-empty">{t(lang, 'resultEmpty') as string}</div>
    }
    const images = result.images ?? []
    const isError = result.isError || result.kind === 'error' || current.kind === 'error'
    if (isError) {
      const errorName = result.errorName ?? current.name
      const errorCode = result.errorCode ?? current.errorCode
      return (
        <div className="ttl-errorBlock" data-testid="ttl-zoom-error">
          <div className="ttl-errorName" data-testid="ttl-zoom-error-name">
            {errorCode !== undefined ? `${errorName} · ${errorCode}` : errorName}
          </div>
          {result.text.length > 0 ? <RawText text={result.text} /> : null}
          {images.length > 0 ? <TrailImages images={images} sessionId={sessionId} lang={lang} /> : null}
        </div>
      )
    }
    if (result.text.length === 0 && images.length === 0) {
      return <div className="ttl-detailHint" data-testid="ttl-zoom-empty">{t(lang, 'resultEmpty') as string}</div>
    }
    const markdown = looksLikeMarkdown(result.text)
    const view = views.get(current.seq) ?? defaultViewForTool(current.name)
    return (
      <>
        {markdown && view === 'rendered'
          ? <MarkdownResult text={result.text} labels={markdownLabels(lang)} />
          : result.text.length > 0 ? <RawText text={result.text} /> : null}
        {markdown
          ? (
            <div className="ttl-detailHint">
              <button
                type="button"
                className="ttl-dtab"
                data-testid="ttl-zoom-view-toggle"
                aria-pressed={view === 'rendered'}
                onClick={() => {
                  setViews((map) => {
                    const next = new Map(map)
                    next.set(current.seq, view === 'rendered' ? 'raw' : 'rendered')
                    return next
                  })
                }}
              >{t(lang, view === 'rendered' ? 'detailSource' : 'detailRender') as string}</button>
            </div>
          )
          : null}
        {images.length > 0 ? <TrailImages images={images} sessionId={sessionId} lang={lang} /> : null}
      </>
    )
  }

  if (current === null || typeof document === 'undefined') return null
  const title = (t(lang, 'zoomTitle') as (name: string) => string)(current.name)
  const truncated = current.argsTruncated === true || current.result?.truncated === true

  const tabButton = (value: DetailTab, label: string): React.ReactElement => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      className={`ttl-dtab${tab === value ? ' ttl-dtabSelected' : ''}`}
      data-testid={`ttl-zoom-tab-${value}`}
      onClick={() => { setTab(value) }}
    >{label}</button>
  )

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
        <div className="ttl-zoomHead">
          <h2 className="ttl-zoomTitle" data-testid="ttl-zoom-title">{title}</h2>
          <div className="ttl-zoomTools" data-testid="ttl-zoom-tools">
            <input
              ref={searchRef}
              type="search"
              className="ttl-zoomSearch"
              data-testid="ttl-zoom-search"
              placeholder={t(lang, 'zoomSearch') as string}
              aria-label={t(lang, 'zoomSearch') as string}
              value={query}
              onChange={(event) => { onSearchChange(event.target.value) }}
            />
            <button type="button" data-testid="ttl-zoom-copy" onClick={copyPane}>
              {t(lang, copied ? 'copiedDone' : 'copyDetail') as string}
            </button>
            <button type="button" data-testid="ttl-zoom-export" onClick={exportCurrent}>
              {t(lang, 'zoomExport') as string}
            </button>
            <button type="button" data-testid="ttl-zoom-close" onClick={onClose}>
              {t(lang, 'zoomClose') as string}
            </button>
          </div>
        </div>
        <div className="ttl-zoomBody">
          <div className="ttl-zoomOutline" data-testid="ttl-zoom-outline">
            {filtered.length === 0
              ? <div className="ttl-detailHint" data-testid="ttl-zoom-nomatch">{t(lang, 'zoomNoMatch') as string}</div>
              : filtered.map((step) => {
                  const preview = step.kind === 'error' ? step.error : step.argsPreview
                  const tone = step.kind === 'error' || step.result?.isError === true ? 'red' : toolDotClass(step.name)
                  return (
                    <button
                      key={step.seq}
                      type="button"
                      className="ttl-zoomOutlineRow"
                      data-testid="ttl-zoom-step"
                      data-step-kind={step.kind}
                      aria-current={step.seq === current.seq ? 'true' : undefined}
                      title={preview}
                      onClick={() => { setSelectedSeq(step.seq) }}
                    >
                      <span className={`ttl-rowDot ttl-dot-${tone}`} aria-hidden="true" />
                      <span className="ttl-rowName ttl-rowNameMono">{step.name}</span>
                      <span className="ttl-rowArgs">{preview}</span>
                    </button>
                  )
                })}
          </div>
          <div className="ttl-zoomPane" data-testid="ttl-zoom-pane">
            <div className="ttl-zoomTabs" role="tablist" data-testid="ttl-zoom-tabs">
              {tabButton('params', t(lang, 'detailParams') as string)}
              {tabButton('result', t(lang, 'detailResult') as string)}
              {tabButton('raw', t(lang, 'detailRaw') as string)}
            </div>
            <div data-testid={`ttl-zoom-body-${tab}`}>{renderPane()}</div>
          </div>
        </div>
        <div className="ttl-zoomFoot" data-testid="ttl-zoom-foot">
          <span className="ttl-zoomKbd" data-testid="ttl-zoom-hint">{t(lang, 'zoomHint') as string}</span>
          <span data-testid="ttl-zoom-seq">{`seq #${current.seq}`}</span>
          <span
            className={`ttl-pill${truncated ? ' ttl-pillWarn' : ' ttl-pillOk'}`}
            data-testid="ttl-zoom-pill"
          >{t(lang, truncated ? 'truncatedPill' : 'fullPill') as string}</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
