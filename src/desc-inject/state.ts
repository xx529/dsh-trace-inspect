/**
 * Per-session on/off state for the opt-in `description` parameter.
 *
 * Layout (owner requirement: a folder named after this plugin under DSH home):
 *
 *   $DSH_HOME/dsh-trace-inspect/tool-description/<sessionId>.json
 *
 * A file exists only after the user actually chose a value; a session with no
 * file uses its parent session's value (subagents inherit) or the configured
 * default. Sealing is derived from the session log (`turn/start`), so the only
 * mutable state is the one boolean written before the first turn.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Folder created under DSH home, named after this plugin. */
export const PLUGIN_DIR = 'dsh-trace-inspect'

/** Sub-folder holding one JSON file per choosing session. */
export const STATE_SUBDIR = 'tool-description'

/** Resolve DSH home the same way `@deepseek-ai/dsh-home-paths` does. */
export function resolveDshHome(env: Record<string, string | undefined> = process.env): string {
  const configured = env.DSH_HOME?.trim()
  return configured !== undefined && configured.length > 0 ? configured : join(homedir(), '.dsh')
}

/** This plugin's folder under DSH home. */
export function stateDirectory(home: string = resolveDshHome()): string {
  return join(home, PLUGIN_DIR, STATE_SUBDIR)
}

/** File name safe for one session id (ids are opaque, so encode them). */
export function stateFile(sessionId: string, home: string = resolveDshHome()): string {
  return join(stateDirectory(home), `${encodeURIComponent(sessionId)}.json`)
}

/** One persisted choice. */
export interface SessionChoice {
  enabled: boolean
}

/** Read one persisted choice, or undefined when the session never chose. */
export function readChoice(sessionId: string, home: string = resolveDshHome()): SessionChoice | undefined {
  let text: string
  try {
    text = readFileSync(stateFile(sessionId, home), 'utf8')
  } catch {
    return undefined
  }
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object') return undefined
    const enabled = (parsed as { enabled?: unknown }).enabled
    return typeof enabled === 'boolean' ? { enabled } : undefined
  } catch {
    return undefined
  }
}

/** Persist one choice atomically (write-then-rename). */
export function writeChoice(sessionId: string, enabled: boolean, home: string = resolveDshHome()): void {
  mkdirSync(stateDirectory(home), { recursive: true })
  const target = stateFile(sessionId, home)
  const temporary = `${target}.${process.pid}.tmp`
  writeFileSync(temporary, `${JSON.stringify({ enabled, updatedAt: new Date().toISOString() })}\n`, 'utf8')
  renameSync(temporary, target)
}

/** One resolved value and where it came from. */
export interface ResolvedChoice {
  enabled: boolean
  source: 'session' | 'parent' | 'default'
}

/**
 * Resolve one session's value: its own persisted choice, else the nearest
 * ancestor's (subagent inheritance), else the configured default. The parent
 * chain is bounded and cycle-safe.
 */
export function resolveChoice(
  sessionId: string,
  parentOf: (id: string) => string | undefined,
  read: (id: string) => SessionChoice | undefined = id => readChoice(id),
  fallback = false,
): ResolvedChoice {
  const seen = new Set<string>()
  let current: string | undefined = sessionId
  for (let depth = 0; depth < 16 && current !== undefined; depth += 1) {
    if (seen.has(current)) break
    seen.add(current)
    const own = read(current)
    if (own !== undefined) return { enabled: own.enabled, source: depth === 0 ? 'session' : 'parent' }
    current = parentOf(current)
  }
  return { enabled: fallback, source: 'default' }
}
