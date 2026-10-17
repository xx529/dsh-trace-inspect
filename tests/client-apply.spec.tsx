/**
 * client-apply.spec.tsx — registration entry coverage: `apply()` must stay
 * inert without a usable `betterSidebar` service (optional peer — absent,
 * null, or missing/broken `registerTab`), and must register exactly one
 * `trace-inspect` tab descriptor when the service is present.
 *
 * The inert path is the plugin's no-better-sidebar contract: no throw, no
 * error bar, no tab. Locking it here so a refactor cannot silently drop the
 * early return and start throwing on hosts without better-sidebar.
 *
 * Language: the tab name must follow DSH's own UI locale, not
 * `navigator.language` — inside Electron that reports the Chromium default
 * (`en-US`) even for a Chinese UI, which is exactly how the sidebar ended up
 * showing "Turn Outline" next to Chinese chrome.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply } from '../src/client/index'
import { detectLang, setHostLocale } from '../src/client/locales'

interface ApplyCtx {
  get(name: string): unknown
  effect<T>(fn: () => T): T
}

/** Stand-in for DSH's client `locale` service (getLocale + subscribe). */
function localeService(initial: string): {
  getLocale: () => { active: string }
  subscribe: (listener: () => void) => () => void
  set: (next: string) => void
} {
  const listeners = new Set<() => void>()
  let active = initial
  return {
    getLocale: () => ({ active }),
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set: (next: string) => {
      active = next
      for (const listener of listeners) listener()
    },
  }
}

/**
 * Mock the client container the way cordis does: `effect(fn)` RUNS fn and
 * treats its return value as the cleanup disposer. `betterSidebarValue` is
 * what `ctx.get('betterSidebar')` reports; `registerTabSpy` (when present)
 * stands in for the real service method; `localeValue` stands in for
 * `ctx.get('locale')`.
 */
function makeCtx(
  betterSidebarValue: unknown,
  registerTabSpy?: (descriptor: unknown) => () => void,
  localeValue?: unknown,
): {
  ctx: ApplyCtx
  disposables: unknown[]
} {
  const disposables: unknown[] = []
  const sidebar =
    betterSidebarValue === 'service' ? { registerTab: registerTabSpy } : betterSidebarValue
  return {
    ctx: {
      get: (name: string) => {
        if (name === 'betterSidebar') return sidebar
        if (name === 'locale') return localeValue
        return undefined
      },
      effect: <T,>(fn: () => T): T => {
        const result = fn()
        disposables.push(result)
        return result
      },
    },
    disposables,
  }
}

interface Descriptor {
  id: string
  single: boolean
  order: number
  title: () => string
  description: () => string
  component: unknown
}

function descriptorOf(registerTab: ReturnType<typeof vi.fn>): Descriptor {
  return registerTab.mock.calls[0]?.[0] as Descriptor
}

const ZH_TITLE = '轮次轨迹'
const EN_TITLE = 'Turn Outline'
const ZH_DESCRIPTION = '按用户轮次折叠会话轨迹，一键定位回对话原位'

afterEach(() => {
  setHostLocale(null)
  document.documentElement.lang = ''
})

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

  it('registers exactly one trace-inspect tab when the service is present', () => {
    const registerTab = vi.fn((descriptor: unknown) => () => {})
    const { ctx, disposables } = makeCtx('service', registerTab)
    expect(() => apply(ctx)).not.toThrow()
    expect(registerTab).toHaveBeenCalledTimes(1)
    const descriptor = descriptorOf(registerTab)
    expect(descriptor.id).toBe('trace-inspect')
    expect(descriptor.single).toBe(true)
    expect(typeof descriptor.title).toBe('function')
    // User-visible title stays 「轮次轨迹」/「Turn Outline」, whichever the host UI is.
    expect([ZH_TITLE, EN_TITLE]).toContain(descriptor.title())
    // 0.2.0 native + menu: the guide page renders the descriptor's description.
    expect(typeof descriptor.description).toBe('function')
    expect(typeof descriptor.component).toBe('function')
    // The injected stylesheet carries the renamed dataset (契约 §1).
    expect(document.head.querySelector('style[data-plugin="dsh-trace-inspect"]')).toBeTruthy()
    // cordis contract: the registerTab disposer is the effect cleanup.
    expect(disposables.length).toBeGreaterThan(0)
    expect(typeof disposables[disposables.length - 1]).toBe('function')
  })
})

describe('client apply — tab name follows the host UI locale', () => {
  it('uses the DSH locale service even when navigator.language is en-US', () => {
    // jsdom's navigator.language is en-US — the Electron situation that made a
    // Chinese UI show "Turn Outline". The host locale service must win.
    expect(typeof navigator !== 'undefined' && navigator.language).toBe('en-US')
    const locale = localeService('zh')
    const registerTab = vi.fn(() => () => {})
    const { ctx } = makeCtx('service', registerTab, locale)
    apply(ctx)
    const descriptor = descriptorOf(registerTab)
    expect(descriptor.title()).toBe(ZH_TITLE)
    expect(descriptor.description()).toBe(ZH_DESCRIPTION)
  })

  it('lets the host locale override a Chinese navigator.language in the other direction too', () => {
    const locale = localeService('en-US')
    const registerTab = vi.fn(() => () => {})
    const { ctx } = makeCtx('service', registerTab, locale)
    apply(ctx)
    expect(descriptorOf(registerTab).title()).toBe(EN_TITLE)
  })

  it('normalizes region-tagged locale ids (zh-CN)', () => {
    const locale = localeService('zh-CN')
    const registerTab = vi.fn(() => () => {})
    const { ctx } = makeCtx('service', registerTab, locale)
    apply(ctx)
    expect(descriptorOf(registerTab).title()).toBe(ZH_TITLE)
  })

  it('follows a live locale switch through the service subscription', () => {
    const locale = localeService('en')
    const registerTab = vi.fn(() => () => {})
    const { ctx } = makeCtx('service', registerTab, locale)
    apply(ctx)
    const descriptor = descriptorOf(registerTab)
    expect(descriptor.title()).toBe(EN_TITLE)
    locale.set('zh')
    expect(descriptor.title()).toBe(ZH_TITLE)
    expect(detectLang()).toBe('zh')
  })

  it('falls back to html[lang] when the host locale service is absent', () => {
    document.documentElement.lang = 'zh-CN'
    const registerTab = vi.fn(() => () => {})
    const { ctx } = makeCtx('service', registerTab)
    apply(ctx)
    expect(descriptorOf(registerTab).title()).toBe(ZH_TITLE)
  })

  it('survives a locale service that throws or is malformed', () => {
    const broken = {
      getLocale: () => {
        throw new Error('boom')
      },
      subscribe: () => () => {},
    }
    const registerTab = vi.fn(() => () => {})
    const { ctx } = makeCtx('service', registerTab, broken)
    expect(() => apply(ctx)).not.toThrow()
    expect([ZH_TITLE, EN_TITLE]).toContain(descriptorOf(registerTab).title())
  })
})
