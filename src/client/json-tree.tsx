/**
 * json-tree.tsx — a lazy, bounded JSON viewer for one tool call's arguments.
 *
 * Design notes (why it looks like this):
 *  - **Lazy**: a collapsed container renders ONE row and never builds its
 *    subtree, so a 5 MB argument object costs nothing until the reader opens a
 *    branch. Pagination (`pageSize`, default 50) additionally caps how many
 *    children one expanded container materializes at a time.
 *  - **Bounded**: `maxNodes` (default 2000) is checked BEFORE the tree renders
 *    by counting nodes with an early abort, so an oversized payload cannot
 *    produce thousands of rows. Over the limit the tree degrades to the
 *    `jsonTooLarge` notice instead of rendering (契约 §4.2).
 *  - **Cycle-safe**: every rendered object joins a `WeakSet` that lives for
 *    exactly one render pass (a `WeakSet` cannot be cloned, so per-pass fresh +
 *    add-only is what makes it correct under React's deferred child rendering:
 *    children run after the parent returns, so a mutated-and-restored set would
 *    already be empty by then). Parsed JSON is a tree, so a repeat inside one
 *    pass means a cycle and renders `[Circular]`; a hand-built graph that
 *    shares a subtree reads as `[Circular]` on its later branch — the safe
 *    direction for a renderer that must terminate.
 *  - **State owned by the root**: open/pagination state lives in `JsonTree`
 *    (keyed by node path), so every toggle re-renders the whole tree and starts
 *    a fresh cycle pass. A persistent per-node `WeakSet` would mark a container
 *    as its own cycle the moment it re-rendered.
 *  - **Untrusted text**: every value goes through React children (escaped by
 *    React). No `innerHTML`, no `dangerouslySetInnerHTML`, no `eval`; long
 *    strings render inside a scrollable box with an explicit copy action that
 *    silently no-ops when the clipboard API is absent.
 */
import * as React from 'react'
import { detectLang, t, type Lang } from './locales'

/** Props of {@link JsonTree}. */
export interface JsonTreeProps {
  /** Parsed value to display. */
  value: unknown
  /** Maximum nesting depth rendered; a container at the limit shows `…`. */
  maxDepth?: number
  /** Children materialized per "page" of an expanded container. */
  pageSize?: number
  /** Node budget for the whole value; above it the tree is not rendered. */
  maxNodes?: number
}

/** Result of {@link parseJsonLoose}. */
export type JsonParseResult = { ok: true; value: unknown } | { ok: false }

/** Strings longer than this collapse into a scrollable `.ttl-strbox`. */
const STRING_BOX_CHARS = 240
const DEFAULT_MAX_DEPTH = 32
const DEFAULT_PAGE_SIZE = 50
const DEFAULT_MAX_NODES = 2000
/** Path of the root node; children append `PATH_SEP + key`. */
const ROOT_PATH = 'root'
const PATH_SEP = '\u001f'

/**
 * Parse tool arguments defensively (契约 §4.2): strict JSON first, then the
 * two shapes a `tool/call` payload realistically wears — a fenced ```json
 * block, and a trailing comma before the closing bracket.
 * @param text - Raw argument text.
 * @returns `{ ok: true, value }` on success, `{ ok: false }` otherwise.
 */
export function parseJsonLoose(text: string): JsonParseResult {
  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (trimmed.length === 0) return { ok: false }
  const direct = tryJson(trimmed)
  if (direct.ok) return direct
  const fenced = stripFence(trimmed)
  if (fenced !== null) {
    const parsed = tryJson(fenced)
    if (parsed.ok) return parsed
  }
  const loosened = trimmed.replace(/,\s*([}\]])/g, '$1')
  if (loosened !== trimmed) {
    const parsed = tryJson(loosened)
    if (parsed.ok) return parsed
  }
  return { ok: false }
}

function tryJson(text: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch {
    return { ok: false }
  }
}

/** Unwrap a fenced code block (closed or truncated) around JSON. */
function stripFence(text: string): string | null {
  const closed = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(text)
  if (closed !== null) return (closed[1] ?? '').trim()
  if (!text.startsWith('```')) return null
  const firstBreak = text.indexOf('\n')
  return firstBreak === -1 ? null : text.slice(firstBreak + 1).trim()
}

/**
 * Count nodes the tree would render, aborting as soon as the budget is
 * exceeded so the precheck itself stays O(maxNodes).
 * @param value - Root value.
 * @param limit - Node budget.
 * @param maxDepth - Depth cap used by the renderer.
 * @returns Node count, saturating just above `limit`.
 */
function countNodes(value: unknown, limit: number, maxDepth: number): number {
  const ancestors = new WeakSet<object>()
  let count = 0
  const walk = (node: unknown, depth: number): void => {
    count += 1
    if (count > limit) return
    if (node === null || typeof node !== 'object') return
    if (depth >= maxDepth) return
    if (ancestors.has(node)) return
    ancestors.add(node)
    const children: unknown[] = Array.isArray(node)
      ? (node as unknown[])
      : Object.values(node as Record<string, unknown>)
    for (const child of children) {
      walk(child, depth + 1)
      if (count > limit) return
    }
    ancestors.delete(node)
  }
  walk(value, 0)
  return count
}

/** Copy through the optional clipboard API; silently give up when absent. */
function copyText(text: string): void {
  if (typeof navigator === 'undefined') return
  const clipboard = navigator.clipboard
  if (clipboard === undefined || typeof clipboard.writeText !== 'function') return
  try {
    const pending: unknown = clipboard.writeText(text)
    if (pending !== null && typeof pending === 'object' && typeof (pending as Promise<void>).catch === 'function') {
      void (pending as Promise<void>).catch(() => undefined)
    }
  } catch {
    // Clipboard denied: the value is still selectable on screen.
  }
}

/**
 * Render one JSON value as a collapsible tree.
 * @param props - Value plus the depth/page/node bounds.
 * @returns The tree, or a `jsonTooLarge` notice when the node budget is blown.
 */
export function JsonTree(props: JsonTreeProps): React.ReactElement {
  const {
    value,
    maxDepth = DEFAULT_MAX_DEPTH,
    pageSize = DEFAULT_PAGE_SIZE,
    maxNodes = DEFAULT_MAX_NODES,
  } = props
  const lang = detectLang()
  const capped = React.useMemo(
    () => countNodes(value, maxNodes, maxDepth) > maxNodes,
    [value, maxNodes, maxDepth],
  )
  const [openPaths, setOpenPaths] = React.useState<ReadonlySet<string>>(
    () => new Set<string>([ROOT_PATH]),
  )
  const [pageCounts, setPageCounts] = React.useState<ReadonlyMap<string, number>>(
    () => new Map<string, number>(),
  )
  const onToggle = React.useCallback((path: string, open: boolean): void => {
    setOpenPaths((current) => {
      if (current.has(path) === open) return current
      const next = new Set(current)
      if (open) next.add(path)
      else next.delete(path)
      return next
    })
  }, [])
  const onMore = React.useCallback((path: string): void => {
    setPageCounts((current) => {
      const next = new Map(current)
      next.set(path, (next.get(path) ?? 1) + 1)
      return next
    })
  }, [])

  return (
    <div className="ttl-json" data-testid="ttl-json">
      {capped
        ? <div className="ttl-jsonCapped" data-testid="ttl-json-capped">{t(lang, 'jsonTooLarge') as string}</div>
        : (
          <JsonNode
            value={value}
            keyName={null}
            path={ROOT_PATH}
            depth={0}
            maxDepth={maxDepth}
            pageSize={pageSize}
            lang={lang}
            seen={new WeakSet<object>()}
            openPaths={openPaths}
            pageCounts={pageCounts}
            onToggle={onToggle}
            onMore={onMore}
          />
        )}
    </div>
  )
}

interface JsonNodeProps {
  value: unknown
  keyName: string | null
  /** Stable path used as the open/pagination state key. */
  path: string
  depth: number
  maxDepth: number
  pageSize: number
  lang: Lang
  /** Objects rendered in this pass (cycle guard); fresh per render pass. */
  seen: WeakSet<object>
  openPaths: ReadonlySet<string>
  pageCounts: ReadonlyMap<string, number>
  onToggle: (path: string, open: boolean) => void
  onMore: (path: string) => void
}

function JsonNode(props: JsonNodeProps): React.ReactElement {
  const {
    value, keyName, path, depth, maxDepth, pageSize, lang, seen, openPaths, pageCounts, onToggle, onMore,
  } = props
  const keyEl = keyName === null ? null : <span className="ttl-jsonKey">{keyName}</span>

  if (value === null) {
    return <div className="ttl-jsonRow">{keyEl}<span className="ttl-jsonNull">null</span></div>
  }
  if (typeof value === 'boolean') {
    return <div className="ttl-jsonRow">{keyEl}<span className="ttl-jsonBool">{String(value)}</span></div>
  }
  if (typeof value === 'number') {
    return <div className="ttl-jsonRow">{keyEl}<span className="ttl-jsonNum">{String(value)}</span></div>
  }
  if (typeof value === 'string') {
    if (value.length > STRING_BOX_CHARS) {
      return <StringNode keyName={keyName} text={value} lang={lang} />
    }
    return <div className="ttl-jsonRow">{keyEl}<span className="ttl-jsonStr">{value}</span></div>
  }
  if (typeof value !== 'object') {
    return <div className="ttl-jsonRow">{keyEl}<span className="ttl-jsonNull">{String(value)}</span></div>
  }
  // Depth cap: keep the row (the reader sees the key) but never its subtree.
  if (depth >= maxDepth) {
    return <div className="ttl-jsonRow">{keyEl}<span className="ttl-jsonMore">…</span></div>
  }

  // Cycle check BEFORE the open check: a value that is one of its own
  // ancestors reads as `[Circular]` even while collapsed (expanding it could
  // only loop). Only expanded containers register in `seen`, so a merely
  // collapsed container is never mistaken for a cycle.
  if (seen.has(value)) {
    return <div className="ttl-jsonRow">{keyEl}<span className="ttl-jsonNull">[Circular]</span></div>
  }

  if (!openPaths.has(path)) {
    const count = Array.isArray(value)
      ? (value as unknown[]).length
      : Object.keys(value as Record<string, unknown>).length
    return (
      <div className="ttl-jsonRow">
        <button
          type="button"
          className="ttl-jsonToggle"
          data-testid="ttl-json-toggle"
          aria-expanded={false}
          onClick={() => onToggle(path, true)}
        >▸</button>
        {keyEl}
        <span className="ttl-jsonPreview">{Array.isArray(value) ? `[${count}]` : `{${count}}`}</span>
      </div>
    )
  }

  const entries: Array<[string, unknown]> = Array.isArray(value)
    ? (value as unknown[]).map((item, index) => [String(index), item] as [string, unknown])
    : Object.entries(value as Record<string, unknown>)
  const pages = pageCounts.get(path) ?? 1
  const shown = entries.slice(0, pageSize * pages)
  const hasMore = entries.length > shown.length
  const summary = Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`
  // Register BEFORE building child elements: children render after this
  // function returns, so registering here is what makes a self-reference
  // resolve to `[Circular]` instead of recursing.
  seen.add(value)

  return (
    <>
      <div className="ttl-jsonRow">
        <button
          type="button"
          className="ttl-jsonToggle"
          data-testid="ttl-json-toggle"
          aria-expanded
          onClick={() => onToggle(path, false)}
        >▾</button>
        {keyEl}
        <span className="ttl-jsonPreview">{summary}</span>
      </div>
      <div className="ttl-jsonChildren">
        {shown.map(([childKey, childValue]) => (
          <JsonNode
            key={childKey}
            value={childValue}
            keyName={childKey}
            path={`${path}${PATH_SEP}${childKey}`}
            depth={depth + 1}
            maxDepth={maxDepth}
            pageSize={pageSize}
            lang={lang}
            seen={seen}
            openPaths={openPaths}
            pageCounts={pageCounts}
            onToggle={onToggle}
            onMore={onMore}
          />
        ))}
        {hasMore
          ? (
            <button
              type="button"
              className="ttl-jsonMore"
              data-testid="ttl-json-more"
              onClick={() => onMore(path)}
            >{t(lang, 'loadMore') as string}</button>
          )
          : null}
      </div>
    </>
  )
}

/** A long string, rendered in a scrollable box with its own copy action. */
function StringNode(props: { keyName: string | null; text: string; lang: Lang }): React.ReactElement {
  const { keyName, text, lang } = props
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="ttl-jsonRow">
      {keyName === null ? null : <span className="ttl-jsonKey">{keyName}</span>}
      <div className="ttl-strbox" data-testid="ttl-strbox">
        <button
          type="button"
          className="ttl-strboxCopy"
          data-testid="ttl-strbox-copy"
          onClick={() => {
            copyText(text)
            setCopied(true)
          }}
        >{t(lang, copied ? 'copiedDone' : 'copyField') as string}</button>
        <span className="ttl-jsonStr">{text}</span>
      </div>
    </div>
  )
}
