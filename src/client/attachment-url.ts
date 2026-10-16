/**
 * attachment-url.ts — the session-authorized attachment URL (contract §10.3.3).
 *
 * The trail panel renders an image thumbnail with a plain `<img src>`; the host
 * route behind this URL reads the bytes ONLY when the session's own event log
 * carries an image block naming that attachmentId (§10.3.1), so the URL must
 * always carry BOTH ids. It is a same-origin relative path: the browser
 * resolves it against the page and `<img>`'s GET passes the plugin fence
 * (loopback Host, no Origin header).
 */

/** Structural twin of the host's image reference (both optional extras may be absent). */
export interface AttachmentRefLike {
  attachmentId: string
  mediaType: string
  bytes?: number
  width?: number
  height?: number
  name?: string
}

/** URL of the session-authorized attachment route; null when the ref/sessionId is unusable. */
export function attachmentUrl(sessionId: string | null | undefined, ref: AttachmentRefLike): string | null {
  if (typeof sessionId !== 'string' || sessionId.trim().length === 0) return null
  if (ref === null || typeof ref !== 'object') return null
  const attachmentId = ref.attachmentId
  if (typeof attachmentId !== 'string' || attachmentId.length === 0) return null
  return `/trace-inspect/api/attachment?sessionId=${encodeURIComponent(sessionId)}`
    + `&attachmentId=${encodeURIComponent(attachmentId)}`
}
