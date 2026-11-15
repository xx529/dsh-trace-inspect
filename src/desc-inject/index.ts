/**
 * Opt-in `description` parameter for injected tools (Host half).
 *
 * Behaviour (owner decisions, 2026-11-14):
 *   - DEFAULT OFF. `enabledByDefault` in the profile patch only decides the
 *     default for a session that never chose; there is no global switch.
 *   - The choice is per conversation and immutable once the first turn starts
 *     (sealed). `/desc-inject on|off` and the audit route refuse after that.
 *   - Subagents inherit their parent session's choice.
 *   - A session's choice persists as one JSON file under the plugin's own
 *     folder under DSH home: `$DSH_HOME/dsh-trace-inspect/tool-description/`.
 *   - When enabled, every visible injected tool (MCP by default) gets the
 *     parameter for THAT agent only, and the parameter is stripped again before
 *     the tool body runs, so the session log keeps the model's audit text while
 *     the tool server never receives it.
 *
 * Implementation: per-agent SCOPED shadow registrations. The global definitions
 * are never touched; a shadow copies one definition, adds the parameter to its
 * schema, and delegates `execute` to the global definition after stripping.
 * `tools/change` reconciles synchronously, so a tool (or MCP server) that
 * appears mid-conversation is decorated before the next step assembles.
 *
 * The first-screen switch talks to the read/write route below instead of
 * executing `/desc-inject`, so mounting the switch never adds a command row to
 * the conversation transcript.
 */
import type { HttpRequestLike, HttpResponseLike } from '../context-types'
import { BODY_TOO_LARGE, isTrustedApiRequest, readJsonBody, sendJson } from '../host-http'
import { injectable, stripInjected, withDescriptionParameter } from './schema'
import { readChoice, resolveChoice, resolveDshHome, writeChoice } from './state'

/** Cordis plugin name. */
export const name = 'trace-inspect-desc'

/** Services required to register shadows and walk the subagent chain. */
export const inject = ['tools', 'agents']

/** Config values read from the bundle patch. */
export interface DescInjectConfig {
  /** Default for a session that never chose. There is no global UI switch. */
  enabledByDefault?: boolean
  /** Tool-name families receiving the parameter (default: MCP). */
  prefixes?: string[]
}

/** First-screen switch endpoint (same-origin, behind the loopback fence). */
export const AUDIT_PATH = '/trace-inspect/api/tool-audit'

/** One visible tool definition (plain object registered on the tool service). */
interface ToolDefinitionLike {
  readonly name: string
  readonly description: string
  readonly parameters: Record<string, unknown>
  readonly execute: (args: unknown, exec: unknown) => Promise<unknown>
  readonly isConcurrencySafe?: (args: unknown) => boolean
  readonly [key: string]: unknown
}

interface SessionLike {
  readonly id: string
  readonly parentSession?: string
  snapshotEvents(): readonly { type: string }[]
}

interface AgentLike {
  readonly id: string
  readonly session: SessionLike
  readonly ctx: {
    readonly tools: { register(definition: ToolDefinitionLike): () => void }
    effect(fn: () => () => void): unknown
  }
}

interface ToolsServiceLike {
  definitions(scope?: unknown): readonly ToolDefinitionLike[]
}

interface CommandsLike {
  register(definition: unknown): () => void
}

interface WebServerLike {
  register(route: {
    kind: 'exact'
    path: string
    handler: (req: unknown, res: unknown) => void | Promise<void>
  }): void
}

interface HostContextLike {
  readonly tools: ToolsServiceLike
  readonly agents: { get(id: string): AgentLike | undefined }
  readonly logger?: { warn?(message: string): void }
  on(event: string, listener: (payload: { agent: AgentLike }) => void): void
  inject(names: readonly string[], callback: (ctx: {
    commands?: CommandsLike
    webServer?: WebServerLike
  }) => void): void
}

/** Default injected families: Harness-qualified MCP tools. */
const DEFAULT_PREFIXES = ['mcp__'] as const

/** The manual/agent command name (`/desc-inject on|off|status`). */
export const COMMAND_NAME = 'desc-inject'

/**
 * Copy one global definition into an injected shadow: same schema fields and
 * callbacks, but the model-facing parameters carry the extra property and
 * `execute`/`isConcurrencySafe` see the stripped arguments.
 */
export function decorateDefinition(definition: ToolDefinitionLike): ToolDefinitionLike {
  const decorated: ToolDefinitionLike = {
    ...definition,
    parameters: withDescriptionParameter(definition.parameters),
    execute: (args: unknown, exec: unknown) => definition.execute(stripInjected(args), exec),
    ...typeof definition.isConcurrencySafe === 'function'
      ? { isConcurrencySafe: (args: unknown) => definition.isConcurrencySafe!(stripInjected(args)) }
      : {},
  }
  return decorated
}

/**
 * Register the per-agent shadows, the `/desc-inject` command, and the
 * first-screen switch's read/write route.
 * @param ctx - Host context carrying `tools` and `agents`.
 * @param config - optional defaults from the profile patch.
 */
export function apply(ctx: HostContextLike, config: DescInjectConfig = {}): void {
  const enabledByDefault = config.enabledByDefault === true
  const prefixes = Array.isArray(config.prefixes) && config.prefixes.length > 0
    ? config.prefixes.map(String)
    : [...DEFAULT_PREFIXES]
  const home = resolveDshHome()

  /** Live agents, by session id (they share the id). */
  const liveAgents = new Map<string, AgentLike>()
  /** Per-agent scoped shadows: agent id → tool name → disposer. */
  const shadows = new Map<string, Map<string, () => void>>()
  /** Per-session resolved choice (the file is the source of truth). */
  const modes = new Map<string, boolean>()
  /** Sessions already known to have started a turn. */
  const sealed = new Set<string>()
  /** Guard against re-entrant reconciliation from our own registrations. */
  let reconciling = false

  const parentOf = (sessionId: string): string | undefined =>
    ctx.agents.get(sessionId)?.session.parentSession

  const modeOf = (agent: AgentLike): boolean => {
    const sessionId = agent.session.id
    const cached = modes.get(sessionId)
    if (cached !== undefined) return cached
    const resolved = resolveChoice(sessionId, parentOf, candidate => readChoice(candidate, home), enabledByDefault)
    modes.set(sessionId, resolved.enabled)
    return resolved.enabled
  }

  /** A choice is sealed once the conversation has started a turn. */
  const isSealed = (agent: AgentLike): boolean => {
    const sessionId = agent.session.id
    if (sealed.has(sessionId)) return true
    let started = false
    try {
      started = agent.session.snapshotEvents().some(event => event.type === 'turn/start')
    } catch {
      started = true
    }
    if (started) sealed.add(sessionId)
    return started
  }

  /** The switch/route projection for one session. */
  const statusOf = (agent: AgentLike): { enabled: boolean; sealed: boolean } =>
    ({ enabled: modeOf(agent), sealed: isSealed(agent) })

  /** Persist one unsealed choice and apply it to the live agent. */
  const choose = (agent: AgentLike, enabled: boolean): { enabled: boolean; sealed: boolean } => {
    writeChoice(agent.session.id, enabled, home)
    modes.set(agent.session.id, enabled)
    liveAgents.set(agent.id, agent)
    reconcile(agent)
    return statusOf(agent)
  }

  /** Bring one agent's shadows in line with the current global definitions. */
  const reconcile = (agent: AgentLike): void => {
    const registered = shadows.get(agent.id) ?? new Map<string, () => void>()
    shadows.set(agent.id, registered)

    if (!modeOf(agent)) {
      for (const dispose of registered.values()) dispose()
      registered.clear()
      return
    }

    const targets = new Map<string, ToolDefinitionLike>()
    for (const definition of ctx.tools.definitions()) {
      if (injectable(definition.name, definition.parameters, prefixes)) targets.set(definition.name, definition)
    }

    for (const [name, dispose] of [...registered]) {
      if (targets.has(name)) continue
      dispose()
      registered.delete(name)
    }

    for (const [name, definition] of targets) {
      if (registered.has(name)) continue
      try {
        registered.set(name, agent.ctx.tools.register(decorateDefinition(definition)))
      } catch (error) {
        ctx.logger?.warn?.(`desc-inject: cannot shadow "${name}" for "${agent.id}": ${String(error)}`)
      }
    }
  }

  // Every new agent (including inherited subagents and resumed sessions) gets
  // its shadows here; later tool/MCP changes reconcile all live agents.
  ctx.on('agent/created', ({ agent }) => {
    liveAgents.set(agent.id, agent)
    agent.ctx.effect(() => () => {
      liveAgents.delete(agent.id)
      shadows.delete(agent.id)
    })
    if (modeOf(agent)) reconcile(agent)
  })
  ctx.on('tools/change', () => {
    if (reconciling) return
    reconciling = true
    try {
      for (const agent of liveAgents.values()) reconcile(agent)
    } finally {
      reconciling = false
    }
  })

  // First-screen switch transport: no command execution, so mounting or
  // toggling the switch never writes a command row into the transcript.
  ctx.inject(['webServer'], (webCtx) => {
    const webServer = webCtx.webServer
    if (webServer === undefined) return
    webServer.register({
      kind: 'exact',
      path: AUDIT_PATH,
      handler: async (rawReq, rawRes) => {
        const req = rawReq as HttpRequestLike
        const res = rawRes as HttpResponseLike
        if (!isTrustedApiRequest({ headers: req.headers })) {
          sendJson(res, 403, { error: 'forbidden' })
          return
        }
        const url = new URL(req.url ?? '/', 'http://127.0.0.1')
        const sessionId = url.searchParams.get('sessionId') ?? ''
        const agent = sessionId.length > 0 ? ctx.agents.get(sessionId) : undefined
        if (agent === undefined) {
          sendJson(res, 404, { error: 'session not found' })
          return
        }
        if (req.method === 'GET') {
          sendJson(res, 200, statusOf(agent))
          return
        }
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'method not allowed' })
          return
        }
        const body = await readJsonBody(req)
        if (body === BODY_TOO_LARGE) {
          sendJson(res, 413, { error: 'payload too large' })
          return
        }
        if (typeof body.enabled !== 'boolean') {
          sendJson(res, 400, { error: 'enabled must be a boolean' })
          return
        }
        if (isSealed(agent)) {
          sendJson(res, 409, { error: 'sealed', ...statusOf(agent) })
          return
        }
        try {
          sendJson(res, 200, choose(agent, body.enabled))
        } catch (error) {
          sendJson(res, 500, { error: String(error) })
        }
      },
    })
  })

  ctx.inject(['commands'], (commandCtx) => {
    const commands = commandCtx.commands
    if (commands === undefined) return
    commands.register({
      definitionId: 'dsh-trace-inspect/desc-inject',
      name: COMMAND_NAME,
      description: '开启或关闭本对话的工具审计（开启后注入类工具多一个 description 参数，记录调用目的，仅用于轮次轨迹）',
      input: { hint: '[on|off|status]' },
      handler: ({ agent, rawInput }: { agent: AgentLike; rawInput: string }) => {
        const argument = String(rawInput ?? '').trim().toLowerCase()
        if (argument === '' || argument === 'status') {
          return {
            kind: 'success' as const,
            text: `${modeOf(agent) ? 'on' : 'off'}${isSealed(agent) ? ' (sealed)' : ''}`,
          }
        }
        if (argument !== 'on' && argument !== 'off') {
          return { kind: 'error' as const, text: '用法：/desc-inject on|off|status' }
        }
        if (isSealed(agent)) {
          return { kind: 'error' as const, text: '本对话已经开始，工具审计不可再修改。' }
        }
        const enabled = argument === 'on'
        try {
          choose(agent, enabled)
        } catch (error) {
          return { kind: 'error' as const, text: `保存设置失败：${String(error)}` }
        }
        return {
          kind: 'success' as const,
          text: enabled
            ? '已开启：本对话后续注入类工具会带 description 参数（已固化）。'
            : '已关闭：本对话不注入 description 参数（已固化）。',
        }
      },
    })
  })
}
