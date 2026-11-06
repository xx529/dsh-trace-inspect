#!/usr/bin/env node
/**
 * scripts/verify/shoot-quiet.mjs — v0.9.7 "quiet rows" check:
 *
 *   panel-fix-quiet.png       400px list screen (turn #8: bash + mcp + read + edit)
 *   panel-fix-quiet-write.png supplementary window with write/edit rows
 *   panel-fix-header.png      turn-header clip (steps + chevron; no ↗, no ∥N,
 *                             error badge kept)
 *
 * Measures (into /tmp/verify/after/quiet-metrics.json):
 *   - `.ttl-stepJump` / `.ttl-locateBtn` / `.ttl-msgJump` / `.ttl-itemJump` and
 *     `.ttl-badgeParallel` computed display (expect none)
 *   - error badge presence, chevron presence
 *   - edit / write / mcp / bash / read icon chip colours
 *   - mix-item + legend-dot colours for edit and mcp
 *   - todo tone colour (synthetic probe; no todo call in this session)
 *   - horizontal-scroll check
 *
 * Usage: node scripts/verify/shoot-quiet.mjs [--port 19487]
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
const SESSION_TITLE = arg('session', '优化侧边查看插件并推送')

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
  const out = { generatedAt: new Date().toISOString(), viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }
  const park = async () => { await page.mouse.move(2, 2).catch(() => {}); await sleep(page, 250) }

  try {
    await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(page, 3500)
    await page.locator('.JoiKIa_sessionRow', { hasText: SESSION_TITLE }).first().click()
    await sleep(page, 5000)
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
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 5, null, { timeout: 90000 })
    await sleep(page, 2000)

    for (let guard = 0; guard < 60; guard += 1) {
      const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
      if (await expanded.count() === 0) break
      await expanded.first().click(); await sleep(page, 120)
    }
    await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
    await sleep(page, 400)
    await page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#8' }).first().locator('.ttl-turnToggle').click()
    await sleep(page, 1800)

    // ── turn header clip (no ↗, no ∥N, error badge kept) ──────────────────
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const turns = [...document.querySelectorAll('[data-testid="ttl-turn"]')]
      const turn = turns[turns.length - 1]
      if (list !== null && turn !== undefined) {
        const lb = list.getBoundingClientRect(), tb = turn.getBoundingClientRect()
        list.scrollTop += tb.top - lb.top - 6
      }
    })
    await sleep(page, 500)
    const headerProbe = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const turns = [...document.querySelectorAll('[data-testid="ttl-turn"]')]
      const turn = turns[turns.length - 1]
      const lb = list.getBoundingClientRect()
      const head = turn?.querySelector('.ttl-turnHead')
      const hb2 = head?.getBoundingClientRect()
      const preview = turn?.querySelector('.ttl-turnPreview')
      const pb = preview?.getBoundingClientRect()
      const badgeParallel = turn?.querySelector('[data-testid="ttl-turn-parallel"]')
      const badgeErr = turn?.querySelector('[data-testid="ttl-error-dot"]')
      const locate = turn?.querySelector('[data-testid="ttl-locate"]')
      const chevron = turn?.querySelector('.ttl-chevron')
      const steps = turn?.querySelector('[data-testid="ttl-steps-count"]')
      const style = (el) => (el === null || el === undefined ? null : {
        display: getComputedStyle(el).display,
        opacity: getComputedStyle(el).opacity,
        text: (el.textContent ?? '').trim(),
        rect: (() => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] })(),
      })
      return {
        turnTag: (turn?.querySelector('[data-testid="ttl-turn-tag"]')?.textContent ?? '').trim(),
        headRect: hb2 ? [Math.round(hb2.x), Math.round(hb2.y), Math.round(hb2.width), Math.round(hb2.height)] : null,
        previewRect: pb ? [Math.round(pb.x), Math.round(pb.y), Math.round(pb.width), Math.round(pb.height)] : null,
        badgeParallel: style(badgeParallel),
        badgeErr: style(badgeErr),
        locateBtn: style(locate),
        chevron: style(chevron),
        steps: style(steps),
        listTop: Math.round(lb.top),
      }
    })
    const clip = {
      x: Math.round(headerProbe.headRect[0]),
      y: Math.round(headerProbe.headRect[1] - 4),
      width: Math.round(headerProbe.headRect[2]),
      height: Math.round((headerProbe.previewRect !== null
        ? headerProbe.previewRect[1] + headerProbe.previewRect[3] - (headerProbe.headRect[1] - 4)
        : headerProbe.headRect[3] + 8) + 6),
    }
    await park()
    const headerFile = path.join(OUT_DIR, 'panel-fix-header.png')
    await page.screenshot({ path: headerFile, clip, animations: 'disabled' })
    log('shot panel-fix-header.png', JSON.stringify(clip))
    out.header = { file: headerFile, clip, probe: headerProbe }
    log('header probe:', JSON.stringify(headerProbe))

    // ── quiet list window around the MCP row (turn #8) ────────────────────
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const row = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        .find((r) => (r.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'playwright')
      if (list !== null && row !== undefined) {
        const lb = list.getBoundingClientRect(), rb = row.getBoundingClientRect()
        list.scrollTop += rb.top - lb.top - 160
      }
    })
    await sleep(page, 500)
    await park()
    const quietProbe = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="ttl-root"]')
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const styleOf = (el) => el === null || el === undefined ? null : {
        display: getComputedStyle(el).display,
        opacity: getComputedStyle(el).opacity,
        color: getComputedStyle(el).color,
        rect: r(el),
        text: (el.textContent ?? '').trim(),
      }
      const icon = (tone) => styleOf(document.querySelector(`.ttl-stepIcon.ttl-tone-${tone}`))
      return {
        jump: {
          stepJump: styleOf(document.querySelector('[data-testid="ttl-step-jump"]')),
          locateBtn: styleOf(document.querySelector('[data-testid="ttl-locate"]')),
          msgJump: styleOf(document.querySelector('[data-testid="ttl-output-jump"]')),
          itemJump: styleOf(document.querySelector('.ttl-itemJump')),
          outputJump: styleOf(document.querySelector('[data-testid="ttl-output-jump"]')),
        },
        badgeParallel: styleOf(document.querySelector('[data-testid="ttl-turn-parallel"]')),
        chevrons: [...document.querySelectorAll('.ttl-chevron')].length,
        chevronVisible: [...document.querySelectorAll('.ttl-chevron')].filter((el) => getComputedStyle(el).display !== 'none').length,
        icons: {
          edit: icon('edit'),
          mcp: icon('mcp'),
          shell: icon('shell'),
          read: icon('read'),
        },
        rowsInView: [...document.querySelectorAll('[data-testid="ttl-step"]')].filter((row) => {
          const b = row.getBoundingClientRect()
          return b.bottom > lb.top && b.top < lb.bottom
        }).map((row) => ({
          name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
          tone: String(row.querySelector('.ttl-stepIcon')?.className ?? ''),
          iconColor: row.querySelector('.ttl-stepIcon') === null ? null : getComputedStyle(row.querySelector('.ttl-stepIcon')).color,
        })),
        horizontal: {
          rootScrollWidth: root.scrollWidth,
          rootClientWidth: root.clientWidth,
          listScrollWidth: list.scrollWidth,
          listClientWidth: list.clientWidth,
          bodyScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
        },
        listRect: r(list),
        listScrollTop: Math.round(list.scrollTop),
      }
    })
    const quietFile = path.join(OUT_DIR, 'panel-fix-quiet.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: quietFile, animations: 'disabled' })
    log('shot panel-fix-quiet.png')
    out.quiet = { file: quietFile, probe: quietProbe }
    log('quiet probe:', JSON.stringify(quietProbe).slice(0, 1100))

    // ── supplementary write/edit window ───────────────────────────────────
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const row = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        .find((r) => (r.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'write')
      if (list !== null && row !== undefined) {
        const lb = list.getBoundingClientRect(), rb = row.getBoundingClientRect()
        list.scrollTop += rb.top - lb.top - 140
      }
    })
    await sleep(page, 500)
    await park()
    const writeFile = path.join(OUT_DIR, 'panel-fix-quiet-write.png')
    await page.locator('[data-testid="ttl-list"]').first().screenshot({ path: writeFile, animations: 'disabled' })
    log('shot panel-fix-quiet-write.png')
    const writeProbe = await page.evaluate(() => {
      const row = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        .find((r) => (r.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'write')
      if (row === undefined) return null
      const chip = row.querySelector('.ttl-stepIcon')
      return {
        rowText: (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        chipClass: String(chip?.className ?? ''),
        chipColor: chip === null ? null : getComputedStyle(chip).color,
        chipBackground: chip === null ? null : getComputedStyle(chip).backgroundColor,
      }
    })
    out.quietWrite = { file: writeFile, probe: writeProbe }

    // ── mix / legend colours (mix only shows on collapsed cards) ──────────
    for (let guard = 0; guard < 60; guard += 1) {
      const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
      if (await expanded.count() === 0) break
      await expanded.first().click(); await sleep(page, 120)
    }
    await sleep(page, 400)
    const mixProbe = await page.evaluate(() => {
      const toneStyle = (label, selector) => {
        const el = document.querySelector(selector)
        return el === null ? null : { tone: label, color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }
      }
      const mix = (tone) => {
        const els = [...document.querySelectorAll(`.ttl-mixItem.ttl-tone-${tone}`)]
        return els.slice(0, 2).map((el) => ({ color: getComputedStyle(el).color, svgStroke: (() => { const svg = el.querySelector('svg'); return svg === null ? null : getComputedStyle(svg).stroke })(), text: (el.textContent ?? '').trim() }))
      }
      return {
        legendEdit: toneStyle('edit', '.ttl-legendDot.ttl-tone-edit'),
        legendMcp: toneStyle('mcp', '.ttl-legendDot.ttl-tone-mcp'),
        legendTodo: toneStyle('todo', '.ttl-legendDot.ttl-tone-todo'),
        distEdit: toneStyle('edit', '.ttl-distSeg.ttl-tone-edit'),
        distMcp: toneStyle('mcp', '.ttl-distSeg.ttl-tone-mcp'),
        mixEdit: mix('edit'),
        mixMcp: mix('mcp'),
        mixTodo: mix('todo'),
        toneEditColor: (() => { const el = document.querySelector('.ttl-mixItem.ttl-tone-edit'); return el === null ? null : getComputedStyle(el).color })(),
      }
    })
    out.mixLegend = mixProbe
    log('mix/legend probe:', JSON.stringify(mixProbe).slice(0, 700))

    // ── synthetic todo tone probe + hidden jump rules sanity ──────────────
    const synth = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="ttl-root"]')
      const make = (cls) => {
        const el = document.createElement('span')
        el.className = cls
        el.style.position = 'absolute'
        el.style.visibility = 'hidden'
        root.appendChild(el)
        const cs = getComputedStyle(el)
        const out = { cls, display: cs.display, color: cs.color, background: cs.backgroundColor }
        el.remove()
        return out
      }
      return {
        todoChip: make('ttl-stepIcon ttl-tone-todo'),
        todoTone: make('ttl-tone-todo'),
        itemJump: make('ttl-itemJump'),
        msgJump: make('ttl-msgJump'),
      }
    })
    out.synthetic = synth
    log('synthetic:', JSON.stringify(synth))

    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'quiet-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('metrics →', path.join(OUT_DIR, 'quiet-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'quiet-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-quiet.mjs failed:', error?.message ?? error)
  process.exit(1)
})
