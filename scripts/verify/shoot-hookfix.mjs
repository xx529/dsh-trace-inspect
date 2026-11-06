#!/usr/bin/env node
/**
 * scripts/verify/shoot-hookfix.mjs — verify the React #300 fix (v0.10.1:
 * TrailTab's `stepNameWidth` useMemo moved before `if (!visible) return null`).
 *
 * Part A (real session, 19487):
 *   open 轮次轨迹 tab → add 文件 tab → switch 文件/轮次轨迹 ×3 → interactions
 *   (expand turn, open detail, 摘要/结果/参数/原始, zoom open/close) → switch ×2.
 * Part B (mocked JSON session via page.route): open trail tab → open step →
 *   detail tabs → zoom → 文件/轮次轨迹 switch ×3.
 *
 * Every step records window.__dshErrors (console.error args + stacks,
 * window.error, unhandledrejection), Playwright console/pageerror, whether the
 * better-sidebar error boundary is visible, and whether `.ttl-root` survives.
 *
 * Outputs: panel-fix-hookfix.png, panel-fix-hookfix-mock.png, hookfix-metrics.json
 *
 * Usage: node scripts/verify/shoot-hookfix.mjs [--port 19487]
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

const MOCK_EVENTS = [
  { type: 'user/message', seq: 1, data: { content: 'check agent', message: { source: { kind: 'user' } } } },
  { type: 'turn/start', seq: 2, data: { turn: 1 } },
  {
    type: 'tool/call', seq: 3, data: {
      name: 'mcp__agent__interrupt_agent', arguments: JSON.stringify({ target: 'x' }),
      callId: 'c3', turn: 1, step: 1,
    },
  },
  {
    type: 'tool/result', seq: 4, data: {
      callId: 'c3', turn: 1, step: 1,
      content: [{ type: 'text', text: JSON.stringify({ previousStatus: 'running' }) }],
    },
  },
  {
    type: 'tool/call', seq: 5, data: {
      name: 'bash', arguments: JSON.stringify({ command: 'echo hi', description: 'Plain text probe' }),
      callId: 'c5', turn: 1, step: 2,
    },
  },
  {
    type: 'tool/result', seq: 6, data: {
      callId: 'c5', turn: 1, step: 2,
      content: [{ type: 'text', text: 'plain log line 1\nplain log line 2' }],
    },
  },
  { type: 'turn/end', seq: 7, data: { turn: 1 } },
]

const t0 = Date.now()
const log = (...p) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')}s]`, ...p)
const sleep = (page, ms) => page.waitForTimeout(ms)

const ERROR_RECORDER = () => {
  window.__dshErrors = []
  const push = (entry) => { try { window.__dshErrors.push(entry) } catch { /* ignore */ } }
  const serialize = (value) => {
    if (value instanceof Error) return value.stack || String(value)
    if (typeof value === 'string') return value
    try { return JSON.stringify(value) } catch { return String(value) }
  }
  const original = console.error
  console.error = function patchedConsoleError(...args) {
    push({ kind: 'console.error', time: Date.now(), text: args.map(serialize).join(' || '), argCount: args.length })
    return original.apply(this, args)
  }
  window.addEventListener('error', (event) => {
    push({ kind: 'window.error', time: Date.now(), text: (event.error && event.error.stack) || event.message, filename: event.filename || null, lineno: event.lineno || null })
  })
  window.addEventListener('unhandledrejection', (event) => {
    push({ kind: 'unhandledrejection', time: Date.now(), text: (event.reason && event.reason.stack) || String(event.reason) })
  })
}

async function snapshot(page) {
  return page.evaluate(() => {
    const bodyText = document.body.innerText || ''
    const root = document.querySelector('[data-testid="ttl-root"]')
    return {
      url: location.href.replace(/token=[^&]+/, 'token=***'),
      trailPresent: root !== null,
      trailRect: root === null ? null : (() => { const b = root.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] })(),
      errorPageVisible: /Minified React error|Rendered fewer hooks|出错了|加载失败/.test(bodyText),
      errorSnippet: (bodyText.match(/Minified React error[^\n]*/) ?? [null])[0],
      bodySnippet: bodyText.replace(/\s+/g, ' ').slice(0, 220),
      tabLabels: [...document.querySelectorAll('[class*=_tab_6nhg2]')].map((t) => (t.textContent ?? '').trim()).filter((t) => t.length > 0).slice(0, 8),
      errors: (window.__dshErrors ?? []).slice(-40),
    }
  })
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const { chromium } = await import(pathToFileURL(PW).href)
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const out = { generatedAt: new Date().toISOString(), viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, steps: [] }

  const newPage = async () => {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    })
    const page = await ctx.newPage()
    const consoleMessages = []
    const pageErrors = []
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') {
        consoleMessages.push({ type: m.type(), text: m.text(), location: m.location() })
      }
    })
    page.on('pageerror', (e) => pageErrors.push({ name: e.name, message: e.message, stack: e.stack }))
    await page.addInitScript(ERROR_RECORDER)
    return { ctx, page, consoleMessages, pageErrors }
  }

  const record = async (name, page, buckets, extra = {}) => {
    const snap = await snapshot(page)
    const entry = {
      step: name,
      at: new Date().toISOString(),
      trailPresent: snap.trailPresent,
      errorPageVisible: snap.errorPageVisible,
      errorSnippet: snap.errorSnippet,
      tabLabels: snap.tabLabels,
      windowErrors: snap.errors,
      playwrightConsoleErrors: buckets.consoleMessages.slice(),
      playwrightPageErrors: buckets.pageErrors.slice(),
      ...extra,
    }
    out.steps.push(entry)
    log(name, '| trail:', snap.trailPresent, '| errorPage:', snap.errorPageVisible, '| winErrors:', snap.errors.length, '| consoleErr:', buckets.consoleMessages.length, '| pageErr:', buckets.pageErrors.length)
    return { snap, entry }
  }

  const openSidebarDock = async (page) => {
    const openButton = page.getByRole('button', { name: '打开右侧边栏' })
    if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
      await openButton.first().click(); await sleep(page, 1200)
    }
    const panel = page.locator('[class*=Dv5QdW_panel]').first()
    const handle = page.locator('.PIRFFq_handle').last()
    await handle.waitFor({ state: 'visible', timeout: 15000 })
    const hb = await handle.boundingBox()
    const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 400
    await page.mouse.move(sx, y); await page.mouse.down()
    for (let i = 1; i <= 12; i += 1) await page.mouse.move(sx + ((tx - sx) * i) / 12, y)
    await page.mouse.up(); await sleep(page, 500)
    return Math.round((await panel.boundingBox()).width)
  }

  const tab = (page, label) => page.locator('[class*=_tab_6nhg2]', { hasText: label }).first()

  const addFileTab = async (page) => {
    // the tab bar "+" opens the guide tab; pick 文件 there
    const plus = page.getByRole('button', { name: '新标签页' })
    if (await plus.count() > 0 && await plus.first().isVisible().catch(() => false)) {
      await plus.first().click(); await sleep(page, 900)
    }
    const fileEntry = page.locator('button.F6Huca_entry', { hasText: '文件' }).first()
    if (await fileEntry.count() > 0) { await fileEntry.click(); await sleep(page, 900); return true }
    return false
  }

  const switchLoop = async (page, buckets, prefix) => {
    for (let i = 1; i <= 3; i += 1) {
      await tab(page, '文件').click(); await sleep(page, 450)
      await record(`${prefix}: switch to 文件 #${i}`, page, buckets)
      await tab(page, '轮次轨迹').click(); await sleep(page, 700)
      await record(`${prefix}: switch back to 轮次轨迹 #${i}`, page, buckets)
    }
  }

  try {
    // ── Part A: real session, tab switching + interactions ────────────────
    const a = await newPage()
    await a.page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(a.page, 3500)
    await a.page.locator('.JoiKIa_sessionRow', { hasText: SESSION_TITLE }).first().click()
    await sleep(a.page, 5000)
    out.dockWidth = await openSidebarDock(a.page)
    await a.page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' }).first().click()
    await a.page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
    await a.page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 5, null, { timeout: 90000 })
    await sleep(a.page, 2000)
    await record('A: trail tab opened', a.page, a)

    const fileAdded = await addFileTab(a.page)
    await record(`A: file tab added (${fileAdded})`, a.page, a)
    if (!fileAdded) throw new Error('could not add 文件 tab; tab switch test aborted')

    await switchLoop(a.page, a, 'A')
    const snapAfterSwitch = await a.page.evaluate(() => ({
      tabs: [...document.querySelectorAll('[class*=_tab_6nhg2]')].map((t) => (t.textContent ?? '').trim()).filter(Boolean),
      trailPresent: document.querySelector('[data-testid="ttl-root"]') !== null,
      turns: document.querySelectorAll('[data-testid="ttl-turn"]').length,
    }))
    await a.page.mouse.move(2, 2); await sleep(a.page, 250)
    const hookfixFile = path.join(OUT_DIR, 'panel-fix-hookfix.png')
    await a.page.screenshot({ path: hookfixFile, fullPage: false, animations: 'disabled' })
    log('shot panel-fix-hookfix.png')
    out.partA = { file: hookfixFile, afterSwitch: snapAfterSwitch, fileAdded }

    // interactions: expand turn, open detail, detail tabs, zoom, tab switches
    const expanded = a.page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
    if (await expanded.count() === 0) {
      await a.page.locator('[data-testid="ttl-turn"]').last().locator('.ttl-turnToggle').click()
      await sleep(a.page, 1200)
    }
    const stepRow = a.page.locator('[data-testid="ttl-step"]').first()
    await stepRow.scrollIntoViewIfNeeded(); await stepRow.click()
    await a.page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
    await sleep(a.page, 1200)
    await record('A: step detail opened', a.page, a)

    for (const name of ['summary', 'result', 'params', 'raw']) {
      const el = a.page.locator(`[data-testid="ttl-detail-tab-${name}"]`).first()
      if (await el.count() > 0) { await el.click(); await sleep(a.page, 700); await record(`A: detail tab ${name}`, a.page, a) }
    }
    const zoomBtn = a.page.locator('[data-testid="ttl-detail-zoom"]').first()
    if (await zoomBtn.count() > 0) {
      await zoomBtn.click()
      await a.page.waitForSelector('[data-testid="ttl-zoom"]', { timeout: 10000 }).catch(() => {})
      await sleep(a.page, 800)
      await record('A: zoom overlay opened', a.page, a)
      await a.page.keyboard.press('Escape')
      await sleep(a.page, 800)
      await record('A: zoom overlay closed', a.page, a)
    }
    await tab(a.page, '文件').click(); await sleep(a.page, 450)
    await record('A: switch to 文件 after interactions', a.page, a)
    await tab(a.page, '轮次轨迹').click(); await sleep(a.page, 700)
    await record('A: switch back after interactions', a.page, a)
    await tab(a.page, '文件').click(); await sleep(a.page, 450)
    await tab(a.page, '轮次轨迹').click(); await sleep(a.page, 700)
    await record('A: second switch back after interactions', a.page, a)
    await a.ctx.close()

    // ── Part B: mocked JSON session ───────────────────────────────────────
    const b = await newPage()
    await b.page.route('**/trace-inspect/api/events**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ events: MOCK_EVENTS, hasMore: false, nextAfterSeq: 7 }),
    }))
    await b.page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(b.page, 3500)
    await openSidebarDock(b.page)
    await b.page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' }).first().click()
    await b.page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
    await b.page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 1, null, { timeout: 30000 })
    await sleep(b.page, 1200)
    await record('B: mocked trail tab opened', b.page, b)
    const mcpRow = b.page.locator('[data-testid="ttl-step"]', { hasText: 'interrupt_agent' }).first()
    await mcpRow.click()
    await b.page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
    await sleep(b.page, 1200)
    await b.page.locator('[data-testid="ttl-detail-tab-result"]').first().click(); await sleep(b.page, 800)
    await record('B: mocked JSON result tab', b.page, b)
    const bZoom = b.page.locator('[data-testid="ttl-detail-zoom"]').first()
    if (await bZoom.count() > 0) {
      await bZoom.click()
      await b.page.waitForSelector('[data-testid="ttl-zoom"]', { timeout: 10000 }).catch(() => {})
      await sleep(b.page, 700)
      await record('B: mocked zoom opened', b.page, b)
      await b.page.keyboard.press('Escape'); await sleep(b.page, 700)
      await record('B: mocked zoom closed', b.page, b)
    }
    const bFileAdded = await addFileTab(b.page)
    await record(`B: file tab added (${bFileAdded})`, b.page, b)
    if (bFileAdded) await switchLoop(b.page, b, 'B')
    await b.page.mouse.move(2, 2); await sleep(b.page, 250)
    const mockFile = path.join(OUT_DIR, 'panel-fix-hookfix-mock.png')
    await b.page.screenshot({ path: mockFile, fullPage: false, animations: 'disabled' })
    log('shot panel-fix-hookfix-mock.png')
    out.partB = { file: mockFile, fileAdded: bFileAdded }
    await b.ctx.close()

    const collectAll = (kind) => out.steps.flatMap((s) => (kind === 'window' ? s.windowErrors : kind === 'console' ? s.playwrightConsoleErrors : s.playwrightPageErrors))
    const consoleAll = collectAll('console')
    const isStatic404 = (m) => /404 \(Not Found\)|Failed to load resource/.test(m.text ?? '')
    const nonStaticConsole = consoleAll.filter((m) => !isStatic404(m))
    out.summary = {
      steps: out.steps.length,
      errorPageSeen: out.steps.some((s) => s.errorPageVisible === true),
      windowErrorCount: collectAll('window').length,
      consoleErrorCount: consoleAll.length,
      consoleStatic404Count: consoleAll.filter(isStatic404).length,
      consoleNonStaticCount: nonStaticConsole.length,
      pageErrorCount: collectAll('page').length,
      react300Seen: /Minified React error #300|Rendered fewer hooks/.test(JSON.stringify(out.steps)),
      trailPresentAtEnd: out.steps[out.steps.length - 1].trailPresent,
    }
    out.consoleErrors = collectAll('console').slice(0, 40)
    out.pageErrors = collectAll('page').slice(0, 40)
    out.windowErrors = collectAll('window').slice(0, 60)
    fs.writeFileSync(path.join(OUT_DIR, 'hookfix-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('summary:', JSON.stringify(out.summary))
    log('metrics →', path.join(OUT_DIR, 'hookfix-metrics.json'))
  } catch (error) {
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'hookfix-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-hookfix.mjs failed:', error?.message ?? error)
  process.exit(1)
})
