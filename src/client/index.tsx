/**
 * Client half of dsh-turn-outline: register the 「轮次轨迹」tab with
 * dsh-better-sidebar (optional peer — inert without it) and inject the
 * token-driven stylesheet once.
 *
 * Bundle purity: `dsh-better-sidebar` is never value-imported — the tab is
 * registered through `ctx.betterSidebar` at runtime; `react` resolves from
 * the client module system seed; `@deepseek-ai/dsh-client-ui-primitives` is
 * required lazily with a glyph fallback so the panel works without it.
 */
import * as React from 'react'
import { trailCss } from './styles'
import { TrailTab } from './TrailTab'

/** Icon primitives with an exact list glyph fallback (not a dropdown arrow). */
const primitives = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@deepseek-ai/dsh-client-ui-primitives')
  } catch {
    return null
  }
})()

function listIcon(): React.ReactNode {
  const path = React.createElement('path', {
    d: 'M3 3.5h10M3 8h10M3 12.5h6',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  })
  return React.createElement('svg', { viewBox: '0 0 16 16', width: '14', height: '14', 'aria-hidden': true }, path)
}

/**
 * Tab glyph. Prefer a ui-primitives BRANCH icon (IconBranchOutline16 — a
 * flow/path) so the「轮次轨迹」tab reads as a trail of turns, not a dropdown
 * arrow; fall back to our own three-line list glyph.
 */
function tabIcon(size: number): React.ReactNode {
  const IconList = primitives !== null && typeof primitives.IconBranchOutline16 === 'function'
    ? primitives.IconBranchOutline16
    : null
  if (IconList !== null) return React.createElement(IconList, { size })
  return listIcon()
}

export const inject = ['sessions', 'betterSidebar']

export function apply(ctx: {
  get(name: string): unknown
  effect<T>(fn: () => T): T
}): void {
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-turn-outline'
  style.textContent = trailCss
  document.head.appendChild(style)
  // cordis ctx.effect(fn) RUNS fn to register and treats its RETURN VALUE as
  // the cleanup. A single arrow executes style.remove() immediately (the
  // injected <style> is deleted on the spot → styles never apply). Double
  // arrow returns the cleanup so the sheet survives (matches conversation-
  // outline, the working reference).
  ctx.effect(() => () => style.remove())

  const betterSidebar = ctx.get('betterSidebar')
  if (
    betterSidebar === undefined || betterSidebar === null
    || typeof (betterSidebar as { registerTab?: unknown }).registerTab !== 'function'
  ) {
    // No better-sidebar: stay inert (the plan's no-op path).
    return
  }

  ctx.effect(() => (betterSidebar as { registerTab(descriptor: unknown): () => void }).registerTab({
    id: 'turn-outline',
    title: () => (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')
      ? '轮次轨迹'
      : 'Turn Outline'),
    icon: (size: number) => tabIcon(size),
    order: 46,
    single: true,
    component: (props: {
      ctx: { get(name: string): unknown }
      store?: unknown
      scope: { sessionId: string; cwd?: string }
      tab: { id: string }
      visible: boolean
    }) => React.createElement(TrailTab, {
      ctx: props.ctx,
      scope: props.scope,
      visible: props.visible === true,
      tab: props.tab,
    }),
  }))
}
