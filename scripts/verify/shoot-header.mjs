#!/usr/bin/env node
/**
 * scripts/verify/shoot-header.mjs — evidence for v0.10.24:
 *   1) the idle 「⋯」 button in the panel header is removed;
 *   2) the search field moved into the header right before 「跟随」, so the
 *      panel saves a whole row (header 44px → chips row 36px, no search row).
 *
 * Frames:
 *   panel-header.png       header + filter chips (2x, dock --dock)
 *   header-metrics.json    header children / rects / overflow / dropdown top
 *
 * Usage: node scripts/verify/shoot-header.mjs [--dock 400|360] [--port 19487]
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
const DOCK = Number(arg('dock', '400'))
const OUT_DIR = path.resolve(arg('out', `/tmp/verify/header-${DOCK}`))
const SERVER_LOG = arg('server-log', '/tmp/verify/server.log')
fs.mkdirSync(OUT_DIR, { recursive: true })

function resolveUrl() {
  const explicit = arg('url', process.env.DSH_URL)
  if (explicit) return explicit
  const text = fs.readFileSync(SERVER_LOG, 'utf8')
  const byPort = [...text.matchAll(new RegExp(`:${PORT}/\\?token=([A-Za-z0-9_\\-]+)`, 'g'))]
  if (byPort.length === 0) throw new Error(`no token for ${PORT} in ${SERVER_LOG}`)
  return `http://127.0.0.1:${PORT}/?token=${byPort[byPort.length - 1][1]}`
}
const URL_WITH_TOKEN = resolveUrl()

const PW = process.env.PLAYWRIGHT_CORE
  || path.join(process.env.HOME || '', '.dsh/mcp-servers/mobile-mcp/node_modules/playwright-core/index.mjs')
const { chromium } = await import(pathToFileURL(PW).href)

/** Six tool names → the chips row overflows into the 「⋯」 chip. */
const CALLS = [
  ['bash', { command: 'ls', description: '列出文件' }],
  ['read', { file_path: 'src/a.ts' }],
  ['edit', { file_path: 'src/a.ts' }],
  ['grep', { pattern: 'foo' }],
  ['glob', { pattern: 'src/**/*.ts' }],
  ['todo_write', { todos: [{ id: 1 }] }],
]
const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '头部改造验证', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 1 } })
CALLS.forEach(([name, args], index) => {
  MOCK_EVENTS.push({ type: 'tool/call', seq: seq++, data: { name, arguments: JSON.stringify(args), callId: `c${index}`, turn: 1, step: index + 1 } })
  MOCK_EVENTS.push({ type: 'tool/result', seq: seq++, data: { callId: `c${index}`, turn: 1, step: index + 1, content: [{ type: 'text', text: 'ok' }] } })
})
MOCK_EVENTS.push({ type: 'turn/end', seq: seq++, data: { turn: 1 } })
const LAST_SEQ = seq - 1

const sleep = (page, ms) => page.waitForTimeout(ms)
const t0 = Date.now()
const log = (...p) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')}s]`, ...p)

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

try {
  await page.route('**/trace-inspect/api/events**', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ events: MOCK_EVENTS, hasMore: false, nextAfterSeq: LAST_SEQ }),
  }))
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(page, 3500)
  const openButton = page.getByRole('button', { name: '打开右侧边栏' })
  if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
    await openButton.first().click()
    await sleep(page, 1200)
  }
  const handle = page.locator('.PIRFFq_handle').last()
  const hb = await handle.boundingBox()
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - DOCK
  await page.mouse.move(sx, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(sx + ((tx - sx) * i) / 12, y)
  await page.mouse.up()
  await sleep(page, 600)
  log('dock:', Math.round((await page.locator('[class*=Dv5QdW_panel]').first().boundingBox()).width))

  let opened = false
  const tab = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await tab.count() > 0) { await tab.first().click(); opened = true }
  if (!opened) {
    const add = page.getByRole('button', { name: '新标签页' })
    if (await add.count() > 0 && await add.first().isVisible().catch(() => false)) { await add.first().click(); await sleep(page, 900) }
    const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
    if (await entry.count() > 0) { await entry.first().click(); opened = true }
  }
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await sleep(page, 1500)
  await page.mouse.move(2, 2)
  await sleep(page, 300)

  const metrics = await page.evaluate(() => {
    const rr = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), right: +b.right.toFixed(1) } }
    const header = document.querySelector('.ttl-header')
    const search = header?.querySelector('.ttl-search')
    const follow = header?.querySelector('[data-testid="ttl-follow-toggle"]')
    const chips = document.querySelector('.ttl-filters')
    const root = document.querySelector('.ttl-root')
    return {
      headerChildren: [...(header?.children ?? [])].map((el) => el.className || el.tagName),
      header: rr(header),
      search: rr(search),
      follow: rr(follow),
      chips: rr(chips),
      root: rr(root),
      headerOverflow: header === null || header === undefined ? null : header.scrollWidth - header.clientWidth,
      followBeforeSearch: search !== null && search !== undefined && follow !== null && follow !== undefined
        ? follow.getBoundingClientRect().right <= search.getBoundingClientRect().left + 0.5
        : null,
      searchIsRightmost: search !== null && search !== undefined && header !== null && header !== undefined
        ? search.getBoundingClientRect().right >= header.getBoundingClientRect().right - 12
        : null,
      searchRowExists: document.querySelector('.ttl-searchRow') !== null,
      moreButtonExists: document.querySelector('[data-testid="ttl-more"]') !== null,
      chipsRightAfterHeader: header !== null && header !== undefined && chips !== null && chips !== undefined
        ? Math.abs(chips.getBoundingClientRect().top - header.getBoundingClientRect().bottom) < 1.5
        : null,
      searchVisible: search === null || search === undefined ? false : getComputedStyle(search).display !== 'none',
    }
  })

  // The tool dropdown must hang right under the chip row (one row up from v0.10.23).
  const moreChip = page.locator('[data-testid="ttl-chip-more"]')
  let dropdownTop = null
  if (await moreChip.count() > 0) {
    await moreChip.first().click()
    await sleep(page, 300)
    dropdownTop = await page.evaluate(() => {
      const dd = document.querySelector('[data-testid="ttl-tool-dropdown"]')
      const chips = document.querySelector('.ttl-filters')
      return dd === null || dd === undefined || chips === null || chips === undefined
        ? null
        : +(dd.getBoundingClientRect().top - chips.getBoundingClientRect().top).toFixed(1)
    })
    await page.keyboard.press('Escape').catch(() => {})
    await moreChip.first().click().catch(() => {})
    await sleep(page, 200)
  }

  const headerBox = await page.locator('.ttl-header').first().boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-header.png'),
    clip: {
      x: Math.max(0, Math.round(headerBox.x)),
      y: Math.max(0, Math.round(headerBox.y)),
      width: Math.min(400, page.viewportSize().width - Math.round(headerBox.x)),
      height: 100,
    },
    animations: 'disabled',
  })

  fs.writeFileSync(path.join(OUT_DIR, 'header-metrics.json'), JSON.stringify({ dock: DOCK, metrics, dropdownTop, consoleErrors }, null, 2))
  log('header:', JSON.stringify(metrics.headerChildren), 'search:', JSON.stringify(metrics.search), 'follow:', JSON.stringify(metrics.follow))
  log('chipsTop==headerBottom:', metrics.chipsRightAfterHeader, 'overflow:', metrics.headerOverflow, 'followBeforeSearch:', metrics.followBeforeSearch, 'dropdownTopDelta:', dropdownTop)
  log('console errors:', consoleErrors.length)
  const bad = [
    metrics.moreButtonExists,
    metrics.searchRowExists,
    !metrics.searchVisible,
    metrics.followBeforeSearch !== true,
    metrics.chipsRightAfterHeader !== true,
    (metrics.headerOverflow ?? 1) > 0.5,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
