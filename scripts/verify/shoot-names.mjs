#!/usr/bin/env node
/**
 * scripts/verify/shoot-names.mjs — verification frames for the v0.9.2 polish
 * "full tool names in the name column" (`--ttl-step-name-w`, 52–132px) and
 * "empty-args tools no longer render `{}` in the description".
 *
 *   panel-fix-names.png        one 400px list screen: long unknown-tool names
 *                              (team_task_create / spawn_teammate) + MCP rows
 *                              (`playwright`) + the long tool desc
 *                              `browser_run_code_unsafe · 1 个参数`
 *   panel-fix-names-long.png   local clip around the browser_run_code_unsafe row
 *
 * Writes /tmp/verify/after/names-metrics.json with the computed name column
 * width, per-row name width/overflow text, desc start-x alignment and the
 * empty-args row probe.
 *
 * Usage: node scripts/verify/shoot-names.mjs [--port 19487] [--out /tmp/verify/after]
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

    // collapse all, expand turn #2 (team_task_create/spawn_teammate + MCP rows)
    for (let guard = 0; guard < 60; guard += 1) {
      const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
      if (await expanded.count() === 0) break
      await expanded.first().click(); await sleep(page, 120)
    }
    await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
    await sleep(page, 400)
    const turn = page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#2' }).first()
    await turn.locator('.ttl-turnToggle').click()
    await sleep(page, 1500)
    // scroll so the spawn_teammate rows sit in the middle (MCP rows follow)
    const scrolled = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const row = rows.find((r) => (r.textContent ?? '').includes('spawn_teammate'))
      if (row === undefined) return null
      const lb = list.getBoundingClientRect(), rb = row.getBoundingClientRect()
      list.scrollTop += rb.top - lb.top - 120
      return { scrollTop: Math.round(list.scrollTop), rowText: (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80) }
    })
    await sleep(page, 500)
    log('scrolled:', JSON.stringify(scrolled))

    const probe = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="ttl-root"]')
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const rect = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const describe = (row) => {
        const nameEl = row.querySelector('.ttl-stepName')
        const descEl = row.querySelector('.ttl-stepDesc')
        const nameRect = nameEl === null ? null : nameEl.getBoundingClientRect()
        const descRect = descEl === null ? null : descEl.getBoundingClientRect()
        return {
          name: (nameEl?.textContent ?? '').trim(),
          nameRect: nameRect === null ? null : [Math.round(nameRect.x), Math.round(nameRect.y), Math.round(nameRect.width), Math.round(nameRect.height)],
          nameWidth: nameRect === null ? null : Math.round(nameRect.width),
          nameScrollWidth: nameEl === null ? null : nameEl.scrollWidth,
          nameClientWidth: nameEl === null ? null : nameEl.clientWidth,
          nameOverflow: nameEl === null ? null : nameEl.scrollWidth > nameEl.clientWidth + 1,
          descText: (descEl?.textContent ?? '').trim(),
          descX: descRect === null ? null : Math.round(descRect.x),
          descWidth: descRect === null ? null : Math.round(descRect.width),
          descScrollWidth: descEl === null ? null : descEl.scrollWidth,
          descClientWidth: descEl === null ? null : descEl.clientWidth,
          kind: row.getAttribute('data-step-kind'),
          rowText: (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90),
        }
      }
      const allRows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const inView = allRows.filter((row) => {
        const b = row.getBoundingClientRect()
        return b.bottom > lb.top && b.top < lb.bottom
      })
      const targetNames = ['team_task_create', 'spawn_teammate', 'playwright']
      const sample = inView.filter((row) => targetNames.includes((row.querySelector('.ttl-stepName')?.textContent ?? '').trim())).slice(0, 6)
      const mcpRows = allRows.filter((row) => (row.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'playwright')
      const longDescRow = allRows.find((row) => (row.querySelector('.ttl-stepDesc')?.textContent ?? '').includes('browser_run_code_unsafe'))
      const emptyArgsRow = allRows.find((row) => (row.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'cordis_inspect_list')
      const emptyDescRows = allRows.filter((row) => (row.querySelector('.ttl-stepDesc')?.textContent ?? '').trim() === '')
      return {
        nameWidthVar: {
          rootStyleAttr: root === null ? null : root.getAttribute('style'),
          computed: root === null ? null : getComputedStyle(root).getPropertyValue('--ttl-step-name-w').trim(),
          inline: root === null ? null : root.style.getPropertyValue('--ttl-step-name-w').trim(),
        },
        sample: sample.map(describe),
        mcpRowNames: mcpRows.slice(0, 4).map((row) => (row.querySelector('.ttl-stepName')?.textContent ?? '').trim()),
        mcpRowCount: mcpRows.length,
        longDescRow: longDescRow === undefined ? null : describe(longDescRow),
        emptyArgsRow: emptyArgsRow === undefined ? null : describe(emptyArgsRow),
        rowsWithEmptyDesc: emptyDescRows.length,
        emptyDescSamples: emptyDescRows.slice(0, 5).map((row) => ({
          name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
          kind: row.getAttribute('data-step-kind'),
          descText: (row.querySelector('.ttl-stepDesc')?.textContent ?? '').trim(),
        })),
        descXs: [...new Set(inView.map((row) => {
          const d = row.querySelector('.ttl-stepDesc')
          return d === null ? null : Math.round(d.getBoundingClientRect().x)
        }).filter((x) => x !== null))],
        listRect: [Math.round(lb.x), Math.round(lb.y), Math.round(lb.width), Math.round(lb.height)],
        listScrollTop: Math.round(list.scrollTop),
        listScrollHeight: Math.round(list.scrollHeight),
        listClientHeight: Math.round(list.clientHeight),
      }
    })

    await park()
    const namesFile = path.join(OUT_DIR, 'panel-fix-names.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: namesFile, animations: 'disabled' })
    log('shot panel-fix-names.png')
    out.names = { file: namesFile, scroll: scrolled, probe }
    log('names probe:', JSON.stringify(probe).slice(0, 900))

    // ── long-desc row: `browser_run_code_unsafe` lives in turn #11 ─────────
    let longFile = null
    try {
      for (let guard = 0; guard < 60; guard += 1) {
        const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
        if (await expanded.count() === 0) break
        await expanded.first().click(); await sleep(page, 120)
      }
      await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
      await sleep(page, 400)
      const turn11 = page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#11' }).first()
      await turn11.locator('.ttl-turnToggle').click()
      await sleep(page, 1500)
      const longProbe = await page.evaluate(() => {
        const list = document.querySelector('[data-testid="ttl-list"]')
        const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        const row = rows.find((r) => (r.querySelector('.ttl-stepDesc')?.textContent ?? '').includes('browser_run_code_unsafe'))
        if (row === undefined) return null
        const lb = list.getBoundingClientRect(), rb = row.getBoundingClientRect()
        list.scrollTop += rb.top - lb.top - Math.round((lb.height - rb.height) / 2)
        return null
      })
      await sleep(page, 500)
      const measured = await page.evaluate(() => {
        const list = document.querySelector('[data-testid="ttl-list"]')
        const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        const row = rows.find((r) => (r.querySelector('.ttl-stepDesc')?.textContent ?? '').includes('browser_run_code_unsafe'))
        if (row === undefined) return null
        const nameEl = row.querySelector('.ttl-stepName')
        const descEl = row.querySelector('.ttl-stepDesc')
        const nb = nameEl.getBoundingClientRect(), db = descEl.getBoundingClientRect()
        const lb = list.getBoundingClientRect(), rb = row.getBoundingClientRect()
        return {
          name: (nameEl.textContent ?? '').trim(),
          nameWidth: Math.round(nb.width),
          nameScrollWidth: nameEl.scrollWidth,
          nameClientWidth: nameEl.clientWidth,
          nameOverflow: nameEl.scrollWidth > nameEl.clientWidth + 1,
          descText: (descEl.textContent ?? '').trim(),
          descX: Math.round(db.x),
          descWidth: Math.round(db.width),
          descScrollWidth: descEl.scrollWidth,
          descClientWidth: descEl.clientWidth,
          descTruncated: descEl.scrollWidth > descEl.clientWidth + 1,
          rowText: (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
          clipAroundRow: { x: Math.round(lb.x), y: Math.round(Math.max(lb.top, rb.top - 34)), width: Math.round(lb.width), height: Math.min(140, Math.round(lb.bottom - Math.max(lb.top, rb.top - 34))) },
        }
      })
      if (measured !== null) {
        await park()
        longFile = path.join(OUT_DIR, 'panel-fix-names-long.png')
        await page.screenshot({ path: longFile, clip: measured.clipAroundRow, animations: 'disabled' })
        log('shot panel-fix-names-long.png')
        out.namesLong = { file: longFile, clip: measured.clipAroundRow, probe: measured }
        log('long-name probe:', JSON.stringify(measured).slice(0, 400))
      }
    } catch (error) {
      log('long-name frame skipped:', String(error).split('\n')[0])
      out.namesLong = { error: String(error).split('\n')[0] }
    }

    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'names-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('names metrics →', path.join(OUT_DIR, 'names-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'names-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-names.mjs failed:', error?.message ?? error)
  process.exit(1)
})
