#!/usr/bin/env node
/**
 * scripts/verify/shoot-longvalue.mjs — evidence for v0.10.15 (turn-head mix keeps `skill`):
 * a sparkle glyph + teal ink (not the generic wrench) and a row detail that is
 * the bare skill name (never `name figma-workbench`).
 *
 * Uses a route-mocked minimal session (the recorded trace-verify history has no
 * `skill` calls); everything else is the real plugin in the real web profile.
 *
 * Frames:
 *   panel-longvalue.png           figma MCP detail band (summary tab)
 *   panel-turnmix-zoom.png      2x crop of the icon column
 *   longvalue-metrics.json        row label/detail/glyph/colour + legend
 *
 * Usage: node scripts/verify/shoot-skillrow.mjs [--port 19487] [--out /tmp/verify/longvalue]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/longvalue'))
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

const OUT_TEXT = "{\"stage\": \"line\", \"err\": \"Error: in resize: Property \\\"width\\\" failed validation: Required value missing\", \"info\": {\"band0\": {\"w\": 372, \"h\": 100}, \"tabs\": {\"w\": 100, \"h\": 100}}}"
const MOCK_EVENTS = [
  { type: 'user/message', seq: 1, data: { content: 'figma use_figma', message: { source: { kind: 'user' } } } },
  { type: 'turn/start', seq: 2, data: { turn: 1 } },
  { type: 'tool/call', seq: 3, data: { name: 'mcp__figma__use_figma', arguments: "{\"code\": \"const line0 = 0\\nconst line1 = 1\\nconst line2 = 2\\nconst line3 = 3\\nconst line4 = 4\\nconst line5 = 5\\nconst line6 = 6\\nconst line7 = 7\\nconst line8 = 8\\nconst line9 = 9\\nconst line10 = 10\\nconst line11 = 11\\nconst line12 = 12\\nconst line13 = 13\\nconst line14 = 14\\nconst line15 = 15\\nconst line16 = 16\\nconst line17 = 17\\nconst line18 = 18\\nconst line19 = 19\\nconst line20 = 20\\nconst line21 = 21\\nconst line22 = 22\\nconst line23 = 23\\nconst line24 = 24\\nconst line25 = 25\\nconst line26 = 26\\nconst line27 = 27\\nconst line28 = 28\\nconst line29 = 29\\nconst line30 = 30\\nconst line31 = 31\\nconst line32 = 32\\nconst line33 = 33\\nconst line34 = 34\\nconst line35 = 35\\nconst line36 = 36\\nconst line37 = 37\\nconst line38 = 38\\nconst line39 = 39\\nconst line40 = 40\\nconst line41 = 41\\nconst line42 = 42\\nconst line43 = 43\\nconst line44 = 44\\nconst line45 = 45\\nconst line46 = 46\\nconst line47 = 47\\nconst line48 = 48\\nconst line49 = 49\\nconst line50 = 50\\nconst line51 = 51\\nconst line52 = 52\\nconst line53 = 53\\nconst line54 = 54\\nconst line55 = 55\\nconst line56 = 56\\nconst line57 = 57\\nconst line58 = 58\\nconst line59 = 59\\nconst line60 = 60\\nconst line61 = 61\\nconst line62 = 62\\nconst line63 = 63\\nconst line64 = 64\\nconst line65 = 65\\nconst line66 = 66\\nconst line67 = 67\\nconst line68 = 68\\nconst line69 = 69\\nconst line70 = 70\\nconst line71 = 71\\nconst line72 = 72\\nconst line73 = 73\\nconst line74 = 74\\nconst line75 = 75\\nconst line76 = 76\\nconst line77 = 77\\nconst line78 = 78\\nconst line79 = 79\\nconst line80 = 80\\nconst line81 = 81\\nconst line82 = 82\\nconst line83 = 83\"}", callId: 'c3', turn: 1 } },
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
    ttlFiles: document.querySelectorAll('[data-testid="ttl-files"]').length,
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
  await sleep(page, 800)
  await park()

  // open the centered viewer on the 参数 tab, then expand the long `code` value
  await page.getByTestId('ttl-detail-view-center').click()
  await page.waitForSelector('[data-testid="ttl-zoom"]', { timeout: 15000 })
  await sleep(page, 800)
  await page.getByTestId('ttl-zoom-tab-params').click()
  await sleep(page, 800)
  const toggle = page.getByTestId('ttl-json-long-toggle').first()
  await toggle.waitFor({ state: 'visible', timeout: 15000 })
  await toggle.click()
  await page.waitForSelector('[data-testid="ttl-json-long-body"]', { timeout: 15000 })
  await sleep(page, 800)
  await park()

  const longBody = page.locator('[data-testid="ttl-json-long-body"]').first()
  await longBody.screenshot({ path: path.join(OUT_DIR, 'panel-longvalue.png'), animations: 'disabled' })
  const metrics = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="ttl-json-long-body"]')
    if (el === null) return { missing: true }
    const cs = getComputedStyle(el)
    const b = el.getBoundingClientRect()
    return {
      rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)],
      maxHeight: cs.maxHeight,
      overflow: cs.overflow,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      innerScroll: el.scrollHeight > el.clientHeight + 1,
      textLength: (el.textContent ?? '').length,
      lines: (el.textContent ?? '').split('\n').length,
    }
  })
  log('shot panel-longvalue.png; metrics:', JSON.stringify(metrics))
  fs.writeFileSync(path.join(OUT_DIR, 'longvalue-metrics.json'), JSON.stringify({ ...metrics, consoleErrors }, null, 2))
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-longvalue-zoom.png'), animations: 'disabled' })
} finally {
  await browser.close()
}
