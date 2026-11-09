#!/usr/bin/env node
/**
 * scripts/verify/shoot-detail-tabs.mjs — evidence for v0.10.29: the detail band
 * (and the zoom overlay) expose only 摘要 / 原始; the former 结果 / 参数 panes are
 * merged into 摘要 (Markdown rendering, image blocks and the params JSON all in
 * one pane).
 *
 * Frames:
 *   panel-detail.png   inline band, 摘要 tab (Markdown + params JSON)
 *   panel-raw.png      inline band after switching to 原始
 *   panel-zoom.png     centered viewer, two tabs
 *   detail-tabs-metrics.json  tab labels / panes / content checks
 *
 * Usage: node scripts/verify/shoot-detail-tabs.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/detailtabs'))
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

const MARKDOWN = '# Deploy notes\n\n- step one\n- step two\n\n```sh\npnpm build\n```\n'
const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '看一下部署说明', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 1 } })
MOCK_EVENTS.push({
  type: 'tool/call', seq: seq++, data: {
    name: 'read', arguments: JSON.stringify({ file_path: '/tmp/verify/DEPLOY.md', limit: 120 }), callId: 'c1', turn: 1, step: 1,
  },
})
MOCK_EVENTS.push({
  type: 'tool/result', seq: seq++, data: {
    callId: 'c1', turn: 1, step: 1,
    content: [{ type: 'text', text: `<path>/tmp/verify/DEPLOY.md</path>\n<type>markdown</type>\n<content>\n${MARKDOWN}</content>` }],
  },
})
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
  await sleep(page, 900)

  const summary = await page.evaluate(() => {
    const detail = document.querySelector('[data-testid="ttl-detail"]')
    const tabs = [...(detail?.querySelectorAll('[role="tab"]') ?? [])].map((el) => ({
      testid: el.getAttribute('data-testid'), text: (el.textContent ?? '').trim(), selected: el.getAttribute('aria-selected'),
    }))
    return {
      tab: detail?.getAttribute('data-tab'),
      tabs,
      tabsCount: tabs.length,
      hasResultTab: detail?.querySelector('[data-testid="ttl-detail-tab-result"]') !== null,
      hasParamsTab: detail?.querySelector('[data-testid="ttl-detail-tab-params"]') !== null,
      hasMarkdown: detail?.querySelector('.ttl-md') !== null || detail?.querySelector('.ttl-markdown') !== null || detail?.textContent.includes('Deploy notes'),
      hasParamsJson: detail?.querySelector('[data-testid="ttl-json-pretty"]') !== null,
      hasViewToggle: detail?.querySelector('[data-testid="ttl-view-toggle"]') !== null,
      text: (detail?.textContent ?? '').slice(0, 400),
      detailRect: detail?.getBoundingClientRect().toJSON() ?? null,
    }
  })
  log('summary:', JSON.stringify({ tab: summary.tab, tabs: summary.tabs, hasMarkdown: summary.hasMarkdown, hasParamsJson: summary.hasParamsJson }))

  const bandBox = summary.detailRect
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-detail.png'),
    clip: { x: Math.max(0, Math.round(bandBox.x) - 6), y: Math.max(0, Math.round(bandBox.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(bandBox.x) + 12), height: Math.min(520, Math.round(bandBox.height) + 12) },
    animations: 'disabled',
  })

  // 原始 tab still carries the wire args / result.
  await page.locator('[data-testid="ttl-detail-tab-raw"]').click()
  await sleep(page, 500)
  const raw = await page.evaluate(() => ({
    tab: document.querySelector('[data-testid="ttl-detail"]')?.getAttribute('data-tab'),
    args: document.querySelector('[data-testid="ttl-raw-args"]')?.textContent ?? null,
    result: document.querySelector('[data-testid="ttl-raw-result"]')?.textContent ?? null,
  }))
  log('raw tab:', JSON.stringify(raw))
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-raw.png'),
    clip: { x: Math.max(0, Math.round(bandBox.x) - 6), y: Math.max(0, Math.round(bandBox.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(bandBox.x) + 12), height: Math.min(420, Math.round(bandBox.height) + 12) },
    animations: 'disabled',
  })

  // Zoom overlay has the same two tabs.
  await page.locator('[data-testid="ttl-detail-zoom"]').click()
  await page.waitForSelector('[data-testid="ttl-zoom"]', { timeout: 15000 })
  await sleep(page, 800)
  const zoom = await page.evaluate(() => ({
    tabs: [...document.querySelectorAll('[data-testid="ttl-zoom"] [role="tab"]')].map((el) => ({ testid: el.getAttribute('data-testid'), text: (el.textContent ?? '').trim() })),
    hasResultTab: document.querySelector('[data-testid="ttl-zoom-tab-result"]') !== null,
    hasParamsTab: document.querySelector('[data-testid="ttl-zoom-tab-params"]') !== null,
    hasViewToggle: document.querySelector('[data-testid="ttl-zoom-view-toggle"]') !== null,
  }))
  log('zoom:', JSON.stringify(zoom))
  const zoomBox = await page.locator('[data-testid="ttl-zoom"]').first().boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-zoom.png'),
    clip: { x: Math.max(0, Math.round(zoomBox.x)), y: Math.max(0, Math.round(zoomBox.y)), width: Math.min(zoomBox.width, page.viewportSize().width), height: Math.min(660, zoomBox.height) },
    animations: 'disabled',
  })

  fs.writeFileSync(path.join(OUT_DIR, 'detail-tabs-metrics.json'), JSON.stringify({ summary, raw, zoom, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const bad = [
    summary.tabsCount !== 2,
    summary.hasResultTab || summary.hasParamsTab,
    summary.hasViewToggle,
    !summary.hasMarkdown,
    !summary.hasParamsJson,
    raw.tab !== 'raw',
    !(raw.args ?? '').includes('DEPLOY.md'),
    !(raw.result ?? '').includes('Deploy notes'),
    zoom.tabs.length !== 2,
    zoom.hasResultTab || zoom.hasParamsTab,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
