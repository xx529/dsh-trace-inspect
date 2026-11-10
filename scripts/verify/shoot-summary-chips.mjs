#!/usr/bin/env node
/**
 * scripts/verify/shoot-summary-chips.mjs — evidence for v0.10.37: the separate
 * filter strip and the distribution legend were the same numbers twice. They
 * are now ONE clickable row inside the overview block:
 *   [全部 N] [失败 F] [●bash n] [●read n] … (one chip per family)
 * The distribution bar stays above it; counts satisfy 全部 = 失败 + 家族合计.
 *
 * Frames: summary.png (panel top), summary-filted.png (after clicking bash)
 *         summary-chips-metrics.json
 *
 * Usage: node scripts/verify/shoot-summary-chips.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/summarychips'))
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

const T0 = Date.now() - 14 * 60 * 1000
const EVENTS = []
let seq = 1
const push = (type, data, time) => EVENTS.push({ type, seq: seq++, time, data })
push('user/message', { content: '统计与筛选合并', message: { source: { kind: 'user' } } }, T0)
push('turn/start', { turn: 1 }, T0)
const add = (n, name, args, resultText = 'ok') => {
  const callId = `c${n}`
  const time = T0 + n * 400
  push('tool/call', { name, arguments: JSON.stringify(args), callId, turn: 1, step: n }, time)
  push('tool/result', { callId, turn: 1, step: n, content: [{ type: 'text', text: resultText }] }, time + 200)
}
add(1, 'bash', { command: 'ls' })
add(2, 'read', { file_path: 'a.ts' })
add(3, 'read_image', { file_path: 'shot.png' })
add(4, 'write', { file_path: 'b.ts', content: 'x' })
add(5, 'mcp__figma__use_figma', { code: 'x' })
add(6, 'figma_status', {})
add(7, 'skill', { name: 'figma-workbench' })
push('tool/call', { name: 'bash', arguments: '{"command":"bad"}', callId: 'c8', turn: 1, step: 8 }, T0 + 8 * 400)
push('tool/result', { callId: 'c8', turn: 1, step: 8, message: { isError: true, content: [{ type: 'text', text: 'boom' }] } }, T0 + 8 * 400 + 200)
add(9, 'bash', { command: 'pnpm test' })
push('turn/end', { turn: 1 }, T0 + 10 * 60 * 1000)
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

  const measure = () => page.evaluate(() => {
    const text = (el) => (el?.textContent ?? '').trim()
    const chips = [...document.querySelectorAll('[data-testid="ttl-chips"] [data-testid^="ttl-chip-"]')]
      .filter((el) => el.getAttribute('data-testid') !== 'ttl-chip-more')
      .map((el) => ({
        testid: el.getAttribute('data-testid'),
        pressed: el.getAttribute('aria-pressed'),
        count: Number(el.querySelector('.ttl-chipCount')?.textContent ?? '0'),
        label: text(el.querySelector('.ttl-chipLabel')),
        hasDot: el.querySelector('.ttl-legendDot') !== null,
      }))
    const summary = document.querySelector('.ttl-summary')?.getBoundingClientRect().toJSON() ?? null
    const header = document.querySelector('.ttl-header')?.getBoundingClientRect().toJSON() ?? null
    return {
      chips,
      summaryRect: summary,
      headerHeight: header?.height ?? null,
      hasLegendRow: document.querySelector('.ttl-legend') !== null,
      hasHeaderFilterStrip: document.querySelector('.ttl-header .ttl-filters') !== null,
      steps: [...document.querySelectorAll('[data-testid="ttl-step"]')].map((el) => text(el.querySelector('.ttl-stepName'))),
    }
  })

  const before = await measure()
  const all = before.chips.find((c) => c.testid === 'ttl-chip-all')?.count ?? 0
  const failed = before.chips.find((c) => c.testid === 'ttl-chip-failed')?.count ?? 0
  const familyChips = before.chips.filter((c) => !['ttl-chip-all', 'ttl-chip-failed'].includes(c.testid))
  const familySum = familyChips.reduce((n, c) => n + c.count, 0)
  log('before:', JSON.stringify({ all, failed, familySum, chips: before.chips.map((c) => [c.testid, c.count]) }))

  await page.screenshot({ path: path.join(OUT_DIR, 'summary.png'), animations: 'disabled' })

  // Click the shell family chip → only shell rows.
  await page.locator('[data-testid="ttl-chip-bash"]').click()
  await sleep(page, 600)
  const after = await measure()
  const selected = after.chips.find((c) => c.testid === 'ttl-chip-bash')
  log('after:', JSON.stringify({ pressed: selected?.pressed, steps: after.steps }))
  await page.screenshot({ path: path.join(OUT_DIR, 'summary-filted.png'), animations: 'disabled' })

  fs.writeFileSync(path.join(OUT_DIR, 'summary-chips-metrics.json'), JSON.stringify({ before, after, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const bashCount = familyChips.find((c) => c.testid === 'ttl-chip-bash')?.count ?? 0
  const bad = [
    before.hasLegendRow,
    before.hasHeaderFilterStrip,
    // one row of numbers only: 全部 = 失败 + 家族合计
    all !== failed + familySum,
    familyChips.length < 5,
    familyChips.some((c) => !c.hasDot),
    selected?.pressed !== 'true',
    after.steps.length !== bashCount,
    after.steps.some((name) => name !== 'bash'),
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
