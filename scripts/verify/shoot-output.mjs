#!/usr/bin/env node
/**
 * scripts/verify/shoot-output.mjs — v0.9.5 assistant-prose message block:
 *
 *   panel-fix-output.png       one 400px list screen with 2–3 assistant output
 *                              blocks (quote-style, green 2px accent, inline
 *                              **bold** / `code`, 3-line clamp)
 *   panel-fix-output-open.png  same block after 「展开全文」 → full Markdown and
 *                              the 「收起」 control
 *
 * Measures (into /tmp/verify/after/output-metrics.json):
 *   - `.ttl-msg` count / block margins (6px 14px 10px) / accent + background
 *   - `.ttl-msgText` font-size/line-height, -webkit-line-clamp (3) and the
 *     clamped pixel height (line count)
 *   - `ttl-output-body` presence before (0) / after (1) expansion
 *   - `.ttl-msgJump` initial display (none) and after hovering the block
 *   - `.ttl-msgStrong` / `.ttl-msgCode` element counts
 *   - horizontal-scroll / clipping checks for the block
 *
 * Usage: node scripts/verify/shoot-output.mjs [--port 19487] [--out /tmp/verify/after]
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

    // scroll so the first long output block (with 展开全文) sits near the top
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const blocks = [...document.querySelectorAll('[data-testid="ttl-output-wrap"]')]
      const block = blocks.find((b) => b.querySelector('[data-testid="ttl-output-toggle"]') !== null)
      if (list !== null && block !== null) {
        const lb = list.getBoundingClientRect(), bb = block.getBoundingClientRect()
        list.scrollTop += bb.top - lb.top - 12
      }
    })
    await sleep(page, 600)

    const probe = () => page.evaluate(() => {
      const root = document.querySelector('[data-testid="ttl-root"]')
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const blocks = [...document.querySelectorAll('.ttl-msg')]
      const inView = blocks.filter((b) => {
        const r = b.getBoundingClientRect()
        return r.bottom > lb.top && r.top < lb.bottom
      })
      const rect = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const block = inView[0] ?? blocks[0] ?? null
      const bcs = block === null ? null : getComputedStyle(block)
      const textEl = block === null ? null : block.querySelector('.ttl-msgText, .ttl-msgTextOpen')
      const tcs = textEl === null ? null : getComputedStyle(textEl)
      const jump = block === null ? null : block.querySelector('[data-testid="ttl-output-jump"]')
      const toggle = block === null ? null : block.querySelector('[data-testid="ttl-output-toggle"]')
      const body = block === null ? null : block.querySelector('[data-testid="ttl-output-body"]')
      const msgTextRect = textEl === null ? null : textEl.getBoundingClientRect()
      return {
        msgCount: blocks.length,
        msgInView: inView.length,
        block: block === null ? null : {
          rect: rect(block),
          margin: bcs.margin,
          padding: bcs.padding,
          borderLeft: bcs.borderLeft,
          background: bcs.backgroundColor,
          borderRadius: bcs.borderRadius,
          dataOpen: block.getAttribute('data-open'),
        },
        msgText: textEl === null ? null : {
          lineClamp: tcs.getPropertyValue('-webkit-line-clamp') || tcs.webkitLineClamp,
          fontSize: tcs.fontSize,
          lineHeight: tcs.lineHeight,
          textAlign: tcs.textAlign,
          whiteSpace: tcs.whiteSpace,
          overflow: tcs.overflow,
          display: tcs.display,
          heightPx: Math.round(msgTextRect.height),
          linesVisible: Math.round(msgTextRect.height / parseFloat(tcs.lineHeight)),
          color: tcs.color,
          scrollWidth: textEl.scrollWidth,
          clientWidth: textEl.clientWidth,
          textPreview: (textEl.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        },
        outputBodyCount: document.querySelectorAll('[data-testid="ttl-output-body"]').length,
        msgJump: jump === null ? null : {
          display: getComputedStyle(jump).display,
          opacity: getComputedStyle(jump).opacity,
          rect: rect(jump),
        },
        toggle: toggle === null ? null : { text: (toggle.textContent ?? '').trim(), display: getComputedStyle(toggle).display },
        strongCount: document.querySelectorAll('.ttl-msgStrong').length,
        codeCount: document.querySelectorAll('.ttl-msgCode').length,
        msgStrongInBlock: block === null ? 0 : block.querySelectorAll('.ttl-msgStrong').length,
        msgCodeInBlock: block === null ? 0 : block.querySelectorAll('.ttl-msgCode').length,
        horizontal: {
          rootScrollWidth: root.scrollWidth,
          rootClientWidth: root.clientWidth,
          listScrollWidth: list.scrollWidth,
          listClientWidth: list.clientWidth,
          bodyScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
        },
        listRect: [Math.round(lb.x), Math.round(lb.y), Math.round(lb.width), Math.round(lb.height)],
        listScrollTop: Math.round(list.scrollTop),
        listScrollHeight: Math.round(list.scrollHeight),
      }
    })

    await park()
    const before = await probe()
    const frameFile = path.join(OUT_DIR, 'panel-fix-output.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: frameFile, animations: 'disabled' })
    log('shot panel-fix-output.png')
    log('output probe:', JSON.stringify(before).slice(0, 700))
    out.closed = { file: frameFile, probe: before }

    // hover the block → ↗ should appear, then park again
    const firstBlock = page.locator('.ttl-msg').first()
    let hoverProbe = null
    try {
      const box = await firstBlock.boundingBox()
      if (box !== null) {
        await page.mouse.move(Math.round(box.x + box.width / 2), Math.round(box.y + 18))
        await sleep(page, 400)
        hoverProbe = await page.evaluate(() => {
          const jump = document.querySelector('.ttl-msg [data-testid="ttl-output-jump"]')
          return jump === null ? null : { display: getComputedStyle(jump).display, opacity: getComputedStyle(jump).opacity }
        })
      }
    } catch (error) {
      hoverProbe = { error: String(error).split('\n')[0] }
    }
    await park()

    // expand the first long block via 「展开全文」
    const toggleBtn = page.locator('[data-testid="ttl-output-toggle"]').first()
    await toggleBtn.waitFor({ state: 'visible', timeout: 10000 })
    await toggleBtn.click()
    await sleep(page, 1500)
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const open = document.querySelector('.ttl-msg[data-open="true"]')
      if (list !== null && open !== null) {
        const lb = list.getBoundingClientRect(), ob = open.getBoundingClientRect()
        list.scrollTop += ob.top - lb.top - 8
      }
    })
    await sleep(page, 500)
    await park()
    const after = await probe()
    const openFile = path.join(OUT_DIR, 'panel-fix-output-open.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: openFile, animations: 'disabled' })
    log('shot panel-fix-output-open.png')
    log('open probe:', JSON.stringify(after).slice(0, 700))

    out.open = { file: openFile, probe: after }
    out.hoverJump = hoverProbe
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'output-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('metrics →', path.join(OUT_DIR, 'output-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'output-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-output.mjs failed:', error?.message ?? error)
  process.exit(1)
})
