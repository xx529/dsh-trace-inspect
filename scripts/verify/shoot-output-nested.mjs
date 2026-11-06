#!/usr/bin/env node
/**
 * scripts/verify/shoot-output-nested.mjs — v0.9.6 tail: nested code inside bold.
 *
 * The assistant message from seq #146 is:
 *   决策已定：**改名为 `dsh-trace-inspect`**，范围 **P0+P1+P1.5（v1.0）**。…
 * The collapsed inlineMarkdown must now render the `` `dsh-trace-inspect` `` as a
 * code chip INSIDE the bold span (no literal backticks).
 *
 * Captures /tmp/verify/after/panel-fix-output-nested.png (400px list frame with
 * that block) + panel-fix-output-nested-block.png (the block itself), and writes
 * output-nested-metrics.json:
 *   - block `.ttl-msgStrong` count / whether any strong contains `.ttl-msgCode`
 *   - `.ttl-msgText` textContent backtick count (expect 0) and `**` count
 *   - code chip computed style (font, colour, background, radius, padding)
 *   - global `.ttl-msg` count + horizontal-scroll check
 *
 * Usage: node scripts/verify/shoot-output-nested.mjs [--port 19487]
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

    // scroll the seq #146 message block (contains 决策已定) near the top
    const scrolled = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const block = [...document.querySelectorAll('.ttl-msg')].find((b) => (b.textContent ?? '').includes('决策已定'))
      if (list === null || block === undefined) return null
      const lb = list.getBoundingClientRect(), bb = block.getBoundingClientRect()
      list.scrollTop += bb.top - lb.top - 12
      return { scrollTop: Math.round(list.scrollTop), blockText: (block.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120) }
    })
    await sleep(page, 500)
    log('scrolled:', JSON.stringify(scrolled))

    await park()
    const probe = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const root = document.querySelector('[data-testid="ttl-root"]')
      const lb = list.getBoundingClientRect()
      const block = [...document.querySelectorAll('.ttl-msg')].find((b) => (b.textContent ?? '').includes('决策已定'))
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const textEl = block?.querySelector('.ttl-msgText')
      const strongs = block === null ? [] : [...block.querySelectorAll('.ttl-msgStrong')]
      const codes = block === null ? [] : [...block.querySelectorAll('.ttl-msgCode')]
      const nestedCode = block === null ? [] : [...block.querySelectorAll('.ttl-msgStrong .ttl-msgCode')]
      const code = codes[0] ?? null
      const cs = code === null ? null : getComputedStyle(code)
      const strongInfo = strongs.map((s) => ({
        text: (s.textContent ?? '').trim(),
        hasCode: s.querySelector('.ttl-msgCode') !== null,
        fontWeight: getComputedStyle(s).fontWeight,
        color: getComputedStyle(s).color,
      }))
      const text = (textEl?.textContent ?? '')
      return {
        blockRect: r(block),
        blockDataOpen: block?.getAttribute('data-open') ?? null,
        blockText: text.replace(/\s+/g, ' ').trim().slice(0, 160),
        strongCount: strongs.length,
        strongs: strongInfo,
        codeCount: codes.length,
        nestedCodeCount: nestedCode.length,
        codeChip: code === null ? null : {
          rect: r(code),
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          padding: cs.padding,
          borderRadius: cs.borderRadius,
          background: cs.backgroundColor,
          color: cs.color,
          text: (code.textContent ?? '').trim(),
        },
        textBacktickCount: (text.match(/`/g) ?? []).length,
        textStarCount: (text.match(/\*\*/g) ?? []).length,
        textLength: text.length,
        msgCount: document.querySelectorAll('.ttl-msg').length,
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
      }
    })
    log('nested probe:', JSON.stringify(probe).slice(0, 1200))

    const frameFile = path.join(OUT_DIR, 'panel-fix-output-nested.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: frameFile, animations: 'disabled' })
    log('shot panel-fix-output-nested.png')
    const blockFile = path.join(OUT_DIR, 'panel-fix-output-nested-block.png')
    try {
      const blockLocator = page.locator('.ttl-msg', { hasText: '决策已定' }).first()
      await blockLocator.screenshot({ path: blockFile, animations: 'disabled' })
      log('shot panel-fix-output-nested-block.png')
    } catch (error) {
      log('block shot skipped:', String(error).split('\n')[0])
    }

    out.frame = { file: frameFile, blockFile, scroll: scrolled, probe }
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'output-nested-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('metrics →', path.join(OUT_DIR, 'output-nested-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'output-nested-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-output-nested.mjs failed:', error?.message ?? error)
  process.exit(1)
})
