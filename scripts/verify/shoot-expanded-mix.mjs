#!/usr/bin/env node
/**
 * scripts/verify/shoot-expanded-mix.mjs — evidence for v0.10.23: the cluster
 * mix stays visible when the turn is OPEN, not only while it is folded.
 *
 * Replays the user's reported 47-step mix (bash 21 / wait_agent 9 /
 * list_agents 4 / team_task_create 4 / spawn_teammate 4 / team_task_list 3 /
 * todo_write 2) and asserts the strip is rendered in the expanded header with
 * computed `display: inline-flex` (the v0.9 rule hid it with `display: none`).
 *
 * Frames:
 *   panel-expanded-mix.png   expanded turn head + first rows (2x, dock 400)
 *   expanded-mix-metrics.json  collapsed/expanded display + chips
 *
 * Usage: node scripts/verify/shoot-expanded-mix.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/expandedmix'))
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

const SPEC = [
  ['bash', 21], ['wait_agent', 9], ['list_agents', 4], ['team_task_create', 4],
  ['spawn_teammate', 4], ['team_task_list', 3], ['todo_write', 2],
]
const CALLS = []
for (const [name, count] of SPEC) for (let i = 0; i < count; i += 1) CALLS.push([name, { index: i }])

const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '展开后也要保留统计', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 1 } })
CALLS.forEach(([name, args], index) => {
  MOCK_EVENTS.push({ type: 'tool/call', seq: seq++, data: { name, arguments: JSON.stringify(args), callId: `c${index}`, turn: 1, step: index + 1 } })
  MOCK_EVENTS.push({ type: 'tool/result', seq: seq++, data: { callId: `c${index}`, turn: 1, step: index + 1, content: [{ type: 'text', text: 'ok' }] } })
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
  // Ensure the turn is OPEN (the latest turn is expanded by default).
  if ((await card.getAttribute('data-collapsed')) === 'true') {
    await card.locator('.ttl-turnHead').click()
    await sleep(page, 700)
  }
  await page.mouse.move(2, 2)
  await sleep(page, 300)

  const expanded = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="ttl-turn"]')
    const mix = card?.querySelector('.ttl-mix')
    const chips = [...(card?.querySelectorAll('.ttl-mixItem') ?? [])].map((el) => ({
      kind: el.getAttribute('data-cluster'),
      count: Number(el.querySelector('.ttl-mixCount')?.textContent ?? '0'),
    }))
    return {
      collapsed: card?.getAttribute('data-collapsed'),
      mixDisplay: mix === null || mix === undefined ? 'missing' : getComputedStyle(mix).display,
      mixRect: mix === null || mix === undefined ? null : mix.getBoundingClientRect().toJSON(),
      chips,
      steps: card?.querySelectorAll('.ttl-step').length ?? 0,
    }
  })

  // Bring the expanded card's head into view (47 rows make the list auto-scroll
  // to the newest step, leaving the header above the viewport).
  await card.evaluate((el) => { el.scrollIntoView({ block: 'start' }) })
  await sleep(page, 400)
  await page.mouse.move(2, 2)
  await sleep(page, 200)
  const box = await card.boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-expanded-mix.png'),
    clip: {
      x: Math.max(0, Math.round(box.x)),
      y: Math.max(0, Math.round(box.y) - 2),
      width: Math.min(400, page.viewportSize().width - Math.round(box.x)),
      height: Math.min(150, Math.round(box.height) + 6),
    },
    animations: 'disabled',
  })

  // Collapse again: the strip must stay too (same ledger, no flicker).
  await card.locator('.ttl-turnHead').click()
  await sleep(page, 500)
  const collapsed = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="ttl-turn"]')
    const mix = card?.querySelector('.ttl-mix')
    return { collapsed: card?.getAttribute('data-collapsed'), mixDisplay: mix === null || mix === undefined ? 'missing' : getComputedStyle(mix).display }
  })

  fs.writeFileSync(path.join(OUT_DIR, 'expanded-mix-metrics.json'), JSON.stringify({ expanded, collapsed, consoleErrors }, null, 2))
  log('expanded:', JSON.stringify(expanded))
  log('collapsed:', JSON.stringify(collapsed))
  log('console errors:', consoleErrors.length)
  if (expanded.collapsed !== 'false' || expanded.mixDisplay === 'none' || expanded.mixDisplay === 'missing') process.exitCode = 2
  if (collapsed.collapsed !== 'true' || collapsed.mixDisplay === 'none' || collapsed.mixDisplay === 'missing') process.exitCode = 2
} finally {
  await browser.close()
}
