#!/usr/bin/env node
/**
 * scripts/verify/shoot-padding.mjs — v0.9.4 "expanded trace gets breathing room":
 *
 *   panel-fix-padding.png  one 400px list screen with parallel groups + output
 *                          rows, showing the new 14px/22px inner padding
 *
 * Measures (into /tmp/verify/after/padding-metrics.json):
 *   - `.ttl-step` computed padding-left/right (expect 14px / 22px)
 *   - first-column icon x (expect +8 vs the old 6px padding → 1055 @ dock 400)
 *   - right edge of the duration column vs `.ttl-root` right edge (expect ≈22)
 *   - parallel `::before` left (expect 10px)
 *   - description available width (readability quote)
 *   - `.ttl-item` output row padding-right (expect 20px) + `显示更早` margin
 *   - `.ttl-detail` width (expect 371–372) and horizontal-scroll check
 *
 * Usage: node scripts/verify/shoot-padding.mjs [--port 19487] [--out /tmp/verify/after]
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
      const root = document.querySelector('[data-testid="ttl-root"]')
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const rb = root.getBoundingClientRect()
      const rect = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const firstRow = rows[0]
      const cs = firstRow === null ? null : getComputedStyle(firstRow)
      const icon = firstRow === null ? null : firstRow.querySelector('.ttl-stepIcon')
      const nameEl = firstRow === null ? null : firstRow.querySelector('.ttl-stepName')
      const descEl = firstRow === null ? null : firstRow.querySelector('.ttl-stepDesc')
      const durationRows = rows.filter((r) => r.querySelector('.ttl-stepDur') !== null)
      const durationRightGaps = durationRows.slice(0, 6).map((r) => {
        const d = r.querySelector('.ttl-stepDur').getBoundingClientRect()
        return Math.round(rb.right - d.right)
      })
      const group = document.querySelector('[data-testid="ttl-parallel-group"]')
      const before = group === null ? null : getComputedStyle(group, '::before')
      const outputLabel = document.querySelector('[data-testid="ttl-item-output"]')
      const outStyle = outputLabel === null ? null : getComputedStyle(outputLabel)
      const showEarlier = document.querySelector('[data-testid="ttl-show-earlier"]')
      const seStyle = showEarlier === null ? null : getComputedStyle(showEarlier)
      return {
        rootRect: rect(root),
        listRect: [Math.round(lb.x), Math.round(lb.y), Math.round(lb.width), Math.round(lb.height)],
        listScrollTop: Math.round(list.scrollTop),
        firstRow: {
          rect: rect(firstRow),
          paddingLeft: cs === null ? null : cs.paddingLeft,
          paddingRight: cs === null ? null : cs.paddingRight,
          iconX: icon === null ? null : Math.round(icon.getBoundingClientRect().x),
          nameX: nameEl === null ? null : Math.round(nameEl.getBoundingClientRect().x),
          nameWidth: nameEl === null ? null : Math.round(nameEl.getBoundingClientRect().width),
          descX: descEl === null ? null : Math.round(descEl.getBoundingClientRect().x),
          descWidth: descEl === null ? null : Math.round(descEl.getBoundingClientRect().width),
          descText: (descEl?.textContent ?? '').trim().slice(0, 60),
          descScrollWidth: descEl === null ? null : descEl.scrollWidth,
          descClientWidth: descEl === null ? null : descEl.clientWidth,
        },
        iconOffsetFromListLeft: icon === null ? null : Math.round(icon.getBoundingClientRect().x - lb.x),
        durationRightGapToRootRight: durationRightGaps,
        durationGapSample: durationRightGaps[0] ?? null,
        parallelBefore: before === null ? null : {
          left: before.left,
          width: before.width,
          height: before.height,
          background: before.backgroundColor,
          top: before.top,
          bottom: before.bottom,
        },
        outputRow: outStyle === null ? null : {
          rect: rect(outputLabel),
          paddingLeft: outStyle.paddingLeft,
          paddingRight: outStyle.paddingRight,
        },
        showEarlier: seStyle === null ? null : {
          rect: rect(showEarlier),
          marginLeft: seStyle.marginLeft,
          marginRight: seStyle.marginRight,
          width: seStyle.width,
        },
        horizontalScrolling: {
          rootScrollWidth: root.scrollWidth,
          rootClientWidth: root.clientWidth,
          rootOverflowX: getComputedStyle(root).overflowX,
          listScrollWidth: list.scrollWidth,
          listClientWidth: list.clientWidth,
          listOverflowX: getComputedStyle(list).overflowX,
          bodyScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
        },
        stepNameWidthVar: getComputedStyle(root).getPropertyValue('--ttl-step-name-w').trim(),
      }
    })

    await park()
    const file = path.join(OUT_DIR, 'panel-fix-padding.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: file, animations: 'disabled' })
    log('shot panel-fix-padding.png')

    // open an inline detail band on a row to re-check the band width / margins
    const detailProbe = await page.evaluate(async () => {
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const row = rows.find((r) => r.getBoundingClientRect().top > 300) ?? rows[0]
      if (row === undefined) return null
      row.click()
      return null
    })
    await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 }).catch(() => {})
    await sleep(page, 1500)
    const band = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="ttl-detail"]')
      const root = document.querySelector('[data-testid="ttl-root"]')
      if (el === null) return null
      const b = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)],
        widthPx: Math.round(b.width),
        marginLeft: cs.marginLeft,
        marginRight: cs.marginRight,
        rootScrollWidth: root.scrollWidth,
        rootClientWidth: root.clientWidth,
      }
    })

    out.frame = { file, probe, detailProbe: band }
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'padding-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('padding probe:', JSON.stringify(probe).slice(0, 900))
    log('detail band:', JSON.stringify(band))
    log('metrics →', path.join(OUT_DIR, 'padding-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'padding-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-padding.mjs failed:', error?.message ?? error)
  process.exit(1)
})
