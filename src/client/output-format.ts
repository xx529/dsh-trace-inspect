/**
 * output-format.ts — heuristic classifier for tool result text.
 *
 * Tool results are mostly JSON, JSONL or Markdown; the panel used to show the
 * raw string for everything. The detector is deliberately conservative and
 * ordered by specificity:
 *
 *   1. JSON    — the whole trimmed text parses as an object/array;
 *   2. JSONL   — two or more non-empty lines, each parsing as JSON;
 *   3. Markdown — the existing structural Markdown test;
 *   4. text    — raw fallback (ANSI logs, diffs, stack traces, …).
 *
 * Pure functions only: no DOM, no React, so the heuristics are unit-testable.
 */
import { looksLikeMarkdown } from './markdown-result'

export type OutputKind = 'json' | 'jsonl' | 'markdown' | 'text'

/** Only whole-document JSON is formatted — mixed logs stay raw. */
export function parseJsonValue(text: string): unknown | null {
  const trimmed = text.trim()
  if (trimmed.length === 0 || trimmed.length > 512 * 1024) return null
  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  const bracketed = (first === '{' && last === '}') || (first === '[' && last === ']')
  if (!bracketed) return null
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return null
  }
}

/** Parse a newline-delimited JSON stream; null unless EVERY line is JSON. */
export function parseJsonLines(text: string): unknown[] | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0)
  if (lines.length < 2 || lines.length > 5000) return null
  const values: unknown[] = []
  for (const line of lines) {
    const first = line[0]
    const last = line[line.length - 1]
    if (!((first === '{' && last === '}') || (first === '[' && last === ']'))) return null
    try {
      values.push(JSON.parse(line) as unknown)
    } catch {
      return null
    }
  }
  return values
}

/** Pick the rendering for one tool result body. */
export function detectOutputKind(text: string): OutputKind {
  if (text.trim().length === 0) return 'text'
  if (parseJsonValue(text) !== null) return 'json'
  if (parseJsonLines(text) !== null) return 'jsonl'
  if (looksLikeMarkdown(text)) return 'markdown'
  return 'text'
}

/** Pretty-print a JSON/JSONL result as text (used by the clamped preview). */
export function prettyJsonText(text: string): string | null {
  if (text.length > 48 * 1024) return null
  const value = parseJsonValue(text)
  if (value !== null) return JSON.stringify(value, null, 2)
  const lines = parseJsonLines(text)
  if (lines !== null) return lines.map((line) => JSON.stringify(line, null, 2)).join('\n')
  return null
}
