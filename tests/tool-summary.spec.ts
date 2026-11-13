/**
 * tool-summary.spec.ts — the folded row's semantic one-liner (v0.6.0).
 *
 * Owner requirement: known built-in tools should read as what they mean
 * (`bash <description>`, `read <file>`, `mcp:<server> {…}`) instead of the raw
 * clipped JSON. These cases pin that mapping; the panel test only checks that
 * the row renders the summary.
 */
import { describe, expect, it } from 'vitest'
import { fileBaseName, inkOf, splitMcpName, summarizeToolCall, toolIconKind } from '../src/client/tool-summary'
import type { ToolIconKind } from '../src/client/tool-summary'

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

  it('todo_write counts the list; todo_read keeps the todo glyph', () => {
    const write = summarizeToolCall('todo_write', JSON.stringify({ todos: [{ id: 1 }, { id: 2 }] }), '…')
    expect(write).toEqual({ label: 'todo_write', detail: '2 项', icon: 'todo' })
    expect(summarizeToolCall('todo_read', '{}', '…').icon).toBe('todo')
  })

  it('figma plugin tools are not DSH built-ins: shared wrench glyph, id still shown', () => {
    expect(summarizeToolCall('figma_status', '{}', '…')).toEqual({ label: 'figma_status', detail: '', icon: 'generic' })
    const select = summarizeToolCall('figma_select_document', JSON.stringify({ documentId: 'doc-1' }), '…')
    expect(select.detail).toBe('doc-1')
    expect(select.icon).toBe('generic')
  })

  it('skill shows the bare skill name (never the raw `name` key) and the skill glyph', () => {
    expect(summarizeToolCall('skill', JSON.stringify({ name: 'figma-workbench' }), '…'))
      .toEqual({ label: 'skill', detail: 'figma-workbench', icon: 'skill' })
    expect(summarizeToolCall('skill', JSON.stringify({ skill: 'ui-ux-pro-max' }), '…').detail).toBe('ui-ux-pro-max')
    expect(summarizeToolCall('skill', 'not json', 'not json').detail).toBe('not json')
  })

  it('mcp tools split into server + tool + a human argument summary', () => {
    const summary = summarizeToolCall(
      'mcp__playwright__browser_click',
      JSON.stringify({ element: 'Save button', ref: 'e42' }),
      '…',
    )
    expect(summary).toEqual({
      label: 'playwright',
      detail: 'browser_click · 2 个参数',
      icon: 'mcp',
      server: 'playwright',
      toolName: 'browser_click',
    })
  })

  it('mcp tools summarize asset arguments (counts + format + scale)', () => {
    const summary = summarizeToolCall(
      'mcp__figma__download_assets',
      JSON.stringify({ nodeIds: ['1:2', '3:4', '5:6'], format: 'PNG', scale: 2 }),
      '…',
    )
    expect(summary.label).toBe('figma')
    expect(summary.toolName).toBe('download_assets')
    expect(summary.detail).toBe('download_assets · 3 个节点 · PNG @2x')
  })

  it('mcp tools without arguments show just the tool name', () => {
    const summary = summarizeToolCall('mcp__deepwiki__read_wiki_structure', '', '')
    expect(summary.label).toBe('deepwiki')
    expect(summary.detail).toBe('read_wiki_structure')
  })

  it('unknown tools keep the clipped preview and the generic glyph', () => {
    const summary = summarizeToolCall('some_custom_tool', undefined, '{"x":1}')
    expect(summary.label).toBe('some_custom_tool')
    expect(summary.icon).toBe('generic')
    expect(summary.detail).toBe('x 1')
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

describe('tool-summary — work clusters (v0.10.19)', () => {
  it('each DSH built-in family maps to its own cluster glyph', () => {
    const cases: Array<[string, ToolIconKind]> = [
      ['bash', 'terminal'], ['pwsh', 'terminal'], ['shell', 'terminal'],
      ['terminal_open', 'terminal-session'], ['terminal_list', 'terminal-session'],
      ['job_list', 'jobs'], ['job_output', 'jobs'],
      ['run_code', 'code'], ['lsp', 'code'],
      ['read_image', 'file-read'], ['apply_patch', 'file-write'], ['str_replace_editor', 'file-edit'],
      ['glob', 'search'], ['web_search', 'web'], ['web_fetch', 'web'],
      ['todo_write', 'todo'], ['create_goal', 'goal'], ['update_goal', 'goal'],
      ['schedule_create', 'schedule'], ['schedule_view', 'schedule'],
      ['ask_user_question', 'ask'], ['present', 'present'],
      ['subagent', 'subagent'], ['subagent_fork', 'subagent'], ['list_subagent_models', 'subagent'],
      ['spawn_teammate', 'team'], ['send_message', 'team'], ['wait_agent', 'team'],
      ['team_task_create', 'team-task'], ['team_task_update', 'team-task'],
      ['workflow', 'workflow'], ['ralph', 'workflow'],
      ['skill', 'skill'],
      ['session_search', 'session'], ['session_event_read', 'session'],
      ['working_directory', 'folder'], ['load_workspace_dependencies', 'folder'],
      ['cordis_inspect_query', 'plugin'], ['list_mcp_resources', 'mcp'],
    ]
    for (const [name, kind] of cases) expect(toolIconKind(name), name).toBe(kind)
  })

  it('non-built-in, non-MCP tools share the wrench; MCP stays on the plug', () => {
    expect(toolIconKind('figma_status')).toBe('generic')
    expect(toolIconKind('acme_deploy')).toBe('generic')
    expect(summarizeToolCall('mcp__figma__get_screenshot', '{}', '…').icon).toBe('mcp')
    expect(summarizeToolCall('list_mcp_resources', '{}', '…').icon).toBe('mcp')
  })

  it('MCP wire names resolve to the MCP cluster, not the wrench (v0.10.33)', () => {
    for (const name of ['mcp__figma__use_figma', 'mcp__figma__create_session', 'mcp__playwright__browser_click', 'mcp_server_tool']) {
      expect(toolIconKind(name), name).toBe('mcp')
    }
    expect(inkOf('mcp')).toBe('pink')
  })

  it('cluster ink follows the seven-tone palette', () => {
    expect(inkOf('terminal')).toBe('violet')
    expect(inkOf('file-read')).toBe('blue')
    expect(inkOf('file-edit')).toBe('green')
    expect(inkOf('goal')).toBe('amber')
    expect(inkOf('team')).toBe('pink')
    expect(inkOf('session')).toBe('teal')
    expect(inkOf('generic')).toBe('gray')
    expect(inkOf('alert')).toBe('red')
  })

  it('the provider subagents carry their own brand mark and ink (v0.10.46)', () => {
    expect(toolIconKind('subagent_claude_code')).toBe('claude')
    expect(toolIconKind('subagent_codex')).toBe('codex')
    expect(inkOf('claude')).toBe('claude')
    expect(inkOf('codex')).toBe('codex')
    // Other provider-named subagents are still one child agent (robot glyph).
    expect(toolIconKind('subagent_acp')).toBe('subagent')
    expect(toolIconKind('subagent')).toBe('subagent')
    expect(summarizeToolCall('subagent_claude_code', '{"description":"列出工作区文件"}', '{}').icon).toBe('claude')
    expect(summarizeToolCall('subagent_codex', '{"description":"列出工作区文件"}', '{}').icon).toBe('codex')
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
