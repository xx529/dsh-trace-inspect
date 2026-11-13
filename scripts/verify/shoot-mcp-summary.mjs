#!/usr/bin/env node
/**
 * scripts/verify/shoot-mcp-summary.mjs — evidence for v0.10.45:
 *   1) a `docker ps` MCP text result is NOT mistaken for a file list
 *      (`4320/tcp` used to become a file named tcp);
 *   2) long JSON argument values wrap instead of hiding behind a horizontal
 *      scrollbar (the cmdString used to look cut at the right edge).
 *
 * Frames: mcp-summary.png ; mcp-summary.json (hasFiles / json overflow)
 *
 * Usage: node scripts/verify/shoot-mcp-summary.mjs [--port 19487]
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const PORT = Number(arg('port', '19487'))
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/mcpsummary'))
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
  || path.join(os.homedir(), '.dsh/mcp-servers/mobile-mcp/node_modules/playwright-core/index.mjs')
const { chromium } = await import(pathToFileURL(PW).href)

const CMD = "docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'"
const RESULT = [
  'NAMES                                   IMAGE              STATUS                   PORTS',
  'htdot-cloud-production-app-1            263830cbca3f       Up 14 hours (healthy)    127.0.0.1:3000->4320/tcp',
  'htdot-cloud-production-dingtalk-1       263830cbca3f       Up 14 hours (healthy)    4320/tcp',
  'htdot-cloud-production-db-1             224550956756       Up 14 hours (healthy)    5432/tcp',
  'nginx                                   m.daocloud.io/docker.io/library/nginx:stable   Up 3 weeks',
].join('\n')

const T0 = Date.now() - 60 * 1000
const EVENTS = []
let seq = 1
const push = (type, data, time) => EVENTS.push({ type, seq: seq++, time, data })
push('user/message', { content: '看下容器', message: { source: { kind: 'user' } } }, T0)
push('turn/start', { turn: 1 }, T0)
push('tool/call', {
  name: 'mcp__cloud-server-ssh__execute-command',
  arguments: JSON.stringify({ cmdString: CMD, timeout: 30000 }),
  callId: 'c1', turn: 1, step: 1,
}, T0 + 1000)
push('tool/result', { callId: 'c1', turn: 1, step: 1, content: [{ type: 'text', text: RESULT }] }, T0 + 1500)
push('turn/end', { turn: 1 }, T0 + 2000)
const LAST_SEQ = seq - 1

const sleep = (page, ms) => page.waitForTimeout(ms)
const log = (...p) => console.log(...p)
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
  await page.route('**/trace-inspect/api/events**', (r) => r.fulfill({
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
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 560
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
  await sleep(page, 1200)

  await page.locator('[data-testid="ttl-step"]').first().click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
  await sleep(page, 800)

  const info = await page.evaluate(() => {
    const rr = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height } }
    const detail = document.querySelector('[data-testid="ttl-detail"]')
    const json = document.querySelector('.ttl-jsonPretty')
    return {
      detail: rr(detail),
      hasFiles: detail?.querySelector('[data-testid="ttl-files"]') !== null,
      outText: detail?.querySelector('[data-testid="ttl-outBlock"]')?.textContent ?? '',
      jsonScrollW: json?.scrollWidth ?? null,
      jsonClientW: json?.clientWidth ?? null,
    }
  })
  log('summary:', JSON.stringify({ hasFiles: info.hasFiles, jsonScrollW: info.jsonScrollW, jsonClientW: info.jsonClientW }))

  const box = info.detail
  await page.screenshot({
    path: path.join(OUT_DIR, 'mcp-summary.png'),
    clip: {
      x: Math.max(0, box.x - 6), y: Math.max(0, box.y - 6),
      width: Math.min(560, page.viewportSize().width - box.x + 12),
      height: Math.min(700, box.h + 12),
    },
    animations: 'disabled',
  })
  fs.writeFileSync(path.join(OUT_DIR, 'mcp-summary.json'), JSON.stringify({ info, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const bad = [
    info.hasFiles,
    !info.outText.includes('4320/tcp'),
    (info.jsonScrollW ?? 0) > (info.jsonClientW ?? 0) + 1,
    consoleErrors.length > 0,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
