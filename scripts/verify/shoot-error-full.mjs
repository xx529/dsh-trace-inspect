#!/usr/bin/env node
/**
 * scripts/verify/shoot-error-full.mjs — evidence for v0.10.40: a failed step
 * shows its message COMPLETELY in the red error block; the duplicate 输出
 * preview (which cut a long single line at 240 chars with 「…」) is gone.
 * Also pins that a long single-line SUCCESS output can be expanded in full.
 *
 * Frames: failure.png (error block with the whole message)
 *         long-output.png (expanded long single-line output)
 *         error-full-metrics.json
 *
 * Usage: node scripts/verify/shoot-error-full.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/errorfull'))
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

const LONG_ERROR = `Error: rw_exec: this session is LOCAL — its workspace is not a remote mirror, so there is no remote host to act on. Refusing rather than falling back to the active machine (root@118.145.200.11), which belongs to a different session. Use rw_connect + rw_pick_workspace to bind a remote workspace, then open a session in its local mirror. END-OF-ERROR`
const LONG_OK = `start ${'y'.repeat(320)} TAIL-OF-OUTPUT`
const T0 = Date.now() - 5 * 60 * 1000
const EVENTS = []
let seq = 1
const push = (type, data, time) => EVENTS.push({ type, seq: seq++, time, data })
push('user/message', { content: '看错误与长输出', message: { source: { kind: 'user' } } }, T0)
push('turn/start', { turn: 1 }, T0)
push('tool/call', { name: 'rv_exec', arguments: JSON.stringify({ command: 'docker ps' }), callId: 'c1', turn: 1, step: 1 }, T0 + 1000)
push('tool/result', { callId: 'c1', turn: 1, step: 1, message: { isError: true, content: [{ type: 'text', text: LONG_ERROR }] } }, T0 + 1500)
push('tool/call', { name: 'bash', arguments: JSON.stringify({ command: 'long' }), callId: 'c2', turn: 1, step: 2 }, T0 + 2000)
push('tool/result', { callId: 'c2', turn: 1, step: 2, content: [{ type: 'text', text: LONG_OK }] }, T0 + 2500)
push('turn/end', { turn: 1 }, T0 + 3000)
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
  await sleep(page, 1500)

  const steps = page.locator('[data-testid="ttl-step"]')
  await steps.nth(0).click()
  await page.waitForSelector('[data-testid="ttl-error-block"]', { timeout: 15000 })
  await sleep(page, 700)
  const failure = await page.evaluate(() => {
    const block = document.querySelector('[data-testid="ttl-error-block"]')
    const detail = document.querySelector('[data-testid="ttl-detail"]')
    return {
      errorText: (block?.textContent ?? ''),
      hasTail: (block?.textContent ?? '').includes('END-OF-ERROR'),
      hasOutBlock: detail?.querySelector('[data-testid="ttl-outBlock"]') !== null,
      detailRect: detail?.getBoundingClientRect().toJSON() ?? null,
    }
  })
  log('failure:', JSON.stringify({ hasTail: failure.hasTail, hasOutBlock: failure.hasOutBlock, chars: failure.errorText.length }))
  const box = failure.detailRect
  await page.screenshot({
    path: path.join(OUT_DIR, 'failure.png'),
    clip: { x: Math.max(0, Math.round(box.x) - 6), y: Math.max(0, Math.round(box.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(box.x) + 12), height: Math.min(620, Math.round(box.height) + 12) },
    animations: 'disabled',
  })

  // Second step: long single-line success output is expandable in full.
  await page.locator('[data-testid="ttl-step"]').nth(1).click()
  await page.waitForSelector('[data-testid="ttl-outBlock"]', { timeout: 15000 })
  await sleep(page, 500)
  const collapsed = await page.evaluate(() => ({
    hasToggle: document.querySelector('[data-testid="ttl-out-toggle"]') !== null,
    hasTail: (document.querySelector('[data-testid="ttl-outBlock"]')?.textContent ?? '').includes('TAIL-OF-OUTPUT'),
  }))
  if (collapsed.hasToggle) {
    await page.locator('[data-testid="ttl-out-toggle"]').click()
    await sleep(page, 500)
  }
  const expanded = await page.evaluate(() => ({
    hasTail: (document.querySelector('[data-testid="ttl-outBlock"]')?.textContent ?? '').includes('TAIL-OF-OUTPUT'),
    hasEllipsis: (document.querySelector('[data-testid="ttl-outBlock"]')?.textContent ?? '').includes('…'),
  }))
  log('long-output:', JSON.stringify({ collapsed, expanded }))
  const box2 = await page.evaluate(() => document.querySelector('[data-testid="ttl-detail"]')?.getBoundingClientRect().toJSON() ?? null)
  await page.screenshot({
    path: path.join(OUT_DIR, 'long-output.png'),
    clip: { x: Math.max(0, Math.round(box2.x) - 6), y: Math.max(0, Math.round(box2.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(box2.x) + 12), height: Math.min(620, Math.round(box2.height) + 12) },
    animations: 'disabled',
  })

  fs.writeFileSync(path.join(OUT_DIR, 'error-full-metrics.json'), JSON.stringify({ failure, collapsed, expanded, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const bad = [
    !failure.hasTail,
    failure.hasOutBlock,
    !collapsed.hasToggle,
    !expanded.hasTail,
    expanded.hasEllipsis,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
