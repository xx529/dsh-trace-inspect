#!/usr/bin/env node
/**
 * scripts/verify/shoot-extra.mjs — the three supplementary frames the final
 * 1:1 prototype comparison still needs, on top of scripts/verify/shoot.mjs:
 *
 *   panel-04-result.png          a step whose result is Markdown/table text,
 *                                detail band with the 结果 tab selected
 *   panel-03-detail-full.png     seq #519 (4-segment bash command) detail band,
 *                                header + command + params + output + footer in
 *                                one element capture
 *   panel-06-skeleton.png        loading skeleton (events route delayed 1.5s)
 *   panel-06-empty.png           empty session (no turns)
 *   panel-06-error.png           failed load (events route aborted)
 *
 * Every frame is an element capture of the 400px panel (`.ttl-root`, 399 CSS
 * px) or of the 372px detail band (`.ttl-detail`). Viewport 1440x900,
 * deviceScaleFactor 2, locale zh-CN, right dock dragged to exactly 400px.
 *
 * Writes /tmp/verify/after/extra-metrics.json with the viewport, scroll
 * positions and state details for each frame.
 *
 * Usage:
 *   node scripts/verify/shoot-extra.mjs [--port 19487] [--out /tmp/verify/after]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/after'))
const SERVER_LOG = arg('server-log', '/tmp/verify/server.log')
const SESSION_TITLE = arg('session', '优化侧边查看插件并推送')

function resolveUrl() {
  const explicit = arg('url', process.env.DSH_URL)
  if (explicit) return explicit
  const text = fs.readFileSync(SERVER_LOG, 'utf8')
  const byPort = [...text.matchAll(new RegExp(`:${PORT}/\\?token=([A-Za-z0-9_\\-]+)`, 'g'))]
  if (byPort.length === 0) throw new Error(`no token for port ${PORT} in ${SERVER_LOG}`)
  return `http://127.0.0.1:${PORT}/?token=${byPort[byPort.length - 1][1]}`
}
const URL_WITH_TOKEN = resolveUrl()

const PW = process.env.PLAYWRIGHT_CORE
  || path.join(process.env.HOME || '', '.dsh/mcp-servers/mobile-mcp/node_modules/playwright-core/index.mjs')

const t0 = Date.now()
const log = (...p) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')}s]`, ...p)
const sleep = (page, ms) => page.waitForTimeout(ms)

const CONTEXT_OPTIONS = {
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  colorScheme: 'dark',
  reducedMotion: 'reduce',
}

async function parkMouse(page) {
  await page.mouse.move(2, 2).catch(() => {})
  await sleep(page, 250)
}

async function elementShot(page, selector, name, outDir) {
  await parkMouse(page)
  const file = path.join(outDir, name)
  const locator = page.locator(selector).first()
  await locator.waitFor({ state: 'visible', timeout: 10000 })
  await locator.screenshot({ path: file, animations: 'disabled' })
  log('shot', name)
  return file
}

async function selectLongSession(page) {
  const row = page.locator('.JoiKIa_sessionRow', { hasText: SESSION_TITLE }).first()
  await row.waitFor({ state: 'visible', timeout: 30000 })
  await row.click()
  await sleep(page, 5000)
}

async function ensureSidebar(page) {
  const openButton = page.getByRole('button', { name: '打开右侧边栏' })
  if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
    await openButton.first().click()
    await sleep(page, 1200)
  }
  await page.waitForSelector('[class*=Dv5QdW_panel]', { timeout: 20000 })
}

/** Drag the right dock divider to exactly `target` CSS px. */
async function resizeDock(page, target = 400) {
  const panel = page.locator('[class*=Dv5QdW_panel]').first()
  const handle = page.locator('.PIRFFq_handle').last()
  await handle.waitFor({ state: 'visible', timeout: 10000 })
  const hb = await handle.boundingBox()
  const viewport = page.viewportSize()
  const startX = hb.x + hb.width / 2
  const y = Math.round(viewport.height / 3)
  const targetX = viewport.width - target
  await page.mouse.move(startX, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(startX + ((targetX - startX) * i) / 12, y)
  await page.mouse.up()
  await sleep(page, 500)
  return Math.round((await panel.boundingBox()).width)
}

async function openTrailTab(page) {
  const existing = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await existing.count() > 0) {
    await existing.first().click()
    await sleep(page, 800)
    return 'existing-tab'
  }
  const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
  await entry.first().click()
  await sleep(page, 1200)
  return 'guide-card'
}

async function waitTrailLoaded(page) {
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 5,
    null,
    { timeout: 90000 },
  )
  await sleep(page, 2000)
}

async function collapseAllTurns(page) {
  for (let guard = 0; guard < 60; guard += 1) {
    const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
    if (await expanded.count() === 0) break
    await expanded.first().click()
    await sleep(page, 120)
  }
  await page.evaluate(() => {
    const list = document.querySelector('[data-testid="ttl-list"]')
    if (list !== null) list.scrollTop = 0
  })
  await sleep(page, 400)
}

async function expandTurn(page, tag) {
  const turn = page.locator('[data-testid="ttl-turn"]').filter({ hasText: tag })
  await turn.first().waitFor({ state: 'visible', timeout: 15000 })
  const toggle = turn.first().locator('.ttl-turnToggle')
  if (await toggle.getAttribute('aria-expanded') !== 'true') {
    await toggle.click()
    await sleep(page, 1500)
  }
  await page.evaluate(() => {
    const list = document.querySelector('[data-testid="ttl-list"]')
    if (list !== null) list.scrollTop = 0
  })
  await sleep(page, 400)
}

/** Open a step's inline detail band and park the band head at the list top. */
async function openStepBand(page, rowText) {
  const row = page.locator('[data-testid="ttl-step"]', { hasText: rowText }).first()
  await row.waitFor({ state: 'visible', timeout: 25000 })
  await row.scrollIntoViewIfNeeded()
  await row.click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 25000 })
  await sleep(page, 2500)
  await page.evaluate(() => {
    const list = document.querySelector('[data-testid="ttl-list"]')
    const band = document.querySelector('[data-testid="ttl-detail"]')
    if (list !== null && band !== null) {
      const lb = list.getBoundingClientRect()
      const bb = band.getBoundingClientRect()
      list.scrollTop += bb.top - lb.top - 2
    }
  })
  await sleep(page, 600)
}

async function scrollState(page) {
  return page.evaluate(() => {
    const list = document.querySelector('[data-testid="ttl-list"]')
    const band = document.querySelector('[data-testid="ttl-detail"]')
    const root = document.querySelector('[data-testid="ttl-root"]')
    const rect = (el) => { if (el === null) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      dockWidth: (() => {
        const panel = document.querySelector('[class*=Dv5QdW_panel]')
        return panel === null ? null : Math.round(panel.getBoundingClientRect().width)
      })(),
      rootRect: rect(root),
      listRect: rect(list),
      listScrollTop: list === null ? null : Math.round(list.scrollTop),
      listScrollHeight: list === null ? null : Math.round(list.scrollHeight),
      listClientHeight: list === null ? null : Math.round(list.clientHeight),
      bandRect: rect(band),
      bandScrollTop: list === null ? null : Math.round(list.scrollTop),
    }
  })
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const { chromium } = await import(pathToFileURL(PW).href)
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const extra = { generatedAt: new Date().toISOString(), viewport: CONTEXT_OPTIONS.viewport, deviceScaleFactor: 2, frames: {} }
  const consoleErrors = []
  const shots = []

  try {
    // ── Part 1: result tab + full detail band (data already loadable) ──────
    const ctx = await browser.newContext(CONTEXT_OPTIONS)
    const page = await ctx.newPage()
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)) })
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`))
    await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(page, 3500)
    await selectLongSession(page)
    await ensureSidebar(page)
    extra.dockWidth = await resizeDock(page, 400)
    log('dock:', extra.dockWidth)
    const tabVia = await openTrailTab(page)
    await waitTrailLoaded(page)
    extra.tabVia = tabVia

    // (1) Markdown/table result → 结果 tab
    await collapseAllTurns(page)
    await expandTurn(page, '#5')
    await openStepBand(page, 'Show contract §11.4 table')
    const resultTab = page.locator('[data-testid="ttl-detail-tab-result"]')
    await resultTab.first().click()
    await sleep(page, 1500)
    // bash defaults to the raw view; flip the segmented toggle to rendered Markdown
    const probeResult = async () => page.evaluate(() => ({
      hasMd: document.querySelector('[data-testid="ttl-md"], .ttl-md') !== null,
      hasRaw: document.querySelector('[data-testid="ttl-md-raw"]') !== null,
      tables: document.querySelectorAll('[data-testid="ttl-md"] table, .ttl-md table').length,
      rows: document.querySelectorAll('[data-testid="ttl-md"] tr, .ttl-md tr').length,
      mdChars: (document.querySelector('[data-testid="ttl-md"], .ttl-md')?.textContent ?? '').length,
      activeTab: (document.querySelector('[data-testid="ttl-detail-tab-result"]')?.getAttribute('aria-selected') ?? null),
      resultBar: (document.querySelector('[data-testid="ttl-resultBar"]')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
    }))
    let resultProbe = await probeResult()
    if (!resultProbe.hasMd) {
      const renderBtn = page.locator('[data-testid="ttl-view-toggle"]')
      if (await renderBtn.count() > 0) {
        await renderBtn.first().click()
        await sleep(page, 1200)
        resultProbe = await probeResult()
      }
    }
    const resultScroll = await scrollState(page)
    const resultFile = await elementShot(page, '[data-testid="ttl-detail"]', 'panel-04-result.png', OUT_DIR)
    shots.push(resultFile)
    extra.frames.result = {
      file: resultFile,
      rowText: 'Show contract §11.4 table',
      turnTag: '#5',
      listScrollTop: resultScroll.listScrollTop,
      listClientHeight: resultScroll.listClientHeight,
      bandRect: resultScroll.bandRect,
      bandTopInListViewport: resultScroll.bandRect !== null ? resultScroll.bandRect[1] - resultScroll.listRect[1] : null,
      probe: resultProbe,
    }
    log('result frame:', JSON.stringify({ band: extra.frames.result.bandRect, probe: resultProbe }))

    // (2) full detail band of seq #519 (4-segment command)
    await collapseAllTurns(page)
    await expandTurn(page, '#1')
    await openStepBand(page, 'Verify install and build succeed again')
    const fullScroll = await scrollState(page)
    const fullBandProbe = await page.evaluate(() => {
      const band = document.querySelector('[data-testid="ttl-detail"]')
      const text = (band?.textContent ?? '').replace(/\s+/g, ' ').trim()
      return {
        seq: (document.querySelector('[data-testid="ttl-detail-seq"], [data-testid="ttl-detail-foot-seq"]')?.textContent ?? '').trim(),
        sections: ['命令', '参数', '输出'].filter((label) => text.includes(label)),
        commandSegments: document.querySelectorAll('.ttl-codeLine').length,
        footText: (band?.querySelector('.ttl-detailFoot')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        hasAllInElement: band !== null,
      }
    })
    const fullFile = await elementShot(page, '[data-testid="ttl-detail"]', 'panel-03-detail-full.png', OUT_DIR)
    shots.push(fullFile)
    extra.frames.detailFull = {
      file: fullFile,
      rowText: 'Verify install and build succeed again',
      turnTag: '#1',
      listScrollTop: fullScroll.listScrollTop,
      listClientHeight: fullScroll.listClientHeight,
      bandRect: fullScroll.bandRect,
      bandTopInListViewport: fullScroll.bandRect !== null ? fullScroll.bandRect[1] - fullScroll.listRect[1] : null,
      probe: fullBandProbe,
    }
    log('detail-full frame:', JSON.stringify({ band: extra.frames.detailFull.bandRect, probe: fullBandProbe }))

    await ctx.close()

    // ── Part 2: loading / empty / error states (fresh context) ────────────
    const statesCtx = await browser.newContext(CONTEXT_OPTIONS)
    const sp = await statesCtx.newPage()
    sp.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)) })
    sp.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`))
    const stateShot = async (name) => {
      const file = await elementShot(sp, '[data-testid="ttl-root"]', name, OUT_DIR)
      shots.push(file)
      return file
    }

    // (a) skeleton: delay the events route by 1.5s
    const eventsPattern = '**/trace-inspect/api/events**'
    await sp.route(eventsPattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue().catch(() => {})
    })
    await sp.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(sp, 3500)
    await selectLongSession(sp)
    await ensureSidebar(sp)
    await resizeDock(sp, 400)
    await sp.locator('button.F6Huca_entry', { hasText: '轮次轨迹' }).first().click()
    await sp.waitForSelector('[data-testid="ttl-status"]', { timeout: 6000 })
    const skeletonRect = await sp.evaluate(() => {
      const el = document.querySelector('[data-testid="ttl-status"]')
      const b = el.getBoundingClientRect()
      return { rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], cls: String(el.className), turns: document.querySelectorAll('[data-testid="ttl-turn"]').length }
    })
    await parkMouse(sp)
    const skeletonFile = await stateShot('panel-06-skeleton.png')
    extra.frames.skeleton = { file: skeletonFile, ...skeletonRect, listScrollTop: 0 }
    log('skeleton frame:', JSON.stringify(skeletonRect))
    await sp.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 }).catch(() => {})
    await sleep(sp, 1500)
    await sp.unroute(eventsPattern)

    // (b) failed load: abort the events route and reload
    await sp.route(eventsPattern, (route) => route.abort('failed').catch(() => {}))
    await sp.reload({ waitUntil: 'domcontentloaded' })
    await sleep(sp, 3500)
    await ensureSidebar(sp).catch(() => {})
    await resizeDock(sp, 400).catch(() => {})
    await sp.waitForSelector('[data-testid="ttl-error"]', { timeout: 25000 })
    await sleep(sp, 500)
    const errorProbe = await sp.evaluate(() => {
      const el = document.querySelector('[data-testid="ttl-error"]')
      const b = el.getBoundingClientRect()
      return { rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], cls: String(el.className), text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160), hasRetry: document.querySelector('[data-testid="ttl-retry"]') !== null }
    })
    const errorFile = await stateShot('panel-06-error.png')
    extra.frames.error = { file: errorFile, ...errorProbe, listScrollTop: 0 }
    log('error frame:', JSON.stringify(errorProbe))
    await sp.unroute(eventsPattern)

    // (c) empty session: brand-new session has no turns
    const newSession = sp.getByRole('button', { name: '新建会话' }).first()
    await newSession.click()
    await sleep(sp, 2500)
    await ensureSidebar(sp).catch(() => {})
    await resizeDock(sp, 400).catch(() => {})
    // the new session's sidebar starts on the guide pane
    const guideEntry = sp.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
    if (await guideEntry.count() === 0) {
      const addTab = sp.getByRole('button', { name: '新标签页' })
      if (await addTab.count() > 0) { await addTab.first().click(); await sleep(sp, 800) }
    }
    await sp.locator('button.F6Huca_entry', { hasText: '轮次轨迹' }).first().click()
    await sp.waitForSelector('[data-testid="ttl-empty"]', { timeout: 25000 })
    await sleep(sp, 500)
    const emptyProbe = await sp.evaluate(() => {
      const el = document.querySelector('[data-testid="ttl-empty"]')
      const b = el.getBoundingClientRect()
      return { rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], cls: String(el.className), text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160), turns: document.querySelectorAll('[data-testid="ttl-turn"]').length }
    })
    const emptyFile = await stateShot('panel-06-empty.png')
    extra.frames.empty = { file: emptyFile, ...emptyProbe, listScrollTop: null }
    log('empty frame:', JSON.stringify(emptyProbe))
    await statesCtx.close()

    extra.consoleErrors = consoleErrors.slice(0, 20)
    extra.shots = shots.map((f) => path.basename(f))
    const outFile = path.join(OUT_DIR, 'extra-metrics.json')
    fs.writeFileSync(outFile, `${JSON.stringify(extra, null, 2)}\n`)
    log('extra metrics →', outFile)
  } catch (error) {
    extra.consoleErrors = consoleErrors.slice(0, 20)
    extra.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'extra-metrics.json'), `${JSON.stringify(extra, null, 2)}\n`)
    throw error
  } finally {
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-extra.mjs failed:', error?.message ?? error)
  process.exit(1)
})
