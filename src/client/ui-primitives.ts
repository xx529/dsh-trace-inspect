/// <reference path="./ui-primitives.d.ts" />
/**
 * ui-primitives.ts — the single, guarded access point to the host-injected
 * `@deepseek-ai/dsh-client-ui-primitives` package.
 *
 * Why a guarded `require` instead of a dependency: the package is a DSH client
 * seed (the same way plugins reach `react`), so the plugin must not declare it
 * in package.json. esbuild keeps the specifier `external`, and the built
 * client bundle resolves it through the `__ModuleLoader__` factory's own
 * `require`. If a host ever stops providing it — or provides a different shape
 * — the loader returns `null` and every consumer degrades to `<RawText>`
 * instead of throwing during render (契约 §4.1).
 *
 * Resolution is memoized; `setPrimitivesForTest` is the unit-test seam (the
 * vitest ESM runner injects a real CJS `require`, so a test cannot otherwise
 * stand in for the host).
 */
import type { ComponentType, ReactNode } from 'react'
import type { MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'

export type { CodeToolbarLabels, MarkdownCodeLabels, MarkdownLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** The subset of the host module this plugin consumes. */
export interface PrimitivesModule {
  MarkdownText: ComponentType<{
    text: string
    streaming?: boolean
    labels: MarkdownLabels
    variant?: 'body' | 'compact'
  }>
  MarkdownDelegateProvider: ComponentType<{
    children?: ReactNode
    openFile?: (path: string, options?: { line?: number }) => void
  }>
}

/** Cached resolution: `undefined` = not resolved yet, `null` = unavailable. */
let cached: PrimitivesModule | null | undefined

/** Test seam override (see {@link setPrimitivesForTest}). */
let override: PrimitivesModule | null | undefined

/**
 * Resolve the host module. Never throws: a missing package, a non-CJS
 * environment, or a changed export shape all collapse to `null`.
 * @returns The primitives, or `null` when the host does not provide them.
 */
function requirePrimitives(): PrimitivesModule | null {
  try {
    // A static literal so esbuild can honor `external` for this specifier.
    if (typeof require !== 'function') return null
    const mod = require('@deepseek-ai/dsh-client-ui-primitives') as {
      MarkdownText?: unknown
      MarkdownDelegateProvider?: unknown
      default?: unknown
    } | null | undefined
    if (mod === null || mod === undefined) return null
    const bag = (
      mod.MarkdownText === undefined && mod.default !== null && typeof mod.default === 'object'
        ? mod.default
        : mod
    ) as { MarkdownText?: unknown; MarkdownDelegateProvider?: unknown }
    if (bag === null || bag === undefined) return null
    if (bag.MarkdownText === undefined || bag.MarkdownDelegateProvider === undefined) return null
    return {
      MarkdownText: bag.MarkdownText as PrimitivesModule['MarkdownText'],
      MarkdownDelegateProvider: bag.MarkdownDelegateProvider as PrimitivesModule['MarkdownDelegateProvider'],
    }
  } catch {
    return null
  }
}

/**
 * Load the host UI primitives (memoized).
 * @returns The module, or `null` when unavailable — callers must degrade.
 */
export function loadPrimitives(): PrimitivesModule | null {
  if (cached !== undefined) return cached
  cached = override !== undefined ? override : requirePrimitives()
  return cached
}

/**
 * Install a synthetic primitives module and drop the memoized resolution.
 * Test-only seam: production code always goes through the guarded `require`.
 * @param next - Module to return, `null` to force the unavailable path, or
 * `undefined` to clear the override and restore the guarded `require`.
 */
export function setPrimitivesForTest(next: PrimitivesModule | null | undefined): void {
  override = next
  cached = undefined
}
