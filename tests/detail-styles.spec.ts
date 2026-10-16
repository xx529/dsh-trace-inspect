/**
 * detail-styles.spec.ts — mechanical gate for the frozen v0.5.0 style/copy
 * contract (docs/detail-contract-v1.md「附：v0.5.0 契约补充」§10.4).
 *
 * This is deliberately a *mechanical* check, not a behaviour test: T6 consumes
 * these class names and dictionary keys verbatim, so a typo or a dropped token
 * must fail here rather than silently ship an unstyled overlay or an English
 * string in the zh UI. It asserts
 *
 *   1. every §10.4.1 class name is present in the injected CSS,
 *   2. the frozen geometry of §10.4.1 (thumbnail clamp, fixed overlay,
 *      min()-sized flex panel, 260px scrollable outline),
 *   3. token discipline: no bare hex/rgba/hsl outside a `var(--dsw-*)`
 *      fallback, and radii come from the native `--dsw-radius-*` scale,
 *   4. every §10.4.2 key exists in BOTH dictionaries with the contracted type
 *      and the contracted string,
 *   5. the v0.4.0 classes/keys are still there (nothing was renamed).
 */
import { describe, expect, it } from 'vitest'
import { trailCss } from '../src/client/styles'
import { t } from '../src/client/locales'
import type { Dict } from '../src/client/locales'

/** Contract §10.4.1 — 20 entries, names verbatim (the last one is a full selector). */
const CONTRACT_CLASSES = [
  '.ttl-imgThumbWrap',
  '.ttl-imgThumb',
  '.ttl-detailLoad',
  '.ttl-detailRetry',
  '.ttl-detailMerged',
  '.ttl-zoom',
  '.ttl-zoomBackdrop',
  '.ttl-zoomPanel',
  '.ttl-zoomHead',
  '.ttl-zoomTitle',
  '.ttl-zoomTools',
  '.ttl-zoomSearch',
  '.ttl-zoomBody',
  '.ttl-zoomOutline',
  '.ttl-zoomOutlineRow',
  '.ttl-zoomOutlineRow[aria-current="true"]',
  '.ttl-zoomPane',
  '.ttl-zoomTabs',
  '.ttl-zoomFoot',
  '.ttl-zoomKbd',
] as const

/** Body of the first rule whose selector text starts at `selector`. */
function rule(selector: string): string {
  const start = trailCss.indexOf(selector)
  if (start < 0) throw new Error(`selector missing from styles.ts: ${selector}`)
  const open = trailCss.indexOf('{', start)
  const close = trailCss.indexOf('}', open)
  return trailCss.slice(open + 1, close)
}

/** Strip every `var(--token, fallback)` span — what remains is a hardcoded value. */
function stripVars(css: string): string {
  return css.replace(/var\(--[a-z0-9-]+\s*(?:,\s*(?:[^()]|\([^()]*\))*)?\)/gi, 'VAR')
}

const V050_MARKER = 'v0.5.0 (契约 §10.4.1)'

describe('§10.4.1 新增 CSS 类', () => {
  it('20 个类名逐字出现在 styles.ts 的 CSS 里', () => {
    const missing = CONTRACT_CLASSES.filter((name) => !trailCss.includes(name))
    expect(missing).toEqual([])
  })

  it('缩略图：max-width 100% / max-height 140px / 圆角取自 --dsw-radius-*', () => {
    const thumb = rule('.ttl-imgThumb {')
    expect(thumb).toContain('max-width: 100%;')
    expect(thumb).toContain('max-height: 140px;')
    expect(thumb).toMatch(/border-radius: var\(--dsw-radius-[a-z]+,\s*\d+px\);/)
    expect(rule('.ttl-imgThumbWrap')).toContain('max-width: 100%;')
  })

  it('浮层：position:fixed / inset:0 / z-index:60；面板 min() 尺寸 + display:flex', () => {
    const zoom = rule('.ttl-zoom {')
    expect(zoom).toContain('position: fixed;')
    expect(zoom).toContain('inset: 0;')
    expect(zoom).toContain('z-index: 60;')

    const panel = rule('.ttl-zoomPanel {')
    expect(panel).toContain('width: min(1080px, 92vw);')
    expect(panel).toContain('height: min(760px, 88vh);')
    expect(panel).toContain('display: flex;')
    expect(panel).toContain('flex-direction: column;')

    // 背板铺满 fixed 层；面板必须相对定位以便叠在背板之上。
    const backdrop = rule('.ttl-zoomBackdrop {')
    expect(backdrop).toContain('position: absolute;')
    expect(backdrop).toContain('inset: 0;')
    expect(panel).toContain('position: relative;')
  })

  it('大纲列：width:260px 且自身可滚动', () => {
    const outline = rule('.ttl-zoomOutline {')
    expect(outline).toContain('width: 260px;')
    expect(outline).toContain('overflow-y: auto;')
  })

  it('大纲当前行用 [aria-current="true"] 而非 JS 类切换', () => {
    expect(trailCss).toContain('.ttl-zoomOutlineRow[aria-current="true"]')
    const current = trailCss.slice(trailCss.indexOf('.ttl-zoomOutlineRow[aria-current="true"]'))
    expect(current.slice(0, current.indexOf('}'))).toContain('background:')
  })
})

describe('§10.4.1 颜色/字体纪律', () => {
  it('整份 CSS 里没有裸 hex：hex 只能出现在 var(--dsw-*) 的 fallback 里', () => {
    expect(stripVars(trailCss).match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
    const offenders = trailCss
      .split('\n')
      .filter((line) => /#[0-9a-fA-F]{3,8}\b/.test(line) && !line.includes('var(--dsw-'))
    expect(offenders).toEqual([])
  })

  it('v0.5.0 新增段连裸 rgba/hsl 都没有（折叠态旧段不在本断言范围）', () => {
    const start = trailCss.indexOf(V050_MARKER)
    expect(start).toBeGreaterThan(0)
    const section = stripVars(trailCss.slice(start))
    expect(section.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
    expect(section.match(/(?<![\w-])(?:rgba?|hsla?)\(/g) ?? []).toEqual([])
  })

  it('v0.5.0 新增段只用 --dsw-* / --ds-font-family-code token', () => {
    const start = trailCss.indexOf(V050_MARKER)
    const section = trailCss.slice(start)
    const tokens = [...section.matchAll(/var\((--[a-z0-9-]+)/gi)].map((match) => match[1]!)
    expect(tokens.length).toBeGreaterThan(0)
    const foreign = [...new Set(tokens)].filter(
      (token) => !token.startsWith('--dsw-') && token !== '--ds-font-family-code',
    )
    expect(foreign).toEqual([])
  })
})

/** Contract §10.4.2 — the 11 plain strings. */
const STRING_KEYS = [
  ['imageLoadFailed', '图片加载失败，仅显示元数据', 'Image failed to load — metadata only'],
  ['detailLoading', '载入完整内容…', 'Loading full content…'],
  ['detailLoadFailed', '完整内容加载失败，当前显示截断预览', 'Failed to load full content — showing the truncated preview'],
  ['detailRetry', '重试', 'Retry'],
  ['detailLoadedFull', '已载入完整内容', 'Full content loaded'],
  ['zoomOpen', '放大查看', 'Open zoomed view'],
  ['zoomClose', '关闭', 'Close'],
  ['zoomSearch', '搜索步骤', 'Search steps'],
  ['zoomNoMatch', '无匹配步骤', 'No matching step'],
  ['zoomExport', '导出 JSON', 'Export JSON'],
  ['zoomHint', 'Esc 关闭 · ↑↓ 切步 · ⌘F 搜索', 'Esc close · ↑↓ step · ⌘F search'],
] as const satisfies ReadonlyArray<readonly [keyof Dict, string, string]>

describe('§10.4.2 新增文案键', () => {
  it('11 个字符串键在 zh/en 都存在、类型为 string、文案逐字一致', () => {
    for (const [key, zhText, enText] of STRING_KEYS) {
      expect(typeof t('zh', key), `zh:${key}`).toBe('string')
      expect(typeof t('en', key), `en:${key}`).toBe('string')
      expect(t('zh', key), `zh:${key}`).toBe(zhText)
      expect(t('en', key), `en:${key}`).toBe(enText)
      // zh/en 文案必须真的不同（防止把中文复制进 en）。
      expect(enText, key).not.toBe(zhText)
    }
  })

  it('mergedNoSurfaceOp(n) 是函数型且插值正确', () => {
    const zhFn = t('zh', 'mergedNoSurfaceOp')
    const enFn = t('en', 'mergedNoSurfaceOp')
    expect(typeof zhFn).toBe('function')
    expect(typeof enFn).toBe('function')
    expect((zhFn as (n: number) => string)(3)).toBe('该内容由 3 条结果合并，事件未声明 surfaceOp')
    expect((enFn as (n: number) => string)(3)).toBe(
      'Merged from 3 results — the events declared no surfaceOp',
    )
  })

  it('zoomTitle(name) 是函数型且插值正确', () => {
    const zhFn = t('zh', 'zoomTitle')
    const enFn = t('en', 'zoomTitle')
    expect(typeof zhFn).toBe('function')
    expect(typeof enFn).toBe('function')
    expect((zhFn as (name: string) => string)('bash')).toBe('bash · 步骤详情')
    expect((enFn as (name: string) => string)('bash')).toBe('bash · step details')
  })
})

describe('向后兼容：v0.4.0 的类与键没有被删改', () => {
  it('既有 ttl- 类仍然在 CSS 里', () => {
    const legacy = [
      'ttl-root',
      'ttl-stepWrap',
      'ttl-detail',
      'ttl-detailFoot',
      'ttl-pillWarn',
      'ttl-json',
      'ttl-md',
      'ttl-raw',
      'ttl-imgChip',
      'ttl-errorBlock',
    ]
    const missing = legacy.filter((name) => !trailCss.includes(`.${name}`))
    expect(missing).toEqual([])
  })

  it('既有键仍然在 zh/en 字典里', () => {
    const legacy: Array<keyof Dict> = ['tabTitle', 'retry', 'detailParams', 'detailResult', 'imageLabel']
    for (const key of legacy) {
      expect(t('zh', key), `zh:${key}`).toBeTruthy()
      expect(t('en', key), `en:${key}`).toBeTruthy()
    }
    expect(t('en', 'tabTitle')).toBe('Turn Outline')
    expect(t('zh', 'tabTitle')).toBe('轮次轨迹')
  })
})
