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
 * v0.10.19: every recognised *work cluster* draws its own glyph. The cluster
 * table below follows DSH's own tool packages (`@deepseek-ai/dsh-tool-*`) and
 * the official `detailIcon` grouping, so a row reads as "kind of work" instead
 * of "some tool". Anything that is neither a DSH built-in nor an MCP tool
 * (plugin-native tools such as `figma_*`, third-party tools, unknown names)
 * deliberately falls back to the single wrench glyph.
 *
 * Everything here is pure so the mapping is unit-testable without React.
 */
import type { Lang } from './locales'

/** Ink colour family of a cluster glyph (CSS: `.ttl-ink-*` in styles.ts). */
export type ToolInk =
  | 'violet' | 'blue' | 'green' | 'amber' | 'pink' | 'teal' | 'gray' | 'red'
  /** Brand inks (v0.10.46): the two subagent provider marks keep their own colour. */
  | 'claude' | 'codex'

/** Glyph family drawn in front of a tool row (see `ToolIcon`). */
export type ToolIconKind =
  /** Command execution: `bash` / `pwsh`. */
  | 'terminal'
  /** Long-lived terminal session: `terminal_*`. */
  | 'terminal-session'
  /** Background jobs: `job_*`. */
  | 'jobs'
  /** Code execution / language service: `run_code`, `lsp`. */
  | 'code'
  | 'file-read'
  | 'file-write'
  | 'file-edit'
  | 'search'
  /** Network access: `web_search` / `web_fetch`. */
  | 'web'
  | 'todo'
  /** Goal loop: `create_goal` / `get_goal` / `update_goal`. */
  | 'goal'
  /** Scheduled tasks: `schedule_*`. */
  | 'schedule'
  /** Asks the user a question: `ask_user_question`. */
  | 'ask'
  /** Declares deliverables: `present`. */
  | 'present'
  /** One child agent: `subagent` / `subagent_fork` / `list_subagent_models`. */
  | 'subagent'
  /** Claude Code subagent (`subagent_claude_code`): Claude brand mark, not a stroke glyph. */
  | 'claude'
  /** Codex subagent (`subagent_codex`): OpenAI brand mark, not a stroke glyph. */
  | 'codex'
  /** Teammate coordination: `spawn_teammate` / `list_agents` / `send_message` / … */
  | 'team'
  /** Team task board: `team_task_*`. */
  | 'team-task'
  /** Orchestration / loops: `workflow` / `ralph`. */
  | 'workflow'
  | 'skill'
  /** Session history: `session_*`. */
  | 'session'
  /** Workspace context: `working_directory` / `load_workspace_dependencies` / `create_worktree`. */
  | 'folder'
  /** Runtime plugin surface: `cordis_*`. */
  | 'plugin'
  | 'mcp'
  | 'alert'
  /** Fallback for non-built-in, non-MCP tools (plugin tools, unknown names). */
  | 'generic'

/** Glyph ink per cluster — violet 执行 / blue 读取 / green 变更 / amber 计划 / pink 协作 / teal 上下文 / gray 其他. */
const INK_OF: Record<ToolIconKind, ToolInk> = {
  terminal: 'violet',
  'terminal-session': 'violet',
  jobs: 'violet',
  code: 'violet',
  'file-read': 'blue',
  'file-write': 'green',
  'file-edit': 'green',
  search: 'blue',
  web: 'blue',
  todo: 'amber',
  goal: 'amber',
  schedule: 'amber',
  ask: 'blue',
  present: 'green',
  subagent: 'pink',
  claude: 'claude',
  codex: 'codex',
  team: 'pink',
  'team-task': 'pink',
  workflow: 'violet',
  skill: 'teal',
  session: 'teal',
  folder: 'gray',
  plugin: 'gray',
  mcp: 'pink',
  alert: 'red',
  generic: 'gray',
}

/** Cluster ink for one glyph family. */
export function inkOf(kind: ToolIconKind): ToolInk {
  return INK_OF[kind]
}

/**
 * Exact wire name → cluster. Only DSH built-ins (and their legacy aliases)
 * belong here; MCP names are handled by `splitMcpName` before this table.
 */
const CLUSTER_BY_NAME: Readonly<Record<string, ToolIconKind>> = {
  // A · 执行
  bash: 'terminal',
  pwsh: 'terminal',
  shell: 'terminal',
  bash_output: 'terminal',
  terminal_open: 'terminal-session',
  terminal_send: 'terminal-session',
  terminal_read: 'terminal-session',
  terminal_signal: 'terminal-session',
  terminal_close: 'terminal-session',
  terminal_list: 'terminal-session',
  job_list: 'jobs',
  job_output: 'jobs',
  job_kill: 'jobs',
  run_code: 'code',
  lsp: 'code',
  // B · 文件与信息
  read: 'file-read',
  read_image: 'file-read',
  write: 'file-write',
  apply_patch: 'file-write',
  append: 'file-write',
  edit: 'file-edit',
  str_replace_editor: 'file-edit',
  glob: 'search',
  grep: 'search',
  search: 'search',
  web_search: 'web',
  web_fetch: 'web',
  // C · 计划与调度
  todo_write: 'todo',
  todo_read: 'todo',
  create_goal: 'goal',
  get_goal: 'goal',
  update_goal: 'goal',
  schedule_create: 'schedule',
  schedule_edit: 'schedule',
  schedule_list: 'schedule',
  schedule_view: 'schedule',
  // D · 交互与交付
  ask_user_question: 'ask',
  present: 'present',
  // E · 协作与编排
  subagent: 'subagent',
  subagent_fork: 'subagent',
  list_subagent_models: 'subagent',
  // v0.10.46: the two provider-specific subagent tools carry their official
  // brand mark instead of the generic robot. The provider `toolName` is free
  // text (dsh-tool-subagent config), so these are the names DSH registers for
  // the bundled anthropic / openai providers.
  subagent_claude_code: 'claude',
  subagent_codex: 'codex',
  spawn_teammate: 'team',
  list_agents: 'team',
  send_message: 'team',
  interrupt_agent: 'team',
  wait_agent: 'team',
  team_task_create: 'team-task',
  team_task_get: 'team-task',
  team_task_list: 'team-task',
  team_task_update: 'team-task',
  workflow: 'workflow',
  ralph: 'workflow',
  // F · 上下文与扩展
  skill: 'skill',
  session_search: 'session',
  session_event_search: 'session',
  session_trace: 'session',
  session_event_trace: 'session',
  session_event_read: 'session',
  working_directory: 'folder',
  load_workspace_dependencies: 'folder',
  create_worktree: 'folder',
  ls: 'folder',
  list_directory: 'folder',
  list_dir: 'folder',
  cordis_inspect_list: 'plugin',
  cordis_inspect_query: 'plugin',
  // MCP resources are MCP-flavoured, not a separate cluster.
  list_mcp_resources: 'mcp',
  list_mcp_resource_templates: 'mcp',
  read_mcp_resource: 'mcp',
}

/** Prefix (or suffix) rules for tool families that ship many names. */
const CLUSTER_RULES: ReadonlyArray<readonly [string, ToolIconKind]> = [
  ['terminal_', 'terminal-session'],
  ['job_', 'jobs'],
  ['schedule_', 'schedule'],
  ['session_', 'session'],
  ['team_task_', 'team-task'],
  ['cordis_', 'plugin'],
  // v0.10.46: every other provider-named subagent tool (`subagent_acp`, a
  // custom `toolName`) is still one delegated child agent; the two branded
  // providers above are resolved by the exact table first.
  ['subagent_', 'subagent'],
]

/**
 * Resolve the glyph family of a wire tool name.
 * @param name - Tool name exactly as the event reported it.
 * @returns The cluster glyph; `generic` (wrench) for non-built-in, non-MCP tools.
 */
export function toolIconKind(name: string): ToolIconKind {
  // MCP calls (`mcp__server__tool`, legacy `mcp_server_tool`) are their own
  // cluster; the rows already draw the plug via `summarizeToolCall`.
  if (name.startsWith('mcp__') || name.startsWith('mcp_')) return 'mcp'
  const exact = CLUSTER_BY_NAME[name]
  if (exact !== undefined) return exact
  for (const [prefix, kind] of CLUSTER_RULES) {
    if (name.startsWith(prefix)) return kind
  }
  // DSH groups the three goal tools by suffix (`*_goal`).
  if (name.endsWith('_goal')) return 'goal'
  return 'generic'
}

export interface ToolSummary {
  /** Mono label rendered in the name slot (`bash`, `read`, `figma`, …). */
  label: string
  /** Compact human detail rendered in the argument slot. */
  detail: string
  /** Inline glyph family. */
  icon: ToolIconKind
  /** MCP server name (`figma`), when the tool is an MCP tool. */
  server?: string
  /** MCP tool name (`download_assets`), when the tool is an MCP tool. */
  toolName?: string
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

/** Human-readable summary of an MCP call's JSON arguments (`5 个节点 · PNG @2x`). */
export function mcpArgsSummary(args: Record<string, unknown> | null): string {
  if (args === null) return ''
  const strings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  const nodes = strings(args.nodeIds)
  const files = strings(args.paths ?? args.files)
  const parts: string[] = []
  if (nodes.length > 0) parts.push(`${nodes.length} 个节点`)
  else if (files.length > 0) parts.push(`${files.length} 个文件`)
  const format = str(args, 'format')
  const scale = typeof args.scale === 'number' && Number.isFinite(args.scale) ? args.scale : undefined
  if (format !== undefined) parts.push(scale !== undefined ? `${format} @${scale}x` : format)
  const scalarKeys = ['path', 'file_path', 'url', 'query', 'name', 'description', 'prompt', 'text', 'command']
  if (parts.length === 0) {
    for (const key of scalarKeys) {
      const value = str(args, key)
      if (value !== undefined) { parts.push(clip(firstLine(value), 48)); break }
    }
  }
  if (parts.length === 0) {
    const count = Object.keys(args).length
    if (count > 0) parts.push(`${count} 个参数`)
  }
  return parts.join(' · ')
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
    const tool = mcp.tool.length > 0 ? mcp.tool : ''
    const summary = mcpArgsSummary(args)
    const detail = [tool, summary].filter((part) => part.length > 0).join(' · ')
    return {
      label: mcp.server,
      detail,
      icon: 'mcp',
      server: mcp.server,
      toolName: tool,
    }
  }

  // Cluster glyph resolved once; the switch below only shapes the detail text.
  const icon = toolIconKind(name)

  switch (name) {
    case 'bash':
    case 'bash_output':
    case 'shell': {
      const description = str(args, 'description')
      const command = str(args, 'command')
      const detail = description !== undefined
        ? clip(description)
        : command !== undefined ? clip(firstLine(command)) : clip(firstLine(argsPreview))
      return { label: name, detail, icon }
    }
    case 'read':
    case 'read_image':
    case 'write':
    case 'edit':
    case 'append': {
      const file = str(args, 'file_path') ?? str(args, 'path')
      if (file !== undefined) return { label: name, detail: clip(fileBaseName(file)), icon }
      return { label: name, detail: clip(firstLine(argsPreview)), icon }
    }
    case 'glob':
    case 'grep':
    case 'search': {
      const pattern = str(args, 'pattern') ?? str(args, 'query')
      return { label: name, detail: pattern !== undefined ? clip(pattern) : clip(firstLine(argsPreview)), icon }
    }
    case 'ls':
    case 'list_directory':
    case 'list_dir': {
      const path = str(args, 'path') ?? str(args, 'file_path')
      return { label: name, detail: path !== undefined ? clip(path) : clip(firstLine(argsPreview)), icon }
    }
    case 'todo_write': {
      // `todo_write {todos:[…]}` — the list size is the useful one-liner.
      const todos = args?.todos
      const count = Array.isArray(todos) ? todos.length : null
      return {
        label: name,
        detail: count !== null ? `${count} 项` : clip(firstLine(argsPreview)),
        icon,
      }
    }
    case 'todo_read': {
      const todos = args?.todos
      const count = Array.isArray(todos) ? todos.length : null
      return { label: name, detail: count !== null ? `${count} 项` : '', icon }
    }
    case 'skill': {
      // `skill {name: "figma-workbench"}` — the skill name IS the row detail;
      // the generic fallback would prefix it with the raw `name` key.
      const skillName = str(args, 'name') ?? str(args, 'skill')
      return {
        label: name,
        detail: skillName !== undefined ? clip(skillName) : clip(firstLine(argsPreview)),
        icon,
      }
    }
    default:
      break
  }

  if (name.startsWith('figma_')) {
    // Native Figma-plugin tools are NOT DSH built-ins and not MCP: they keep the
    // useful id in the detail slot but draw the shared wrench (`icon` is
    // `generic` here — the cluster table deliberately does not list them).
    const detail = str(args, 'documentId') ?? str(args, 'fileKey') ?? str(args, 'nodeId')
      ?? str(args, 'name') ?? (args === null ? clip(firstLine(argsPreview)) : '')
    return { label: name, detail, icon }
  }

  if (args !== null) {
    for (const key of FALLBACK_KEYS) {
      const value = str(args, key)
      if (value !== undefined) return { label: name, detail: clip(key === 'file_path' || key === 'path' ? fileBaseName(value) : firstLine(value)), icon }
    }
    // Unknown tools: never show raw JSON in the row — prefer a readable
    // `key value` pair, then an array count, then the argument count.
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return { label: name, detail: clip(`${key} ${firstLine(value)}`), icon }
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return { label: name, detail: clip(`${key} ${String(value)}`), icon }
      }
      if (Array.isArray(value)) {
        return { label: name, detail: `${key} · ${value.length} 项`, icon }
      }
    }
    const count = Object.keys(args).length
    if (count > 0) return { label: name, detail: `${count} 个参数`, icon }
    // Parsed object with no fields: show the name only, never the raw `{}`.
    return { label: name, detail: '', icon }
  }
  return { label: name, detail: clip(firstLine(argsPreview)), icon }
}
