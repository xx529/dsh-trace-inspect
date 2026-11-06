#!/usr/bin/env node
/**
 * scripts/verify/shoot-parallel2.mjs — v0.9.3 parallel-batch expression check:
 *
 *   panel-fix-parallel2.png  one 400px list screen with 2–3 parallel groups
 *
 * Expected (and measured into /tmp/verify/after/parallel2-metrics.json):
 *   - no `∥ 并行 ×N` header row at all (`.ttl-parallelHead` count 0; the
 *     semantics live on the group's aria-label/title)
 *   - each group draws a 2px amber `#f2b45c` bracket on its left, inset 6px
 *     top/bottom, 2px radius, 3px from the group's left edge
 *   - `.ttl-stepRail` is display:none, ordinary rows have no vertical line
 *   - output rows / normal step rows keep their original left column (no shift)
 *
 * Usage: node scripts/verify/shoot-parallel2.mjs [--port 19487] [--out /tmp/verify/after]
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

    for (let guard = 0; guard < 60; guard += 1) {
      const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
      if (await expanded.count() === 0) break
      await expanded.first().click(); await sleep(page, 120)
    }
    await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
    await sleep(page, 400)
    const turn1 = page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#1' }).first()
    await turn1.locator('.ttl-turnToggle').click()
    await sleep(page, 1800)
    // put the first visible parallel group near the top of the list viewport
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const group = document.querySelector('[data-testid="ttl-parallel-group"]')
      if (list !== null && group !== null) {
        const lb = list.getBoundingClientRect(), gb = group.getBoundingClientRect()
        list.scrollTop += gb.top - lb.top - 6
      }
    })
    await sleep(page, 600)

    const probe = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const rect = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const groups = [...document.querySelectorAll('[data-testid="ttl-parallel-group"]')]
      const inView = groups.filter((g) => {
        const b = g.getBoundingClientRect()
        return b.bottom > lb.top && b.top < lb.bottom
      })
      const first = groups[0] ?? null
      const before = first === null ? null : getComputedStyle(first, '::before')
      const railEl = document.querySelector('.ttl-stepRail')
      const rail = railEl === null ? null : getComputedStyle(railEl)
      const step = document.querySelector('[data-testid="ttl-step"]')
      const stepStyle = step === null ? null : getComputedStyle(step)
      const icon = step === null ? null : step.querySelector('.ttl-stepIcon')
      // alignment probes: a parallel row, an ordinary tool row, an output row
      const parallelRow = first === null ? null : first.querySelector('[data-testid="ttl-step"]')
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const ordinaryRow = rows.find((r) => (r.closest('[data-testid="ttl-parallel-group"]') ?? null) === null)
      const outputLabel = document.querySelector('[data-testid="ttl-item-output"]') ?? document.querySelector('[data-testid="ttl-output-wrap"]')
      const outLabelRect = outputLabel === null ? null : outputLabel.getBoundingClientRect()
      const leftOf = (el) => (el === null ? null : Math.round(el.getBoundingClientRect().x))
      const iconX = (row) => (row === null ? null : leftOf(row.querySelector('.ttl-stepIcon')))
      const nameX = (row) => (row === null ? null : leftOf(row.querySelector('.ttl-stepName')))
      return {
        listRect: [Math.round(lb.x), Math.round(lb.y), Math.round(lb.width), Math.round(lb.height)],
        listScrollTop: Math.round(list.scrollTop),
        listScrollHeight: Math.round(list.scrollHeight),
        parallelHeadCount: document.querySelectorAll('.ttl-parallelHead').length,
        parallelMarkCount: document.querySelectorAll('.ttl-parallelMark').length,
        groupCount: groups.length,
        groupsInView: inView.length,
        groupLabels: inView.map((g) => g.getAttribute('aria-label')),
        groupTitles: inView.map((g) => g.getAttribute('title')),
        groupRects: inView.map(rect),
        groupTestId: first === null ? null : first.getAttribute('data-testid'),
        bracket: before === null ? null : {
          width: before.width,
          height: before.height,
          background: before.backgroundColor,
          left: before.left,
          top: before.top,
          bottom: before.bottom,
          borderRadius: before.borderRadius,
          opacity: before.opacity,
        },
        stepRail: railEl === null ? null : { exists: true, display: rail.display, width: rail.width, background: rail.backgroundColor },
        ordinaryRowNoLine: stepStyle === null ? null : {
          paddingLeft: stepStyle.paddingLeft,
          borderLeftWidth: stepStyle.borderLeftWidth,
          backgroundImage: stepStyle.backgroundImage,
          beforeContent: getComputedStyle(step, '::before').content,
        },
        alignment: {
          listLeft: Math.round(lb.x),
          parallelRowIconX: iconX(parallelRow),
          ordinaryRowIconX: iconX(ordinaryRow),
          parallelRowPaddingLeft: parallelRow === null ? null : getComputedStyle(parallelRow).paddingLeft,
          ordinaryRowPaddingLeft: ordinaryRow === null ? null : getComputedStyle(ordinaryRow).paddingLeft,
          outputRowX: outLabelRect === null ? null : Math.round(outLabelRect.x),
          outputRowPaddingLeft: outputLabel === null ? null : getComputedStyle(outputLabel).paddingLeft,
          nameXParallel: nameX(parallelRow),
          nameXOrdinary: nameX(ordinaryRow),
          iconXDeltaParallelVsOrdinary: iconX(parallelRow) !== null && iconX(ordinaryRow) !== null ? iconX(parallelRow) - iconX(ordinaryRow) : null,
        },
        ordinaryRowsWithoutRail: rows.filter((r) => {
          const rail = r.querySelector('.ttl-stepRail')
          return rail === null || getComputedStyle(rail).display === 'none'
        }).length,
        totalStepRows: rows.length,
      }
    })

    await park()
    const file = path.join(OUT_DIR, 'panel-fix-parallel2.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: file, animations: 'disabled' })
    log('shot panel-fix-parallel2.png')

    out.frame = { file, probe }
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'parallel2-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('parallel2 probe:', JSON.stringify(probe).slice(0, 900))
    log('metrics →', path.join(OUT_DIR, 'parallel2-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'parallel2-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-parallel2.mjs failed:', error?.message ?? error)
  process.exit(1)
})
