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
  '.ttl-detailFoot', '.ttl-tabs', '.ttl-tab', '.ttl-code', '.ttl-codeLine', '.ttl-codeText',
  '.ttl-section', '.ttl-parallel', '.ttl-valueViewer', '.ttl-valueBackdrop', '.ttl-valuePanel',
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

})

const PALETTE = new Set([
  '#000000', '#111111', '#171719', '#17171a', '#1e1e20', '#1f1f21', '#202024', '#22c55e', '#232324',
  '#2a2a2b', '#2c2c2f', '#2f3033', '#34d399', '#353638', '#35363a', '#4176e6', '#4c8dff', '#4ed4a4',
  '#545557', '#55595e', '#5686fe', '#5f6469', '#60a5fa', '#63c9d1', '#6a6e75', '#6f747a', '#7b8086',
  '#7cb2ff', '#8fdcb8', '#9ba1a7', '#9bb8e8', '#a78bfa', '#a9e6b9', '#adb2b8', '#b39cf5', '#b99a6b', '#b9a7ee',
  '#b9bdc4', '#c4b2ff', '#cfd3d6', '#d7dade', '#d97757', '#dfe2e5', '#e6e8ea', '#f08fb8', '#f0a7a5', '#f0f1f2',
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

describe('v0.10.2: 统一 ICON 底色 + 图标间竖线（原型 2-02）', () => {
  it('ICON 底色统一为中性面，不再按工具家族着色', () => {
    const chip = rule('.ttl-stepIcon {')
    expect(chip).toContain('var(--dsw-alias-bg-layer-2')
    // 只有报错家族还允许自己的 chip 底色；其余家族只保留字形颜色。
    const tinted = [...trailCss.matchAll(/\.ttl-stepIcon\.ttl-tone-(shell|read|edit|mcp|todo|generic)\s*\{[^}]*background/gi)]
    expect(tinted).toEqual([])
  })

  it('报错 chip 仍是红底（不透明，避免竖线透出）', () => {
    const err = rule('.ttl-step[data-step-kind="error"] .ttl-stepIcon')
    expect(err).toContain('color-mix')
    expect(err).toContain('--dsw-alias-state-error-primary')
  })

  it('竖线恢复，且只显示在图标之间（图标不透明、竖线居中对齐图标中心）', () => {
    expect(trailCss).not.toMatch(/^\.ttl-stepRail\s*\{\s*display:\s*none/m)
    const rail = rule('.ttl-turn .ttl-stepRail {')
    expect(rail).toContain('left: 23px;')
    // 18px chip + 14px 左内边距 → 图标中心 23px；chip 自身 z-index 1 盖住穿过部分。
    expect(rule('.ttl-stepIcon {')).toContain('z-index: 1;')
  })
})

describe('v0.10.12: 展开的输出是卡片', () => {
  it('展开体与详情带同款 surface / 圆角 / 边框 / 内边距 / 13.5px 内缩', () => {
    const body = rule('.ttl-msgBody {')
    expect(body).toContain('margin: 4px 13.5px 10px;')
    expect(body).toContain('padding: 12px;')
    expect(body).toContain('border-radius: 8px;')
    expect(body).toContain('background: color-mix(')
    expect(body).toContain('border: 1px solid var(--dsw-alias-border-l1')
    // The old bare-text padding must be gone.
    expect(body).not.toContain('padding: 6px 22px 10px 14px;')
  })
})

describe('v0.10.10: 工具族不再有灰色字形', () => {
  it('todo 用薄荷色、figma 用淡紫色，二者都有 dist/legend 底色', () => {
    expect(trailCss).toContain('.ttl-tone-todo { color: #8fdcb8; }')
    expect(trailCss).toContain('.ttl-tone-figma { color: #c4b2ff; }')
    expect(trailCss).toContain('.ttl-distSeg.ttl-tone-todo, .ttl-legendDot.ttl-tone-todo { background: #8fdcb8; }')
    expect(trailCss).toContain('.ttl-distSeg.ttl-tone-figma, .ttl-legendDot.ttl-tone-figma { background: #c4b2ff; }')
    // The old grey todo ink must be gone from the final cascade.
    const todoRules = [...trailCss.matchAll(/\.ttl-tone-todo\s*\{[^}]*\}/g)].map((m) => m[0])
    expect(todoRules.some((rule) => rule.includes('#9ba1a7'))).toBe(false)
  })
})

describe('v0.10.27: 挪出 meta 后统计数字仍与图标居中', () => {
  it('.ttl-mix 自带 13px 行盒（不再依赖 .ttl-turnMeta 继承）', () => {
    expect(rule('.ttl-mix {')).toContain('line-height: 13px;')
  })
})

describe('v0.10.45: 参数 JSON 长值换行', () => {
  it('.ttl-jsonPretty wraps instead of silently scrolling horizontally', () => {
    const rule = '.ttl-jsonPretty {'
    expect(trailCss).toContain(rule)
    const block = trailCss.slice(trailCss.indexOf(rule), trailCss.indexOf('}', trailCss.indexOf(rule)))
    expect(block).toContain('white-space: pre-wrap')
    expect(block).toContain('overflow-wrap: anywhere')
    expect(block).toContain('overflow-x: hidden')
  })
})

describe('v0.10.47: 注入正文与输出一样完整展开', () => {
  it('.ttl-ctxSections grows with its content — no 141px inner scroll', () => {
    const block = rule('.ttl-ctxSections {')
    expect(block).toContain('max-height: none;')
    expect(block).toContain('overflow: visible;')
    // The old capped card clipped long injections mid-sentence.
    expect(trailCss).not.toContain('max-height: 141px;')
  })
})

describe('v0.10.34: 统计数字与图标同尺度 (SVG text)', () => {
  it('.ttl-mixCount is a 13px SVG box; digits use the 9.5px code font', () => {
    expect(rule('.ttl-mixCount {')).toContain('height: 13px')
    const text = rule('.ttl-mixCount text {')
    expect(text).toContain('font-size: 9.5px')
  })
})

describe('v0.10.32: 长值内联 JSON + 蓝色省略号', () => {
  it('不再有卡片/按钮：值以 JSON 字符串内联，只有 ⤢ 前的蓝色 … 可点', () => {
    const block = rule('.ttl-jpLong {')
    expect(block).toContain('display: flex')
    expect(rule('.ttl-jpLineFlex {')).toContain('display: flex')
    expect(block).not.toContain('border')
    expect(block).not.toContain('background')
    expect(rule('.ttl-jpLongMore {')).toContain('color: var(--dsw-static-blue-300, #7cb2ff);')
    expect(trailCss).not.toContain('.ttl-jpLongAction')
    expect(trailCss).not.toContain('.ttl-jpLongFoot')
    expect(trailCss).not.toContain('.ttl-jpRestored')
  })
})

describe('v0.10.30: 单值查看器背景模糊（放大浮层移除）', () => {
  it('.ttl-valueBackdrop 带 backdrop-filter blur', () => {
    const backdrop = rule('.ttl-valueBackdrop {')
    expect(backdrop).toContain('backdrop-filter: blur(6px);')
    expect(backdrop).toContain('-webkit-backdrop-filter: blur(6px);')
  })

  it('旧放大浮层的 class 已从 CSS 中移除', () => {
    for (const legacy of ['.ttl-zoom {', '.ttl-zoomBackdrop {', '.ttl-zoomPanel {', '.ttl-zoomOutline {']) {
      expect(trailCss).not.toContain(legacy)
    }
    expect(trailCss).not.toContain('.ttl-clickablePane')
  })
})

describe('v0.10.25: 簇统计挪到「时长」一侧', () => {
  it('.ttl-mix 在左侧分组里换行时左对齐', () => {
    const mix = rule('.ttl-mix {')
    expect(mix).toContain('flex: 0 1 auto;')
    expect(mix).toContain('justify-content: flex-start;')
  })
})

describe('v0.10.24: 搜索收进头部、去掉空闲的 ⋯', () => {
  it('旧的全宽搜索行样式已移除，头部内联搜索是紧凑高度', () => {
    expect(trailCss).not.toContain('.ttl-searchRow {')
    expect(rule('.ttl-header .ttl-search {')).toContain('height: 24px;')
    expect(rule('.ttl-header .ttl-search {')).toContain('max-width: 240px;')
  })

  it('工具下拉跟着少一行上移', () => {
    expect(rule('.ttl-toolDropdown {')).toContain('top: 82px;')
  })
})

describe('v0.10.23: 展开态保留簇统计', () => {
  it('展开的轮次不再隐藏 .ttl-mix', () => {
    // The old v0.9 rule hid the strip on open (prototype 2-02); v0.10.23 keeps
    // it because the chips are the same 1:1 ledger as the expanded rows.
    expect(trailCss).not.toMatch(/\.ttl-turn\[data-collapsed="false"\][^{]*\.ttl-mix[^{]*\{[^}]*display:\s*none/)
    expect(trailCss).toContain('.ttl-turn[data-collapsed="false"] .ttl-mix { display: inline-flex; }')
  })
})

describe('v0.10.20: 统计条与行图标共用墨色 + 数字与图标居中对齐', () => {
  it('mix 行高对齐 13px 图标网格（数字不再偏上）', () => {
    const meta = rule('.ttl-turnMeta {')
    expect(meta).toContain('line-height: 13px;')
    expect(meta).toContain('align-items: center;')
  })

  it('分布条 / 图例 dot 也走 .ttl-ink-*（含 display 规则）', () => {
    expect(trailCss).toContain('.ttl-distSeg.ttl-ink-violet, .ttl-legendDot.ttl-ink-violet { background: #a78bfa; }')
    expect(trailCss).toContain('.ttl-distSeg.ttl-ink-pink, .ttl-legendDot.ttl-ink-pink { background: #f08fb8; }')
    expect(trailCss).toContain('.ttl-distSeg[class*="ttl-tone-"], .ttl-distSeg[class*="ttl-ink-"]')
    expect(trailCss).toContain('.ttl-legendDot[class*="ttl-tone-"], .ttl-legendDot[class*="ttl-ink-"]')
  })
})

describe('v0.10.19: 每个工作簇一个图标与一种墨色', () => {
  it('八种 ink 规则齐全；青色复用既有 skill 家族色，不引入新 hex', () => {
    const inks: Array<[string, string]> = [
      ['violet', '#a78bfa'], ['blue', '#60a5fa'], ['green', '#34d399'], ['amber', '#f2b45c'],
      ['pink', '#f08fb8'], ['teal', '#63c9d1'], ['gray', '#9ba1a7'], ['red', '#f2726f'],
    ]
    for (const [ink, hex] of inks) expect(trailCss).toContain(`.ttl-ink-${ink} { color: ${hex}; }`)
  })

  it('ink 只给字形上色，不改变 chip 底色', () => {
    // 行/详情 chip 的底色仍由 .ttl-stepIcon 统一给；ink 只在 dist / legend dot
    // 这类本来就靠 background 着色的元素上补 background（v0.10.20）。
    expect(trailCss).not.toMatch(/\.ttl-(stepIcon|detailIcon|mixItem)\.ttl-ink-[a-z]+\s*\{[^}]*background/)
    // 统计族色仍在（向后兼容），没有被 ink 规则删掉。
    expect(trailCss).toContain('.ttl-tone-shell { color: #a78bfa; }')
  })
})

describe('v0.10.8: 展开轮次体缩进（tree）', () => {
  it('只对展开态给 turnBody 加 14px 左缩进，折叠卡保持满宽', () => {
    const expanded = rule('.ttl-turn[data-collapsed="false"] .ttl-turnBody {')
    expect(expanded).toContain('padding-left: 14px;')
    // The base body rule must not carry the indent (collapsed cards unaffected).
    expect(rule('.ttl-turnBody {')).not.toContain('padding-left')
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
