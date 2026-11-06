#!/usr/bin/env node
/**
 * scripts/verify/shoot-skillrow.mjs — evidence for the v0.10.6 `skill` family:
 * a sparkle glyph + teal ink (not the generic wrench) and a row detail that is
 * the bare skill name (never `name figma-workbench`).
 *
 * Uses a route-mocked minimal session (the recorded trace-verify history has no
 * `skill` calls); everything else is the real plugin in the real web profile.
 *
 * Frames:
 *   panel-skillrow.png           two skill rows + a bash row (2x, dock 400)
 *   panel-skillrow-zoom.png      2x crop of the icon column
 *   skillrow-metrics.json        row label/detail/glyph/colour + legend
 *
 * Usage: node scripts/verify/shoot-skillrow.mjs [--port 19487] [--out /tmp/verify/skillrow]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/skillrow'))
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

const MOCK_EVENTS = [
  { type: 'user/message', seq: 1, data: { content: '加载 figma-workbench 与 ui-ux-pro-max 两个 skill', message: { source: { kind: 'user' } } } },
  { type: 'turn/start', seq: 2, data: { turn: 1 } },
  {
    type: 'tool/call', seq: 3, data: {
      name: 'skill', arguments: JSON.stringify({ name: 'figma-workbench' }), callId: 'c3', turn: 1, step: 1,
    },
  },
  {
    type: 'tool/result', seq: 4, data: {
      callId: 'c3', turn: 1, step: 1, content: [{ type: 'text', text: 'Loaded skill figma-workbench' }],
    },
  },
  {
    type: 'tool/call', seq: 5, data: {
      name: 'skill', arguments: JSON.stringify({ name: 'ui-ux-pro-max' }), callId: 'c5', turn: 1, step: 1,
    },
  },
  {
    type: 'tool/result', seq: 6, data: {
      callId: 'c5', turn: 1, step: 1, content: [{ type: 'text', text: 'Loaded skill ui-ux-pro-max' }],
    },
  },
  {
    type: 'tool/call', seq: 7, data: {
      name: 'bash', arguments: JSON.stringify({ command: 'ls', description: '列出源码文件' }), callId: 'c7', turn: 1, step: 2,
    },
  },
  {
    type: 'tool/result', seq: 8, data: {
      callId: 'c7', turn: 1, step: 2, content: [{ type: 'text', text: 'a.ts' }],
    },
  },
  { type: 'turn/end', seq: 9, data: { turn: 1 } },
]

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
const park = async () => { await page.mouse.move(2, 2).catch(() => {}); await sleep(page, 250) }

const probe = () => page.evaluate(() => {
  const r = (el) => { if (el === null || el === undefined) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
  const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')].map((row) => {
    const icon = row.querySelector('.ttl-stepIcon')
    const glyph = icon?.querySelector('svg path')
    const cs = icon === null ? null : getComputedStyle(icon)
    return {
      name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
      desc: (row.querySelector('.ttl-stepDesc')?.textContent ?? '').trim(),
      tone: String(icon?.className ?? ''),
      iconRect: r(icon),
      iconBg: cs?.backgroundColor ?? null,
      ink: cs?.color ?? null,
      glyphPath: glyph?.getAttribute('d') ?? null,
      rowRect: r(row),
    }
  })
  const legend = [...document.querySelectorAll('.ttl-legend')].map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
  const chips = [...document.querySelectorAll('[data-testid="ttl-chips"] .ttl-chip')].map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
  const dist = [...document.querySelectorAll('.ttl-distSeg')].map((el) => getComputedStyle(el).backgroundColor)
  return { rows, legend, chips, dist }
})

try {
  await page.route('**/trace-inspect/api/events**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ events: MOCK_EVENTS, hasMore: false, nextAfterSeq: 9 }),
  }))
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(page, 3500)
  const openButton = page.getByRole('button', { name: '打开右侧边栏' })
  if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
    await openButton.first().click()
    await sleep(page, 1200)
  }
  const panel = page.locator('[class*=Dv5QdW_panel]').first()
  const handle = page.locator('.PIRFFq_handle').last()
  const hb = await handle.boundingBox()
  const sx = hb.x + hb.width / 2
  const y = 300
  const tx = 1440 - 400
  await page.mouse.move(sx, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(sx + ((tx - sx) * i) / 12, y)
  await page.mouse.up()
  await sleep(page, 500)
  log('dock:', Math.round((await panel.boundingBox()).width))

  let opened = false
  const existingTab = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await existingTab.count() > 0) {
    await existingTab.first().click()
    opened = true
  }
  if (!opened) {
    const addTab = page.getByRole('button', { name: '新标签页' })
    if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) {
      await addTab.first().click()
      await sleep(page, 1000)
    }
    const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
    if (await entry.count() > 0 && await entry.first().isVisible().catch(() => false)) {
      await entry.first().click()
      opened = true
    }
  }
  if (!opened) {
    await page.screenshot({ path: path.join(OUT_DIR, 'debug-before-tab.png') })
    throw new Error('cannot find the 轮次轨迹 tab entry')
  }
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-step"]').length >= 2, null, { timeout: 30000 })
  await sleep(page, 1500)
  await park()
  const metrics = await probe()

  const rowsBox = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
    const first = rows[0]
    first?.scrollIntoView({ block: 'center' })
    return null
  })
  await sleep(page, 500)
  await park()
  const firstBox = await page.locator('[data-testid="ttl-step"]').first().boundingBox()
  const top = Math.max(0, Math.round(firstBox.y) - 90)
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-skillrow.png'),
    clip: { x: Math.max(0, Math.round(firstBox.x) - 4), y: top, width: 400, height: Math.min(420, page.viewportSize().height - top - 20) },
    animations: 'disabled',
  })
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-skillrow-zoom.png'),
    clip: { x: Math.max(0, Math.round(firstBox.x) - 4), y: Math.max(0, Math.round(firstBox.y) - 8), width: 200, height: Math.min(240, page.viewportSize().height) },
    animations: 'disabled',
  })
  log('shots written')
  fs.writeFileSync(path.join(OUT_DIR, 'skillrow-metrics.json'), JSON.stringify({ ...metrics, consoleErrors }, null, 2))
  log('rows:', JSON.stringify(metrics.rows.map((row) => [row.name, row.desc, row.ink])), 'legend:', JSON.stringify(metrics.legend))
} finally {
  await browser.close()
}
