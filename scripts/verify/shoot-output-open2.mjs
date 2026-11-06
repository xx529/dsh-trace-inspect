#!/usr/bin/env node
/**
 * scripts/verify/shoot-output-open2.mjs — v0.9.6 check: the expanded assistant
 * message body no longer inherits the old `.ttl-output-body` 64px left padding.
 *
 * Captures /tmp/verify/after/panel-fix-output-open2.png (the same first long
 * output block as panel-fix-output-open.png, expanded) and measures:
 *   - collapsed `.ttl-msgText` x / width
 *   - expanded `.ttl-msg .ttl-md` x / width (should match the collapsed x and
 *     fill the block, ≈347px — not the old 269px)
 *   - `.ttl-msg .ttl-output-body` computed padding (expect 0px)
 *   - 「收起」 availability + horizontal-scroll check
 *
 * Usage: node scripts/verify/shoot-output-open2.mjs [--port 19487]
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
    await page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#1' }).first().locator('.ttl-turnToggle').click()
    await sleep(page, 1800)
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const blocks = [...document.querySelectorAll('.ttl-msg')]
      const block = blocks.find((b) => b.querySelector('[data-testid="ttl-output-toggle"]') !== null)
      if (list !== null && block !== null) {
        const lb = list.getBoundingClientRect(), bb = block.getBoundingClientRect()
        list.scrollTop += bb.top - lb.top - 12
      }
    })
    await sleep(page, 600)

    await park()
    const closed = await page.evaluate(() => {
      const block = [...document.querySelectorAll('.ttl-msg')].find((b) => b.querySelector('[data-testid="ttl-output-toggle"]'))
      const text = block?.querySelector('.ttl-msgText')
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      return {
        msgTextX: text === null ? null : Math.round(text.getBoundingClientRect().x),
        msgTextWidth: text === null ? null : Math.round(text.getBoundingClientRect().width),
        msgTextRect: r(text),
        blockRect: r(block),
        toggleText: (block?.querySelector('[data-testid="ttl-output-toggle"]')?.textContent ?? '').trim(),
      }
    })
    log('closed:', JSON.stringify(closed))

    const toggleBtn = page.locator('[data-testid="ttl-output-toggle"]').first()
    await toggleBtn.click()
    await sleep(page, 1600)
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const open = document.querySelector('.ttl-msg[data-open="true"]')
      if (list !== null && open !== null) {
        list.scrollTop += open.getBoundingClientRect().top - list.getBoundingClientRect().top - 8
      }
    })
    await sleep(page, 500)

    await park()
    const expanded = await page.evaluate(() => {
      const block = document.querySelector('.ttl-msg[data-open="true"]')
      const body = block?.querySelector('[data-testid="ttl-output-body"]')
      const md = body?.querySelector('[data-testid="ttl-md"], .ttl-md')
      const firstP = body?.querySelector('p, h1, h2, h3, .ttl-mdTableWrap')
      const toggle = block?.querySelector('[data-testid="ttl-output-toggle"]')
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const cs = body === null ? null : getComputedStyle(body)
      const list = document.querySelector('[data-testid="ttl-list"]')
      const root = document.querySelector('[data-testid="ttl-root"]')
      return {
        blockRect: r(block),
        dataOpen: block?.getAttribute('data-open') ?? null,
        outputBody: body === null ? null : {
          rect: r(body),
          padding: cs.padding,
          paddingLeft: cs.paddingLeft,
          paddingRight: cs.paddingRight,
          marginTop: cs.marginTop,
          color: cs.color,
        },
        md: md === null ? null : { rect: r(md), x: Math.round(md.getBoundingClientRect().x), width: Math.round(md.getBoundingClientRect().width) },
        firstText: firstP === null ? null : { x: Math.round(firstP.getBoundingClientRect().x), rect: r(firstP), text: (firstP.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60) },
        toggle: toggle === null ? null : { text: (toggle.textContent ?? '').trim(), display: getComputedStyle(toggle).display, rect: r(toggle) },
        horizontal: {
          rootScrollWidth: root.scrollWidth,
          rootClientWidth: root.clientWidth,
          listScrollWidth: list.scrollWidth,
          listClientWidth: list.clientWidth,
          bodyScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
        },
        listScrollTop: Math.round(list.scrollTop),
        listScrollHeight: Math.round(list.scrollHeight),
      }
    })
    log('expanded:', JSON.stringify(expanded).slice(0, 900))

    const file = path.join(OUT_DIR, 'panel-fix-output-open2.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: file, animations: 'disabled' })
    log('shot panel-fix-output-open2.png')

    out.closed = closed
    out.expanded = expanded
    out.file = file
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'output-open2-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('metrics →', path.join(OUT_DIR, 'output-open2-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'output-open2-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-output-open2.mjs failed:', error?.message ?? error)
  process.exit(1)
})
