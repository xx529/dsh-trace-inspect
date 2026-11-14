/**
 * desc-inject-plugin.spec.ts — the Host sub-plugin's behaviour with a fake
 * tool registry: default off, per-conversation opt-in, sealing at the first
 * turn, persistence under DSH home, subagent inheritance, and mid-conversation
 * tool/MCP additions reconciled on `tools/change`.
 */
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apply } from '../src/desc-inject/index'
import { MARKER, PARAM_NAME } from '../src/desc-inject/schema'
import { readChoice } from '../src/desc-inject/state'

interface FakeDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute(args: unknown): Promise<unknown>
  received?: unknown
}

function definition(name: string): FakeDefinition {
  const value: FakeDefinition = {
    name,
    description: `${name} description`,
    parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
    execute: async (args: unknown) => {
      value.received = args
      return args
    },
  }
  return value
}

interface FakeAgent {
  id: string
  session: { id: string; parentSession?: string; snapshotEvents(): readonly { type: string }[] }
  ctx: {
    tools: { register(value: FakeDefinition): () => void }
    effect(fn: () => () => void): () => void
  }
  shadows: FakeDefinition[]
}

function agent(id: string, options: { parent?: string; events?: string[] } = {}): FakeAgent {
  const shadows: FakeDefinition[] = []
  return {
    id,
    shadows,
    session: {
      id,
      ...options.parent === undefined ? {} : { parentSession: options.parent },
      snapshotEvents: () => (options.events ?? []).map(type => ({ type })),
    },
    ctx: {
      tools: {
        register(value: FakeDefinition) {
          shadows.push(value)
          return () => {
            const index = shadows.indexOf(value)
            if (index >= 0) shadows.splice(index, 1)
          }
        },
      },
      effect(fn: () => () => void) { return fn() },
    },
  }
}

interface Harness {
  create(agentValue: FakeAgent): void
  changeTools(definitions: FakeDefinition[]): void
  run(agentValue: FakeAgent, input: string): { kind: string; text: string }
  definitions: FakeDefinition[]
}

function harness(config: { enabledByDefault?: boolean; prefixes?: string[] } = {}): Harness {
  const listeners = new Map<string, Array<(payload: { agent: FakeAgent }) => void>>()
  const agents = new Map<string, FakeAgent>()
  const definitions: FakeDefinition[] = []
  let command: { handler: (input: { agent: FakeAgent; rawInput: string }) => { kind: string; text: string } } | undefined

  const ctx = {
    tools: { definitions: () => definitions },
    agents: { get: (id: string) => agents.get(id) },
    logger: { warn: () => {} },
    on: (event: string, listener: (payload: { agent: FakeAgent }) => void) => {
      const list = listeners.get(event) ?? []
      list.push(listener)
      listeners.set(event, list)
    },
    inject: (_names: readonly string[], callback: (scope: { commands: { register: (value: never) => void } }) => void) => {
      callback({
        commands: {
          register: (value: never) => {
            command = value as never
            return () => {}
          },
        },
      })
    },
  }

  apply(ctx as never, config)

  return {
    definitions,
    create(agentValue: FakeAgent) {
      agents.set(agentValue.id, agentValue)
      for (const listener of listeners.get('agent/created') ?? []) listener({ agent: agentValue })
    },
    changeTools(next: FakeDefinition[]) {
      definitions.splice(0, definitions.length, ...next)
      for (const listener of listeners.get('tools/change') ?? []) listener({ agent: undefined as never })
    },
    run(agentValue: FakeAgent, input: string) {
      if (command === undefined) throw new Error('command was not registered')
      return command.handler({ agent: agentValue, rawInput: input })
    },
  }
}

let home: string
let previousHome: string | undefined

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'desc-inject-plugin-'))
  previousHome = process.env.DSH_HOME
  process.env.DSH_HOME = home
})

afterEach(() => {
  if (previousHome === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = previousHome
})

describe('desc-inject plugin — default off and opt-in', () => {
  it('registers no shadow until the conversation opts in', () => {
    const probe = definition('mcp__probe__probe')
    const plugin = harness()
    plugin.changeTools([probe])
    const session = agent('session-a')
    plugin.create(session)
    expect(session.shadows).toHaveLength(0)
    expect(plugin.run(session, 'status')).toEqual({ kind: 'success', text: 'off' })

    expect(plugin.run(session, 'on')).toMatchObject({ kind: 'success' })
    expect(readChoice('session-a', home)).toEqual({ enabled: true })
    expect(session.shadows).toHaveLength(1)
    expect(session.shadows[0]?.parameters.properties).toHaveProperty(PARAM_NAME)
    expect((session.shadows[0]?.parameters.properties as Record<string, { description?: string }>)[PARAM_NAME]?.description).toBe(MARKER)
  })

  it('strips the injected parameter before the global body runs', async () => {
    const probe = definition('mcp__probe__probe')
    const plugin = harness()
    plugin.changeTools([probe])
    const session = agent('session-b')
    plugin.create(session)
    plugin.run(session, 'on')
    await session.shadows[0]?.execute({ text: 'hello', [PARAM_NAME]: 'why' })
    expect(probe.received).toEqual({ text: 'hello' })
  })

  it('turns off again before sealing by removing shadows', () => {
    const plugin = harness({ enabledByDefault: true })
    plugin.changeTools([definition('mcp__probe__probe')])
    const session = agent('session-c')
    plugin.create(session)
    expect(session.shadows).toHaveLength(1)
    plugin.run(session, 'off')
    expect(session.shadows).toHaveLength(0)
    expect(readChoice('session-c', home)).toEqual({ enabled: false })
  })
})

describe('desc-inject plugin — sealing and inheritance', () => {
  it('refuses a change once the conversation started', () => {
    const plugin = harness()
    plugin.changeTools([definition('mcp__probe__probe')])
    const session = agent('session-d', { events: ['turn/start'] })
    plugin.create(session)
    const result = plugin.run(session, 'on')
    expect(result.kind).toBe('error')
    expect(result.text).toContain('不可再修改')
    expect(readChoice('session-d', home)).toBeUndefined()
    expect(session.shadows).toHaveLength(0)
    expect(plugin.run(session, 'status').text).toContain('sealed')
  })

  it('lets a subagent inherit its parent session choice', () => {
    const plugin = harness()
    plugin.changeTools([definition('mcp__probe__probe')])
    const parent = agent('session-parent')
    plugin.create(parent)
    plugin.run(parent, 'on')

    const child = agent('session-child', { parent: 'session-parent' })
    plugin.create(child)
    expect(child.shadows).toHaveLength(1)
    expect(readChoice('session-child', home)).toBeUndefined()
  })


  it('restores the persisted choice in a fresh plugin instance (restart)', () => {
    const probe = definition('mcp__probe__probe')
    const first = harness()
    first.changeTools([probe])
    const original = agent('session-restart')
    first.create(original)
    expect(first.run(original, 'on')).toMatchObject({ kind: 'success' })

    // A new Host process: new plugin instance, same $DSH_HOME.
    const second = harness()
    second.changeTools([probe])
    const resumed = agent('session-restart')
    second.create(resumed)
    expect(resumed.shadows).toHaveLength(1)
    expect(second.run(resumed, 'status')).toEqual({ kind: 'success', text: 'on' })
  })

  it('does not leak an enabled parent into an unrelated session', () => {
    const plugin = harness()
    plugin.changeTools([definition('mcp__probe__probe')])
    const parent = agent('session-parent-2')
    plugin.create(parent)
    plugin.run(parent, 'on')
    const other = agent('session-other')
    plugin.create(other)
    expect(other.shadows).toHaveLength(0)
  })
})

describe('desc-inject plugin — mid-conversation tool additions', () => {
  it('decorates a tool that connects after the conversation started', () => {
    const plugin = harness({ enabledByDefault: true })
    plugin.changeTools([definition('mcp__probe__probe')])
    const session = agent('session-e')
    plugin.create(session)
    expect(session.shadows.map(value => value.name)).toEqual(['mcp__probe__probe'])

    const late = definition('mcp__late__tool')
    plugin.changeTools([definition('mcp__probe__probe'), late])
    expect(session.shadows.map(value => value.name)).toEqual(['mcp__probe__probe', 'mcp__late__tool'])

    plugin.changeTools([late])
    expect(session.shadows.map(value => value.name)).toEqual(['mcp__late__tool'])
  })
})
