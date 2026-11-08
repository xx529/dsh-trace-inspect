#!/usr/bin/env node
/**
 * scripts/verify/shoot-paramsjson.mjs — evidence for v0.10.18.
 *
 * The 摘要 参数 block is now ONE uniform shape for every tool family: the FULL
 * argument object pretty-printed as JSON (`JsonPretty`). The old per-family
 * key/value table (friendly key labels, array → chip folding, long strings →
 * `N 字符 · M 行`) is gone, on BOTH the inline detail band and the zoom overlay.
 * The 参数 tab keeps its interactive JSON tree, unchanged.
 *
 * Uses a route-mocked minimal session (ask_user_question + bash) so the frames
 * do not depend on the recorded trace-verify history.
 *
 * Frames:
 *   panel-paramsjson-generic.png  ask_user_question band, 摘要: 参数 block = JSON
 *   panel-paramsjson-shell.png    bash band, 摘要: command block + JSON params
 *   panel-paramsjson-zoom.png     zoom overlay, 摘要: same uniform JSON block
 *   paramsjson-metrics.json       ttl-kv absence / JSON presence / 参数 tab tree
 *
 * Usage:
 *   node scripts/verify/shoot-paramsjson.mjs [--port 19487] [--out /tmp/verify/paramsjson]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/paramsjson'))
const SERVER_LOG = arg('server-log', '/tmp/verify/server-params.log')
fs.mkdirSync(OUT_DIR, { recursive: true })

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
const { chromium } = await import(pathToFileURL(PW).href)

/** The exact shape from the user's screenshot: one `questions` array. */
const ASK_ARGS = JSON.stringify({
  questions: [{
    id: 'release2',
    header: '发版方式',
    question: '发布 1.15.1 要用哪种方式？',
    options: [
      { label: '推 master + tag + 重装 desktop', description: '推荐' },
      { label: '只打 tag', description: '不重装' },
    ],
  }],
})
const ASK_OUT = JSON.stringify({
  answers: [{ id: 'release2', selected: ['发布 1.15.1 后推 master + tag + 重装 desktop（推荐）'] }],
}, null, 2)
const BASH_ARGS = JSON.stringify({
  command: 'cd /tmp && git add -A && git commit -m "feat: params json" && git push',
  description: 'commit and push',
  timeout: 120000,
})
const MOCK_EVENTS = [
  { type: 'user/message', seq: 1, data: { content: '发版', message: { source: { kind: 'user' } } } },
  { type: 'turn/start', seq: 2, data: { turn: 1 } },
  { type: 'tool/call', seq: 3, data: { name: 'ask_user_question', arguments: ASK_ARGS, callId: 'c3', turn: 1 } },
  {
    type: 'tool/result',
    seq: 4,
    data: { callId: 'c3', turn: 1, content: [{ type: 'text', text: ASK_OUT }] },
  },
  { type: 'tool/call', seq: 5, data: { name: 'bash', arguments: BASH_ARGS, callId: 'c5', turn: 1 } },
  {
    type: 'tool/result',
    seq: 6,
    data: { callId: 'c5', turn: 1, content: [{ type: 'text', text: 'ok 3 files changed' }] },
  },
  { type: 'turn/end', seq: 7, data: { turn: 1 } },
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

const metrics = { generatedAt: new Date().toISOString(), frames: {} }

try {
  await page.route('**/trace-inspect/api/events**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ events: MOCK_EVENTS, hasMore: false, nextAfterSeq: 7 }),
  }))
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(page, 3500)
  // Any recorded session will do — the events route is mocked below it.
  const sessionRow = page.locator('.JoiKIa_sessionRow').first()
  await sessionRow.waitFor({ state: 'visible', timeout: 30000 })
  await sessionRow.click()
  await sleep(page, 5000)

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
  const DOCK = 560
  const tx = 1440 - DOCK
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
  await sleep(page, 1200)
  await park()

  const stepRow = (name) => page.locator('[data-testid="ttl-step"]').filter({ hasText: name }).first()

  // ── Frame 1: the generic band (the screenshot case) ────────────────────
  await stepRow('ask_user_question').click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
  await sleep(page, 900)
  await park()
  const band = page.locator('[data-testid="ttl-detail"]').first()
  await band.scrollIntoViewIfNeeded()
  await park()
  await band.screenshot({ path: path.join(OUT_DIR, 'panel-paramsjson-generic.png'), animations: 'disabled' })
  metrics.frames.generic = await page.evaluate(() => {
    const band = document.querySelector('[data-testid="ttl-detail"]')
    const params = band?.querySelector('[data-testid="ttl-params"]')
    return {
      paramsSection: params !== null && params !== undefined,
      jsonPretty: params?.querySelector('[data-testid="ttl-json-pretty"]') !== null
        && params?.querySelector('[data-testid="ttl-json-pretty"]') !== undefined,
      jsonText: (params?.textContent ?? '').replace(/\s+/g, ' ').slice(0, 260),
      kvTables: band?.querySelectorAll('.ttl-kv').length ?? -1,
      chipTags: band?.querySelectorAll('.ttl-chipTag').length ?? -1,
      meta: (band?.querySelector('[data-testid="ttl-detail"] .ttl-detailMeta, .ttl-detailMeta')?.textContent ?? '').trim(),
      sectionCount: band?.querySelectorAll('.ttl-section').length ?? -1,
    }
  })
  log('generic params json:', metrics.frames.generic.paramsSection, '| kv:', metrics.frames.generic.kvTables)

  // The 参数 tab keeps the interactive JSON tree (unchanged by this round).
  await page.click('[data-testid="ttl-detail-tab-params"]')
  await sleep(page, 600)
  metrics.frames.paramsTab = await page.evaluate(() => ({
    jsonTree: document.querySelector('[data-testid="ttl-detail-body-params"] [data-testid="ttl-json"]') !== null,
    pretty: document.querySelector('[data-testid="ttl-detail-body-params"] [data-testid="ttl-json-pretty"]') !== null,
  }))
  await page.click('[data-testid="ttl-detail-tab-summary"]')
  await sleep(page, 400)

  // ── Frame 2: the shell band (command block stays, JSON params added) ───
  await stepRow('bash').click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
  await sleep(page, 900)
  await park()
  const shellBand = page.locator('[data-testid="ttl-detail"]').first()
  await shellBand.scrollIntoViewIfNeeded()
  await park()
  await shellBand.screenshot({ path: path.join(OUT_DIR, 'panel-paramsjson-shell.png'), animations: 'disabled' })
  metrics.frames.shell = await page.evaluate(() => {
    const band = document.querySelector('[data-testid="ttl-detail"]')
    const params = band?.querySelector('[data-testid="ttl-params"]')
    return {
      commandBlock: band?.querySelector('[data-testid="ttl-code"]') !== null
        && band?.querySelector('[data-testid="ttl-code"]') !== undefined,
      paramsJson: params?.querySelector('[data-testid="ttl-json-pretty"]') !== null
        && params?.querySelector('[data-testid="ttl-json-pretty"]') !== undefined,
      paramsHasCommandKey: (params?.textContent ?? '').includes('"command"'),
      paramsHasDescriptionKey: (params?.textContent ?? '').includes('"description"'),
      kvTables: band?.querySelectorAll('.ttl-kv').length ?? -1,
    }
  })
  log('shell command block:', metrics.frames.shell.commandBlock, '| params json:', metrics.frames.shell.paramsJson)

  // ── Frame 3: the zoom overlay 摘要 pane ────────────────────────────────
  await page.click('[data-testid="ttl-detail-zoom"]')
  await page.waitForSelector('[data-testid="ttl-zoom-panel"]', { timeout: 15000 })
  await sleep(page, 900)
  await park()
  metrics.frames.zoom = await page.evaluate(() => {
    const pane = document.querySelector('[data-testid="ttl-zoom-body-summary"]')
    const params = pane?.querySelector('[data-testid="ttl-zoom-params"]')
    return {
      commandBlock: pane?.querySelector('[data-testid="ttl-zoom-command"]') !== null
        && pane?.querySelector('[data-testid="ttl-zoom-command"]') !== undefined,
      paramsJson: params?.querySelector('[data-testid="ttl-json-pretty"]') !== null
        && params?.querySelector('[data-testid="ttl-json-pretty"]') !== undefined,
      paramsText: (params?.textContent ?? '').replace(/\s+/g, ' ').slice(0, 160),
      kvTables: pane?.querySelectorAll('.ttl-kv').length ?? -1,
    }
  })
  const zoomPanel = page.locator('[data-testid="ttl-zoom-panel"]').first()
  await zoomPanel.screenshot({ path: path.join(OUT_DIR, 'panel-paramsjson-zoom.png'), animations: 'disabled' })
  log('zoom params json:', metrics.frames.zoom.paramsJson, '| kv:', metrics.frames.zoom.kvTables)

  fs.writeFileSync(path.join(OUT_DIR, 'paramsjson-metrics.json'), JSON.stringify({ ...metrics, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
} finally {
  await browser.close()
}
