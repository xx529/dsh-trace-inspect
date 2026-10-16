/**
 * attachment-url.spec.ts — T7 contract §10.3.3:
 * `attachmentUrl(sessionId, ref)` builds the session-authorized attachment URL
 * (an `<img src>` target), or null when either id is unusable.
 */
import { describe, expect, it } from 'vitest'
import { attachmentUrl, type AttachmentRefLike } from '../src/client/attachment-url'

const ref = (attachmentId: string, extra: Partial<AttachmentRefLike> = {}): AttachmentRefLike => ({
  attachmentId,
  mediaType: 'image/png',
  bytes: 2048,
  width: 4,
  height: 3,
  ...extra,
})

describe('attachmentUrl', () => {
  it('builds the relative session-authorized route with both ids', () => {
    expect(attachmentUrl('sess-1', ref('sha256:aa'))).toBe(
      '/trace-inspect/api/attachment?sessionId=sess-1&attachmentId=sha256%3Aaa',
    )
  })

  it('percent-encodes both ids', () => {
    expect(attachmentUrl('sess/1 2', ref('sha256:aa/bb+cc?d=1&e=2'))).toBe(
      '/trace-inspect/api/attachment?sessionId=sess%2F1%202&attachmentId=sha256%3Aaa%2Fbb%2Bcc%3Fd%3D1%26e%3D2',
    )
  })

  it('returns null when the sessionId is missing, empty or blank', () => {
    expect(attachmentUrl(null, ref('sha256:aa'))).toBeNull()
    expect(attachmentUrl(undefined, ref('sha256:aa'))).toBeNull()
    expect(attachmentUrl('', ref('sha256:aa'))).toBeNull()
    expect(attachmentUrl('   ', ref('sha256:aa'))).toBeNull()
    expect(attachmentUrl('\t\n', ref('sha256:aa'))).toBeNull()
  })

  it('returns null when the attachmentId is missing or empty', () => {
    expect(attachmentUrl('sess-1', ref(''))).toBeNull()
    expect(attachmentUrl('sess-1', { attachmentId: undefined as unknown as string, mediaType: 'image/png' })).toBeNull()
    expect(attachmentUrl('sess-1', { attachmentId: 'x', mediaType: '' })).toBe(
      '/trace-inspect/api/attachment?sessionId=sess-1&attachmentId=x',
    )
    expect(attachmentUrl('sess-1', null as unknown as AttachmentRefLike)).toBeNull()
  })

  it('ignores mediaType / bytes / dimensions (only the ids ride in the URL)', () => {
    const bare = attachmentUrl('sess-1', { attachmentId: 'sha256:aa', mediaType: '' })
    expect(bare).toBe('/trace-inspect/api/attachment?sessionId=sess-1&attachmentId=sha256%3Aaa')
    expect(bare).toBe(attachmentUrl('sess-1', ref('sha256:aa')))
  })

  it('is usable as an <img src>: the host route parses the encoded ids back', () => {
    const url = attachmentUrl('sess/1', ref('sha256:aa/bb+cc'))
    expect(url).not.toBeNull()
    const parsed = new URL(url as string, 'http://127.0.0.1:19487')
    expect(parsed.pathname).toBe('/trace-inspect/api/attachment')
    expect(parsed.searchParams.get('sessionId')).toBe('sess/1')
    expect(parsed.searchParams.get('attachmentId')).toBe('sha256:aa/bb+cc')
  })

  it('sticks to the frozen route path', () => {
    const url = attachmentUrl('s', ref('a'))
    expect(url?.startsWith('/trace-inspect/api/attachment?')).toBe(true)
  })
})
