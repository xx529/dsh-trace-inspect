/**
 * tool-summary.ts — turn a tool call into a one-line, human summary.
 *
 * The folded row used to print the clipped raw JSON of the arguments
 * (`read {"file_path":"/…"}`). For the built-in tools the panel now prints
 * what the call actually means instead:
 *
 * | tool            | row                                            |
 * | --------------- | ---------------------------------------------- |
 * | `bash`          | `bash <the description arg>`                   |
 * | `read`          | `read package.json`                            |
 * | `write`/`edit`  | `write package.json` / `edit package.json`     |
 * | `glob`/`grep`   | `glob src/**\/*.ts` / `grep onProgress`        |
 * | `mcp__srv__t`   | `mcp:srv t {…}`                                |
 * | anything else   | the previous name + clipped raw arguments      |
 *
 * Everything here is pure so the mapping is unit-testable without React.
 */
import type { Lang } from './locales'

/** Semantic tint shared by the row dot and the row icon. */
export type ToolTone = 'success' | 'warn' | 'neutral' | 'blue' | 'violet' | 'red'

/** Glyph family drawn in front of a tool row (see `ToolIcon`). */
export type ToolIconKind =
  | 'terminal'
  | 'file-read'
  | 'file-write'
  | 'file-edit'
  | 'search'
  | 'folder'
  | 'mcp'
  | 'generic'

export interface ToolSummary {
  /** Mono label rendered in the name slot (`bash`, `read`, `mcp:playwright`, …). */
  label: string
  /** Compact human detail rendered in the argument slot. */
  detail: string
  /** Inline glyph family. */
  icon: ToolIconKind
}

/** Keys worth showing for tools we do not special-case. */
const FALLBACK_KEYS = ['description', 'command', 'file_path', 'path', 'pattern', 'query', 'url', 'prompt']

/** Hard cap for the summary text (the row is ~18px tall and ellipsized). */
const DETAIL_MAX = 120

/** Last path segment of a POSIX or Windows path; the input unchanged if none. */
export function fileBaseName(path: string): string {
  const trimmed = path.trim().replace(/[\\/]+$/, '')
  if (trimmed.length === 0) return path.trim()
  const at = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return at >= 0 ? trimmed.slice(at + 1) : trimmed
}

/** First non-empty line, trimmed. */
function firstLine(text: string): string {
  for (const line of text.split('\n')) {
    const value = line.trim()
    if (value.length > 0) return value
  }
  return ''
}

function clip(text: string, max: number = DETAIL_MAX): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

/** Parse the wire `arguments` string; `null` when it is not a JSON object. */
function parseArgs(raw: string | undefined): Record<string, unknown> | null {
  if (raw === undefined || raw.trim().length === 0) return null
  try {
    const value: unknown = JSON.parse(raw)
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** Read a string field, if present and non-empty. */
function str(args: Record<string, unknown> | null, key: string): string | undefined {
  if (args === null) return undefined
  const value = args[key]
  if (typeof value === 'string' && value.trim().length > 0) return value
  return undefined
}

/** `mcp__playwright__browser_click` → `{ server: 'playwright', tool: 'browser_click' }`. */
export function splitMcpName(name: string): { server: string; tool: string } | null {
  if (!name.startsWith('mcp__') && !name.startsWith('mcp_')) return null
  const parts = name.split('__')
  if (parts.length < 2 || parts[0] !== 'mcp') {
    const single = name.split('_')
    // Tolerate the single-underscore spelling (`mcp_server_tool`).
    if (single[0] !== 'mcp' || single.length < 3) return null
    return { server: single[1]!, tool: single.slice(2).join('_') }
  }
  const server = parts[1] ?? ''
  const tool = parts.slice(2).join('__')
  return server.length > 0 ? { server, tool } : null
}

/**
 * Summarize one tool call for the folded row.
 * @param name - Tool name exactly as the event reported it.
 * @param rawArgs - The wire `arguments` string (full text when available).
 * @param argsPreview - The clipped preview, used when `rawArgs` is absent/unparsable.
 * @param lang - Reserved for localized fallbacks (currently unused: tool names stay verbatim).
 * @returns Label/detail/icon for the row.
 */
export function summarizeToolCall(
  name: string,
  rawArgs: string | undefined,
  argsPreview: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lang?: Lang,
): ToolSummary {
  const args = parseArgs(rawArgs ?? argsPreview)
  const mcp = splitMcpName(name)

  if (mcp !== null) {
    const hasArgs = args !== null ? Object.keys(args).length > 0 : (rawArgs ?? argsPreview).trim().length > 0
    const tool = mcp.tool.length > 0 ? mcp.tool : ''
    return {
      label: `mcp:${mcp.server}`,
      detail: hasArgs ? `${tool} {…}`.trim() : tool,
      icon: 'mcp',
    }
  }

  switch (name) {
    case 'bash':
    case 'bash_output':
    case 'shell': {
      const description = str(args, 'description')
      const command = str(args, 'command')
      const detail = description !== undefined
        ? clip(description)
        : command !== undefined ? clip(firstLine(command)) : clip(firstLine(argsPreview))
      return { label: name, detail, icon: 'terminal' }
    }
    case 'read':
    case 'read_image':
    case 'write':
    case 'edit':
    case 'append': {
      const file = str(args, 'file_path') ?? str(args, 'path')
      const icon: ToolIconKind = name === 'read' || name === 'read_image'
        ? 'file-read'
        : name === 'write' || name === 'append' ? 'file-write' : 'file-edit'
      if (file !== undefined) return { label: name, detail: clip(fileBaseName(file)), icon }
      return { label: name, detail: clip(firstLine(argsPreview)), icon }
    }
    case 'glob':
    case 'grep':
    case 'search': {
      const pattern = str(args, 'pattern') ?? str(args, 'query')
      return { label: name, detail: pattern !== undefined ? clip(pattern) : clip(firstLine(argsPreview)), icon: 'search' }
    }
    case 'ls':
    case 'list_directory':
    case 'list_dir': {
      const path = str(args, 'path') ?? str(args, 'file_path')
      return { label: name, detail: path !== undefined ? clip(path) : clip(firstLine(argsPreview)), icon: 'folder' }
    }
    default:
      break
  }

  if (args !== null) {
    for (const key of FALLBACK_KEYS) {
      const value = str(args, key)
      if (value !== undefined) return { label: name, detail: clip(key === 'file_path' || key === 'path' ? fileBaseName(value) : firstLine(value)), icon: 'generic' }
    }
  }
  return { label: name, detail: clip(firstLine(argsPreview)), icon: 'generic' }
}
