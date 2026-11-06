/**
 * output-format.spec.ts — heuristics for tool-result rendering.
 *
 * Order matters: whole-document JSON wins over JSONL, JSONL wins over
 * Markdown, everything else stays raw. The detector is conservative on
 * purpose — mixed logs and ANSI output must never be reformatted.
 */
import { describe, expect, it } from 'vitest'
import {
  detectOutputKind,
  parseJsonLines,
  parseJsonValue,
  prettyJsonText,
} from '../src/client/output-format'

describe('output-format', () => {
  it('detects whole-document JSON objects and arrays', () => {
    expect(detectOutputKind('{"previousStatus":"running"}')).toBe('json')
    expect(detectOutputKind('  [1, 2, {"a": true}]  ')).toBe('json')
    expect(parseJsonValue('{"a":1}')).toEqual({ a: 1 })
    expect(parseJsonValue('[1,2]')).toEqual([1, 2])
  })

  it('rejects JSON-looking text that does not parse', () => {
    expect(parseJsonValue('{not json}')).toBeNull()
    expect(parseJsonValue('{"a":1} trailing')).toBeNull()
    expect(detectOutputKind('echo {"a":1}')).toBe('text')
  })

  it('detects newline-delimited JSON only when every line parses', () => {
    expect(detectOutputKind('{"a":1}\n{"b":2}')).toBe('jsonl')
    expect(parseJsonLines('{"a":1}\n[1,2]')).toEqual([{ a: 1 }, [1, 2]])
    expect(parseJsonLines('{"a":1}\nnot json')).toBeNull()
    expect(detectOutputKind('{"a":1}\nlog line')).toBe('text')
  })

  it('falls through to Markdown, then text', () => {
    expect(detectOutputKind('# Title\n\n- one\n- two')).toBe('markdown')
    expect(detectOutputKind('## only heading')).toBe('markdown')
    expect(detectOutputKind('plain log line\nsecond line')).toBe('text')
    expect(detectOutputKind('diff --git a/x b/x\n@@ -1 +1 @@')).toBe('text')
    expect(detectOutputKind('')).toBe('text')
  })

  it('pretty-prints JSON and JSONL for the clamped preview', () => {
    expect(prettyJsonText('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(prettyJsonText('{"a":1}\n{"b":2}')).toBe('{\n  "a": 1\n}\n{\n  "b": 2\n}')
    expect(prettyJsonText('plain')).toBeNull()
    expect(prettyJsonText(JSON.stringify({ big: 'x'.repeat(50 * 1024) }))).toBeNull()
  })
})
