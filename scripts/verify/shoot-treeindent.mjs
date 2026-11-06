#!/usr/bin/env node
/**
 * scripts/verify/shoot-treeindent.mjs — evidence for v0.10.8: an expanded turn
 * body nests under its header (tree indent), so the rows visibly belong to #N.
 *
 * Frames:
 *   panel-treeindent.png       turn header + indented body (2x, dock 400)
 *   panel-treeindent-band.png  indented body with an inline detail band open
 *   treeindent-metrics.json    header/body/icon x + detail-band width
 *
 * Usage: node scripts/verify/shoot-treeindent.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/treeindent'))
const SERVER_LOG = arg('server-log', '/tmp/verify/server.log')
const SESSION_TITLE = arg('session', '优化侧边查看插件并推送')
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

const sleep = (page, ms) => page.waitForTimeout(ms)
const log = (...p) => console.log('[treeindent]', ...p)

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

const metrics = () => page.evaluate(() => {
  const r = (el) => { if (el === null || el === undefined) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
  const turn = [...document.querySelectorAll('[data-testid="ttl-turn"]')].find((el) => el.getAttribute('data-collapsed') === 'false')
  const head = turn?.querySelector('.ttl-turnHead')
  const tag = turn?.querySelector('[data-testid="ttl-turn-tag"]')
  const row = turn?.querySelector('[data-testid="ttl-step"]')
  const icon = turn?.querySelector('[data-testid="ttl-step"] .ttl-stepIcon')
  const rail = turn?.querySelector('[data-testid="ttl-step"] .ttl-stepRail')
  const foot = turn?.querySelector('[data-testid="ttl-turn-foot"]')
  const inputRow = turn?.querySelector('[data-testid="ttl-item-input"]')
  const band = turn?.querySelector('[data-testid="ttl-detail"]')
  const d = (a, b) => (a === null || b === null ? null : Math.round(a[0] - b[0]))
  return {
    turn: r(turn),
    head: r(head),
    tag: r(tag),
    inputRow: r(inputRow),
    row: r(row),
    icon: r(icon),
    rail: r(rail),
    foot: r(foot),
    band: r(band),
    rowIndentVsHead: d(r(row), r(head)),
    iconIndentVsTag: d(r(icon), r(tag)),
    bandWidth: band === null ? null : Math.round(band.getBoundingClientRect().width),
    panelWidth: Math.round(document.querySelector('[class*=Dv5QdW_panel]').getBoundingClientRect().width),
  }
})

try {
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(page, 3500)
  const sessionRow = page.locator('.JoiKIa_sessionRow', { hasText: SESSION_TITLE })
  await sessionRow.waitFor({ state: 'visible', timeout: 30000 })
  await sessionRow.first().click()
  await sleep(page, 5000)
  const openButton = page.getByRole('button', { name: '打开右侧边栏' })
  if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
    await openButton.first().click()
    await sleep(page, 1200)
  }
  await page.waitForSelector('[class*=Dv5QdW_panel]', { timeout: 20000 })
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
  log('dock', Math.round((await panel.boundingBox()).width))

  const existing = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await existing.count() > 0) {
    await existing.first().click()
  } else {
    const addTab = page.getByRole('button', { name: '新标签页' })
    if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) {
      await addTab.first().click()
      await sleep(page, 1000)
    }
    await page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' }).first().click()
  }
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 5, null, { timeout: 90000 })
  await sleep(page, 2500)

  // keep one turn expanded
  for (let guard = 0; guard < 60; guard += 1) {
    const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
    if (await expanded.count() === 0) break
    await expanded.first().click()
    await sleep(page, 120)
  }
  const turn = page.locator('[data-testid="ttl-turn"]').first()
  await turn.locator('.ttl-turnToggle').click()
  await sleep(page, 1500)
  await page.evaluate(() => {
    const list = document.querySelector('[data-testid="ttl-list"]')
    const first = [...document.querySelectorAll('[data-testid="ttl-turn"]')].find((el) => el.getAttribute('data-collapsed') === 'false')
    if (list !== null && first !== undefined && first !== null) {
      const lr = list.getBoundingClientRect()
      const br = first.getBoundingClientRect()
      list.scrollTop += br.top - lr.top - 6
    }
  })
  await sleep(page, 700)
  await park()

  const turnBox = await page.locator('[data-testid="ttl-turn"]').first().boundingBox()
  const clip = { x: Math.max(0, Math.round(turnBox.x)), y: Math.max(0, Math.round(turnBox.y) - 6), width: 400, height: Math.min(700, page.viewportSize().height - Math.round(turnBox.y) - 10) }
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-treeindent.png'), clip, animations: 'disabled' })
  log('shot panel-treeindent.png')
  const before = await metrics()
  before.consoleErrors = [...consoleErrors]

  // open a step -> indented inline band
  await page.locator('[data-testid="ttl-turn"] [data-testid="ttl-step"]').first().click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
  await sleep(page, 1200)
  await park()
  const turnBox2 = await page.locator('[data-testid="ttl-turn"]').first().boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-treeindent-band.png'),
    clip: { x: Math.max(0, Math.round(turnBox2.x)), y: Math.max(0, Math.round(turnBox2.y) - 6), width: 400, height: Math.min(700, page.viewportSize().height - Math.round(turnBox2.y) - 10) },
    animations: 'disabled',
  })
  log('shot panel-treeindent-band.png')
  const after = await metrics()
  after.consoleErrors = [...consoleErrors]

  fs.writeFileSync(path.join(OUT_DIR, 'treeindent-metrics.json'), JSON.stringify({ before, after, consoleErrors }, null, 2))
  log('metrics', JSON.stringify({ rowIndentVsHead: before.rowIndentVsHead, iconIndentVsTag: before.iconIndentVsTag, bandWidth: after.bandWidth }))
} finally {
  await browser.close()
}
