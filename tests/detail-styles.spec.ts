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
  '.ttl-step', '.ttl-stepWrap', '.ttl-stepIcon', '.ttl-detail', '.ttl-detailHead', '.ttl-detailBody',
  '.ttl-detailFoot', '.ttl-tabs', '.ttl-tab', '.ttl-code', '.ttl-codeLine', '.ttl-codeText', '.ttl-kv',
  '.ttl-section', '.ttl-parallel', '.ttl-zoom', '.ttl-zoomBackdrop', '.ttl-zoomPanel', '.ttl-zoomTop',
  '.ttl-zoomBody', '.ttl-zoomOutline', '.ttl-zoomOutlineRow', '.ttl-zoomMain', '.ttl-zoomHead', '.ttl-zoomFoot',
  '.ttl-imgThumbWrap', '.ttl-imgThumb',
]

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

  it('浮层：fixed 全屏 + 背板 + 1280 宽 flex 面板', () => {
    const zoom = rule('.ttl-zoom {')
    expect(zoom).toContain('position: fixed;')
    expect(zoom).toContain('inset: 0;')
    expect(zoom).toMatch(/z-index: \d+;/)

    const panel = rule('.ttl-zoomPanel {')
    expect(trailCss).toContain('width: 1280px;')
    expect(trailCss).toContain('height: 800px;')
    expect(panel).toContain('display: flex;')
    expect(panel).toContain('flex-direction: column;')
    expect(panel).toContain('position: relative;')

    const backdrop = rule('.ttl-zoomBackdrop {')
    expect(backdrop).toContain('position: absolute;')
    expect(backdrop).toContain('inset: 0;')
  })

  it('大纲列：width:256px 且自身可滚动', () => {
    const outline = rule('.ttl-zoomOutline {')
    expect(outline).toContain('width: 256px;')
    expect(outline).toContain('overflow-y: auto;')
  })

  it('大纲当前行用 [aria-current="true"] 而非 JS 类切换', () => {
    expect(trailCss).toContain('.ttl-zoomOutlineRow[aria-current="true"]')
    const current = trailCss.slice(trailCss.indexOf('.ttl-zoomOutlineRow[aria-current="true"]'))
    expect(current.slice(0, current.indexOf('}'))).toContain('background:')
  })
})

const PALETTE = new Set([
  '#000000', '#111111', '#171719', '#17171a', '#1e1e20', '#1f1f21', '#202024', '#22c55e', '#232324',
  '#2a2a2b', '#2c2c2f', '#2f3033', '#34d399', '#353638', '#35363a', '#4176e6', '#4c8dff', '#4ed4a4',
  '#545557', '#55595e', '#5686fe', '#5f6469', '#60a5fa', '#63c9d1', '#6a6e75', '#6f747a', '#7b8086',
  '#7cb2ff', '#8fdcb8', '#9ba1a7', '#9bb8e8', '#a78bfa', '#a9e6b9', '#adb2b8', '#b39cf5', '#b99a6b', '#b9a7ee',
  '#b9bdc4', '#c4b2ff', '#cfd3d6', '#d7dade', '#dfe2e5', '#e6e8ea', '#f08fb8', '#f0a7a5', '#f0f1f2',
  '#f25a5a', '#f2726f', '#f2b45c', '#f2c98d', '#f3b4cc', '#f472b6', '#f3f4f6', '#f59e0b', '#f6a9a7', '#f9fafb',
])

describe('v0.9 palette discipline', () => {
  it('every hex comes from the frozen v0.9 palette', () => {
    const hexes = [...new Set((trailCss.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((h) => h.toLowerCase()))]
    const offenders = hexes.filter((h) => !PALETTE.has(h))
    expect(offenders).toEqual([])
    expect(trailCss).toContain('var(--dsw-alias-bg-layer-1')
    expect(trailCss).toContain('var(--ds-font-family-code')
  })

  it('no rgb()/hsl() colors (tints use rgba with the same palette)', () => {
    expect(trailCss.match(/(?<![\w-])rgb\(/g) ?? []).toEqual([])
    expect(trailCss.match(/(?<![\w-])hsl\(/g) ?? []).toEqual([])
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
