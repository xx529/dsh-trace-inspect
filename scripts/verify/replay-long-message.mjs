#!/usr/bin/env node
/**
 * scripts/verify/replay-long-message.mjs — v0.10.44 evidence: replay the LAST
 * turn of a real session log and prove a long Markdown assistant message
 * renders completely with no right-edge fade overlay (the old
 * `.ttl-mdTableWrap::after` dimmed 18px of every line when the message
 * contained a table, so long replies looked cut off).
 *
 * The session is read from disk (`zstd -dc`), the last turn is served through
 * the mocked events route, the trace tab is opened, the last 输出 row is
 * expanded and the message body is screenshotted.
 *
 * Usage:
 *   node scripts/verify/replay-long-message.mjs \
 *     [--session ~/.dsh/sessions/.../session.v4.jsonl.zstd] [--port 19487]
 *
 * Without --session it scans the most recently modified session logs for one
 * whose ASSISTANT message contains the default phrase (the long OpenDesign
 * report) — a user message / tool output with the phrase does not count.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const PORT = Number(arg('port', '19487'))
const PHRASE = arg('phrase', '顺带验证了一件事')
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/replay-longmsg'))
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

// ── locate + decode a session with the long report ─────────────────────────
const sessionsRoot = path.join(os.homedir(), '.dsh', 'sessions')
function findSession() {
  const explicit = arg('session')
  if (explicit) return path.resolve(explicit.replace(/^~/, os.homedir()))
  const found = spawnSync('find', [sessionsRoot, '-name', 'session.v4.jsonl.zstd', '-mmin', '-2880'], {
    encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  }).stdout.split('\n').filter(Boolean)
  found.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
  for (const file of found) {
    const decoded = spawnSync('zstd', ['-dc', file], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
    if (decoded.status !== 0) continue
    const hasAssistantText = decoded.stdout.split('\n').some((line) => {
      if (!line.includes(PHRASE)) return false
      try {
        const row = JSON.parse(line)
        if (row.type !== 'assistant/message') return false
        const content = row.data?.message?.content
        if (!Array.isArray(content)) return false
        const joined = content.filter((b) => typeof b?.text === 'string').map((b) => b.text).join('\n')
        return joined.startsWith('已完成并写入 OpenDesign 项目') && joined.includes(PHRASE)
      } catch {
        return false
      }
    })
    if (hasAssistantText) return file
  }
  throw new Error(`no recent session contains ${JSON.stringify(PHRASE)}`)
}
const sessionFile = findSession()
const decoded = spawnSync('zstd', ['-dc', sessionFile], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
if (decoded.status !== 0) throw new Error(`zstd failed for ${sessionFile}`)
const rows = decoded.stdout.split('\n').filter(Boolean).map((line) => JSON.parse(line))

const starts = rows.filter((r) => r.type === 'turn/start').map((r) => r.seq)
const lastStart = starts[starts.length - 1]
const lastSeq = Math.max(...rows.map((r) => (typeof r.seq === 'number' ? r.seq : 0)))
const turnRows = rows.filter((r) => typeof r.seq === 'number' && r.seq >= lastStart)
const userBefore = [...rows].reverse().find((r) => r.type === 'user/message' && r.seq < lastStart)
const events = [...(userBefore !== undefined ? [userBefore] : []), ...turnRows].sort((a, b) => a.seq - b.seq)
const lastAssistant = [...turnRows].reverse().find((r) => {
  if (r.type !== 'assistant/message') return false
  const content = r.data?.message?.content
  return Array.isArray(content) && content.some((b) => typeof b?.text === 'string' && b.text.includes(PHRASE))
})
const expectedTail = (() => {
  const content = lastAssistant?.data?.message?.content ?? []
  const text = content.filter((b) => typeof b?.text === 'string').map((b) => b.text).join('\n')
  return text.trim().slice(-30)
})()
const turnSteps = turnRows.filter((r) => r.type === 'tool/call').length

// ── replay ─────────────────────────────────────────────────────────────────
const PW = process.env.PLAYWRIGHT_CORE
  || path.join(os.homedir(), '.dsh/mcp-servers/mobile-mcp/node_modules/playwright-core/index.mjs')
const { chromium } = await import(pathToFileURL(PW).href)
const sleep = (page, ms) => page.waitForTimeout(ms)
const log = (...p) => console.log(...p)

const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
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
  await page.route('**/trace-inspect/api/events**', (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ events, hasMore: false, nextAfterSeq: lastSeq }),
  }))
  await page.route('**/trace-inspect/api/attachment**', (r) => r.fulfill({ status: 404, body: '' }))
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(page, 3500)
  const openButton = page.getByRole('button', { name: '打开右侧边栏' })
  if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
    await openButton.first().click()
    await sleep(page, 1200)
  }
  const handle = page.locator('.PIRFFq_handle').last()
  const hb = await handle.boundingBox()
  const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 620
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
  await sleep(page, 2000)

  const lastTurn = page.locator('[data-testid="ttl-turn"]').last()
  if ((await lastTurn.getAttribute('data-collapsed')) === 'true') {
    await lastTurn.locator('.ttl-turnHead').click()
    await sleep(page, 600)
  }
  const outRow = page.locator('[data-testid="ttl-item-output"]').last()
  if (await outRow.count() > 0) { await outRow.click(); await sleep(page, 800) }
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="ttl-output-body"]')
    if (el) el.scrollIntoView({ block: 'start' })
  })
  await sleep(page, 500)

  const info = await page.evaluate(() => {
    const body = document.querySelector('.ttl-msgBody')
    const tableWrap = body?.querySelector('.ttl-mdTableWrap')
    const after = tableWrap ? getComputedStyle(tableWrap, '::after') : null
    return {
      textLength: body?.textContent?.length ?? 0,
      tailOk: body?.textContent?.includes('一键出页') ?? false,
      hasTable: body?.querySelector('table') !== null,
      overlayContent: after?.content ?? null,
      overlayOpacity: after?.opacity ?? null,
      msgRect: body?.getBoundingClientRect().toJSON() ?? null,
    }
  })
  log('replay:', JSON.stringify({ session: sessionFile, turnSteps, textLength: info.textLength, tailOk: info.tailOk, hasTable: info.hasTable, overlay: info.overlayContent }))

  const box = info.msgRect
  if (box !== null) {
    const y = Math.max(0, Math.min(box.y, 1100 - 400))
    await page.screenshot({
      path: path.join(OUT_DIR, 'message-body.png'),
      clip: { x: Math.max(0, box.x - 8), y, width: Math.min(box.width + 16, 1440 - box.x + 8), height: Math.min(1000, 1100 - y) },
      animations: 'disabled',
    })
  }
  const shot = path.join(OUT_DIR, 'message-body-bottom.png')
  await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = l.scrollHeight })
  await sleep(page, 400)
  await page.screenshot({ path: shot, animations: 'disabled' })

  fs.writeFileSync(path.join(OUT_DIR, 'replay-longmsg.json'), JSON.stringify({ sessionFile, turnSteps, info, consoleErrors }, null, 2))
  log('console errors:', consoleErrors.length)
  const bad = [
    !info.tailOk,
    info.overlayContent !== null && info.overlayContent !== 'none',
    consoleErrors.length > 0,
  ]
  if (bad.some(Boolean)) process.exitCode = 2
} finally {
  await browser.close()
}
