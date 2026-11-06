#!/usr/bin/env node
/**
 * scripts/verify/shoot-outputrow.mjs — evidence for the v0.10.3 assistant
 * message row (one-line row on the 32px step grid: chip + 输出 + first N chars +
 * 「还有 N 字符」; click opens the full Markdown body below).
 *
 * Frames:
 *   panel-outputrow-collapsed.png   one-line output rows (2x, 400px dock)
 *   panel-outputrow-open.png        the same row expanded to its full text
 *   outputrow-metrics.json          row/icon/preview/meta/body geometry
 *
 * Usage: node scripts/verify/shoot-outputrow.mjs [--port 19487] [--out /tmp/verify/outputrow]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/outputrow'))
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
const t0 = Date.now()
const log = (...parts) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')}s]`, ...parts)

const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--disable-blink-features=AutomationControlled'] })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  colorScheme: 'dark',
  reducedMotion: 'reduce',
})
const page = await context.newPage()
const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 240)) })
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 240)}`))

const parkMouse = async () => { await page.mouse.move(2, 2).catch(() => {}); await sleep(page, 250) }

async function openLongSession() {
  const row = page.locator('.JoiKIa_sessionRow', { hasText: SESSION_TITLE })
  await row.waitFor({ state: 'visible', timeout: 30000 })
  await row.first().click()
  await sleep(page, 5000)
}
async function ensureRightSidebar() {
  const btn = page.getByRole('button', { name: '打开右侧边栏' })
  if (await btn.count() > 0 && await btn.first().isVisible().catch(() => false)) {
    await btn.first().click()
    await sleep(page, 1200)
  }
  await page.waitForSelector('[class*=Dv5QdW_panel]', { timeout: 20000 })
}
async function resizeDock(target) {
  const panel = page.locator('[class*=Dv5QdW_panel]').first()
  const handle = page.locator('.PIRFFq_handle').last()
  await handle.waitFor({ state: 'visible', timeout: 10000 })
  const hb = await handle.boundingBox()
  const viewport = page.viewportSize()
  const startX = hb.x + hb.width / 2
  const y = Math.max(40, Math.round(viewport.height / 3))
  const targetX = viewport.width - target
  const dx = targetX - startX
  await page.mouse.move(startX, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(startX + (dx * i) / 12, y)
  await page.mouse.up()
  await sleep(page, 500)
  return Math.round((await panel.boundingBox()).width)
}
async function openTrailTab() {
  const existing = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await existing.count() > 0) { await existing.first().click(); await sleep(page, 1000); return }
  const addTab = page.getByRole('button', { name: '新标签页' })
  if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) {
    await addTab.first().click(); await sleep(page, 1000)
  }
  const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
  if (await entry.count() === 0) {
    await page.locator('button[title="轮次轨迹"], .nArs4W_paneCard', { hasText: '轮次轨迹' }).first().click()
  } else {
    await entry.first().click()
  }
  await sleep(page, 2000)
}
async function waitTrailReady() {
  await page.waitForSelector('[data-testid="ttl-root"]', { timeout: 30000 })
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 5, null, { timeout: 90000 })
  await sleep(page, 2500)
}
async function collapseAllTurns() {
  for (let guard = 0; guard < 60; guard += 1) {
    const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
    if (await expanded.count() === 0) break
    await expanded.first().click()
    await sleep(page, 120)
  }
  await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l !== null) l.scrollTop = 0 })
  await sleep(page, 600)
}
async function expandTurn(turnTag) {
  const turn = page.locator('[data-testid="ttl-turn"]').filter({ hasText: turnTag })
  await turn.first().waitFor({ state: 'visible', timeout: 15000 })
  const toggle = turn.first().locator('.ttl-turnToggle')
  if (await toggle.getAttribute('aria-expanded') !== 'true') { await toggle.click(); await sleep(page, 1500) }
  await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l !== null) l.scrollTop = l.scrollHeight })
  await sleep(page, 800)
}

async function metrics() {
  return page.evaluate(() => {
    const r = (el) => { if (el === null || el === undefined) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
    const style = (el, props) => { if (el === null) return null; const cs = getComputedStyle(el); const out = {}; for (const p of props) out[p] = cs[p]; return out }
    const row = document.querySelector('[data-testid="ttl-item-output"]')
    const chip = row?.querySelector('.ttl-stepIcon')
    const preview = row?.querySelector('[data-testid="ttl-output-preview"]')
    const rest = row?.querySelector('[data-testid="ttl-output-rest"]')
    const step = document.querySelector('[data-testid="ttl-step"]')
    const stepChip = step?.querySelector('.ttl-stepIcon')
    const stepDesc = document.querySelector('[data-testid="ttl-step"] .ttl-stepDesc')
    const body = document.querySelector('[data-testid="ttl-output-body"]')
    return {
      row: r(row),
      rowStyle: style(row, ['height', 'paddingLeft', 'paddingRight', 'gap', 'fontSize']),
      rowExpanded: row?.getAttribute('aria-expanded') ?? null,
      stepDesc: r(stepDesc),
      chip: r(chip),
      chipBg: style(chip, ['backgroundColor']),
      stepChip: r(stepChip),
      preview: r(preview),
      previewStyle: style(preview, ['fontSize', 'whiteSpace', 'overflow', 'textOverflow']),
      previewText: (preview?.textContent ?? '').slice(0, 40),
      rest: r(rest),
      restText: rest?.textContent ?? null,
      chevron: r(row?.querySelector('.ttl-msgChevron')),
      body: r(body),
      bodyStyle: style(body, ['padding', 'width']),
      bodyTextChars: body?.textContent?.length ?? null,
      hasChevron: row?.querySelector('.ttl-msgChevron') !== null,
    }
  })
}

try {
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(page, 3500)
  await openLongSession()
  await ensureRightSidebar()
  log('dock width', await resizeDock(400))
  await openTrailTab()
  await waitTrailReady()

  await collapseAllTurns()
  const tags = await page.evaluate(() => [...document.querySelectorAll('[data-testid="ttl-turn"] [data-testid="ttl-turn-tag"]')].map((el) => (el.textContent ?? '').trim()))
  log('turn tags', tags.slice(0, 4))
  const targetTag = tags[0] ?? '#1'
  await expandTurn(targetTag)
  await page.waitForSelector('[data-testid="ttl-turn"] [data-testid="ttl-item-output"]', { timeout: 15000 })

  const rowBox = await page.evaluate(() => {
    const row = document.querySelector('[data-testid="ttl-item-output"]')
    if (row === null) return null
    row.scrollIntoView({ block: 'center' })
    return null
  })
  await sleep(page, 600)
  await parkMouse()
  const rb = await page.locator('[data-testid="ttl-item-output"]').first().boundingBox()
  const top = Math.max(0, Math.round(rb.y) - 120)
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-outputrow-collapsed.png'),
    clip: { x: Math.max(0, Math.round(rb.x) - 4), y: top, width: 400, height: Math.min(480, page.viewportSize().height - top - 20) },
    animations: 'disabled',
  })
  log('shot panel-outputrow-collapsed.png')
  const before = await metrics()
  before.consoleErrors = [...consoleErrors]

  await page.locator('[data-testid="ttl-item-output"]').first().click()
  await sleep(page, 900)
  await parkMouse()
  const opened = await page.locator('[data-testid="ttl-item-output"]').first().boundingBox()
  const top2 = Math.max(0, Math.round(opened.y) - 80)
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-outputrow-open.png'),
    clip: { x: Math.max(0, Math.round(opened.x) - 4), y: top2, width: 400, height: Math.min(760, page.viewportSize().height - top2 - 20) },
    animations: 'disabled',
  })
  log('shot panel-outputrow-open.png')
  const after = await metrics()
  after.consoleErrors = [...consoleErrors]

  fs.writeFileSync(path.join(OUT_DIR, 'outputrow-metrics.json'), JSON.stringify({
    collapsed: before,
    expanded: after,
  }, null, 2))
  log('metrics →', path.join(OUT_DIR, 'outputrow-metrics.json'))
  log('console errors', after.consoleErrors.length)
} finally {
  await browser.close()
}
