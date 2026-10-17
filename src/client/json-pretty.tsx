/**
 * json-pretty.tsx — formatted JSON, fully expanded.
 *
 * Replaces the collapsed tree for the detail band's 参数 pane: the owner asked
 * for "格式化的 json" that is fully expanded on open (the old tree showed `{3}`
 * and required clicking each level). Rendering is a syntax-colored `<pre>`; long
 * payloads are capped with a "show all" affordance so a 44 KB argument cannot
 * stall the sidebar.
 *
 * Colour classes are the existing `.ttl-jsonKey/.ttl-jsonStr/.ttl-jsonNum/
 * .ttl-jsonBool/.ttl-jsonNull` tokens, so light/dark themes keep working.
 */
import * as React from 'react'

export interface JsonPrettyProps {
  value: unknown
  /** Characters rendered before the "show all" affordance appears. */
  cap?: number
}

type TokenKind = 'key' | 'string' | 'number' | 'literal'

const TOKEN_PATTERN = /("(?:[^"\\]|\\.)*"\s*:)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g

const CLASS_OF: Record<TokenKind, string> = {
  key: 'ttl-jsonKey',
  string: 'ttl-jsonStr',
  number: 'ttl-jsonNum',
  literal: 'ttl-jsonBool',
}

/** Literal `null` gets its own class so the three JSON scalars stay distinct. */
function classOf(text: string, kind: TokenKind): string {
  if (kind === 'literal' && text === 'null') return 'ttl-jsonNull'
  return CLASS_OF[kind]
}

/** Split one JSON document into colored spans plus the untouched separators. */
function renderTokens(json: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let cursor = 0
  let key = 0
  TOKEN_PATTERN.lastIndex = 0
  for (let match = TOKEN_PATTERN.exec(json); match !== null; match = TOKEN_PATTERN.exec(json)) {
    if (match.index > cursor) nodes.push(json.slice(cursor, match.index))
    const text = match[0]
    const kind: TokenKind = match[1] !== undefined
      ? 'key'
      : match[2] !== undefined ? 'string' : match[3] !== undefined ? 'number' : 'literal'
    const trailing = kind === 'key' ? text.slice(text.lastIndexOf(':')) : ''
    const body = kind === 'key' ? text.slice(0, text.lastIndexOf(':')) : text
    nodes.push(React.createElement('span', { key: key += 1, className: classOf(body, kind) }, body))
    if (trailing.length > 0) nodes.push(trailing)
    cursor = match.index + text.length
  }
  if (cursor < json.length) nodes.push(json.slice(cursor))
  return nodes
}

/**
 * Pretty-printed, syntax-colored, fully-expanded JSON.
 * @param props - The parsed value and the render cap.
 * @returns A `<pre>` block; unparsable values fall back to `String(value)`.
 */
export function JsonPretty(props: JsonPrettyProps): React.ReactElement {
  const { value, cap = 200_000 } = props
  const json = React.useMemo(() => {
    try {
      return JSON.stringify(value, null, 2) ?? String(value)
    } catch {
      return String(value)
    }
  }, [value])
  const [expanded, setExpanded] = React.useState(false)
  const clipped = !expanded && json.length > cap
  const shown = clipped ? json.slice(0, cap) : json
  return (
    <div className="ttl-jsonPrettyWrap">
      <pre className="ttl-jsonPretty" data-testid="ttl-json-pretty">{renderTokens(shown)}</pre>
      {clipped
        ? (
          <button
            type="button"
            className="ttl-dtab ttl-jsonMore"
            data-testid="ttl-json-pretty-more"
            onClick={() => { setExpanded(true) }}
          >{`+${json.length - cap}`}</button>
        )
        : null}
    </div>
  )
}
