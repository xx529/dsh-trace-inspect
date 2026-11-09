#!/usr/bin/env node
/**
 * scripts/verify/shoot-turnhead-mix.mjs — evidence for v0.10.25: the turn-head
 * cluster ledger moved from the right edge to the 「时长」 side (left group),
 * right before the flexible spacer; the right group keeps only the badges,
 * 「N 步」 and the chevron.
 *
 * Frames:
 *   panel-turnhead.png    collapsed turn head with a real 12m00s duration (2x)
 *   turnhead-metrics.json rects / same-row / ordering / 0 console errors
 *
 * Usage: node scripts/verify/shoot-turnhead-mix.mjs [--dock 400] [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/turnheadmix'))
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

const CALLS = [
  ['bash', { command: 'ls', description: '列出源码文件' }],
  ['bash', { command: 'git status', description: '查看工作区状态' }],
  ['bash', { command: 'pnpm test', description: '跑测试' }],
  ['bash', { command: 'pnpm build', description: '构建' }],
  ['bash', { command: 'git log', description: '看提交' }],
  ['read', { file_path: 'src/a.ts' }],
  ['read', { file_path: 'src/b.ts' }],
  ['edit', { file_path: 'src/a.ts' }],
  ['wait_agent', { target: 'reviewer' }],
  ['wait_agent', { target: 'tester' }],
]
const T0 = Date.now() - 12 * 60 * 1000
const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, time: T0, data: { content: '统计 icon 挪到时长那一侧', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, time: T0, data: { turn: 1 } })
CALLS.forEach(([name, args], index) => {
  const time = T0 + (index + 1) * 40_000
  MOCK_EVENTS.push({ type: 'tool/call', seq: seq++, time, data: { name, arguments: JSON.stringify(args), callId: `c${index}`, turn: 1, step: index + 1 } })
  MOCK_EVENTS.push({ type: 'tool/result', seq: seq++, time: time + 1000, data: { callId: `c${index}`, turn: 1, step: index + 1, content: [{ type: 'text', text: 'ok' }] } })
})
MOCK_EVENTS.push({ type: 'turn/end', seq: seq++, time: T0 + 12 * 60 * 1000, data: { turn: 1 } })
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

  const card = page.locator('[data-testid="ttl-turn"]').first()
  if ((await card.getAttribute('data-collapsed')) === 'false') {
    await card.locator('.ttl-turnHead').click()
    await sleep(page, 600)
  }
  await page.mouse.move(2, 2)
  await sleep(page, 300)

  const metrics = await page.evaluate(() => {
    const rr = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return {
        x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
        right: +b.right.toFixed(1), cy: +(b.y + b.height / 2).toFixed(1),
      }
    }
    const toggle = document.querySelector('.ttl-turnToggle')
    const mix = toggle?.querySelector('.ttl-mix')
    const dur = toggle?.querySelector('.ttl-turnDur')
    const spacer = toggle?.querySelector('.ttl-turnHeadSpacer')
    const meta = toggle?.querySelector('.ttl-turnMeta')
    const chips = [...(mix?.querySelectorAll('.ttl-mixItem') ?? [])].map((el) => ({
      kind: el.getAttribute('data-cluster'),
      count: Number(el.querySelector('.ttl-mixCount')?.textContent ?? '0'),
    }))
    const children = [...(toggle?.children ?? [])].map((el) => el.className.split(' ')[0] || el.tagName)
    return {
      children,
      mixInMeta: meta?.querySelector('.ttl-mix') !== null && meta?.querySelector('.ttl-mix') !== undefined,
      dur: rr(dur), mix: rr(mix), spacer: rr(spacer), meta: rr(meta),
      durText: dur?.textContent ?? null,
      chips,
      sameRow: dur !== null && dur !== undefined && mix !== null && mix !== undefined
        ? Math.abs(rr(dur).cy - rr(mix).cy) < 2
        : null,
      mixRightOfDur: dur !== null && dur !== undefined && mix !== null && mix !== undefined
        ? rr(mix).x >= rr(dur).right - 0.5
        : null,
      mixLeftOfMeta: mix !== null && mix !== undefined && meta !== null && meta !== undefined
        ? rr(mix).right <= rr(meta).x + 0.5
        : null,
    }
  })

  const headBox = await card.locator('.ttl-turnHead').first().boundingBox()
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-turnhead.png'),
    clip: {
      x: Math.max(0, Math.round(headBox.x) - 4),
      y: Math.max(0, Math.round(headBox.y) - 2),
      width: Math.min(400, page.viewportSize().width - Math.round(headBox.x) + 4),
      height: Math.min(72, Math.round(headBox.height) + 6),
    },
    animations: 'disabled',
  })

  fs.writeFileSync(path.join(OUT_DIR, 'turnhead-metrics.json'), JSON.stringify({ dock: DOCK, metrics, consoleErrors }, null, 2))
  log('children:', JSON.stringify(metrics.children))
  log('dur:', metrics.durText, JSON.stringify(metrics.dur), 'mix:', JSON.stringify(metrics.mix), 'meta:', JSON.stringify(metrics.meta))
  log('sameRow:', metrics.sameRow, 'mixRightOfDur:', metrics.mixRightOfDur, 'mixLeftOfMeta:', metrics.mixLeftOfMeta, 'mixInMeta:', metrics.mixInMeta)
  log('chips:', JSON.stringify(metrics.chips))
  log('console errors:', consoleErrors.length)
  const bad = [
    metrics.mixInMeta,
    metrics.sameRow !== true,
    metrics.mixRightOfDur !== true,
    metrics.mixLeftOfMeta !== true,
    metrics.durText === null,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
