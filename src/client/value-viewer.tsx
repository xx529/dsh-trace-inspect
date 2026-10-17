/**
 * value-viewer.tsx — the centered, single-value reader (v0.7.0, option C).
 *
 * A long tool argument (a 1–4 KB `bash` command, a file body, a JSON blob) is
 * unreadable inside a ~600 px sidebar: JSON escapes its newlines, so the whole
 * value is one clipped line. This dialog shows ONE value with
 *   - real newlines restored (the JSON `\n` escapes are already decoded by the
 *     time this component receives the string),
 *   - soft wrapping instead of horizontal scrolling,
 *   - per-logical-line numbers,
 *   - find-in-value highlighting and a copy of the *full* text,
 * and it is wide (up to 1080 px) so terminal output and heredocs read naturally.
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { copyToClipboard } from './ZoomOverlay'
import { t, type Lang } from './locales'

export interface ValueViewerProps {
  /** Field label shown in the header (`command`, `content`, `README.md`, …). */
  label: string
  /** The decoded value; newlines are rendered as real line breaks. */
  text: string
  lang: Lang
  onClose: () => void
}

/** Lines rendered at once; the copy button always copies the whole value. */
const RENDER_LINE_CAP = 4000

/** Split one line into text/highlight segments for the current query. */
function highlight(line: string, query: string): React.ReactNode {
  if (query.length === 0) return line
  const lower = line.toLowerCase()
  const needle = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let from = 0
  let key = 0
  for (let at = lower.indexOf(needle, from); at !== -1; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push(line.slice(from, at))
    parts.push(React.createElement('mark', { key: key += 1, className: 'ttl-valueHit' }, line.slice(at, at + query.length)))
    from = at + query.length
  }
  if (from < line.length) parts.push(line.slice(from))
  return parts.length === 0 ? line : parts
}

/**
 * Centered single-value reader.
 * @param props - Label, full text, language and close handler.
 * @returns A portal dialog, or null outside the browser.
 */
export function ValueViewer(props: ValueViewerProps): React.ReactPortal | null {
  const { label, text, lang, onClose } = props
  const [query, setQuery] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const searchRef = React.useRef<HTMLInputElement | null>(null)
  const returnFocusRef = React.useRef<Element | null>(null)

  const allLines = React.useMemo(() => {
    // Normalize CRLF so the line count and rendering agree everywhere.
    return text.replace(/\r\n?/g, '\n').split('\n')
  }, [text])
  const lines = allLines.length > RENDER_LINE_CAP ? allLines.slice(0, RENDER_LINE_CAP) : allLines
  const clipped = lines.length < allLines.length

  const hits = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length === 0) return 0
    let count = 0
    for (const line of allLines) {
      const lower = line.toLowerCase()
      for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, at + needle.length)) count += 1
    }
    return count
  }, [allLines, query])

  React.useEffect(() => {
    returnFocusRef.current = typeof document === 'undefined' ? null : document.activeElement
    const panel = panelRef.current
    if (panel !== null) panel.focus()
    return () => {
      const target = returnFocusRef.current
      if (target instanceof HTMLElement && target.isConnected !== false) target.focus()
    }
  }, [])

  const copy = React.useCallback((): void => {
    copyToClipboard(text)
    setCopied(true)
  }, [text])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
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
        const target = event.target as HTMLElement | null
        const tag = target !== null && typeof target.tagName === 'string' ? target.tagName.toUpperCase() : ''
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        if (typeof window.getSelection === 'function' && (window.getSelection()?.toString() ?? '').length > 0) return
        event.preventDefault()
        copy()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => { window.removeEventListener('keydown', onKeyDown, true) }
  }, [copy, onClose])

  if (typeof document === 'undefined') return null
  const meta = `${allLines.length} 行 · ${text.length} 字符`
  return createPortal(
    <div className="ttl-valueViewer" data-testid="ttl-value-viewer">
      <div className="ttl-valueBackdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="ttl-valuePanel"
        role="dialog"
        aria-modal="true"
        aria-label={(t(lang, 'valueViewerTitle') as (label: string) => string)(label)}
        tabIndex={-1}
        ref={panelRef}
        data-testid="ttl-value-panel"
      >
        <div className="ttl-valueHead">
          <span className="ttl-valueTitle" data-testid="ttl-value-title">
            <span className="ttl-valueName">{label}</span>
            <span className="ttl-valueMeta">{meta}</span>
          </span>
          <span className="ttl-valueTools">
            <input
              ref={searchRef}
              className="ttl-valueSearch"
              data-testid="ttl-value-search"
              type="search"
              value={query}
              placeholder={t(lang, 'valueSearch') as string}
              aria-label={t(lang, 'valueSearch') as string}
              onChange={(event) => { setQuery(event.target.value) }}
            />
            {query.trim().length > 0
              ? (
                <span className="ttl-valueHits" data-testid="ttl-value-hits">
                  {hits > 0
                    ? (t(lang, 'valueHits') as (n: number) => string)(hits)
                    : t(lang, 'valueNoHit') as string}
                </span>
              )
              : null}
            <button type="button" className="ttl-dtab" data-testid="ttl-value-copy" onClick={copy}>
              {t(lang, copied ? 'copiedDone' : 'copyDetail') as string}
            </button>
            <button type="button" className="ttl-dtab" data-testid="ttl-value-close" onClick={onClose}>
              {t(lang, 'zoomClose') as string}
            </button>
          </span>
        </div>
        <div className="ttl-valueBody" data-testid="ttl-value-body">
          {lines.map((line, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div className="ttl-valueLine" key={index}>
              <span className="ttl-valueLn" aria-hidden="true">{index + 1}</span>
              <span className="ttl-valueCode">{highlight(line, query.trim())}</span>
            </div>
          ))}
          {clipped
            ? (
              <div className="ttl-valueClipped" data-testid="ttl-value-clipped">
                {(t(lang, 'valueClipped') as (n: number) => string)(allLines.length - lines.length)}
              </div>
            )
            : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
