#!/usr/bin/env node
/**
 * scripts/verify/shoot-wrench.mjs — v0.9.8: unknown tools now use a Lucide
 * wrench glyph (single path starting `M14.7 6.3…`, stroke 1.7) instead of the
 * cube, while every known family glyph and the red alert error glyph stay as-is.
 *
 * Captures /tmp/verify/after/panel-fix-wrench.png — 400px list screen with
 * unknown-tool rows + an error row — and writes wrench-metrics.json with:
 *   - `.ttl-stepIcon.ttl-tone-generic svg path` d / stroke-width (wrench check)
 *   - generic chip colour + background
 *   - error row first path d (alert triangle `M10.29 3.86…`) + colour
 *   - known glyph probes: mcp plug / bash terminal / read file / edit pencil
 *   - horizontal-scroll check
 *
 * Usage: node scripts/verify/shoot-wrench.mjs [--port 19487]
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

const WRENCH_PREFIX = 'M14.7 6.3'
const ALERT_PREFIX = 'M10.29 3.86'

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
    for (let guard = 0; guard < 60; guard += 1) {
      const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
      if (await expanded.count() === 0) break
      await expanded.first().click(); await sleep(page, 120)
    }
    await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
    await sleep(page, 400)
  }

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

    // expand turn #1 (team_task_create / spawn_teammate / edit error …)
    await collapseAll()
    await page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#1' }).first().locator('.ttl-turnToggle').click()
    await sleep(page, 1800)
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const generic = rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => (row.querySelector('.ttl-stepIcon')?.className ?? '').includes('ttl-tone-generic'))
      // prefer an unknown-tool row that has an error row within the next six rows,
      // so one screenshot shows both the wrench glyph and the alert triangle
      const pick = generic.find(({ index }) => rows.slice(index, index + 7).some((r) => r.getAttribute('data-step-kind') === 'error'))
        ?? generic[0]
      if (list !== null && pick !== undefined) {
        const lb = list.getBoundingClientRect()
        const rb = pick.row.getBoundingClientRect()
        list.scrollTop += rb.top - lb.top - 120
      }
    })
    await sleep(page, 500)

    const svgInfo = (el) => {
      if (el === null || el === undefined) return null
      const svg = el.querySelector('svg')
      if (svg === null) return { svg: null }
      return {
        svgRect: (() => { const b = svg.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)] })(),
        viewBox: svg.getAttribute('viewBox'),
        children: [...svg.children].map((c) => c.tagName),
        paths: [...svg.querySelectorAll('path')].map((p) => ({ d: p.getAttribute('d'), strokeWidth: p.getAttribute('stroke-width'), stroke: p.getAttribute('stroke') })),
        lines: [...svg.querySelectorAll('line')].map((l) => ({ x1: l.getAttribute('x1'), y1: l.getAttribute('y1'), x2: l.getAttribute('x2'), y2: l.getAttribute('y2') })),
        polylines: [...svg.querySelectorAll('polyline')].map((p) => p.getAttribute('points')),
      }
    }

    await park()
    const probe = await page.evaluate(({ wrenchPrefix, alertPrefix }) => {
      const root = document.querySelector('[data-testid="ttl-root"]')
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const inView = (el) => { const b = el.getBoundingClientRect(); return b.bottom > lb.top && b.top < lb.bottom }
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const info = (row) => {
        const chip = row.querySelector('.ttl-stepIcon')
        const svg = chip?.querySelector('svg')
        const paths = svg === null || svg === undefined ? [] : [...svg.querySelectorAll('path')]
        const lines = svg === null || svg === undefined ? [] : [...svg.querySelectorAll('line')]
        const polylines = svg === null || svg === undefined ? [] : [...svg.querySelectorAll('polyline')]
        return {
          name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
          kind: row.getAttribute('data-step-kind'),
          chipClass: chip === null ? null : String(chip.className),
          chipColor: chip === null ? null : getComputedStyle(chip).color,
          chipBackground: chip === null ? null : getComputedStyle(chip).backgroundColor,
          svgChildren: svg === null || svg === undefined ? null : [...svg.children].map((c) => c.tagName),
          firstPathD: paths.length === 0 ? null : paths[0].getAttribute('d'),
          firstPathStrokeWidth: paths.length === 0 ? null : paths[0].getAttribute('stroke-width'),
          firstPathStroke: paths.length === 0 ? null : paths[0].getAttribute('stroke'),
          lineCount: lines.length,
          polylinePoints: polylines.map((p) => p.getAttribute('points')),
          isWrench: paths.some((p) => (p.getAttribute('d') ?? '').includes(wrenchPrefix)),
          isAlert: paths.some((p) => (p.getAttribute('d') ?? '').includes(alertPrefix)),
        }
      }
      const genericRows = rows.filter((r) => (r.querySelector('.ttl-stepIcon')?.className ?? '').includes('ttl-tone-generic'))
      const errorRows = rows.filter((r) => r.getAttribute('data-step-kind') === 'error')
      const known = {}
      for (const tone of ['shell', 'read', 'edit']) {
        const row = rows.find((r) => (r.querySelector('.ttl-stepIcon')?.className ?? '').includes(`ttl-tone-${tone}`))
        known[tone] = row === undefined ? null : info(row)
      }
      return {
        genericInView: genericRows.filter(inView).length,
        genericTotal: genericRows.length,
        genericSamples: genericRows.filter(inView).slice(0, 4).map(info),
        errorInView: errorRows.filter(inView).length,
        errorSamples: errorRows.filter(inView).slice(0, 2).map(info),
        knownIcons: known,
        listRect: [Math.round(lb.x), Math.round(lb.y), Math.round(lb.width), Math.round(lb.height)],
        listScrollTop: Math.round(list.scrollTop),
        horizontal: {
          rootScrollWidth: root.scrollWidth,
          rootClientWidth: root.clientWidth,
          listScrollWidth: list.scrollWidth,
          listClientWidth: list.clientWidth,
          bodyScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
        },
      }
    }, { wrenchPrefix: WRENCH_PREFIX, alertPrefix: ALERT_PREFIX })

    const wrenchFile = path.join(OUT_DIR, 'panel-fix-wrench.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: wrenchFile, animations: 'disabled' })
    log('shot panel-fix-wrench.png')
    log('wrench probe:', JSON.stringify(probe).slice(0, 1200))

    // mcp glyph lives in turn #2 — measure it separately
    await collapseAll()
    await page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#2' }).first().locator('.ttl-turnToggle').click()
    await sleep(page, 1500)
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const row = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        .find((r) => (r.querySelector('.ttl-stepIcon')?.className ?? '').includes('ttl-tone-mcp'))
      if (list !== null && row !== undefined) {
        const lb = list.getBoundingClientRect(), rb = row.getBoundingClientRect()
        list.scrollTop += rb.top - lb.top - 200
      }
    })
    await sleep(page, 400)
    const mcpProbe = await page.evaluate(({ wrenchPrefix }) => {
      const row = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        .find((r) => (r.querySelector('.ttl-stepIcon')?.className ?? '').includes('ttl-tone-mcp'))
      if (row === undefined) return null
      const chip = row.querySelector('.ttl-stepIcon')
      const svg = chip.querySelector('svg')
      const paths = [...svg.querySelectorAll('path')]
      return {
        name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
        chipClass: String(chip.className),
        chipColor: getComputedStyle(chip).color,
        svgChildren: [...svg.children].map((c) => c.tagName),
        firstPathD: paths.length === 0 ? null : paths[0].getAttribute('d'),
        firstPathStrokeWidth: paths.length === 0 ? null : paths[0].getAttribute('stroke-width'),
        isWrench: paths.some((p) => (p.getAttribute('d') ?? '').includes(wrenchPrefix)),
      }
    }, { wrenchPrefix: WRENCH_PREFIX })

    out.frame = { file: wrenchFile, probe }
    out.mcp = mcpProbe
    out.expected = { wrenchPrefix: WRENCH_PREFIX, alertPrefix: ALERT_PREFIX, wrenchStrokeWidth: '1.7' }
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'wrench-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('mcp probe:', JSON.stringify(mcpProbe))
    log('metrics →', path.join(OUT_DIR, 'wrench-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'wrench-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-wrench.mjs failed:', error?.message ?? error)
  process.exit(1)
})
