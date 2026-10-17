/**
 * tool-summary.spec.ts — the folded row's semantic one-liner (v0.6.0).
 *
 * Owner requirement: known built-in tools should read as what they mean
 * (`bash <description>`, `read <file>`, `mcp:<server> {…}`) instead of the raw
 * clipped JSON. These cases pin that mapping; the panel test only checks that
 * the row renders the summary.
 */
import { describe, expect, it } from 'vitest'
import { fileBaseName, splitMcpName, summarizeToolCall } from '../src/client/tool-summary'

describe('tool-summary — known tools', () => {
  it('bash shows the description argument', () => {
    const summary = summarizeToolCall(
      'bash',
      JSON.stringify({ command: 'npm test -- --run', description: 'Run the unit suite' }),
      '…',
    )
    expect(summary).toEqual({ label: 'bash', detail: 'Run the unit suite', icon: 'terminal' })
  })

  it('bash falls back to the first line of the command when there is no description', () => {
    const summary = summarizeToolCall('bash', JSON.stringify({ command: 'npm test\nnpm lint' }), '…')
    expect(summary.detail).toBe('npm test')
    expect(summary.icon).toBe('terminal')
  })

  it('bash falls back to the preview when the arguments are not JSON', () => {
    expect(summarizeToolCall('bash', 'npm test', 'npm test').detail).toBe('npm test')
  })

  it('read/write/edit show the file name only', () => {
    const read = summarizeToolCall('read', JSON.stringify({ file_path: '/Users/me/project/package.json' }), '…')
    expect(read).toEqual({ label: 'read', detail: 'package.json', icon: 'file-read' })
    const write = summarizeToolCall('write', JSON.stringify({ file_path: '/tmp/out/report.md' }), '…')
    expect(write).toEqual({ label: 'write', detail: 'report.md', icon: 'file-write' })
    const edit = summarizeToolCall('edit', JSON.stringify({ file_path: 'src/client/TrailTab.tsx', old_string: 'a', new_string: 'b' }), '…')
    expect(edit).toEqual({ label: 'edit', detail: 'TrailTab.tsx', icon: 'file-edit' })
  })

  it('glob/grep show the pattern; directory tools show the path', () => {
    expect(summarizeToolCall('glob', JSON.stringify({ pattern: 'src/**/*.tsx' }), '…').detail).toBe('src/**/*.tsx')
    expect(summarizeToolCall('grep', JSON.stringify({ pattern: 'onProgress' }), '…').icon).toBe('search')
    expect(summarizeToolCall('ls', JSON.stringify({ path: '/tmp/x' }), '…')).toEqual({ label: 'ls', detail: '/tmp/x', icon: 'folder' })
  })

  it('mcp tools collapse to mcp:<server> plus the tool name and an args marker', () => {
    const summary = summarizeToolCall(
      'mcp__playwright__browser_click',
      JSON.stringify({ element: 'Save button', ref: 'e42' }),
      '…',
    )
    expect(summary).toEqual({ label: 'mcp:playwright', detail: 'browser_click {…}', icon: 'mcp' })
  })

  it('mcp tools without arguments show just the tool name', () => {
    expect(summarizeToolCall('mcp__deepwiki__read_wiki_structure', '', '').detail).toBe('read_wiki_structure')
  })

  it('unknown tools keep the clipped preview and the generic glyph', () => {
    const summary = summarizeToolCall('some_custom_tool', undefined, '{"x":1}')
    expect(summary.label).toBe('some_custom_tool')
    expect(summary.icon).toBe('generic')
    expect(summary.detail).toBe('{"x":1}')
  })

  it('unknown tools with object arguments surface a useful field', () => {
    const summary = summarizeToolCall('deploy', JSON.stringify({ url: 'https://example.com' }), '…')
    expect(summary.detail).toBe('https://example.com')
    expect(summary.icon).toBe('generic')
  })

  it('clips very long summaries', () => {
    const summary = summarizeToolCall('custom', JSON.stringify({ description: 'x'.repeat(400) }), '…')
    expect(summary.detail.length).toBeLessThanOrEqual(120)
    expect(summary.detail.endsWith('…')).toBe(true)
  })
})

describe('tool-summary — helpers', () => {
  it('fileBaseName handles POSIX, Windows and trailing slashes', () => {
    expect(fileBaseName('/a/b/c.ts')).toBe('c.ts')
    expect(fileBaseName('C:\\proj\\src\\main.rs')).toBe('main.rs')
    expect(fileBaseName('/a/b/')).toBe('b')
    expect(fileBaseName('/')).toBe('/')
    expect(fileBaseName('plain.txt')).toBe('plain.txt')
  })

  it('splitMcpName parses both double- and single-underscore spellings', () => {
    expect(splitMcpName('mcp__playwright__browser_click')).toEqual({ server: 'playwright', tool: 'browser_click' })
    expect(splitMcpName('mcp_server_tool')).toEqual({ server: 'server', tool: 'tool' })
    expect(splitMcpName('bash')).toBeNull()
    expect(splitMcpName('mcp__')).toBeNull()
  })
})
