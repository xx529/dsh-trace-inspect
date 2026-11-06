#!/usr/bin/env node
/**
 * scripts/verify/shoot-legend.mjs — final v0.9.7 check: the overview legend dots
 * and usage-distribution segments follow the same tone palette as the rows
 * (edit amber #f2b45c, mcp green #34d399, todo grey #9ba1a7).
 *
 * Captures /tmp/verify/after/panel-fix-legend.png — 400px overview strip
 * (distribution bar + legend) at 2x — and writes legend-metrics.json with:
 *   - `.ttl-legendDot.ttl-tone-{edit,mcp,todo}` computed background
 *   - `.ttl-distSeg.ttl-tone-{edit,mcp,todo}` computed background
 *   - edit / mcp step icon colours, hidden jump arrows and `∥N` badge
 *   - horizontal-scroll check
 * (todo has no calls in this session, so its dot/segment is probed with a
 *  synthesised element carrying the same classes.)
 *
 * Usage: node scripts/verify/shoot-legend.mjs [--port 19487]
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

    const overview = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="ttl-root"]')
      const summary = document.querySelector('.ttl-summary')
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const bg = (el) => (el === null ? null : getComputedStyle(el).backgroundColor)
      const legend = [...document.querySelectorAll('.ttl-legendDot')].map((el) => ({
        tone: [...el.classList].find((c) => c.startsWith('ttl-tone-')) ?? null,
        background: getComputedStyle(el).backgroundColor,
        rect: r(el),
      }))
      const segs = [...document.querySelectorAll('.ttl-distSeg')].map((el) => ({
        tone: [...el.classList].find((c) => c.startsWith('ttl-tone-')) ?? null,
        background: getComputedStyle(el).backgroundColor,
        rect: r(el),
      }))
      const legendItems = [...document.querySelectorAll('.ttl-legendItem')].map((el) => ({
        text: (el.textContent ?? '').trim(),
        rect: r(el),
      }))
      const summaryText = (summary?.textContent ?? '').replace(/\s+/g, ' ').trim()
      // synthesised todo probes (no todo call in this session)
      const synth = (cls, prop) => {
        const el = document.createElement('i')
        el.className = cls
        el.style.position = 'absolute'
        el.style.visibility = 'hidden'
        root.appendChild(el)
        const value = getComputedStyle(el)[prop]
        el.remove()
        return value
      }
      return {
        rootRect: r(root),
        summaryRect: r(summary),
        summaryText: summaryText.slice(0, 160),
        legend,
        segments: segs,
        legendItems,
        toneLegend: {
          edit: bg(document.querySelector('.ttl-legendDot.ttl-tone-edit')),
          mcp: bg(document.querySelector('.ttl-legendDot.ttl-tone-mcp')),
          todoDom: bg(document.querySelector('.ttl-legendDot.ttl-tone-todo')),
          todoSynth: synth('ttl-legendDot ttl-tone-todo', 'backgroundColor'),
          editSynth: synth('ttl-legendDot ttl-tone-edit', 'backgroundColor'),
        },
        toneDist: {
          edit: bg(document.querySelector('.ttl-distSeg.ttl-tone-edit')),
          mcp: bg(document.querySelector('.ttl-distSeg.ttl-tone-mcp')),
          todoDom: bg(document.querySelector('.ttl-distSeg.ttl-tone-todo')),
          todoSynth: synth('ttl-distSeg ttl-tone-todo', 'backgroundColor'),
        },
      }
    })
    log('overview:', JSON.stringify(overview).slice(0, 1200))

    const clip = {
      x: Math.round(overview.summaryRect[0]),
      y: Math.round(overview.summaryRect[1]),
      width: Math.round(overview.summaryRect[2]),
      height: Math.round(overview.summaryRect[3]),
    }
    await park()
    const legendFile = path.join(OUT_DIR, 'panel-fix-legend.png')
    await page.screenshot({ path: legendFile, clip, animations: 'disabled' })
    log('shot panel-fix-legend.png', JSON.stringify(clip))

    // expand turn #8 (bash/edit/mcp/read/write) to re-check row icon colours + quiet state
    for (let guard = 0; guard < 60; guard += 1) {
      const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
      if (await expanded.count() === 0) break
      await expanded.first().click(); await sleep(page, 120)
    }
    await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
    await sleep(page, 400)
    await page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#8' }).first().locator('.ttl-turnToggle').click()
    await sleep(page, 1600)
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const row = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        .find((r) => (r.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'playwright')
      if (list !== null && row !== undefined) {
        const lb = list.getBoundingClientRect(), rb = row.getBoundingClientRect()
        list.scrollTop += rb.top - lb.top - 160
      }
    })
    await sleep(page, 500)
    await park()
    const rows = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="ttl-root"]')
      const list = document.querySelector('[data-testid="ttl-list"]')
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const chipColor = (selector) => {
        const el = document.querySelector(selector)
        return el === null ? null : { color: getComputedStyle(el).color, rect: r(el) }
      }
      return {
        editIcon: chipColor('.ttl-stepIcon.ttl-tone-edit'),
        mcpIcon: chipColor('.ttl-stepIcon.ttl-tone-mcp'),
        jump: {
          stepJump: (() => { const el = document.querySelector('[data-testid="ttl-step-jump"]'); return el === null ? null : getComputedStyle(el).display })(),
          locateBtn: (() => { const el = document.querySelector('[data-testid="ttl-locate"]'); return el === null ? null : getComputedStyle(el).display })(),
          msgJump: (() => { const el = document.querySelector('[data-testid="ttl-output-jump"]'); return el === null ? null : getComputedStyle(el).display })(),
        },
        badgeParallel: (() => {
          const el = document.querySelector('[data-testid="ttl-turn-parallel"]')
          return el === null ? null : { display: getComputedStyle(el).display, text: (el.textContent ?? '').trim() }
        })(),
        horizontal: {
          rootScrollWidth: root.scrollWidth,
          rootClientWidth: root.clientWidth,
          listScrollWidth: list.scrollWidth,
          listClientWidth: list.clientWidth,
          noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
        },
      }
    })
    log('rows:', JSON.stringify(rows))

    out.overview = { file: legendFile, clip, probe: overview }
    out.rows = rows
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'legend-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('metrics →', path.join(OUT_DIR, 'legend-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'legend-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-legend.mjs failed:', error?.message ?? error)
  process.exit(1)
})
