/**
 * ui-shared.tsx — view primitives shared by the shell, the inline detail band
 * and the full-size overlay: image blocks, clipboard, byte formatting and the
 * legacy semantic tone helper.
 *
 * Split out of ZoomOverlay (v0.9) so TrailTab / StepDetail / ZoomOverlay can
 * depend on these without importing the overlay itself (no import cycles).
 */
import * as React from 'react'
import { attachmentUrl } from './attachment-url'
import { t, type Lang } from './locales'
import type { TrailResultImage } from '../trail-model'

export type { ResultView, DetailTab } from './detail-types'

// ── Shared view primitives (TrailTab imports these) ──────────────────────

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

