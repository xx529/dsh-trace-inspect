/**
 * desc-inject.spec.ts — the opt-in `description` parameter's pure rules and
 * per-session state (default off, per-conversation, subagent inheritance,
 * persisted under DSH home).
 */
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MARKER, PARAM_NAME, describeSchemas, hasInjectedParameter, injectable,
  projectSchema, stripInjected, withDescriptionParameter,
} from '../src/desc-inject/schema'
import {
  PLUGIN_DIR, STATE_SUBDIR, readChoice, resolveChoice, stateDirectory, stateFile, writeChoice,
} from '../src/desc-inject/state'

const PREFIXES = ['mcp__']

const mcpTool = {
  name: 'mcp__probe__probe',
  description: 'Verification probe',
  parameters: {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text'],
  },
}

describe('desc-inject schema — injection eligibility', () => {
  it('injects into an MCP tool without a description parameter', () => {
    expect(injectable(mcpTool.name, mcpTool.parameters, PREFIXES)).toBe(true)
  })

  it('never injects into a tool that already declares description', () => {
    const bash = {
      type: 'object',
      properties: { description: { type: 'string' }, command: { type: 'string' } },
      required: ['description', 'command'],
    }
    expect(injectable('bash', bash, PREFIXES)).toBe(false)
  })

  it('leaves non-targeted families alone', () => {
    expect(injectable('read', mcpTool.parameters, PREFIXES)).toBe(false)
  })

  it('needs an object schema with a property map', () => {
    expect(injectable('mcp__x__y', { type: 'array' }, PREFIXES)).toBe(false)
    expect(injectable('mcp__x__y', { type: 'object' }, PREFIXES)).toBe(false)
    expect(injectable('mcp__x__y', undefined, PREFIXES)).toBe(false)
  })
})

describe('desc-inject schema — projection and stripping', () => {
  it('adds the required parameter without mutating the definition schema', () => {
    const schema = withDescriptionParameter(mcpTool.parameters)
    expect(schema.properties).toHaveProperty(PARAM_NAME)
    expect((schema.properties as Record<string, { description?: string }>)[PARAM_NAME]?.description).toBe(MARKER)
    expect(schema.required).toEqual(['text', PARAM_NAME])
    expect(mcpTool.parameters.required).toEqual(['text'])
  })

  it('recognizes its own injected parameter and rejects a foreign one', () => {
    expect(hasInjectedParameter(withDescriptionParameter(mcpTool.parameters))).toBe(true)
    expect(hasInjectedParameter(mcpTool.parameters)).toBe(false)
    expect(hasInjectedParameter({ type: 'object', properties: { description: { type: 'string', description: 'other' } } })).toBe(false)
  })

  it('strips only the injected parameter, leaving the call untouched', () => {
    const args = { text: 'hello', description: 'why' }
    expect(stripInjected(args)).toEqual({ text: 'hello' })
    expect(args).toEqual({ text: 'hello', description: 'why' })
    expect(stripInjected('not json')).toBe('not json')
    expect(stripInjected(null)).toBe(null)
    expect(stripInjected({ text: 'hello' })).toEqual({ text: 'hello' })
  })

  it('projects untouched schemas when disabled', () => {
    const schemas = describeSchemas([mcpTool], false, PREFIXES)
    expect(schemas).toHaveLength(1)
    expect(schemas[0]?.parameters).toBe(mcpTool.parameters)
    expect(schemas[0]?.parameters.properties).not.toHaveProperty(PARAM_NAME)
  })

  it('injects only into eligible tools when enabled', () => {
    const other = { name: 'read', description: 'Read a file', parameters: { type: 'object', properties: { file_path: { type: 'string' } } } }
    const schemas = describeSchemas([mcpTool, other], true, PREFIXES)
    expect(schemas[0]?.parameters.properties).toHaveProperty(PARAM_NAME)
    expect(schemas[1]?.parameters).toBe(other.parameters)
    expect(projectSchema(other).deferLoading).toBeUndefined()
  })
})

describe('desc-inject state — persistence and inheritance', () => {
  it('writes and reads one choice under the plugin folder in DSH home', () => {
    const home = mkdtempSync(join(tmpdir(), 'desc-inject-home-'))
    expect(readChoice('session-a', home)).toBeUndefined()
    writeChoice('session-a', true, home)
    expect(readChoice('session-a', home)).toEqual({ enabled: true })
    expect(stateDirectory(home)).toBe(join(home, PLUGIN_DIR, STATE_SUBDIR))
    const stored = JSON.parse(readFileSync(stateFile('session-a', home), 'utf8')) as { enabled: boolean }
    expect(stored.enabled).toBe(true)
    writeChoice('session-a', false, home)
    expect(readChoice('session-a', home)).toEqual({ enabled: false })
  })

  it('prefers the session choice, then the parent, then the default', () => {
    const home = mkdtempSync(join(tmpdir(), 'desc-inject-home-'))
    writeChoice('parent', true, home)
    const parentOf = (id: string): string | undefined => (id === 'child' ? 'parent' : undefined)

    expect(resolveChoice('child', parentOf, id => readChoice(id, home), false)).toEqual({ enabled: true, source: 'parent' })
    expect(resolveChoice('other', parentOf, id => readChoice(id, home), true)).toEqual({ enabled: true, source: 'default' })

    writeChoice('child', false, home)
    expect(resolveChoice('child', parentOf, id => readChoice(id, home), false)).toEqual({ enabled: false, source: 'session' })
  })

  it('walks deeper chains and stops on a cycle', () => {
    const home = mkdtempSync(join(tmpdir(), 'desc-inject-home-'))
    writeChoice('root', true, home)
    const parents: Record<string, string | undefined> = { grandchild: 'child', child: 'root', root: undefined }
    const parentOf = (id: string): string | undefined => parents[id]
    expect(resolveChoice('grandchild', parentOf, id => readChoice(id, home), false)).toEqual({ enabled: true, source: 'parent' })

    const cyclic: Record<string, string | undefined> = { a: 'b', b: 'a' }
    expect(resolveChoice('a', id => cyclic[id], id => readChoice(id, home), false)).toEqual({ enabled: false, source: 'default' })
  })
})
