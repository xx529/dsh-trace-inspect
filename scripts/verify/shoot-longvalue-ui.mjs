#!/usr/bin/env node
/**
 * scripts/verify/shoot-longvalue-ui.mjs — evidence for v0.10.31: the long
 * parameter value is a quiet code card (solid border + left accent, value line
 * as the primary action, meta + text actions underneath), replacing the old
 * dashed box with three solid buttons.
 *
 * Frames:
 *   panel-collapsed.png  collapsed long value (2x)
 *   panel-expanded.png   after 「展开」, value inline under the card
 *   longvalue-metrics.json  border style / no solid buttons / action sizes
 *
 * Usage: node scripts/verify/shoot-longvalue-ui.mjs [--port 19487]
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const PORT = Number(arg('port', '19487'))
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/longvalueui'))
const SERVER_LOG = arg('server-log', '/tmp/verify/server.log')
fs.mkdirSync(OUT_DIR, { recursive: true })

function resolveUrl() {
  const explicit = arg('url', process.env.DSH_URL)
  if (explicit) return explicit
  const text = fs.readFileSync(SERVER_LOG, 'utf8')
  const byPort = [...text.matchAll(new RegExp(`:${PORT}/\\?token=([A-Za-z0-9_\\-]+)`, 'g'))]
  if (byPort.length === 0) throw new Error(`no token for ${PORT} in ${SERVER_LOG}`)
  return `http://127.0.0.1:${PORT}/?token=${byPort[byPort.length - 1][1]}`
}
const URL_WITH_TOKEN = resolveUrl()

const PW = process.env.PLAYWRIGHT_CORE
  || path.join(process.env.HOME || '', '.dsh/mcp-servers/mobile-mcp/node_modules/playwright-core/index.mjs')
const { chromium } = await import(pathToFileURL(PW).href)

const LONG_COMMAND = [
  'cd /Users/lzx/Documents/GitHub/dsh-trace-inspect ;',
  'pnpm typecheck && pnpm test && pnpm build && git add -A &&',
  'git commit -q -m "feat(v0.10.31): redesign the long-value block" && git tag -a v0.10.31 -m "v0.10.31"',
].join('\n')
const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '长值块 UI 重设计', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 1 } })
MOCK_EVENTS.push({
  type: 'tool/call', seq: seq++, data: {
    name: 'bash', arguments: JSON.stringify({ command: LONG_COMMAND, description: '跑门禁并发布' }), callId: 'c1', turn: 1, step: 1,
  },
})
MOCK_EVENTS.push({ type: 'tool/result', seq: seq++, data: { callId: 'c1', turn: 1, step: 1, content: [{ type: 'text', text: 'ok' }] } })
MOCK_EVENTS.push({ type: 'turn/end', seq: seq++, data: { turn: 1 } })
const LAST_SEQ = seq - 1

const sleep = (page, ms) => page.waitForTimeout(ms)
const t0 = Date.now()
const log = (...p) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')}s]`, ...p)

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  colorScheme: 'dark',
  reducedMotion: 'reduce',
})
const page = await ctx.newPage()
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)) })
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`))

try {
  await page.route('**/trace-inspect/api/events**', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ events: MOCK_EVENTS, hasMore: false, nextAfterSeq: LAST_SEQ }),
  }))
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(page, 3500)
  const openButton = page.getByRole('button', { name: '打开右侧边栏' })
  if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
    await openButton.first().click()
    await sleep(page, 1200)
  }
  const handle = page.locator('.PIRFFq_handle').last()
  const hb = await handle.boundingBox()
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 420
  await page.mouse.move(sx, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(sx + ((tx - sx) * i) / 12, y)
  await page.mouse.up()
  await sleep(page, 600)
  log('dock:', Math.round((await page.locator('[class*=Dv5QdW_panel]').first().boundingBox()).width))

  let opened = false
  const tab = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await tab.count() > 0) { await tab.first().click(); opened = true }
  if (!opened) {
    const add = page.getByRole('button', { name: '新标签页' })
    if (await add.count() > 0 && await add.first().isVisible().catch(() => false)) { await add.first().click(); await sleep(page, 900) }
    const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
    if (await entry.count() > 0) { await entry.first().click(); opened = true }
  }
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await sleep(page, 1500)

  await page.locator('[data-testid="ttl-step"]').first().click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
  await sleep(page, 700)

  const metrics = await page.evaluate(() => {
    const block = document.querySelector('[data-testid="ttl-json-long"]')
    const style = block === null ? null : getComputedStyle(block)
    const preview = block?.querySelector('[data-testid="ttl-json-long-preview"]')
    const actions = [...(block?.querySelectorAll('[data-testid="ttl-json-long-toggle"], [data-testid="ttl-json-long-copy"]') ?? [])]
      .map((el) => ({ text: (el.textContent ?? '').trim(), size: getComputedStyle(el).fontSize, bg: getComputedStyle(el).backgroundColor }))
    return {
      borderStyle: style?.borderStyle ?? null,
      borderLeftWidth: style?.borderLeftWidth ?? null,
      radius: style?.borderRadius ?? null,
      previewText: (preview?.textContent ?? '').slice(0, 80),
      previewFontSize: preview === null || preview === undefined ? null : getComputedStyle(preview).fontSize,
      actions,
      hasDtabButtons: block?.querySelectorAll('.ttl-dtab').length ?? 0,
      blockRect: block?.getBoundingClientRect().toJSON() ?? null,
      detailRect: document.querySelector('[data-testid="ttl-detail"]')?.getBoundingClientRect().toJSON() ?? null,
    }
  })
  log('metrics:', JSON.stringify({ borderStyle: metrics.borderStyle, radius: metrics.radius, actions: metrics.actions, hasDtab: metrics.hasDtabButtons }))

  const detailRect = metrics.detailRect
  const clip = { x: Math.max(0, Math.round(detailRect.x) - 6), y: Math.max(0, Math.round(detailRect.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(detailRect.x) + 12), height: Math.min(560, Math.round(detailRect.height) + 12) }
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-collapsed.png'), clip, animations: 'disabled' })

  // Hover state
  await page.locator('[data-testid="ttl-json-long-preview"]').first().hover()
  await sleep(page, 500)
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-hover.png'), clip, animations: 'disabled' })

  // Expand inline
  await page.locator('[data-testid="ttl-json-long-toggle"]').first().click()
  await sleep(page, 600)
  const expanded = await page.evaluate(() => ({
    hasBody: document.querySelector('[data-testid="ttl-json-long-body"]') !== null,
    bodyText: (document.querySelector('[data-testid="ttl-json-long-body"]')?.textContent ?? '').slice(0, 60),
    toggleText: (document.querySelector('[data-testid="ttl-json-long-toggle"]')?.textContent ?? '').trim(),
  }))
  log('expanded:', JSON.stringify(expanded))
  const detailRect2 = await page.evaluate(() => document.querySelector('[data-testid="ttl-detail"]')?.getBoundingClientRect().toJSON() ?? null)
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-expanded.png'),
    clip: { x: Math.max(0, Math.round(detailRect2.x) - 6), y: Math.max(0, Math.round(detailRect2.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(detailRect2.x) + 12), height: Math.min(660, Math.round(detailRect2.height) + 12) },
    animations: 'disabled',
  })

  fs.writeFileSync(path.join(OUT_DIR, 'longvalue-metrics.json'), JSON.stringify({ metrics, expanded, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const bad = [
    metrics.borderStyle !== 'solid',
    metrics.hasDtabButtons > 0,
    !expanded.hasBody,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
