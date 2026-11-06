/**
 * command-format.ts — split a shell command into display segments + syntax
 * tokens for the v0.9 detail band (契约 §3.3).
 *
 * The old detail band printed `args.command` as one clipped line, so a 249
 * character `cd … && git tag … && git push … | tail -3` could only be read by
 * scrolling sideways inside a 400 px sidebar. The redesign renders the command
 * as a small, soft-wrapped script: one row per command segment (split on
 * `&&` / `;` / top-level newline), with the connector, pipes (`|` / `||`),
 * flags, quoted strings, paths, commit hashes and redirects tinted by token
 * class.
 *
 * Everything here is pure and DOM-free so the heuristics stay unit-testable:
 * `splitCommand` returns the segments, `commandStats` the footer counters.
 *
 * Deliberate limits: this is a display heuristic, not a shell parser. It
 * understands single/double quoting, the `&&` / `;` / newline segment
 * boundaries, the `|` / `||` pipe tokens and the common redirection forms
 * (`>`, `>>`, `<`, `2>&1`, `&>`); anything else degrades to a plain `sub`
 * token, so the command text is never hidden or reordered.
 */

/** Syntax class of one displayed word (rendered as `ttl-tok-<kind>`). */
export type CommandTokenKind = 'cmd' | 'sub' | 'flag' | 'str' | 'path' | 'hash' | 'op' | 'muted'

/** One display word of a command segment. */
export interface CommandToken {
  /** Verbatim token text (quotes included for `str`). */
  text: string
  kind: CommandTokenKind
}

/**
 * Connector that introduced a segment; `null` for the first segment (and for
 * a segment started by a newline). Splitting only ever produces `&&` and `;`;
 * `|` / `||` stay inside a segment as `op` tokens, and remain in the union for
 * interface stability.
 */
export type CommandConnector = '&&' | ';' | '|' | '||'

/** One command segment, rendered as one gutter-numbered line. */
export interface CommandSegment {
  /**
   * The `&&` / `;` that separated this segment from the previous one, or
   * `null` for the first one (and for a segment started by a newline). The
   * renderer draws it at the END of the PREVIOUS line (v0.10.7) so every line
   * begins with a command word; it is NOT repeated inside `tokens`, whose first
   * entry is always the `cmd` word when the segment has any.
   */
  connector: CommandConnector | null
  tokens: CommandToken[]
}

/** 40 hex characters — a git object id / commit hash. */
const HASH = /^[0-9a-fA-F]{40}$/

/**
 * Redirection word: `>`, `>>`, `<`, `2>`, `2>>`, `&>`, `&>>`, `2>&1`, `>&2`,
 * `2>&-`, `1>&2` … (never the funky `1>/dev/null` form, which classifies as
 * plain/path text instead — safe, it stays visible).
 */
const REDIRECT = /^(?:&>>?|(?:\d+)?(?:>>?|<)(?:&\d+|\d+|-)?)$/

/** A bare connector word (defensive: connectors are split out already). */
const OPERATOR_WORD = /^(?:&&|\|\||\||;)$/

/** Single or double quoted word (quote characters included in `text`). */
const QUOTED = /^["']/

/** Is this word classified as a path-like argument? (`/a/b`, `./x`, `a/b`) */
function isPathWord(word: string): boolean {
  return word.includes('/') || word.includes('\\')
}

/**
 * Match a segment-splitting connector at `index`. Pipes are deliberately NOT
 * split: `git push … 2>&1 | tail -3` reads better on one soft-wrapped row
 * (03 帧), so `|` / `||` stay inside the segment as `op` tokens.
 * @param text - Command text being scanned.
 * @param index - Current offset.
 * @returns `&&` / `;`, or `null` when the character is not a segment boundary.
 */
function operatorAt(text: string, index: number): '&&' | ';' | null {
  if (text.startsWith('&&', index)) return '&&'
  return text[index] === ';' ? ';' : null
}

/**
 * Classify one scanned word.
 * @param word - Word text, quotes included when quoted.
 * @param first - Whether this is the first word of its segment.
 * @returns The token kind used for coloring.
 */
function classifyWord(word: string, first: boolean): CommandTokenKind {
  // The first word is the command by contract, even when it is a path
  // (`./deploy.sh` is far more readable tinted as the command).
  if (first) return 'cmd'
  if (HASH.test(word)) return 'hash'
  if (REDIRECT.test(word)) return 'muted'
  // A trailing shell comment: `cmd # note`.
  if (word.startsWith('#')) return 'muted'
  if (word.length > 1 && word.startsWith('-')) return 'flag'
  if (QUOTED.test(word)) return 'str'
  if (OPERATOR_WORD.test(word)) return 'op'
  if (isPathWord(word)) return 'path'
  return 'sub'
}

/**
 * Normalize a command string before scanning: join explicit line
 * continuations (`\` + newline) and unify newlines.
 * @param command - Wire command text.
 * @returns Text with no continuation backslashes.
 */
function normalizeCommand(command: string): string {
  return command.replace(/\\\r?\n/g, ' ').replace(/\r\n?/g, '\n')
}

/**
 * Split one shell command into display segments.
 *
 * Scanning is quote-aware: a connector inside `"…"` / `'…'` is literal text,
 * and the quoted run (spaces included) stays one `str` token. Segments are
 * split on `&&`, `;` and top-level newlines; `&&` / `;` are exposed as
 * `connector` on the segment they introduce (a leading operator carries no
 * meaning and is dropped). `|` / `||` are NOT separators — they land inside
 * `tokens` as `op` words, so a pipeline stays on one wrapped row.
 *
 * @param command - `args.command` as delivered by the wire.
 * @returns Segments in command order; `[]` for an empty/blank command.
 */
export function splitCommand(command: string): CommandSegment[] {
  if (typeof command !== 'string') return []
  const text = normalizeCommand(command)
  if (text.trim().length === 0) return []

  const segments: CommandSegment[] = []
  let tokens: CommandToken[] = []
  let word = ''
  let quote: '"' | '\'' | null = null
  let connector: CommandConnector | null = null

  const flushWord = (): void => {
    if (word.length === 0) return
    tokens.push({ text: word, kind: classifyWord(word, tokens.length === 0) })
    word = ''
  }

  let index = 0
  while (index < text.length) {
    const ch = text[index] as string
    if (quote !== null) {
      word += ch
      if (ch === quote) quote = null
      index += 1
      continue
    }
    if (ch === '"' || ch === '\'') {
      quote = ch
      word += ch
      index += 1
      continue
    }
    const op = operatorAt(text, index)
    if (op !== null) {
      flushWord()
      if (tokens.length > 0) {
        segments.push({ connector, tokens })
        tokens = []
        connector = op
      } else if (segments.length === 0) {
        // Leading connector (`&& cmd`): render the segment without one.
        connector = null
      } else if (connector === null) {
        // `cmd\n&& next`: the newline closed the previous segment; this
        // operator still leads the upcoming one.
        connector = op
      }
      index += op.length
      continue
    }
    if (ch === '\n') {
      // A top-level newline is a segment boundary without an operator.
      flushWord()
      if (tokens.length > 0) {
        segments.push({ connector, tokens })
        tokens = []
        connector = null
      } else if (segments.length === 0) {
        connector = null
      }
      index += 1
      continue
    }
    if (ch === ' ' || ch === '\t') {
      flushWord()
      index += 1
      continue
    }
    word += ch
    index += 1
  }
  flushWord()
  if (tokens.length > 0) segments.push({ connector, tokens })
  return segments
}

/**
 * Footer counters of the command block (`4 段 · 249 字符`).
 * @param command - Raw `args.command`.
 * @returns Segment count plus the trimmed raw character count (`0`/`0` when blank).
 */
export function commandStats(command: string): { segments: number; chars: number } {
  if (typeof command !== 'string') return { segments: 0, chars: 0 }
  return { segments: splitCommand(command).length, chars: command.trim().length }
}
