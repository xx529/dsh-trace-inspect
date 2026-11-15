/**
 * Shared Host HTTP helpers: the browser-trust fence and the small JSON
 * request/response utilities used by both Host entries.
 *
 * The fence is DNS-rebinding / cross-site defense, not authentication: the
 * Host must resolve to loopback, cross-site browser markers refuse, and an
 * Origin (when present) must name the same hostname. It mirrors DSH's own
 * /api gateway fence (api-request-trust + loopback-hostname).
 */
import type { HttpHeadersLike, HttpRequestLike, HttpResponseLike } from './context-types'
import { MAX_BODY_BYTES } from './wire'

/** Read one header case-insensitively enough for the Node facade. */
export function header(headers: HttpHeadersLike, name: string): string | undefined {
  const value = (headers as Record<string, unknown>)[name]
  return typeof value === 'string' ? value : undefined
}

function parseAuthority(authority: string): URL | undefined {
  try {
    return new URL(`http://${authority}`)
  } catch {
    return undefined
  }
}

/** Whether a hostname is a loopback literal accepted by the fence. */
export function isLoopbackHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  const parts = hostname.split('.')
  return parts.length === 4
    && parts[0] === '127'
    && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

/** Whether one request may reach a Host route. */
export function isTrustedApiRequest(request: { headers: HttpHeadersLike }): boolean {
  const host = header(request.headers, 'host')
  if (host === undefined) return false
  const hostUrl = parseAuthority(host)
  if (hostUrl === undefined || !isLoopbackHostname(hostUrl.hostname)) return false
  if (header(request.headers, 'sec-fetch-site') === 'cross-site') return false
  const origin = header(request.headers, 'origin')
  if (origin === undefined) return true
  try {
    return new URL(origin).hostname === hostUrl.hostname
  } catch {
    return false
  }
}

/** Write one JSON response (content-length + utf-8). */
export function sendJson(res: HttpResponseLike, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(Buffer.byteLength(text)),
  })
  res.end(text)
}

/** Sentinel for an oversized request body (mapped to 413). */
export const BODY_TOO_LARGE = Symbol('trail-body-too-large')

/** Read a bounded JSON object body; malformed input maps to `{}`. */
export async function readJsonBody(req: HttpRequestLike): Promise<Record<string, unknown> | typeof BODY_TOO_LARGE> {
  const declared = header(req.headers, 'content-length')
  if (declared !== undefined) {
    const declaredBytes = Number(declared)
    if (Number.isFinite(declaredBytes) && declaredBytes > MAX_BODY_BYTES) return BODY_TOO_LARGE
  }
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8')
    total += buf.length
    if (total > MAX_BODY_BYTES) return BODY_TOO_LARGE
    chunks.push(buf)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  try {
    const parsed = JSON.parse(text.length > 0 ? text : '{}')
    return parsed !== null && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}
