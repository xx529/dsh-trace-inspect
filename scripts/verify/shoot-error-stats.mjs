#!/usr/bin/env node
/**
 * scripts/verify/shoot-error-stats.mjs — evidence for v0.10.36: the global
 * failure counter (toolbar chip + overview bar) counts the same rows the turn
 * badge does — wire `error` rows AND plain `tool/result` messages with
 * `isError: true`. Previously only kind === 'error' counted, so a turn with
 * ⚠2 showed 失败 1 in the toolbar.
 *
 * Also pins the invariant: 全部 = 失败 + (legend distribution sum).
 *
 * Frames: panel-stats.png (toolbar + summary + mixed-failure turn)
 *         error-stats-metrics.json
 *
 * Usage: node scripts/verify/shoot-error-stats.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/errorstats'))
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

const T0 = Date.now() - 12 * 60 * 1000
const EVENTS = []
let seq = 1
const push = (type, data, time) => EVENTS.push({ type, seq: seq++, time, data })
push('user/message', { content: '先跑个健康轮次', message: { source: { kind: 'user' } } }, T0)
push('turn/start', { turn: 1 }, T0)
push('tool/call', { name: 'bash', arguments: '{"command":"ls"}', callId: 'h1', turn: 1, step: 1 }, T0)
push('tool/result', { callId: 'h1', turn: 1, step: 1, content: [{ type: 'text', text: 'ok' }] }, T0 + 100)
push('turn/end', { turn: 1 }, T0 + 200)

const T1 = T0 + 60 * 1000
push('user/message', { content: '一个有两条失败的行', message: { source: { kind: 'user' } } }, T1)
push('turn/start', { turn: 2 }, T1)
const call = (n, name, args, callId) => push('tool/call', { name, arguments: args, callId, turn: 2, step: n }, T1)
const ok = (n, callId) => push('tool/result', { callId, turn: 2, step: n, content: [{ type: 'text', text: 'ok' }] }, T1)
const isErr = (callId) => push('tool/result', { callId, turn: 2, message: { source: { callId }, isError: true, content: [{ type: 'text', text: 'boom' }] } }, T1)
const wireErr = (callId, name, code) => push('tool/result', { callId, turn: 2, error: { name, code } }, T1)
call(1, 'bash', '{"command":"pnpm test"}', 'b1'); ok(1, 'b1')
call(2, 'read', '{"file_path":"a.ts"}', 'r1'); ok(2, 'r1')
call(3, 'mcp__figma__use_figma', '{"code":"x"}', 'm1'); isErr('m1')
call(4, 'mcp__figma__get_screenshot', '{"nodeId":"1:2"}', 'm2'); wireErr('m2', 'ToolNotFoundError', 'UNKNOWN_TOOL')
call(5, 'figma_status', '{}', 'f1'); ok(5, 'f1')
push('turn/end', { turn: 2 }, T1 + 60 * 1000)
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
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 440
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
  await sleep(page, 1800)

  const metrics = await page.evaluate(() => {
    const text = (el) => (el?.textContent ?? '').trim()
    const chip = (id) => document.querySelector(`[data-testid="${id}"]`)
    const turns = [...document.querySelectorAll('[data-testid="ttl-turn"]')]
    const badge = (turn) => turn.querySelector('[data-testid="ttl-error-count"]')
    const summaryFail = document.querySelector('.ttl-summaryFail')
    const legend = document.querySelector('.ttl-legend')
    const counts = [...(legend?.querySelectorAll('.ttl-legendItem') ?? [])]
      .map((el) => Number((text(el).match(/(\d+)\s*$/) ?? [])[1] ?? '0'))
    return {
      turns: turns.length,
      turnBadges: turns.map((turn) => text(badge(turn))),
      allChip: text(chip('ttl-chip-all')),
      failedChip: text(chip('ttl-chip-failed')),
      summaryFail: text(summaryFail),
      legendText: text(legend),
      legendCounts: counts,
      legendSum: counts.reduce((n, v) => n + v, 0),
      rows: turns.length > 0 ? [...turns[turns.length - 1].querySelectorAll('[data-testid="ttl-step"]')].map((el) => text(el.querySelector('.ttl-stepName'))) : [],
      errorRows: [...document.querySelectorAll('[data-testid="ttl-turn"] [data-testid="ttl-step"][data-step-kind="error"]')].length,
    }
  })
  log('metrics:', JSON.stringify({ badges: metrics.turnBadges, all: metrics.allChip, failed: metrics.failedChip, summaryFail: metrics.summaryFail, legendSum: metrics.legendSum }))

  const summary = await page.evaluate(() => document.querySelector('.ttl-summary')?.getBoundingClientRect().toJSON() ?? null)
  const list = await page.evaluate(() => document.querySelector('[data-testid="ttl-list"]')?.getBoundingClientRect().toJSON() ?? null)
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-stats.png'), animations: 'disabled' })

  fs.writeFileSync(path.join(OUT_DIR, 'error-stats-metrics.json'), JSON.stringify({ metrics, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const all = Number(metrics.allChip.match(/\d+/)?.[0] ?? '0')
  const failed = Number(metrics.failedChip.match(/\d+/)?.[0] ?? '0')
  const bad = [
    metrics.turnBadges[1] !== '2',
    failed !== 2,
    !metrics.summaryFail.includes('2'),
    all !== failed + metrics.legendSum,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
