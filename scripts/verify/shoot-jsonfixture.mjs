#!/usr/bin/env node
/**
 * scripts/verify/shoot-jsonfixture.mjs — JSON output heuristic verified against a
 * mocked minimal session (the trace-verify history has no surviving JSON tool
 * result after compaction), per the Lead's fixture request.
 *
 * The route mock serves `** /trace-inspect/api/events**` with:
 *   - mcp__agent__interrupt_agent → result `{"previousStatus":"running"}`
 *   - bash                       → plain-text result (RawText regression check)
 *
 * Frames:
 *   panel-fix-json-summary.png  摘要 tab: 「输出」 preview is multi-line indented JSON
 *   panel-fix-json-result.png   结果 tab: JsonPretty rendered by default
 *
 * Metrics (jsonfixture-metrics.json): summary output line count / second line,
 * `.ttl-jsonPretty` / `.ttl-raw` presence, 渲染-原文 segmented control presence,
 * plain-text result still RawText, horizontal-scroll check.
 *
 * Usage: node scripts/verify/shoot-jsonfixture.mjs [--port 19487]
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
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/after'))
const SERVER_LOG = arg('server-log', '/tmp/verify/server.log')

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

const MOCK_EVENTS = [
  { type: 'user/message', seq: 1, data: { content: 'check agent', message: { source: { kind: 'user' } } } },
  { type: 'turn/start', seq: 2, data: { turn: 1 } },
  {
    type: 'tool/call', seq: 3, data: {
      name: 'mcp__agent__interrupt_agent',
      arguments: JSON.stringify({ target: 'x' }),
      callId: 'c3',
      turn: 1,
      step: 1,
    },
  },
  {
    type: 'tool/result', seq: 4, data: {
      callId: 'c3',
      turn: 1,
      step: 1,
      content: [{ type: 'text', text: JSON.stringify({ previousStatus: 'running' }) }],
    },
  },
  {
    type: 'tool/call', seq: 5, data: {
      name: 'bash',
      arguments: JSON.stringify({ command: 'echo hi', description: 'Plain text probe' }),
      callId: 'c5',
      turn: 1,
      step: 2,
    },
  },
  {
    type: 'tool/result', seq: 6, data: {
      callId: 'c5',
      turn: 1,
      step: 2,
      content: [{ type: 'text', text: 'plain log line 1\nplain log line 2' }],
    },
  },
  {
    type: 'tool/call', seq: 7, data: {
      name: 'bash',
      arguments: JSON.stringify({ command: 'cat md', description: 'Markdown probe' }),
      callId: 'c7',
      turn: 1,
      step: 3,
    },
  },
  {
    type: 'tool/result', seq: 8, data: {
      callId: 'c7',
      turn: 1,
      step: 3,
      content: [{ type: 'text', text: '## Markdown probe\n\n| key | value |\n| --- | --- |\n| a | 1 |' }],
    },
  },
  { type: 'turn/end', seq: 9, data: { turn: 1 } },
]

const t0 = Date.now()
const log = (...p) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')}s]`, ...p)
const sleep = (page, ms) => page.waitForTimeout(ms)

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const { chromium } = await import(pathToFileURL(PW).href)
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
  const out = { generatedAt: new Date().toISOString(), viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, mockEvents: MOCK_EVENTS.length }
  const park = async () => { await page.mouse.move(2, 2).catch(() => {}); await sleep(page, 250) }

  const shotBand = async (name) => {
    await park(); await sleep(page, 250)
    const file = path.join(OUT_DIR, name)
    await page.locator('[data-testid="ttl-detail"]').first().screenshot({ path: file, animations: 'disabled' })
    log('shot', name)
    return file
  }
  const bandProbe = () => page.evaluate(() => {
    const band = document.querySelector('[data-testid="ttl-detail"]')
    const outBlock = band?.querySelector('[data-testid="ttl-outBlock"]')
    const jsonPretty = band?.querySelectorAll('.ttl-jsonPretty') ?? []
    const raw = band?.querySelectorAll('.ttl-raw') ?? []
    const keys = band?.querySelectorAll('.ttl-jsonKey') ?? []
    const keyEl = keys[0] ?? null
    const toggleRender = band?.querySelector('[data-testid="ttl-view-toggle"]')
    const prettyKey = band?.querySelector('.ttl-jsonPretty .ttl-jsonKey, .ttl-jsonKey')
    const treeKey = band?.querySelector('.ttl-jsonRow .ttl-jsonKey')
    const toggleRaw = band?.querySelector('[data-testid="ttl-view-raw"]')
    const root = document.querySelector('[data-testid="ttl-root"]')
    const list = document.querySelector('[data-testid="ttl-list"]')
    const lines = outBlock === null || outBlock === undefined ? [] : (outBlock.innerText ?? '').split('\n')
    return {
      activeTab: [...(band?.querySelectorAll('[role=tab]') ?? [])].find((t) => t.getAttribute('aria-selected') === 'true')?.textContent?.trim() ?? null,
      bandRect: band === null ? null : (() => { const b = band.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] })(),
      resultBarText: (band?.querySelector('[data-testid="ttl-resultBar"]')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      output: outBlock === null || outBlock === undefined ? null : {
        lineCount: lines.length,
        lines: lines.slice(0, 6),
        secondLine: lines[1] ?? null,
        hasIndent: lines.some((l) => /^\s{2,}/.test(l)),
      },
      presence: {
        jsonPretty: jsonPretty.length,
        rawText: raw.length,
        jsonKeys: keys.length,
        keyColor: keyEl === null ? null : getComputedStyle(keyEl).color,
        renderToggle: toggleRender !== null,
        rawToggle: toggleRaw !== null,
        renderPressed: toggleRender === null ? null : toggleRender.getAttribute('aria-pressed'),
        rawPressed: toggleRaw === null ? null : toggleRaw.getAttribute('aria-pressed'),
        prettyKeyAfterContent: prettyKey === null ? null : getComputedStyle(prettyKey, '::after').content,
        treeKeyAfterContent: treeKey === null ? null : getComputedStyle(treeKey, '::after').content,
        jsonPrettyText: (band?.querySelector('.ttl-jsonPretty')?.textContent ?? '').slice(0, 200),
        jsonPrettyColonCount: ((band?.querySelector('.ttl-jsonPretty')?.textContent ?? '').match(/":\s*:/g) ?? []).length,
      },
      horizontal: {
        rootScrollWidth: root.scrollWidth,
        rootClientWidth: root.clientWidth,
        listScrollWidth: list.scrollWidth,
        listClientWidth: list.clientWidth,
        detailScrollWidth: band === null ? null : band.scrollWidth,
        detailClientWidth: band === null ? null : band.clientWidth,
        noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
      },
    }
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
      await openButton.first().click(); await sleep(page, 1200)
    }
    const panel = page.locator('[class*=Dv5QdW_panel]').first()
    const handle = page.locator('.PIRFFq_handle').last()
    const hb = await handle.boundingBox()
    const sx = hb.x + hb.width / 2, y = 300, tx = 1440 - 400
    await page.mouse.move(sx, y); await page.mouse.down()
    for (let i = 1; i <= 12; i += 1) await page.mouse.move(sx + ((tx - sx) * i) / 12, y)
    await page.mouse.up(); await sleep(page, 500)
    out.dockWidth = Math.round((await panel.boundingBox()).width)
    log('dock:', out.dockWidth)
    await page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' }).first().click()
    await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 1, null, { timeout: 30000 })
    await sleep(page, 1500)

    // open the mocked MCP step (JSON result)
    const mcpRow = page.locator('[data-testid="ttl-step"]', { hasText: 'interrupt_agent' }).first()
    await mcpRow.waitFor({ state: 'visible', timeout: 15000 })
    await mcpRow.scrollIntoViewIfNeeded()
    await mcpRow.click()
    await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
    await sleep(page, 1500)
    const summary = await bandProbe()
    const summaryFile = await shotBand('panel-fix-json-summary.png')
    log('summary:', JSON.stringify(summary).slice(0, 900))

    // result tab: JsonPretty expected by default (no 渲染 click)
    await page.locator('[data-testid="ttl-detail-tab-result"]').first().click()
    await sleep(page, 1200)
    const result = await bandProbe()
    const resultFile = await shotBand('panel-fix-json-result2.png')
    log('result:', JSON.stringify(result).slice(0, 900))

    // try to switch to 原文 (only if the segmented control exists)
    let rawAfterToggle = null
    let rawFile = null
    if (result.presence.rawToggle === true) {
      await page.locator('[data-testid="ttl-view-raw"]').first().click()
      await sleep(page, 900)
      rawAfterToggle = await bandProbe()
      rawFile = await shotBand('panel-fix-json-raw.png')
      log('raw toggled:', JSON.stringify(rawAfterToggle.presence))
    }

    // 参数 tab renders args via JsonTree: its key must still get the ':' pseudo
    let jsonTreeProbe = null
    try {
      await page.locator('[data-testid="ttl-detail-tab-params"]').first().click()
      await sleep(page, 900)
      jsonTreeProbe = await page.evaluate(() => {
        const band = document.querySelector('[data-testid="ttl-detail"]')
        const key = band?.querySelector('.ttl-jsonRow .ttl-jsonKey')
        return {
          activeTab: [...(band?.querySelectorAll('[role=tab]') ?? [])].find((t) => t.getAttribute('aria-selected') === 'true')?.textContent?.trim() ?? null,
          jsonRowCount: band?.querySelectorAll('.ttl-jsonRow').length ?? 0,
          treeKeyText: (key?.textContent ?? '').trim() || null,
          treeKeyAfterContent: key === null || key === undefined ? null : getComputedStyle(key, '::after').content,
        }
      })
      log('json tree probe:', JSON.stringify(jsonTreeProbe))
    } catch (error) {
      jsonTreeProbe = { error: String(error).split('\n')[0] }
    }

    // 「原始」 tab is the only way to see the raw string for JSON results
    let rawTabProbe = null
    try {
      await page.locator('[data-testid="ttl-detail-tab-raw"]').first().click()
      await sleep(page, 1000)
      rawTabProbe = await page.evaluate(() => {
        const band = document.querySelector('[data-testid="ttl-detail"]')
        const raw = band?.querySelectorAll('.ttl-raw') ?? []
        const rawResult = band?.querySelector('[data-testid="ttl-raw-result"]')
        return {
          activeTab: [...(band?.querySelectorAll('[role=tab]') ?? [])].find((t) => t.getAttribute('aria-selected') === 'true')?.textContent?.trim() ?? null,
          rawTextCount: raw.length,
          rawResultText: (rawResult?.textContent ?? '').slice(0, 80),
        }
      })
      log('raw tab:', JSON.stringify(rawTabProbe))
    } catch (error) {
      rawTabProbe = { error: String(error).split('\n')[0] }
    }

    // plain-text regression: bash result stays RawText
    let plainProbe = null
    try {
      const bashRow = page.locator('[data-testid="ttl-step"]', { hasText: 'Plain text probe' }).first()
      await bashRow.click()
      await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
      await sleep(page, 1200)
      await page.locator('[data-testid="ttl-detail-tab-result"]').first().click()
      await sleep(page, 1000)
      plainProbe = await bandProbe()
      log('plain:', JSON.stringify(plainProbe.presence))
    } catch (error) {
      plainProbe = { error: String(error).split('\n')[0] }
    }

    // markdown result still gets the 渲染/原文 segmented
    let markdownProbe = null
    try {
      const mdRow = page.locator('[data-testid="ttl-step"]', { hasText: 'Markdown probe' }).first()
      await mdRow.click()
      await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 15000 })
      await sleep(page, 1500)
      await page.locator('[data-testid="ttl-detail-tab-result"]').first().click()
      await sleep(page, 1200)
      markdownProbe = await bandProbe()
      log('markdown:', JSON.stringify(markdownProbe.presence))
    } catch (error) {
      markdownProbe = { error: String(error).split('\n')[0] }
    }

    out.frames = {
      summary: { file: summaryFile, probe: summary },
      result: { file: resultFile, probe: result },
      rawFile,
      rawAfterToggle,
      rawTab: rawTabProbe,
      jsonTree: jsonTreeProbe,
      plain: plainProbe,
      markdown: markdownProbe,
    }
    out.expected = {
      summaryLines: '>= 2 indented lines with "previousStatus": "running" on line 2',
      resultDefault: 'JsonPretty rendered without clicking 渲染',
      rawToggle: '原文 segmented control present after switching to result (per Lead)',
      plain: 'RawText for non-JSON text',
    }
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'jsonfixture-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('metrics →', path.join(OUT_DIR, 'jsonfixture-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'jsonfixture-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-jsonfixture.mjs failed:', error?.message ?? error)
  process.exit(1)
})
