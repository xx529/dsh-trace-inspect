#!/usr/bin/env node
/**
 * scripts/verify/shoot-mix-exact.mjs — evidence for v0.10.22: the collapsed
 * turn-head statistics count WORK CLUSTERS over the same steps the opened body
 * renders, so every `icon + N` chip is countable 1:1 in the expanded turn.
 *
 * The `real` mode replays the exact tool mix of the user's reported turn
 * (47 steps: bash 21, wait_agent 9, list_agents 4, team_task_create 4,
 * spawn_teammate 4, team_task_list 3, todo_write 2) and proves the chips read
 * `>_ 21 · users 17 · kanban 7 · checklist 2 = 47`, each matching the rows.
 *
 * Frames:
 *   panel-chips.png       collapsed turn header (2x, dock 400)
 *   mixexact-metrics.json chips vs rendered-row glyph counts
 *
 * Usage: node scripts/verify/shoot-mix-exact.mjs [--mode real|wrap] [--port 19487]
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const MODE = arg('mode', 'real')
const PORT = Number(arg('port', '19487'))
const OUT_DIR = path.resolve(arg('out', `/tmp/verify/mixexact-${MODE}`))
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

/** The user's reported 47-step turn (session-45821dca turn 1), verbatim mix. */
const REAL = [
  ['bash', 21], ['wait_agent', 9], ['list_agents', 4], ['team_task_create', 4],
  ['spawn_teammate', 4], ['team_task_list', 3], ['todo_write', 2],
]
/** Nine clusters: max observed in real sessions — exercises the wrap. */
const WRAP = [
  ['bash', 12], ['team_task_create', 10], ['team_task_list', 8], ['read', 7], ['edit', 6],
  ['write', 5], ['todo_write', 4], ['web_search', 3], ['present', 2],
]
const SPEC = MODE === 'wrap' ? WRAP : REAL
const CALLS = []
for (const [name, count] of SPEC) for (let i = 0; i < count; i += 1) CALLS.push([name, { index: i }])

const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '统计口径核对', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 1 } })
CALLS.forEach(([name, args], index) => {
  MOCK_EVENTS.push({ type: 'tool/call', seq: seq++, data: { name, arguments: JSON.stringify(args), callId: `c${index}`, turn: 1, step: index + 1 } })
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
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 400
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

  const card = page.locator('[data-testid="ttl-turn"]').first()
  // Fold the turn so the cluster chips are visible.
  if ((await card.getAttribute('data-collapsed')) === 'false') {
    await card.locator('.ttl-turnHead').click()
    await sleep(page, 500)
  }
  await page.mouse.move(2, 2)
  await sleep(page, 300)

  const chips = await page.evaluate(() => [...document.querySelectorAll('.ttl-mixItem')].map((el) => ({
    kind: el.getAttribute('data-cluster'),
    count: Number(el.querySelector('.ttl-mixCount')?.textContent ?? '0'),
    title: el.getAttribute('title'),
    ink: /ttl-ink-(\w+)/.exec(String(el.className))?.[1] ?? null,
  })))
  const chipRects = await page.evaluate(() => [...document.querySelectorAll('.ttl-mixItem')].map((el) => {
    const b = el.getBoundingClientRect()
    return { kind: el.getAttribute('data-cluster'), x: b.x, y: b.y }
  }))
  const box = await card.boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-chips.png'),
    clip: { x: Math.max(0, Math.round(box.x)), y: Math.max(0, Math.round(box.y) - 2), width: Math.min(400, page.viewportSize().width - Math.round(box.x)), height: Math.min(120, Math.round(box.height) + 6) },
    animations: 'disabled',
  })

  // Open the turn and count the rendered rows per glyph.
  await card.locator('.ttl-turnHead').click()
  await sleep(page, 900)
  const check = await page.evaluate(() => {
    const svgOf = (el) => el?.querySelector('svg')?.innerHTML ?? ''
    const rows = [...document.querySelectorAll('[data-testid="ttl-turn"]')[0].querySelectorAll('.ttl-step')]
    const rowGlyphs = rows.map((row) => svgOf(row.querySelector('.ttl-stepIcon')))
    const chips = [...document.querySelectorAll('.ttl-mixItem')].map((el) => ({
      kind: el.getAttribute('data-cluster'),
      count: Number(el.querySelector('.ttl-mixCount')?.textContent ?? '0'),
      glyph: svgOf(el),
    }))
    const alertGlyph = chips.length === 0 ? '' : null
    const matched = chips.map((chip) => ({
      kind: chip.kind,
      chipCount: chip.count,
      rows: rowGlyphs.filter((html) => html === chip.glyph).length,
    }))
    const alertRows = rows.filter((row) => (row.querySelector('[data-testid="ttl-step"]') === null) && svgOf(row.querySelector('.ttl-stepIcon')).includes('M10.29 3.86')).length
    return { rows: rows.length, matched, alertRows, totalChipCount: chips.reduce((n, c) => n + c.count, 0) }
  })
  const metrics = { mode: MODE, dock: 400, chips, chipRects, check, consoleErrors }
  fs.writeFileSync(path.join(OUT_DIR, 'mixexact-metrics.json'), JSON.stringify(metrics, null, 2))
  log('chips:', JSON.stringify(chips.map((c) => [c.kind, c.count, c.ink])))
  log('rows:', check.rows, 'chipTotal:', check.totalChipCount, 'perChip:', JSON.stringify(check.matched))
  log('console errors:', consoleErrors.length)
  const bad = check.matched.filter((m) => m.chipCount !== m.rows)
  if (bad.length > 0) process.exitCode = 2
} finally {
  await browser.close()
}
