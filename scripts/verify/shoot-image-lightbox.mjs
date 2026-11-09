#!/usr/bin/env node
/**
 * scripts/verify/shoot-image-lightbox.mjs — evidence for v0.10.35: the inline
 * image block (read_image result) now opens a full-size lightbox on click:
 * fixed layer + blurred backdrop + caption/meta + Esc / backdrop / ✕ closes.
 *
 * Frames:
 *   panel-inline.png   摘要 with the clickable thumbnail (2x)
 *   panel-lightbox.png full-size image dialog over the blurred detail band
 *   image-lightbox-metrics.json  portal / naturalWidth / blur / close checks
 *
 * Usage: node scripts/verify/shoot-image-lightbox.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/imglightbox'))
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
const IMAGE_FILE = path.resolve('docs/assets/v0130-value-viewer.jpg')
const IMAGE_BYTES = fs.readFileSync(IMAGE_FILE)
const IMAGE_B64 = IMAGE_BYTES.toString('base64')

const PW = process.env.PLAYWRIGHT_CORE
  || path.join(process.env.HOME || '', '.dsh/mcp-servers/mobile-mcp/node_modules/playwright-core/index.mjs')
const { chromium } = await import(pathToFileURL(PW).href)

const MOCK_EVENTS = []
let seq = 1
const push = (type, data, time) => MOCK_EVENTS.push({ type, seq: seq++, time, data })
const T0 = Date.now() - 60 * 1000
push('user/message', { content: '看下这张图', message: { source: { kind: 'user' } } }, T0)
push('turn/start', { turn: 1 }, T0)
push('tool/call', { name: 'read_image', arguments: JSON.stringify({ file_path: '/tmp/verify/demo.jpg' }), callId: 'c1', turn: 1, step: 1 }, T0 + 1000)
push('tool/result', {
  callId: 'c1', turn: 1, step: 1,
  content: [
    { type: 'text', text: 'image/jpeg image 1600x972, 80263 bytes' },
    {
      type: 'image',
      attachment: {
        attachmentId: 'sha256:demo', mediaType: 'image/jpeg', bytes: IMAGE_BYTES.length,
        width: 1600, height: 972, name: 'demo.jpg',
      },
    },
  ],
}, T0 + 1500)
push('turn/end', { turn: 1 }, T0 + 2000)
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
  await page.route('**/trace-inspect/api/attachment**', (route) => route.fulfill({
    status: 200, contentType: 'image/jpeg', body: IMAGE_BYTES,
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
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 400
  await page.mouse.move(sx, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(sx + ((tx - sx) * i) / 12, y)
  await page.mouse.up()
  await sleep(page, 600)
  let opened = false
  const tab = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await tab.count() > 0) { await tab.first().click(); opened = true }
  if (!opened) {
    const addTab = page.getByRole('button', { name: '新标签页' })
    if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) { await addTab.first().click(); await sleep(page, 900) }
    const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
    if (await entry.count() > 0) { await entry.first().click(); opened = true }
  }
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await sleep(page, 1500)

  await page.locator('[data-testid="ttl-step"]').first().click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
  await page.waitForSelector('[data-testid="ttl-img-thumb"]', { timeout: 15000 })
  await sleep(page, 900)
  log('thumb loaded:', await page.evaluate(() => {
    const img = document.querySelector('[data-testid="ttl-img-thumb"]')
    return img === null ? null : { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, tag: img.parentElement?.tagName }
  }))

  const detail = await page.evaluate(() => document.querySelector('[data-testid="ttl-detail"]')?.getBoundingClientRect().toJSON() ?? null)
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-inline.png'),
    clip: { x: Math.max(0, Math.round(detail.x) - 6), y: Math.max(0, Math.round(detail.y) - 6), width: Math.min(430, page.viewportSize().width - Math.round(detail.x) + 12), height: Math.min(620, Math.round(detail.height) + 12) },
    animations: 'disabled',
  })

  // Click the thumbnail → full-size lightbox.
  await page.locator('[data-testid="ttl-img-thumb"]').click()
  await page.waitForSelector('[data-testid="ttl-img-lightbox"]', { timeout: 15000 })
  await sleep(page, 800)
  const lightbox = await page.evaluate(() => {
    const root = document.querySelector('[data-testid="ttl-img-lightbox"]')
    const backdrop = root?.querySelector('.ttl-imgLightboxBackdrop')
    const img = root?.querySelector('[data-testid="ttl-img-lightbox-img"]')
    const panel = root?.querySelector('.ttl-imgLightboxPanel')
    return {
      inBody: root?.parentElement === document.body,
      role: root?.getAttribute('role'),
      ariaModal: root?.getAttribute('aria-modal'),
      naturalWidth: img?.naturalWidth ?? 0,
      naturalHeight: img?.naturalHeight ?? 0,
      backdropFilter: backdrop ? getComputedStyle(backdrop).backdropFilter : null,
      panelRect: panel?.getBoundingClientRect().toJSON() ?? null,
      headText: (root?.querySelector('.ttl-imgLightboxHead')?.textContent ?? '').slice(0, 120),
    }
  })
  log('lightbox:', JSON.stringify({ inBody: lightbox.inBody, naturalWidth: lightbox.naturalWidth, blur: lightbox.backdropFilter }))
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-lightbox.png'), animations: 'disabled' })

  // Esc closes.
  await page.keyboard.press('Escape')
  await sleep(page, 500)
  const closed = await page.evaluate(() => document.querySelector('[data-testid="ttl-img-lightbox"]') === null)
  log('closed:', closed, 'console errors:', consoleErrors.length)

  fs.writeFileSync(path.join(OUT_DIR, 'image-lightbox-metrics.json'), JSON.stringify({ lightbox, closed, consoleErrors }, null, 2))
  const bad = [
    !lightbox.inBody,
    lightbox.naturalWidth === 0,
    !String(lightbox.backdropFilter ?? '').includes('blur'),
    lightbox.role !== 'dialog',
    !closed,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
