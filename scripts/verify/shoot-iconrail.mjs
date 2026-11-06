#!/usr/bin/env node
/**
 * scripts/verify/shoot-iconrail.mjs — narrow evidence run for the v0.10.2 row
 * polish (unified neutral icon chip, rail between chips, alert glyph on every
 * failing row), compared 1:1 with prototype frame `docs/prototype/2-02-展开轮次.png`
 * (400px frame exported at 2x, same as our dsf2 element screenshots).
 *
 * Frames:
 *   panel-iconrail-expanded.png   expanded turn, step rows (2x, 400px dock)
 *   panel-iconrail-zoom.png       3x crop of the icon column for eyeball diff
 *   panel-iconrail-failed.png     failure filter, error rows (red chip + alert)
 *   iconrail-metrics.json         computed chip/rail geometry + colours
 *
 * Usage: node scripts/verify/shoot-iconrail.mjs [--port 19487] [--out /tmp/verify/iconrail]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/iconrail'))
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
  let addPath = 'guide'
  const addTab = page.getByRole('button', { name: '新标签页' })
  if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) {
    await addTab.first().click(); await sleep(page, 1000); addPath = 'plus'
  }
  const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
  if (await entry.count() === 0) {
    await page.locator('button[title="轮次轨迹"], .nArs4W_paneCard', { hasText: '轮次轨迹' }).first().click()
  } else {
    await entry.first().click()
  }
  await sleep(page, 2000)
  log('tab via', addPath)
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

/** Computed chip / rail geometry for the visible rows. */
async function collectMetrics() {
  return page.evaluate(() => {
    const r = (el) => { if (el === null || el === undefined) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
    const rows = [...document.querySelectorAll('[data-testid="ttl-turn"] [data-testid="ttl-step"]')].slice(0, 12)
    const sample = rows.map((row) => {
      const icon = row.querySelector('.ttl-stepIcon')
      const rail = row.querySelector('.ttl-stepRail')
      const glyph = row.querySelector('.ttl-rowIcon svg')
      const cs = icon === null ? null : getComputedStyle(icon)
      const rs = rail === null ? null : getComputedStyle(rail)
      const gs = glyph === null ? null : getComputedStyle(glyph)
      return {
        kind: row.getAttribute('data-step-kind'),
        name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
        row: r(row),
        icon: r(icon),
        iconBg: cs?.backgroundColor ?? null,
        iconZ: cs?.zIndex ?? null,
        glyphColor: gs?.stroke ?? gs?.color ?? null,
        rail: r(rail),
        railDisplay: rs?.display ?? null,
        railBg: rs?.backgroundColor ?? null,
        railLeft: rs?.left ?? null,
        railVisiblePx: rail === null ? null : Math.round(rail.getBoundingClientRect().width * 10) / 10,
        paddingLeft: getComputedStyle(row).paddingLeft,
        rowBg: getComputedStyle(row).backgroundColor,
        wrapBg: getComputedStyle(row.closest('.ttl-stepWrap')).backgroundColor,
      }
    })
    return {
      dockPanel: r(document.querySelector('[class*=Dv5QdW_panel]')),
      firstRow: sample[0] ?? null,
      sample,
      errorRows: [...document.querySelectorAll('[data-testid="ttl-turn"] [data-testid="ttl-step"][data-step-kind="error"]')].slice(0, 6)
        .map((row) => ({
          row: r(row),
          iconBg: getComputedStyle(row.querySelector('.ttl-stepIcon')).backgroundColor,
          iconColor: getComputedStyle(row.querySelector('.ttl-stepIcon')).color,
          glyphPath: row.querySelector('.ttl-rowIcon svg path')?.getAttribute('d')?.slice(0, 40) ?? null,
        })),
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

  // ── normal rows: expand the biggest turn near the top (#1 has 100+ steps) ──
  await collapseAllTurns()
  const tags = await page.evaluate(() => [...document.querySelectorAll('[data-testid="ttl-turn"] [data-testid="ttl-turn-tag"]')].map((el) => (el.textContent ?? '').trim()))
  log('turn tags', tags.slice(0, 6))
  const targetTag = tags[0] ?? '#1'
  await expandTurn(targetTag)
  await page.waitForSelector('[data-testid="ttl-turn"] [data-testid="ttl-step"]', { timeout: 15000 })
  await sleep(page, 600)
  await parkMouse()
  await page.locator('[data-testid="ttl-turn"]').filter({ hasText: targetTag }).first().screenshot({
    path: path.join(OUT_DIR, 'panel-iconrail-expanded.png'),
    animations: 'disabled',
  })
  log('shot panel-iconrail-expanded.png')

  // icon-column crop of the first fully visible step row (click-free, hover-free)
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[data-testid="ttl-turn"] [data-testid="ttl-step"]')]
    const plain = rows.find((row) => row.closest('.ttl-parallel') === null)
    const firstRow = plain ?? rows[0]
    if (firstRow !== null && firstRow !== undefined) firstRow.scrollIntoView({ block: 'center' })
  })
  await sleep(page, 500)
  await parkMouse()
  const rowBox = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[data-testid="ttl-turn"] [data-testid="ttl-step"]')]
    const row = rows.find((el) => el.closest('.ttl-parallel') === null) ?? rows[0]
    const b = row.getBoundingClientRect()
    return { x: b.x, y: b.y }
  })
  const viewport = page.viewportSize()
  const top = Math.max(0, Math.round(rowBox.y) - 8)
  const clip = {
    x: Math.max(0, Math.round(rowBox.x)),
    y: top,
    width: 200,
    height: Math.min(560, viewport.height - top - 20),
  }
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-iconrail-zoom.png'), clip, animations: 'disabled' })
  log('shot panel-iconrail-zoom.png', JSON.stringify(clip))
  const metricsBefore = await collectMetrics()
  metricsBefore.consoleErrors = [...consoleErrors]

  // ── failure rows: expand a turn carrying ✗ and centre its first error row ──
  await collapseAllTurns()
  await expandTurn('#8')
  await page.evaluate(() => {
    const err = document.querySelector('[data-testid="ttl-turn"] [data-testid="ttl-step"][data-step-kind="error"]')
    if (err !== null) err.scrollIntoView({ block: 'center' })
  })
  await sleep(page, 800)
  await parkMouse()
  const errBox = await page.locator('[data-testid="ttl-turn"] [data-step-kind="error"]').first().boundingBox()
  const vp = page.viewportSize()
  const errTop = Math.max(0, Math.round(errBox.y) - 120)
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-iconrail-failed.png'),
    clip: { x: Math.max(0, Math.round(errBox.x) - 4), y: errTop, width: 400, height: Math.min(560, vp.height - errTop - 20) },
    animations: 'disabled',
  })
  log('shot panel-iconrail-failed.png')
  const metricsFailed = await collectMetrics()
  metricsFailed.consoleErrors = [...consoleErrors]

  // a parallel batch: amber bracket marks the group, the grey rail keeps
  // connecting the chips inside it (same as prototype 2-02)
  const groupBox = await page.evaluate(() => {
    const group = document.querySelector('[data-testid="ttl-parallel-group"]')
    if (group === null) return null
    group.scrollIntoView({ block: 'center' })
    return null
  })
  await sleep(page, 700)
  await parkMouse()
  const gb = await page.locator('[data-testid="ttl-parallel-group"]').first().boundingBox()
  if (gb !== null) {
    const gTop = Math.max(0, Math.round(gb.y) - 40)
    await page.screenshot({
      path: path.join(OUT_DIR, 'panel-iconrail-parallel.png'),
      clip: { x: Math.max(0, Math.round(gb.x) - 4), y: gTop, width: 400, height: Math.min(600, page.viewportSize().height - gTop - 20) },
      animations: 'disabled',
    })
  } else {
    await page.screenshot({ path: path.join(OUT_DIR, 'panel-iconrail-parallel.png'), animations: 'disabled' })
  }
  log('shot panel-iconrail-parallel.png')

  fs.writeFileSync(path.join(OUT_DIR, 'iconrail-metrics.json'), JSON.stringify({
    url: URL_WITH_TOKEN.replace(/token=.*/, 'token=…'),
    normal: metricsBefore,
    failed: metricsFailed,
  }, null, 2))
  log('metrics →', path.join(OUT_DIR, 'iconrail-metrics.json'))
} finally {
  await browser.close()
}
