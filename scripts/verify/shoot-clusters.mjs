#!/usr/bin/env node
/**
 * scripts/verify/shoot-clusters.mjs — evidence for v0.10.19 (one glyph + one
 * ink per DSH work cluster; non-built-in & non-MCP tools share the wrench).
 *
 * Uses a route-mocked minimal session (the recorded trace-verify history does
 * not contain most of these tools); the plugin itself is the real built bundle
 * running in the real web profile.
 *
 * Frames:
 *   panel-clusters.png       one row per cluster (2x, dock 400)
 *   clusters-metrics.json    per-row ink colour / ink class / glyph primitives
 *
 * Usage: node scripts/verify/shoot-clusters.mjs [--port 19487] [--out /tmp/verify/clusters]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/clusters'))
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

/** name / arguments of one mocked call; results are synthesized as text. */
const CALLS = [
  ['bash', { command: 'ls', description: '列出源码文件' }],
  ['terminal_open', { cwd: '/tmp' }],
  ['job_list', {}],
  ['read', { file_path: 'src/client/tool-icon.tsx' }],
  ['grep', { pattern: 'toolIconKind' }],
  ['web_search', { query: 'DSH tool icon' }],
  ['write', { file_path: 'docs/assets/v0119-tool-clusters.jpg' }],
  ['edit', { file_path: 'src/client/tool-summary.ts' }],
  ['todo_write', { todos: [{ id: 1 }, { id: 2 }, { id: 3 }] }],
  ['create_goal', { objective: '工具图标体系' }],
  ['schedule_create', { prompt: '每日汇总', rrule: 'FREQ=DAILY' }],
  ['subagent', { prompt: 'review the icon map' }],
  ['spawn_teammate', { name: 'reviewer' }],
  ['team_task_create', { subject: 'audit icons' }],
  ['skill', { name: 'figma-workbench' }],
  ['session_search', { query: 'tool icon' }],
  ['mcp__figma__get_screenshot', { nodeId: '12:34' }],
  ['figma_status', {}],
  ['acme_deploy', { url: 'https://example.com' }],
]

const MOCK_EVENTS = []
let seq = 1
MOCK_EVENTS.push({ type: 'user/message', seq: seq++, data: { content: '每个工作簇一个图标', message: { source: { kind: 'user' } } } })
MOCK_EVENTS.push({ type: 'turn/start', seq: seq++, data: { turn: 1 } })
CALLS.forEach(([name, args], index) => {
  const callId = `c${index + 1}`
  MOCK_EVENTS.push({
    type: 'tool/call', seq: seq++, data: { name, arguments: JSON.stringify(args), callId, turn: 1, step: index + 1 },
  })
  MOCK_EVENTS.push({
    type: 'tool/result', seq: seq++, data: { callId, turn: 1, step: index + 1, content: [{ type: 'text', text: 'ok' }] },
  })
})
MOCK_EVENTS.push({ type: 'turn/end', seq: seq++, data: { turn: 1 } })
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
const park = async () => { await page.mouse.move(2, 2).catch(() => {}); await sleep(page, 250) }

const probe = () => page.evaluate(() => {
  const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')].map((row) => {
    const icon = row.querySelector('.ttl-stepIcon')
    const svg = icon?.querySelector('svg')
    const cs = icon === null ? null : getComputedStyle(icon)
    return {
      name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
      desc: (row.querySelector('.ttl-stepDesc')?.textContent ?? '').trim(),
      className: String(icon?.className ?? ''),
      ink: cs?.color ?? null,
      prims: svg === null || svg === undefined
        ? []
        : [...svg.children].map((child) => child.tagName.toLowerCase()),
      paths: svg === null || svg === undefined
        ? []
        : [...svg.querySelectorAll('path')].map((p) => p.getAttribute('d')),
    }
  })
  return { rows, consoleErrors: [] }
})

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
  await sleep(page, 600)
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
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="ttl-step"]').length >= n, CALLS.length, { timeout: 30000 })
  await sleep(page, 1200)
  await park()
  const metrics = await probe()

  const firstBox = await page.locator('[data-testid="ttl-step"]').first().boundingBox()
  const top = Math.max(0, Math.round(firstBox.y) - 8)
  const height = Math.min(700, page.viewportSize().height - top - 12)
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-clusters.png'),
    clip: { x: Math.max(0, Math.round(firstBox.x) - 14), y: top, width: 400, height },
    animations: 'disabled',
  })
  log('shot written')
  fs.writeFileSync(
    path.join(OUT_DIR, 'clusters-metrics.json'),
    JSON.stringify({ ...metrics, consoleErrors }, null, 2),
  )
  log('rows:', JSON.stringify(metrics.rows.map((row) => [row.name, row.ink, row.className])))
  log('console errors:', consoleErrors.length)
} finally {
  await browser.close()
}
