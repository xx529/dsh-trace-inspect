#!/usr/bin/env node
/**
 * scripts/verify/shoot-outjson.mjs — v0.9.10 output rendering heuristics:
 *   summary preview + result tab choose JSON pretty-print / Markdown / raw.
 *
 *   panel-fix-outjson.png         JSON tool result, 摘要 tab: the 「输出」 preview
 *                                 must be indented multi-line JSON (3-line clamp)
 *   panel-fix-outjson-result.png  same step, 结果 tab: JsonPretty (key coloured)
 *   panel-fix-outmd.png           Markdown tool result, 结果 tab: MarkdownResult
 *
 * Measured (outputjson-metrics.json):
 *   - `.ttl-outBlock` textContent newline/indent, `.ttl-outLine` count
 *   - 结果 tab: `.ttl-jsonPretty` / `.ttl-raw` / `.ttl-md` presence + key colour
 *   - a plain-text result still renders `.ttl-raw`
 *   - horizontal-scroll check
 *
 * Usage: node scripts/verify/shoot-outjson.mjs [--port 19487]
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const { chromium } = await import(pathToFileURL(PW).href)
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
  const out = { generatedAt: new Date().toISOString(), viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }
  const park = async () => { await page.mouse.move(2, 2).catch(() => {}); await sleep(page, 250) }
  const collapseAll = async () => {
    for (let guard = 0; guard < 70; guard += 1) {
      const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
      if (await expanded.count() === 0) break
      await expanded.first().click(); await sleep(page, 120)
    }
    await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
    await sleep(page, 400)
  }
  const expandTurn = async (tag) => {
    await page.locator('[data-testid="ttl-turn"]').filter({ hasText: tag }).first().locator('.ttl-turnToggle').click()
    await sleep(page, 1600)
  }
  const shotBand = async (name) => {
    await park()
    await sleep(page, 300)
    const file = path.join(OUT_DIR, name)
    await page.locator('[data-testid="ttl-detail"]').first().screenshot({ path: file, animations: 'disabled' })
    log('shot', name)
    return file
  }
  const openRow = async (rowText) => {
    const row = page.locator('[data-testid="ttl-step"]', { hasText: rowText }).first()
    await row.waitFor({ state: 'visible', timeout: 20000 })
    await row.scrollIntoViewIfNeeded()
    await row.click()
    await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 20000 })
    await sleep(page, 2200)
  }
  const tab = async (name) => {
    const el = page.locator(`[data-testid="ttl-detail-tab-${name}"]`).first()
    if (await el.count() > 0) { await el.click(); await sleep(page, 1200) }
  }
  const detailProbe = () => page.evaluate(() => {
    const band = document.querySelector('[data-testid="ttl-detail"]')
    const outBlock = band?.querySelector('[data-testid="ttl-outBlock"]')
    const outLines = band?.querySelectorAll('.ttl-outLine') ?? []
    const jsonPretty = band?.querySelectorAll('.ttl-jsonPretty') ?? []
    const raw = band?.querySelectorAll('.ttl-raw') ?? []
    const mdRaw = band?.querySelectorAll('[data-testid="ttl-md-raw"]') ?? []
    const md = band?.querySelectorAll('[data-testid="ttl-md"], .ttl-md') ?? []
    const key = band?.querySelector('.ttl-jsonKey')
    const outText = outBlock === null || outBlock === undefined ? null : (outBlock.textContent ?? '')
    const outInner = outBlock === null || outBlock === undefined ? null : (outBlock.innerText ?? '')
    const lines = outText === null ? null : outText.split('\n')
    const root = document.querySelector('[data-testid="ttl-root"]')
    const list = document.querySelector('[data-testid="ttl-list"]')
    return {
      activeTab: [...(band?.querySelectorAll('[role=tab]') ?? [])].find((t) => t.getAttribute('aria-selected') === 'true')?.textContent?.trim() ?? null,
      bandRect: band === null ? null : (() => { const b = band.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] })(),
      outBlock: outBlock === null || outBlock === undefined ? null : {
        text: outText.slice(0, 300),
        innerText: (outInner ?? '').slice(0, 300),
        lineCount: outLines.length,
        hasNewline: outText.includes('\n'),
        indentedLines: outText.split('\n').filter((line) => /^\s{2,}/.test(line)).length,
        firstLines: outText.split('\n').slice(0, 4).map((line) => line.slice(0, 80)),
      },
      resultTab: {
        jsonPrettyCount: jsonPretty.length,
        rawCount: raw.length,
        mdRawCount: mdRaw.length,
        mdCount: md.length,
        keyColor: key === null || key === undefined ? null : getComputedStyle(key).color,
        keyCount: band?.querySelectorAll('.ttl-jsonKey').length ?? 0,
      },
      horizontal: {
        rootScrollWidth: root.scrollWidth,
        rootClientWidth: root.clientWidth,
        listScrollWidth: list.scrollWidth,
        listClientWidth: list.clientWidth,
        detailScrollWidth: band === null ? null : band.scrollWidth,
        detailClientWidth: band === null ? null : band.clientWidth,
        noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
      },
    }
  })

  try {
    await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(page, 3500)
    await page.locator('.JoiKIa_sessionRow', { hasText: SESSION_TITLE }).first().click()
    await sleep(page, 5000)
    const openButton = page.getByRole('button', { name: '打开右侧边栏' })
    if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
      await openButton.first().click(); await sleep(page, 1200)
    }
    const panel = page.locator('[class*=Dv5QdW_panel]').first()
    const handle = page.locator('.PIRFFq_handle').last()
    const hb = await handle.boundingBox()
    const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 400
    await page.mouse.move(sx, y); await page.mouse.down()
    for (let i = 1; i <= 12; i += 1) await page.mouse.move(sx + ((tx - sx) * i) / 12, y)
    await page.mouse.up(); await sleep(page, 500)
    out.dockWidth = Math.round((await panel.boundingBox()).width)
    log('dock:', out.dockWidth)
    await page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' }).first().click()
    await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 5, null, { timeout: 90000 })
    await sleep(page, 2000)

    // ── JSON result: cordis_inspect_query in turn #2 ──────────────────────
    await collapseAll()
    await expandTurn('#8')
    const firstQuery = page.locator('[data-testid="ttl-step"]').filter({ has: page.locator('.ttl-stepName', { hasText: 'cordis_inspect_query' }) }).first()
    const queryCount = await firstQuery.count()
    log('cordis_inspect_query rows:', queryCount)
    if (queryCount === 0) throw new Error('no cordis_inspect_query row found')
    await firstQuery.scrollIntoViewIfNeeded()
    await firstQuery.click()
    await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 20000 })
    await sleep(page, 2500)
    // default tab is 摘要
    const summaryProbe = await detailProbe()
    const outjsonFile = await shotBand('panel-fix-outjson.png')
    log('summary probe:', JSON.stringify(summaryProbe).slice(0, 900))

    await tab('result')
    await sleep(page, 1500)
    const resultProbe = await detailProbe()
    const outjsonResultFile = await shotBand('panel-fix-outjson-result.png')
    log('result probe:', JSON.stringify(resultProbe).slice(0, 900))

    // ── Markdown result: "Show contract §11.4 table" in turn #5 ───────────
    await collapseAll()
    await expandTurn('#5')
    await openRow('Show contract §11.4 table')
    await tab('result')
    await sleep(page, 1200)
    if (await page.locator('[data-testid="ttl-md"]').count() === 0) {
      const renderBtn = page.locator('[data-testid="ttl-view-toggle"]')
      if (await renderBtn.count() > 0) {
        const pressed = await renderBtn.first().getAttribute('aria-pressed')
        if (pressed !== 'true') { await renderBtn.first().click(); await sleep(page, 1200) }
      }
    }
    const mdProbe = await detailProbe()
    const outmdFile = await shotBand('panel-fix-outmd.png')
    log('md probe:', JSON.stringify(mdProbe).slice(0, 700))

    // ── plain text result: still raw ───────────────────────────────────────
    let plainProbe = null
    try {
      await openRow('Inspect CSS color discipline test')
      await tab('result')
      await sleep(page, 1200)
      plainProbe = await detailProbe()
      log('plain probe:', JSON.stringify(plainProbe).slice(0, 500))
    } catch (error) {
      plainProbe = { error: String(error).split('\n')[0] }
    }

    out.frames = {
      json: { file: outjsonFile, summary: summaryProbe, result: resultProbe },
      markdown: { file: outmdFile, probe: mdProbe },
      plain: { probe: plainProbe },
    }
    out.expected = {
      summaryPreview: 'indented multi-line JSON (3 lines)',
      jsonResult: '.ttl-jsonPretty present, .ttl-raw absent',
      markdownResult: '.ttl-md present, .ttl-jsonPretty absent',
      plainResult: '.ttl-raw present',
    }
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'outputjson-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('metrics →', path.join(OUT_DIR, 'outputjson-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'outputjson-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-outjson.mjs failed:', error?.message ?? error)
  process.exit(1)
})
