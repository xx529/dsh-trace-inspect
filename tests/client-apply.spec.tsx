/**
 * client-apply.spec.tsx — registration entry coverage: `apply()` must stay
 * inert without a usable `betterSidebar` service (optional peer — absent,
 * null, or missing/broken `registerTab`), and must register exactly one
 * `turn-outline` tab descriptor when the service is present.
 *
 * The inert path is the plugin's no-better-sidebar contract: no throw, no
 * error bar, no tab. Locking it here so a refactor cannot silently drop the
 * early return and start throwing on hosts without better-sidebar.
 */
import { describe, expect, it, vi } from 'vitest'
import { apply } from '../src/client/index'

interface ApplyCtx {
  get(name: string): unknown
  effect<T>(fn: () => T): T
}

/**
 * Mock the client container the way cordis does: `effect(fn)` RUNS fn and
 * treats its return value as the cleanup disposer. `betterSidebarValue` is
 * what `ctx.get('betterSidebar')` reports; `registerTabSpy` (when present)
 * stands in for the real service method.
 */
function makeCtx(betterSidebarValue: unknown, registerTabSpy?: (descriptor: unknown) => () => void): {
  ctx: ApplyCtx
  disposables: unknown[]
} {
  const disposables: unknown[] = []
  const sidebar =
    betterSidebarValue === 'service' ? { registerTab: registerTabSpy } : betterSidebarValue
  return {
    ctx: {
      get: (name: string) => (name === 'betterSidebar' ? sidebar : undefined),
      effect: <T,>(fn: () => T): T => {
        const result = fn()
        disposables.push(result)
        return result
      },
    },
    disposables,
  }
}

describe('client apply — registration entry', () => {
  it('stays inert when better-sidebar is absent (undefined)', () => {
    const registerTab = vi.fn(() => () => {})
    const { ctx } = makeCtx(undefined, registerTab)
    expect(() => apply(ctx)).not.toThrow()
    expect(registerTab).not.toHaveBeenCalled()
  })

  it('stays inert when better-sidebar is null', () => {
    const { ctx } = makeCtx(null)
    expect(() => apply(ctx)).not.toThrow()
  })

  it('stays inert when registerTab is missing on the service', () => {
    const { ctx } = makeCtx({})
    expect(() => apply(ctx)).not.toThrow()
  })

  it('stays inert when registerTab is not a function', () => {
    const { ctx } = makeCtx({ registerTab: 'not-a-function' })
    expect(() => apply(ctx)).not.toThrow()
  })

  it('registers exactly one turn-outline tab when the service is present', () => {
    const registerTab = vi.fn((descriptor: unknown) => () => {})
    const { ctx, disposables } = makeCtx('service', registerTab)
    expect(() => apply(ctx)).not.toThrow()
    expect(registerTab).toHaveBeenCalledTimes(1)
    const descriptor = registerTab.mock.calls[0]?.[0] as {
      id: string
      single: boolean
      order: number
      title: () => string
      description: () => string
      component: unknown
    }
    expect(descriptor.id).toBe('turn-outline')
    expect(descriptor.single).toBe(true)
    expect(typeof descriptor.title).toBe('function')
    // 0.2.0 native + menu: the guide page renders the descriptor's description.
    expect(typeof descriptor.description).toBe('function')
    expect(typeof descriptor.component).toBe('function')
    // cordis contract: the registerTab disposer is the effect cleanup.
    expect(disposables.length).toBeGreaterThan(0)
    expect(typeof disposables[disposables.length - 1]).toBe('function')
  })
})
