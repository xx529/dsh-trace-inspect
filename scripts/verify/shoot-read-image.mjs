#!/usr/bin/env node
/**
 * scripts/verify/shoot-read-image.mjs — evidence for v0.10.26: a `read_image`
 * result renders the actual picture in the default 摘要 pane (it used to show
 * only the `image/jpeg image, WxH px, N bytes` text placeholder there).
 *
 * Frames:
 *   panel-detail.png     inline detail band, 摘要 tab, image thumbnail (2x)
 *   read-image-metrics.json  tab / img row / natural size / console errors
 *
 * Usage: node scripts/verify/shoot-read-image.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/readimage'))
const SERVER_LOG = arg('server-log', '/tmp/verify/server.log')
const IMAGE = path.resolve(arg('image', '/Users/lzx/Documents/GitHub/dsh-trace-inspect/docs/assets/turn-outline-panel.png'))
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

/** One `read_image` result shaped exactly like DSH's: text envelope + image block. */
const FILE = '/tmp/verify/turnheadmix-big.png'
const ATTACHMENT = 'sha256:b413b70c549dcaf436d3da7df0e29f6e636cef1795f5cea91d7b005122069f6a'
const MOCK_EVENTS = []
let seq = 1
const T0 = Date.now() - 30_000
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, time: T0, data: { content: '看一下这张截图', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, time: T0, data: { turn: 1 } })
MOCK_EVENTS.push({
  type: 'tool/call',
  seq: seq++,
  time: T0 + 1000,
  data: { name: 'read_image', arguments: JSON.stringify({ file_path: FILE }), callId: 'c1', turn: 1, step: 1 },
})
MOCK_EVENTS.push({
  type: 'tool/result',
  seq: seq++,
  time: T0 + 1500,
  data: {
    callId: 'c1',
    turn: 1,
    step: 1,
    isError: false,
    content: [
      { type: 'text', text: `<path>${FILE}</path>\n<type>image</type>\n<content>\nimage/jpeg image, 800x144 px, 9390 bytes\n</content>` },
      { type: 'image', attachment: { attachmentId: ATTACHMENT, mediaType: 'image/jpeg', bytes: 9390, width: 800, height: 144, name: 'turnheadmix-big.png' } },
    ],
  },
})
MOCK_EVENTS.push({ type: 'turn/end', seq: seq++, time: T0 + 4000, data: { turn: 1 } })
const LAST_SEQ = seq - 1

const sleep = (page, ms) => page.waitForTimeout(ms)
const t0 = Date.now()
const log = (...p) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')}s]`, ...p)

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
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
  // The plugin's attachment route: serve the real picture bytes for that id.
  await page.route('**/trace-inspect/api/attachment**', (route) => route.fulfill({
    status: 200,
    contentType: 'image/jpeg',
    body: fs.readFileSync(IMAGE),
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
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 420
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

  // Open the read_image step; the band lands on 摘要.
  await page.locator('[data-testid="ttl-step"]').first().click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
  await page.waitForSelector('[data-testid="ttl-img-thumb"]', { timeout: 15000 })
  await sleep(page, 700)
  await page.mouse.move(2, 2)
  await sleep(page, 300)

  const metrics = await page.evaluate(() => {
    const detail = document.querySelector('[data-testid="ttl-detail"]')
    const thumb = document.querySelector('[data-testid="ttl-img-thumb"]')
    const row = document.querySelector('[data-testid="ttl-img-row"]')
    const chip = document.querySelector('[data-testid="ttl-img-chip"]')
    const outBlock = detail?.querySelector('[data-testid="ttl-outBlock"]')
    const rr = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) } }
    return {
      tab: detail?.getAttribute('data-tab'),
      hasImgRow: row !== null,
      hasThumb: thumb !== null,
      thumbAlt: thumb?.getAttribute('alt') ?? null,
      thumbRect: rr(thumb),
      naturalWidth: thumb?.naturalWidth ?? 0,
      naturalHeight: thumb?.naturalHeight ?? 0,
      chipText: (chip?.textContent ?? '').trim(),
      outBlockText: (outBlock?.textContent ?? '').trim().slice(0, 80),
      detailRect: rr(detail),
    }
  })

  const box = metrics.detailRect
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-detail.png'),
    clip: {
      x: Math.max(0, Math.round(box.x) - 6),
      y: Math.max(0, Math.round(box.y) - 6),
      width: Math.min(430, page.viewportSize().width - Math.round(box.x) + 12),
      height: Math.min(430, Math.round(box.h) + 12),
    },
    animations: 'disabled',
  })

  fs.writeFileSync(path.join(OUT_DIR, 'read-image-metrics.json'), JSON.stringify({ metrics, consoleErrors }, null, 2))
  log('tab:', metrics.tab, 'imgRow:', metrics.hasImgRow, 'thumb:', metrics.thumbRect, 'natural:', `${metrics.naturalWidth}x${metrics.naturalHeight}`)
  log('chip:', JSON.stringify(metrics.chipText))
  log('console errors:', consoleErrors.length)
  const bad = [
    metrics.tab !== 'summary',
    !metrics.hasImgRow,
    !metrics.hasThumb,
    metrics.naturalWidth <= 0,
    !metrics.chipText.includes('image/jpeg'),
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
