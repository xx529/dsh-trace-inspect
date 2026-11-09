#!/usr/bin/env node
/**
 * scripts/verify/shoot-mix-align.mjs — evidence for v0.10.34: the cluster
 * counters are SVG text, so the numbers stay optically centred on the 13px
 * icon glyphs at fractional zoom (the user's app renders at ~90% zoom, where
 * plain HTML text with line-height:13px drifted ~1px above the icons).
 *
 * Screenshots the header at zoom 0.9 / 1.0 / 1.1 and pins the DOM contract
 * (counters are SVG text); the pixel-level ink-centre delta is checked in
 * docs/verification with the saved PNGs.
 *
 * Usage: node scripts/verify/shoot-mix-align.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/mixalign2'))
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

const T0 = Date.now() - 8 * 60 * 1000
const EVENTS = []
let seq = 1
const push = (type, data, time) => EVENTS.push({ type, seq: seq++, time, data })
push('user/message', { content: '统计对齐', message: { source: { kind: 'user' } } }, T0)
push('turn/start', { turn: 1 }, T0)
const add = (name, args, n) => {
  for (let i = 0; i < n; i += 1) {
    const callId = `c${seq}`
    const time = T0 + seq * 100
    push('tool/call', { name, arguments: JSON.stringify(args), callId, turn: 1, step: seq }, time)
    push('tool/result', { callId, turn: 1, step: seq, content: [{ type: 'text', text: 'ok' }] }, time + 50)
  }
}
add('bash', { command: 'ls', description: 'x' }, 17)
add('mcp__figma__use_figma', { code: 'x' }, 4)
add('read', { file_path: 'a.ts' }, 2)
add('cordis_inspect_query', { name: 'x' }, 1)
add('skill', { name: 'figma-workbench' }, 1)
push('turn/end', { turn: 1 }, T0 + 8 * 60 * 1000)
const LAST = seq - 1

const sleep = (page, ms) => page.waitForTimeout(ms)
const log = (...p) => console.log(...p)
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const report = {}
const consoleErrors = []

for (const zoom of [0.9, 1, 1.1]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error' && zoom === 1) consoleErrors.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => { if (zoom === 1) consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`) })
  await page.route('**/trace-inspect/api/events**', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ events: EVENTS, hasMore: false, nextAfterSeq: LAST }),
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
  let opened = false
  const tab = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await tab.count() > 0) { await tab.first().click(); opened = true }
  if (!opened) {
    const addTab = page.getByRole('button', { name: '新标签页' })
    if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) { await addTab.first().click(); await sleep(page, 900) }
    const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
    if (await entry.count() > 0) { await entry.first().click(); opened = true }
  }
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await sleep(page, 1500)
  const card = page.locator('[data-testid="ttl-turn"]').first()
  if ((await card.getAttribute('data-collapsed')) === 'false') {
    await card.locator('.ttl-turnHead').click()
    await sleep(page, 500)
  }
  if (zoom !== 1) {
    await page.evaluate((z) => { document.documentElement.style.zoom = String(z) }, zoom)
    await sleep(page, 500)
  }
  await page.mouse.move(2, 2)
  await sleep(page, 400)
  const geom = await page.evaluate(() => {
    const rr = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } }
    return [...document.querySelectorAll('.ttl-mixItem')].map((item) => ({
      kind: item.getAttribute('data-cluster'),
      countText: (item.querySelector('.ttl-mixCount')?.textContent ?? '').trim(),
      countIsSvg: item.querySelector('.ttl-mixCount svg text') !== null,
      svg: rr(item.querySelector('svg')),
      count: rr(item.querySelector('.ttl-mixCount')),
    }))
  })
  const head = await page.locator('.ttl-mix').first().boundingBox()
  const clip = { x: Math.max(0, Math.floor(head.x) - 3), y: Math.max(0, Math.floor(head.y) - 6), width: Math.ceil(head.width) + 6, height: Math.ceil(head.height) + 12 }
  const tag = `z${Math.round(zoom * 100)}`
  await page.screenshot({ path: path.join(OUT_DIR, `mix-${tag}.png`), clip })
  report[tag] = { geom, clip }
  await ctx.close()
}

// Simpler: hand the PNGs + geometry to the shell (python PIL) later; here we
// only assert the DOM contract.
let ok = true
for (const tag of Object.keys(report)) {
  const items = report[tag].geom
  if (items.length !== 5) ok = false
  for (const item of items) {
    if (!item.countIsSvg) ok = false
    if (item.countText === '') ok = false
  }
  log(tag, JSON.stringify(items.map((i) => [i.kind, i.countText, i.countIsSvg])))
}
fs.writeFileSync(path.join(OUT_DIR, 'mix-align.json'), JSON.stringify({ report, consoleErrors }, null, 2))
log('console errors:', consoleErrors.length)
if (!ok || consoleErrors.length > 0) process.exitCode = 2
await browser.close()
