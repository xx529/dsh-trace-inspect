#!/usr/bin/env node
/**
 * scripts/verify/shoot-mix.mjs — evidence for v0.10.20 (turn-head statistics):
 * the mix chips paint from the same cluster ink as the rows, and the counters
 * sit vertically centered on the 13px glyphs (13px line box, not the old
 * 18px inherited line-height that left them ~1px high / top-aligned).
 *
 * Frames:
 *   panel-mix.png        collapsed turn header (2x, dock 400)
 *   mix-metrics.json     per-chip class / ink colour / line-height / centers
 *
 * Usage: node scripts/verify/shoot-mix.mjs [--port 19487] [--out /tmp/verify/mix]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/mix'))
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

/** One turn mixing the loud families so the capped mix shows four chips. */
const CALLS = [
  ['bash', { command: 'a', description: 'a' }],
  ['bash', { command: 'b', description: 'b' }],
  ['bash', { command: 'c', description: 'c' }],
  ['edit', { file_path: 'a.ts' }],
  ['edit', { file_path: 'b.ts' }],
  ['mcp__figma__get_screenshot', { nodeId: '1:1' }],
  ['mcp__figma__get_screenshot', { nodeId: '1:2' }],
  ['read', { file_path: 'a.ts' }],
  ['skill', { name: 'figma-workbench' }],
]
const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '统计条墨色与对齐', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 1 } })
CALLS.forEach(([name, args], index) => {
  MOCK_EVENTS.push({
    type: 'tool/call', seq: seq++, data: { name, arguments: JSON.stringify(args), callId: `c${index}`, turn: 1, step: index + 1 },
  })
  MOCK_EVENTS.push({
    type: 'tool/result', seq: seq++, data: { callId: `c${index}`, turn: 1, step: index + 1, content: [{ type: 'text', text: 'ok' }] },
  })
})
MOCK_EVENTS.push({ type: 'turn/end', seq: seq++, data: { turn: 1 } })
const LAST_SEQ = seq - 1

const sleep = (page, ms) => page.waitForTimeout(ms)
const t0 = Date.now()
const log = (...p) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')}s]`, ...p)

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
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
    status: 200,
    contentType: 'application/json',
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
  const sx = hb.x + hb.width / 2
  const y = 300
  const tx = 1440 - 400
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
  // Collapse the turn so the family mix is visible.
  if (await page.locator('[data-testid="ttl-step"]').count() > 0) {
    await page.locator('.ttl-turnHead').first().click()
    await sleep(page, 500)
  }
  await page.mouse.move(2, 2)
  await sleep(page, 300)

  const metrics = await page.evaluate(() => {
    const rect = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, cy: +(b.y + b.height / 2).toFixed(2) } }
    const chips = [...document.querySelectorAll('.ttl-mixItem')].map((item) => {
      const count = item.querySelector('.ttl-mixCount')
      const svg = item.querySelector('svg')
      return {
        className: item.className,
        title: item.getAttribute('title'),
        count: count?.textContent ?? '',
        chipColor: getComputedStyle(item).color,
        countLineHeight: count === null ? null : getComputedStyle(count).lineHeight,
        svgRect: rect(svg),
        countRect: rect(count),
      }
    })
    const segments = [...document.querySelectorAll('.ttl-distSeg')].map((el) => {
      const b = el.getBoundingClientRect()
      return { cls: el.className, bg: getComputedStyle(el).backgroundColor, h: +b.height.toFixed(1), display: getComputedStyle(el).display }
    })
    const legend = [...document.querySelectorAll('.ttl-legendItem')].map((el) => ({
      text: (el.textContent ?? '').trim(),
      dot: getComputedStyle(el.querySelector('.ttl-legendDot')).backgroundColor,
    }))
    return { chips, segments, legend }
  })
  const headBox = await page.locator('.ttl-turnHead').first().boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-mix.png'),
    clip: {
      x: Math.max(0, Math.round(headBox.x)),
      y: Math.max(0, Math.round(headBox.y) - 2),
      width: Math.min(400, page.viewportSize().width - Math.round(headBox.x)),
      height: Math.round(headBox.height) + 4,
    },
    animations: 'disabled',
  })
  const summaryBox = await page.locator('.ttl-summary').first().boundingBox().catch(() => null)
  if (summaryBox !== null) {
    await page.screenshot({
      path: path.join(OUT_DIR, 'panel-summary.png'),
      clip: {
        x: Math.max(0, Math.round(summaryBox.x)),
        y: Math.max(0, Math.round(summaryBox.y)),
        width: Math.min(400, page.viewportSize().width - Math.round(summaryBox.x)),
        height: Math.min(100, Math.round(summaryBox.height)),
      },
      animations: 'disabled',
    })
  }
  fs.writeFileSync(path.join(OUT_DIR, 'mix-metrics.json'), JSON.stringify({ ...metrics, consoleErrors }, null, 2))
  log('segments:', JSON.stringify(metrics.segments))
  log('chips:', JSON.stringify(metrics.chips.map((c) => [c.className.split(' ')[1], c.count, c.chipColor, c.countLineHeight])))
  log('legend:', JSON.stringify(metrics.legend))
  log('console errors:', consoleErrors.length)
} finally {
  await browser.close()
}
