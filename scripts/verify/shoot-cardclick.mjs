#!/usr/bin/env node
/**
 * scripts/verify/shoot-cardclick.mjs — evidence for v0.10.21: the whole
 * collapsed turn card is a click target, so clicking the 2-line input preview
 * (not only the time row) opens the timeline.
 *
 * Frames:
 *   panel-collapsed.png   the collapsed card (preview = dead text before this fix)
 *   panel-expanded.png    the same card after clicking the preview line
 *   cardclick-metrics.json  steps before/after, collapsed state, pointer cursor, 0 console errors
 *
 * Usage: node scripts/verify/shoot-cardclick.mjs [--port 19487] [--out /tmp/verify/cardclick]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/cardclick'))
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

/** Two turns: the older one stays collapsed and carries the input preview. */
const CALLS = [
  ['bash', { command: 'ls', description: '列出源码文件' }],
  ['read', { file_path: 'src/client/TrailTab.tsx' }],
  ['edit', { file_path: 'src/client/TrailTab.tsx' }],
]
const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '第一轮：先看下代码结构', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 1 } })
CALLS.forEach(([name, args], index) => {
  MOCK_EVENTS.push({
    type: 'tool/call', seq: seq++, data: { name, arguments: JSON.stringify(args), callId: `c${index}`, turn: 1, step: index + 1 },
  })
  MOCK_EVENTS.push({
    type: 'tool/result', seq: seq++, data: { callId: `c${index}`, turn: 1, step: index + 1, content: [{ type: 'text', text: 'ok' }] },
  })
})
MOCK_EVENTS.push({ type: 'turn/end', seq: seq++, data: { turn: 1 } })
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '第二轮：打 tag，提交到远程并安装到当前 desktop profile', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 2 } })
MOCK_EVENTS.push({ type: 'tool/call', seq: seq++, data: { name: 'bash', arguments: JSON.stringify({ command: 'git tag', description: '打标签' }), callId: 'c9', turn: 2, step: 1 } })
MOCK_EVENTS.push({ type: 'tool/result', seq: seq++, data: { callId: 'c9', turn: 2, step: 1, content: [{ type: 'text', text: 'ok' }] } })
MOCK_EVENTS.push({ type: 'turn/end', seq: seq++, data: { turn: 2 } })
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
    status: 200,
    contentType: 'application/json',
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
  const sx = hb.x + hb.width / 2
  const y = 300
  const tx = 1440 - 400
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

  // Fold the latest turn so both cards are collapsed and previews are visible.
  const latest = page.locator('[data-testid="ttl-turn"]').last()
  if ((await latest.getAttribute('data-collapsed')) === 'false') {
    await latest.locator('.ttl-turnHead').click()
    await sleep(page, 500)
  }
  const firstCard = page.locator('[data-testid="ttl-turn"]').first()
  const preview = firstCard.locator('[data-testid="ttl-turn-preview"]')
  await preview.scrollIntoViewIfNeeded()
  await page.mouse.move(2, 2)
  await sleep(page, 300)

  const before = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="ttl-turn"]')
    const preview = card?.querySelector('[data-testid="ttl-turn-preview"]')
    return {
      collapsed: card?.getAttribute('data-collapsed'),
      previewText: (preview?.textContent ?? '').slice(0, 60),
      previewCursor: preview === null || preview === undefined ? null : getComputedStyle(card).cursor,
      steps: document.querySelectorAll('[data-testid="ttl-step"]').length,
      cardBox: card?.getBoundingClientRect().toJSON() ?? null,
    }
  })
  const box = await firstCard.boundingBox()
  const clip = {
    x: Math.max(0, Math.round(box.x)),
    y: Math.max(0, Math.round(box.y) - 2),
    width: Math.min(400, page.viewportSize().width - Math.round(box.x)),
    height: Math.min(120, Math.round(box.height) + 6),
  }
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-collapsed.png'), clip, animations: 'disabled' })

  // The actual fix: click the preview LINE, not the time row.
  await preview.click()
  await sleep(page, 700)
  const after = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="ttl-turn"]')
    return {
      collapsed: card?.getAttribute('data-collapsed'),
      steps: document.querySelectorAll('[data-testid="ttl-step"]').length,
    }
  })
  const box2 = await firstCard.boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-expanded.png'),
    clip: {
      x: Math.max(0, Math.round(box2.x)),
      y: Math.max(0, Math.round(box2.y) - 2),
      width: Math.min(400, page.viewportSize().width - Math.round(box2.x)),
      height: Math.min(260, Math.round(box2.height) + 6),
    },
    animations: 'disabled',
  })

  // And the guard: a click inside the expanded body must not fold it again.
  await page.locator('[data-testid="ttl-turn-foot"]').first().click()
  await sleep(page, 400)
  const afterBodyClick = await page.evaluate(() => document.querySelector('[data-testid="ttl-turn"]')?.getAttribute('data-collapsed'))

  fs.writeFileSync(path.join(OUT_DIR, 'cardclick-metrics.json'), JSON.stringify({ before, after, afterBodyClick, consoleErrors }, null, 2))
  log('before:', JSON.stringify(before))
  log('after:', JSON.stringify(after), 'afterBodyClick:', afterBodyClick)
  log('console errors:', consoleErrors.length)
} finally {
  await browser.close()
}
