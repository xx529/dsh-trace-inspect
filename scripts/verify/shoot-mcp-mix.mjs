#!/usr/bin/env node
/**
 * scripts/verify/shoot-mcp-mix.mjs — evidence for v0.10.33:
 *   1) MCP calls (`mcp__server__tool`) now count as the pink plug cluster in the
 *      turn-head statistics instead of falling into the wrench fallback;
 *   2) the failure badge moved into the left group, right after the cluster
 *      chips (before the spacer), instead of the far-right meta group.
 *
 * Frames:
 *   panel-header.png   collapsed turn head (chips + alert badge)
 *   mcp-mix-metrics.json  chips / badge position / console errors
 *
 * Usage: node scripts/verify/shoot-mcp-mix.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/mcpmix'))
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

const T0 = Date.now() - 8 * 60 * 1000
const MOCK_EVENTS = []
let seq = 1
const push = (type, data, time) => MOCK_EVENTS.push({ type, seq: seq++, time, data })
push('user/message', { content: 'MCP 统计与失败徽标', message: { source: { kind: 'user' } } }, T0)
push('turn/start', { turn: 1 }, T0)
const add = (name, args, result, failed = false) => {
  const callId = `c${seq}`
  const time = T0 + seq * 1000
  push('tool/call', { name, arguments: JSON.stringify(args), callId, turn: 1, step: seq }, time)
  push('tool/result', failed
    ? { callId, turn: 1, step: seq, message: { isError: true }, content: [{ type: 'text', text: 'tool failed' }] }
    : { callId, turn: 1, step: seq, content: [{ type: 'text', text: result }] }, time + 500)
}
add('bash', { command: 'ls', description: '列出文件' }, 'a.ts')
add('read', { file_path: 'src/a.ts' }, 'ok')
add('mcp__figma__use_figma', { code: 'x' }, 'ok')
add('mcp__figma__create_session', { description: 'x' }, 'ok')
add('mcp__figma__get_screenshot', { nodeId: '1:2' }, 'failed', true)
add('figma_status', {}, 'ok') // plugin-native tool → wrench (non-builtin, non-MCP)
add('bash', { command: 'pnpm test', description: '跑测试' }, 'ok')
push('turn/end', { turn: 1 }, T0 + 8 * 60 * 1000)
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
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 400
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
    const addTab = page.getByRole('button', { name: '新标签页' })
    if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) { await addTab.first().click(); await sleep(page, 900) }
    const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
    if (await entry.count() > 0) { await entry.first().click(); opened = true }
  }
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await sleep(page, 1500)

  const card = page.locator('[data-testid="ttl-turn"]').first()
  if ((await card.getAttribute('data-collapsed')) === 'false') {
    await card.locator('.ttl-turnHead').click()
    await sleep(page, 500)
  }
  await page.mouse.move(2, 2)
  await sleep(page, 300)

  const metrics = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="ttl-turn"]')
    const toggle = card?.querySelector('.ttl-turnToggle')
    const meta = card?.querySelector('.ttl-turnMeta')
    const badge = card?.querySelector('[data-testid="ttl-error-dot"]')
    const spacer = toggle?.querySelector('.ttl-turnHeadSpacer')
    const chips = [...(card?.querySelectorAll('.ttl-mixItem') ?? [])].map((el) => ({
      kind: el.getAttribute('data-cluster'),
      count: Number(el.querySelector('.ttl-mixCount')?.textContent ?? '0'),
      className: el.className,
    }))
    const children = [...(toggle?.children ?? [])]
    const rect = (el) => el === null || el === undefined ? null : el.getBoundingClientRect().toJSON()
    return {
      chips,
      alertText: (badge?.textContent ?? '').trim(),
      badgeInToggle: badge !== null && badge !== undefined && badge.parentElement === toggle,
      badgeInMeta: meta?.querySelector('[data-testid="ttl-error-dot"]') !== undefined && meta?.querySelector('[data-testid="ttl-error-dot"]') !== null,
      badgeBeforeSpacer: badge !== null && badge !== undefined && spacer !== null && spacer !== undefined
        ? children.indexOf(badge) < children.indexOf(spacer)
        : null,
      childrenOrder: children.map((el) => el.className.split(' ')[0]),
      badgeRect: rect(badge),
      cardRect: rect(card),
    }
  })
  log('chips:', JSON.stringify(metrics.chips.map((c) => [c.kind, c.count])))
  log('badge:', JSON.stringify({ inToggle: metrics.badgeInToggle, inMeta: metrics.badgeInMeta, beforeSpacer: metrics.badgeBeforeSpacer, order: metrics.childrenOrder }))

  const box = metrics.cardRect
  await page.screenshot({
    path: path.join(OUT_DIR, 'panel-header.png'),
    clip: {
      x: Math.max(0, Math.round(box.x)),
      y: Math.max(0, Math.round(box.y) - 2),
      width: Math.min(400, page.viewportSize().width - Math.round(box.x)),
      height: Math.min(72, Math.round(box.height) + 6),
    },
    animations: 'disabled',
  })

  fs.writeFileSync(path.join(OUT_DIR, 'mcp-mix-metrics.json'), JSON.stringify({ metrics, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const mcpChip = metrics.chips.find((c) => c.kind === 'mcp')
  const bad = [
    // 3 MCP calls, one failed: the two healthy ones are the plug chip.
    mcpChip === undefined || mcpChip.count !== 2,
    !mcpChip?.className.includes('ttl-ink-pink'),
    metrics.alertText === '',
    !metrics.badgeInToggle,
    metrics.badgeInMeta,
    metrics.badgeBeforeSpacer !== true,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
