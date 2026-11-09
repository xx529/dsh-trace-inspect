#!/usr/bin/env node
/**
 * scripts/verify/shoot-scroll-anchor.mjs — evidence for v0.10.28: collapsing a
 * turn near the end of the list no longer clamps `scrollTop` (which used to
 * jump the whole list). The clicked card stays where it is; the temporary
 * blank below is released as soon as the user scrolls back into the content.
 *
 * Frames:
 *   panel-collapse.png    collapsed last turn, same place, blank below (2x)
 *   scroll-anchor-metrics.json  head tops / scrollTop / padding before+after
 *
 * Usage: node scripts/verify/shoot-scroll-anchor.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/scrollanchor'))
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

/** 18 turns × 18 steps: the last turn is expanded and taller than the list. */
const EVENTS = []
let seq = 1
for (let turn = 1; turn <= 18; turn += 1) {
  EVENTS.push({ type: 'user/message', seq: seq++, data: { content: `第 ${turn} 轮：跑一堆命令`, message: { source: { kind: 'user' } } } })
  EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn } })
  for (let i = 0; i < 18; i += 1) {
    const callId = `t${turn}c${i}`
    EVENTS.push({
      type: 'tool/call', seq: seq++, data: {
        name: i % 3 === 0 ? 'read' : 'bash',
        arguments: JSON.stringify(i % 3 === 0 ? { file_path: `src/f${i}.ts` } : { command: 'echo x', description: `步骤 ${i}` }),
        callId, turn, step: i + 1,
      },
    })
    EVENTS.push({ type: 'tool/result', seq: seq++, data: { callId, turn, step: i + 1, content: [{ type: 'text', text: 'ok' }] } })
  }
  EVENTS.push({ type: 'turn/end', seq: seq++, data: { turn } })
}
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
    body: JSON.stringify({ events: EVENTS, hasMore: false, nextAfterSeq: LAST_SEQ }),
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
  await sleep(page, 2200)

  const probe = () => page.evaluate(() => {
    const list = document.querySelector('[data-testid="ttl-list"]')
    const turns = [...document.querySelectorAll('[data-testid="ttl-turn"]')]
    const last = turns[turns.length - 1]
    const b = last.getBoundingClientRect()
    return {
      scrollTop: +list.scrollTop.toFixed(1),
      max: +(list.scrollHeight - list.clientHeight).toFixed(1),
      paddingBottom: getComputedStyle(list).paddingBottom,
      lastTop: +b.top.toFixed(1),
      lastHeight: +b.height.toFixed(1),
      lastCollapsed: last.getAttribute('data-collapsed'),
    }
  })

  const before = await probe()
  log('before:', JSON.stringify(before))
  // Collapse the last (expanded) turn through its toggle button. A native DOM
  // click keeps Playwright's scroll-into-view from moving the list first.
  await page.evaluate(() => {
    const turns = [...document.querySelectorAll('[data-testid="ttl-turn"]')]
    turns[turns.length - 1].querySelector('.ttl-turnToggle').click()
  })
  await sleep(page, 800)
  const after = await probe()
  log('after: ', JSON.stringify(after))

  const box = await page.locator('.ttl-root').first().boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-collapse.png'),
    clip: { x: Math.max(0, Math.round(box.x)), y: Math.max(0, Math.round(box.y)), width: Math.min(400, page.viewportSize().width - Math.round(box.x)), height: Math.min(820, page.viewportSize().height - 40) },
    animations: 'disabled',
  })

  // User scrolls back into the content: the temporary pad is released as soon
  // as the offset is inside the real (un-padded) content.
  await page.mouse.move(box.x + 200, box.y + 400)
  for (let i = 0; i < 8; i += 1) {
    await page.mouse.wheel(0, -200)
    await sleep(page, 250)
    const pad = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.querySelector('[data-testid="ttl-list"]')).paddingBottom) || 0)
    if (pad === 0) break
  }
  await sleep(page, 400)
  const released = await probe()
  log('released:', JSON.stringify(released))
  log('console errors:', consoleErrors.length)

  fs.writeFileSync(path.join(OUT_DIR, 'scroll-anchor-metrics.json'), JSON.stringify({ before, after, released, consoleErrors }, null, 2))
  const headStable = Math.abs(after.lastTop - before.lastTop) < 1.5
  const scrollHeld = Math.abs(after.scrollTop - before.scrollTop) < 1
  const padHeld = Number.parseFloat(after.paddingBottom) > 10
  const padReleased = released.paddingBottom === before.paddingBottom
  log('headStable:', headStable, 'scrollHeld:', scrollHeld, 'padHeld:', padHeld, 'padReleased:', padReleased)
  if (!(headStable && scrollHeld && padHeld && padReleased)) process.exitCode = 2
} finally {
  await browser.close()
}
