/**
 * Pure schema rules for the opt-in `description` parameter.
 *
 * The parameter is injected into the MODEL-FACING copy of an injected tool's
 * schema (MCP today) and stripped again before the tool body runs, so the
 * session log (`tool/call.arguments`) keeps the model's "what & why" while the
 * server never receives it. Everything here is pure so it is unit-testable
 * without a Host.
 */

/** The injected parameter name. */
export const PARAM_NAME = 'description'

/**
 * Marker text for the injected parameter. It doubles as the injection
 * fingerprint: a schema or call carrying exactly this text was produced by this
 * plugin, never by an MCP server (which cannot know this string).
 */
export const MARKER =
  'Clear, concise description of what this call does, in active voice, 15-30 words '
  + '(shown in the UI). Name the action and its target.'

/** A parameter schema root this plugin can extend. */
export interface ObjectParameters {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
  [key: string]: unknown
}

/** The model-facing slice of a tool definition this plugin projects. */
export interface ProjectedSchema {
  name: string
  description: string
  parameters: Record<string, unknown>
  deferLoading?: true
}

/** Own-property check without depending on the ES2022 `Object.hasOwn`. */
function hasOwn(target: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(target, key)
}

/** Narrow a JSON-Schema node to an object root with a property map. */
export function objectParameters(parameters: unknown): ObjectParameters | undefined {
  if (parameters === null || typeof parameters !== 'object' || Array.isArray(parameters)) return undefined
  const root = parameters as Record<string, unknown>
  if (root.type !== 'object') return undefined
  const properties = root.properties
  if (properties === null || typeof properties !== 'object' || Array.isArray(properties)) return undefined
  return parameters as ObjectParameters
}

/** Whether a tool name belongs to the configured injected families. */
export function matchesPrefix(name: string, prefixes: readonly string[]): boolean {
  return prefixes.some(prefix => prefix.length > 0 && name.startsWith(prefix))
}

/**
 * Whether this tool should receive the injected parameter: a targeted name, an
 * object root this plugin can extend, and no existing `description` property
 * (a real `description` parameter, such as `bash`'s, is never touched).
 */
export function injectable(name: string, parameters: unknown, prefixes: readonly string[]): boolean {
  if (!matchesPrefix(name, prefixes)) return false
  const root = objectParameters(parameters)
  return root !== undefined && !hasOwn(root.properties, PARAM_NAME)
}

/** Clone one parameter schema with the injected property appended as required. */
export function withDescriptionParameter(parameters: unknown): Record<string, unknown> {
  const root = objectParameters(parameters)
  if (root === undefined) return parameters as Record<string, unknown>
  const required = Array.isArray(root.required) ? root.required : []
  return {
    ...root,
    properties: {
      ...root.properties,
      [PARAM_NAME]: { type: 'string', description: MARKER },
    },
    required: [...required, PARAM_NAME],
  }
}

/** Whether a parameter schema already carries this plugin's injected property. */
export function hasInjectedParameter(parameters: unknown): boolean {
  const root = objectParameters(parameters)
  if (root === undefined) return false
  const property = root.properties[PARAM_NAME]
  return property !== null && typeof property === 'object'
    && (property as { description?: unknown }).description === MARKER
}

/** Drop the injected parameter from one call's arguments without mutating them. */
export function stripInjected(args: unknown): unknown {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) return args
  if (!hasOwn(args, PARAM_NAME)) return args
  const copy: Record<string, unknown> = { ...(args as Record<string, unknown>) }
  delete copy[PARAM_NAME]
  return copy
}

/** Project one definition onto the model-facing fields (`parameters` by reference). */
export function projectSchema(definition: {
  name: string
  description: string
  parameters: Record<string, unknown>
  deferLoading?: true
}): ProjectedSchema {
  return {
    name: definition.name,
    description: definition.description,
    parameters: definition.parameters,
    ...definition.deferLoading === true ? { deferLoading: true as const } : {},
  }
}

/**
 * Project every visible definition into the request schemas, injecting the
 * parameter into eligible tools when the session opted in.
 */
export function describeSchemas(
  tools: readonly {
    name: string
    description: string
    parameters: Record<string, unknown>
    deferLoading?: true
  }[],
  enabled: boolean,
  prefixes: readonly string[],
): ProjectedSchema[] {
  return tools.map((definition) => {
    const schema = projectSchema(definition)
    if (!enabled || !injectable(definition.name, definition.parameters, prefixes)) return schema
    return { ...schema, parameters: withDescriptionParameter(definition.parameters) }
  })
}
