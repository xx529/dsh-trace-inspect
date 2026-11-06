#!/usr/bin/env node
/**
 * scripts/verify/shoot-output-lines.mjs — evidence for v0.10.11 (turn-head mix keeps `skill`):
 * a sparkle glyph + teal ink (not the generic wrench) and a row detail that is
 * the bare skill name (never `name figma-workbench`).
 *
 * Uses a route-mocked minimal session (the recorded trace-verify history has no
 * `skill` calls); everything else is the real plugin in the real web profile.
 *
 * Frames:
 *   panel-output-lines.png           two skill rows + a bash row (2x, dock 400)
 *   panel-turnmix-zoom.png      2x crop of the icon column
 *   outputlines-metrics.json        row label/detail/glyph/colour + legend
 *
 * Usage: node scripts/verify/shoot-skillrow.mjs [--port 19487] [--out /tmp/verify/outputlines]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/outputlines'))
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

const OUT_TEXT = 'line 1: trace output row\nline 2: trace output row\nline 3: trace output row\nline 4: trace output row\nline 5: trace output row\nline 6: trace output row\nline 7: trace output row\nline 8: trace output row\nline 9: trace output row\nline 10: trace output row\nline 11: trace output row\nline 12: trace output row\nline 13: trace output row\nline 14: trace output row\nline 15: trace output row\nline 16: trace output row\nline 17: trace output row\nline 18: trace output row\nline 19: trace output row\nline 20: trace output row\nline 21: trace output row\nline 22: trace output row\nline 23: trace output row\nline 24: trace output row\nline 25: trace output row\nline 26: trace output row\nline 27: trace output row\nline 28: trace output row\nline 29: trace output row\nline 30: trace output row\nline 31: trace output row\nline 32: trace output row\nline 33: trace output row\nline 34: trace output row\nline 35: trace output row\nline 36: trace output row\nline 37: trace output row\nline 38: trace output row\nline 39: trace output row\nline 40: trace output row\nline 41: trace output row\nline 42: trace output row\nline 43: trace output row\nline 44: trace output row\nline 45: trace output row\nline 46: trace output row\nline 47: trace output row\nline 48: trace output row\nline 49: trace output row\nline 50: trace output row\nline 51: trace output row\nline 52: trace output row\nline 53: trace output row\nline 54: trace output row\nline 55: trace output row'
const MOCK_EVENTS = [
  { type: 'user/message', seq: 1, data: { content: 'run long output', message: { source: { kind: 'user' } } } },
  { type: 'turn/start', seq: 2, data: { turn: 1 } },
  { type: 'tool/call', seq: 3, data: { name: 'bash', arguments: JSON.stringify({ command: 'grep -n render src/client/TrailTab.tsx', description: '读取输出行渲染代码' }), callId: 'c3', turn: 1 } },
  { type: 'tool/result', seq: 4, data: { callId: 'c3', turn: 1, content: [{ type: 'text', text: OUT_TEXT }] } },
  { type: 'turn/end', seq: 5, data: { turn: 1 } },
]
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
const park = async () => { await page.mouse.move(2, 2).catch(() => {}); await sleep(page, 250) }

const probe = () => page.evaluate(() => {
  const cards = [...document.querySelectorAll('[data-testid="ttl-turn"]')]
  const first = cards[0]
  const items = [...(first?.querySelectorAll('.ttl-mixItem') ?? [])].map((el) => ({
    cls: String(el.className),
    title: el.getAttribute('title'),
    count: el.querySelector('.ttl-mixCount')?.textContent ?? null,
  }))
  const legend = [...document.querySelectorAll('.ttl-legend')].map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
  const out = document.querySelector('[data-testid="ttl-outBlock"]')
  const outLines = [...(out?.querySelectorAll('.ttl-outLine') ?? [])].map((el) => el.textContent)
  const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')].map((row) => {
    const icon = row.querySelector('.ttl-stepIcon')
    return {
      name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
      desc: (row.querySelector('.ttl-stepDesc')?.textContent ?? '').trim(),
      tone: String(icon?.className ?? ''),
      ink: icon === null ? null : getComputedStyle(icon).color,
      glyph: icon?.querySelector('svg path')?.getAttribute('d')?.slice(0, 40) ?? null,
    }
  })
  return {
    outPreviewLines: outLines.length,
    outFirst: outLines[0] ?? null,
    outLast: outLines[outLines.length - 1] ?? null,
    outToggleText: document.querySelector('[data-testid="ttl-out-toggle"]')?.textContent ?? null,
    rows,
    cards: cards.length,
    mixCount: items.length,
    items,
    legend,
    firstCollapsed: first?.getAttribute('data-collapsed'),
    firstHeadText: (first?.querySelector('.ttl-turnHead')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
  }
})

try {
  await page.route('**/trace-inspect/api/events**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ events: MOCK_EVENTS, hasMore: false, nextAfterSeq: 5 }),
  }))
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(page, 3500)
  // A session view (not the home hero) exposes the right-sidebar toggle; the
  // mocked event route then feeds this session our fixture.
  const sessionRow = page.locator('.JoiKIa_sessionRow', { hasText: '优化侧边查看插件并推送' })
  await sessionRow.waitFor({ state: 'visible', timeout: 30000 })
  await sessionRow.first().click()
  await sleep(page, 5000)
  const openButton = page.getByRole('button', { name: '打开右侧边栏' })
  if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
    await openButton.first().click()
    await sleep(page, 1200)
  }
  const panel = page.locator('[class*=Dv5QdW_panel]').first()
  const handle = page.locator('.PIRFFq_handle').last()
  const hb = await handle.boundingBox()
  const sx = hb.x + hb.width / 2
  const y = 300
  const tx = 1440 - 400
  await page.mouse.move(sx, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(sx + ((tx - sx) * i) / 12, y)
  await page.mouse.up()
  await sleep(page, 500)
  log('dock:', Math.round((await panel.boundingBox()).width))

  let opened = false
  const existingTab = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await existingTab.count() > 0) {
    await existingTab.first().click()
    opened = true
  }
  if (!opened) {
    const addTab = page.getByRole('button', { name: '新标签页' })
    if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) {
      await addTab.first().click()
      await sleep(page, 1000)
    }
    const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
    if (await entry.count() > 0 && await entry.first().isVisible().catch(() => false)) {
      await entry.first().click()
      opened = true
    }
  }
  if (!opened) {
    await page.screenshot({ path: path.join(OUT_DIR, 'debug-before-tab.png') })
    throw new Error('cannot find the 轮次轨迹 tab entry')
  }
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 1, null, { timeout: 30000 })
  await sleep(page, 1500)
  await park()

  const row = page.locator('[data-testid="ttl-step"]').first()
  await row.waitFor({ state: 'visible', timeout: 15000 })
  await row.scrollIntoViewIfNeeded()
  await row.click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
  await sleep(page, 1200)
  await park()
  const band = page.locator('[data-testid="ttl-detail"]').first()
  await band.scrollIntoViewIfNeeded()
  await sleep(page, 300)
  await park()
  await band.screenshot({ path: path.join(OUT_DIR, 'panel-output-lines.png'), animations: 'disabled' })
  const openCount = await page.evaluate(() => document.querySelectorAll('[data-testid="ttl-outBlock"] .ttl-outLine').length)
  await page.getByTestId('ttl-out-toggle').click()
  await sleep(page, 800)
  await park()
  await band.screenshot({ path: path.join(OUT_DIR, 'panel-output-lines-open.png'), animations: 'disabled' })
  const fullCount = await page.evaluate(() => document.querySelectorAll('[data-testid="ttl-outBlock"] .ttl-outLine').length)
  log('shot panel-output-lines.png; preview lines:', openCount, '→ expanded:', fullCount)

  const metrics = await probe()
  fs.writeFileSync(path.join(OUT_DIR, 'outputlines-metrics.json'), JSON.stringify({ ...metrics, consoleErrors }, null, 2))
  log('mix:', JSON.stringify(metrics.items), 'legend:', JSON.stringify(metrics.legend))
} finally {
  await browser.close()
}
