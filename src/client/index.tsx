/**
 * Client half of dsh-turn-outline: register the 「轮次轨迹」tab with
 * dsh-better-sidebar (optional peer — inert without it) and inject the
 * token-driven stylesheet once.
 *
 * Bundle purity: `dsh-better-sidebar` is never value-imported — the tab is
 * registered through `ctx.betterSidebar` at runtime; `react` resolves from
 * the client module system seed; the tab glyph is an inline SVG (no
 * ui-primitives dependency), so the panel works without it.
 */
import * as React from 'react'
import { trailCss } from './styles'
import { TrailTab } from './TrailTab'

/**
 * Tab glyph — Lucide `route` (ISC license): two round endpoints joined by an
 * S-shaped detour, reading as the trail between turns. Drawn inline at 24
 * grid with stroke 2 so it scales cleanly to the 14px tab size; keeps the tab
 * visually distinct from the source-control branch icon it previously shared
 * (ui-primitives IconBranchOutline16). Chosen over a 4-node waypoints glyph
 * after a 14px density review: 3 elements render far less crowded in the
 * selected-tab state.
 */
function routeIcon(size: number): React.ReactNode {
  const children = [
    React.createElement('circle', { key: 'a', cx: 6, cy: 19, r: 3 }),
    React.createElement('path', { key: 'p', d: 'M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15' }),
    React.createElement('circle', { key: 'b', cx: 18, cy: 5, r: 3 }),
  ]
  return React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: size,
      height: size,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
    },
    children,
  )
}

export const inject = ['sessions', 'uiConversation', 'betterSidebar']

/**
 * Localized one-liners for the native right-Sidebar guide page (DSH
 * 0.1.5-rc.1+ / 0.2.0 render the descriptor's description under the title;
 * a descriptor without one renders the bare title).
 */
function tabDescription(): string {
  if (typeof navigator === 'undefined') return 'Turn outline'
  return navigator.language.toLowerCase().startsWith('zh')
    ? '按用户轮次折叠会话轨迹，一键定位回对话原位'
    : 'Fold the session into per-turn steps and jump back to any of them'
}

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
    description: tabDescription,
    icon: (size: number) => routeIcon(size),
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
