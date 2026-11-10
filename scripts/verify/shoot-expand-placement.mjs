#!/usr/bin/env node
/**
 * scripts/verify/shoot-expand-placement.mjs — evidence for v0.10.43: the
 * 「展开全部 N 段」/「展开全文」 affordances moved from the section header to a
 * CENTRED row below the block, so readers reach the cut and the expander in
 * the same eye movement (no scrolling back up).
 *
 * Frames: command-expand.png / output-expand.png
 *         expand-placement.json
 *
 * Usage: node scripts/verify/shoot-expand-placement.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/expandplace'))
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

const LONG_COMMAND = Array.from({ length: 41 }, (_, i) => `echo step-${i + 1}`).join(' && ')
const LONG_OUTPUT = Array.from({ length: 34 }, (_, i) => `line ${i + 1}: ${'x'.repeat(40)}`).join('\n')
const T0 = Date.now() - 3 * 60 * 1000
const EVENTS = []
let seq = 1
const push = (type, data, time) => EVENTS.push({ type, seq: seq++, time, data })
push('user/message', { content: '展开按钮位置', message: { source: { kind: 'user' } } }, T0)
push('turn/start', { turn: 1 }, T0)
push('tool/call', { name: 'bash', arguments: JSON.stringify({ command: LONG_COMMAND, description: '41 段命令' }), callId: 'c1', turn: 1, step: 1 }, T0 + 1000)
push('tool/result', { callId: 'c1', turn: 1, step: 1, content: [{ type: 'text', text: 'ok' }] }, T0 + 1500)
push('tool/call', { name: 'bash', arguments: JSON.stringify({ command: 'run', description: '长输出' }), callId: 'c2', turn: 1, step: 2 }, T0 + 2000)
push('tool/result', { callId: 'c2', turn: 1, step: 2, content: [{ type: 'text', text: LONG_OUTPUT }] }, T0 + 2500)
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

  const measure = (blockId, toggleId) => page.evaluate(({ blockId, toggleId }) => {
    const block = document.querySelector(`[data-testid="${blockId}"]`)
    const toggle = document.querySelector(`[data-testid="${toggleId}"]`)
    const head = toggle?.closest('.ttl-section')?.querySelector('.ttl-sectionHead')
    const wrap = toggle?.parentElement ?? null
    const centerOf = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.x + r.width / 2 }
    return {
      hasToggle: toggle !== null,
      parentClass: wrap?.className ?? null,
      afterBlock: block !== null && toggle !== null ? (block.compareDocumentPosition(toggle) & 4) === 4 : null,
      inHeader: head !== null && head !== undefined && toggle !== null ? head.contains(toggle) : null,
      wrapCenter: centerOf(wrap),
      blockCenter: centerOf(block),
      blockRect: block?.getBoundingClientRect().toJSON() ?? null,
      detailRect: document.querySelector('[data-testid="ttl-detail"]')?.getBoundingClientRect().toJSON() ?? null,
    }
  }, { blockId, toggleId })

  // Step 1: long command → code expander
  await page.locator('[data-testid="ttl-step"]').nth(0).click()
  await page.waitForSelector('[data-testid="ttl-code"]', { timeout: 15000 })
  await sleep(page, 600)
  const command = await measure('ttl-code', 'ttl-code-toggle')
  log('command:', JSON.stringify({ parent: command.parentClass, after: command.afterBlock, inHeader: command.inHeader, centered: Math.abs(command.wrapCenter - command.blockCenter) <= 2 }))
  const cbox = command.detailRect
  await page.screenshot({
    path: path.join(OUT_DIR, 'command-expand.png'),
    clip: { x: Math.max(0, Math.round(cbox.x) - 6), y: Math.max(0, Math.round(cbox.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(cbox.x) + 12), height: Math.min(660, Math.round(cbox.height) + 12) },
    animations: 'disabled',
  })

  // Step 2: long output → output expander
  await page.locator('[data-testid="ttl-step"]').nth(1).click()
  await page.waitForSelector('[data-testid="ttl-outBlock"]', { timeout: 15000 })
  await sleep(page, 600)
  const output = await measure('ttl-outBlock', 'ttl-out-toggle')
  log('output:', JSON.stringify({ parent: output.parentClass, after: output.afterBlock, inHeader: output.inHeader, centered: Math.abs(output.wrapCenter - output.blockCenter) <= 2 }))
  const obox = output.detailRect
  await page.screenshot({
    path: path.join(OUT_DIR, 'output-expand.png'),
    clip: { x: Math.max(0, Math.round(obox.x) - 6), y: Math.max(0, Math.round(obox.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(obox.x) + 12), height: Math.min(1000, Math.round(obox.height) + 12) },
    animations: 'disabled',
  })

  fs.writeFileSync(path.join(OUT_DIR, 'expand-placement.json'), JSON.stringify({ command, output, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const bad = [
    !command.hasToggle || command.parentClass !== 'ttl-sectionExpand' || !command.afterBlock || command.inHeader,
    Math.abs(command.wrapCenter - command.blockCenter) > 2,
    !output.hasToggle || output.parentClass !== 'ttl-sectionExpand' || !output.afterBlock || output.inHeader,
    Math.abs(output.wrapCenter - output.blockCenter) > 2,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
