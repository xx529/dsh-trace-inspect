#!/usr/bin/env node
/**
 * scripts/verify/shoot-fix.mjs — targeted frames for the final v0.9.1 polish:
 *
 *   panel-fix-parallel.png  consecutive ∥ parallel groups in one turn
 *                           (no full-row band, 1px rail, 9.5px label, hint hidden)
 *   panel-fix-mcp.png       several MCP step rows (green plug chips) + one real
 *                           MCP failure row (red)
 *   panel-fix-generic.png   unknown tools (cube icon) + one error row (red alert)
 *
 * All three are `.ttl-list` element captures at the 400px dock (~399x637 CSS,
 * 798x1274 px at deviceScaleFactor 2), pointer parked at (2,2) first.
 * Writes /tmp/verify/after/fix-metrics.json with the computed values and the
 * scroll position of every frame.
 *
 * Usage: node scripts/verify/shoot-fix.mjs [--port 19487] [--out /tmp/verify/after]
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
  const out = { generatedAt: new Date().toISOString(), viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, frames: {} }

  const park = async () => { await page.mouse.move(2, 2).catch(() => {}); await sleep(page, 250) }
  const shotList = async (name) => {
    await park()
    const file = path.join(OUT_DIR, name)
    const el = page.locator('[data-testid="ttl-list"]').first()
    await el.waitFor({ state: 'visible', timeout: 10000 })
    await el.screenshot({ path: file, animations: 'disabled' })
    log('shot', name)
    return file
  }
  const listScroll = async () => page.evaluate(() => {
    const list = document.querySelector('[data-testid="ttl-list"]')
    const b = list.getBoundingClientRect()
    return { scrollTop: Math.round(list.scrollTop), scrollHeight: Math.round(list.scrollHeight), clientHeight: Math.round(list.clientHeight), rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
  })

  try {
    await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(page, 3500)
    await page.locator('.JoiKIa_sessionRow', { hasText: SESSION_TITLE }).first().click()
    await sleep(page, 5000)
    const openButton = page.getByRole('button', { name: '打开右侧边栏' })
    if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
      await openButton.first().click(); await sleep(page, 1200)
    }
    // dock -> 400
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

    const collapseAll = async () => {
      for (let guard = 0; guard < 60; guard += 1) {
        const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
        if (await expanded.count() === 0) break
        await expanded.first().click(); await sleep(page, 120)
      }
      await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
      await sleep(page, 400)
    }
    const expandTurn = async (tag) => {
      const turn = page.locator('[data-testid="ttl-turn"]').filter({ hasText: tag }).first()
      await turn.waitFor({ state: 'visible', timeout: 15000 })
      const toggle = turn.locator('.ttl-turnToggle')
      if (await toggle.getAttribute('aria-expanded') !== 'true') { await toggle.click(); await sleep(page, 1500) }
    }
    /** Scroll so the row matching `text` sits in the middle of the list viewport. */
    const scrollRowToMiddle = async (text) => page.evaluate((needle) => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const row = rows.find((r) => (r.textContent ?? '').includes(needle))
      if (!row) return null
      const lb = list.getBoundingClientRect()
      const rb = row.getBoundingClientRect()
      list.scrollTop += rb.top - lb.top - Math.round((lb.height - rb.height) / 2)
      return { scrollTop: Math.round(list.scrollTop), rowText: (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80) }
    }, text)

    // ── (1) consecutive parallel groups (turn #1, steps 1-9) ───────────────
    await collapseAll()
    await expandTurn('#1')
    await page.evaluate(() => { const l = document.querySelector('[data-testid="ttl-list"]'); if (l) l.scrollTop = 0 })
    await sleep(page, 500)
    const parallelProbe = await page.evaluate(() => {
      const group = document.querySelector('.ttl-parallel')
      const label = document.querySelector('.ttl-parallelLabel')
      const head = document.querySelector('.ttl-parallelHead')
      const hint = document.querySelector('.ttl-parallelHint')
      const agg = document.querySelector('.ttl-parallelAgg')
      const before = group === null ? null : getComputedStyle(group, '::before')
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const groups = [...document.querySelectorAll('.ttl-parallel')]
      const visible = groups.filter((g) => {
        const b = g.getBoundingClientRect()
        const lb = document.querySelector('[data-testid="ttl-list"]').getBoundingClientRect()
        return b.bottom > lb.top && b.top < lb.bottom
      })
      return {
        groupsTotal: groups.length,
        groupsVisible: visible.length,
        visibleLabels: visible.map((g) => (g.querySelector('.ttl-parallelLabel')?.textContent ?? '').trim()),
        background: group === null ? null : getComputedStyle(group).backgroundColor,
        beforeWidth: before === null ? null : before.width,
        beforeColor: before === null ? null : before.backgroundColor,
        beforeLeft: before === null ? null : before.left,
        labelFontSize: label === null ? null : getComputedStyle(label).fontSize,
        labelColor: label === null ? null : getComputedStyle(label).color,
        labelRect: r(label),
        headHeight: head === null ? null : Math.round(head.getBoundingClientRect().height),
        hintDisplay: hint === null ? 'absent' : getComputedStyle(hint).display,
        aggFontSize: agg === null ? null : getComputedStyle(agg).fontSize,
        aggColor: agg === null ? null : getComputedStyle(agg).color,
        aggText: agg === null ? null : (agg.textContent ?? '').trim(),
      }
    })
    const parallelFile = await shotList('panel-fix-parallel.png')
    out.frames.parallel = { file: parallelFile, scroll: await listScroll(), probe: parallelProbe }
    log('parallel frame:', JSON.stringify(parallelProbe).slice(0, 500))

    // ── (2) MCP rows: green plug success + red failure ─────────────────────
    await collapseAll()
    await expandTurn('#11')
    // A failing call keeps kind="tool" (result.isError drives the red tone), so
    // detect it via the red tinted icon chip on an MCP-named row.
    const mcpErrorRow = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const isMcpName = (r) => (r.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'playwright'
      const isRedChip = (r) => String(r.querySelector('.ttl-stepIcon')?.className ?? '').includes('ttl-tone-error')
      const row = rows.find((r) => isMcpName(r) && isRedChip(r))
        ?? rows.find((r) => isRedChip(r))
      return row === undefined ? null : (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
    })
    if (mcpErrorRow !== null) await scrollRowToMiddle(mcpErrorRow)
    else await scrollRowToMiddle('browser_run_code_unsafe')
    await sleep(page, 500)
    const mcpProbe = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const inView = (el) => { const b = el.getBoundingClientRect(); return b.bottom > lb.top && b.top < lb.bottom }
      const mcpSuccess = [...document.querySelectorAll('[data-testid="ttl-step"]')].filter((row) => {
        const icon = row.querySelector('.ttl-stepIcon')
        return inView(row) && icon !== null && icon.classList.contains('ttl-tone-mcp')
      })
      const mcpFailures = [...document.querySelectorAll('[data-testid="ttl-step"]')].filter((row) => {
        const icon = row.querySelector('.ttl-stepIcon')
        const name = (row.querySelector('.ttl-stepName')?.textContent ?? '').trim()
        return inView(row) && icon !== null && icon.classList.contains('ttl-tone-error') && name === 'playwright'
      })
      const errRows = [...document.querySelectorAll('[data-testid="ttl-step"]')].filter((row) => inView(row) && row.getAttribute('data-step-kind') === 'error')
      const describeIcon = (row) => {
        const chip = row.querySelector('.ttl-stepIcon')
        const inner = row.querySelector('.ttl-stepIcon .ttl-rowIcon')
        const svg = row.querySelector('.ttl-stepIcon svg')
        const cs = chip === null ? null : getComputedStyle(chip)
        return {
          chipClass: chip === null ? null : String(chip.className),
          chipColor: cs === null ? null : cs.color,
          chipBackground: cs === null ? null : cs.backgroundColor,
          innerClass: inner === null ? null : String(inner.className),
          svgChildren: svg === null ? null : [...svg.children].map((c) => c.tagName),
          svgFirstPathD: svg === null ? null : (svg.querySelector('path')?.getAttribute('d') ?? null),
          rowText: (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
        }
      }
      return {
        mcpSuccessRows: mcpSuccess.length,
        mcpSuccessSamples: mcpSuccess.slice(0, 3).map(describeIcon),
        mcpFailRows: mcpFailures.length,
        mcpFailSamples: mcpFailures.slice(0, 2).map(describeIcon),
        errorRows: errRows.length,
        errorSamples: errRows.slice(0, 2).map(describeIcon),
        mcpErrorFound: mcpFailures.length > 0 || errRows.some((row) => (row.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'playwright'),
        expectedSuccessColor: 'rgb(52, 211, 153)',
        expectedFailureTone: 'ttl-tone-error (red plug)',
      }
    })
    const mcpFile = await shotList('panel-fix-mcp.png')
    out.frames.mcp = { file: mcpFile, scroll: await listScroll(), probe: mcpProbe }
    log('mcp frame:', JSON.stringify(mcpProbe).slice(0, 700))

    // ── (2b) local frames: failure row styling + neighbouring success rows ──
    const mcpFix = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')]
      const describe = (row) => {
        const cs = getComputedStyle(row)
        const st = row.querySelector('.ttl-stepStatus')
        const nameEl = row.querySelector('.ttl-stepName')
        const descEl = row.querySelector('.ttl-stepDesc')
        const icon = row.querySelector('.ttl-stepIcon')
        const svg = row.querySelector('.ttl-stepIcon svg')
        const b = row.getBoundingClientRect()
        return {
          text: (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90),
          kind: row.getAttribute('data-step-kind'),
          rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)],
          statusText: (st?.textContent ?? '').trim() || null,
          statusColor: st === null ? null : getComputedStyle(st).color,
          rowBackground: cs.backgroundColor,
          nameColor: nameEl === null ? null : getComputedStyle(nameEl).color,
          descColor: descEl === null ? null : getComputedStyle(descEl).color,
          descText: (descEl?.textContent ?? '').trim().slice(0, 60),
          iconClass: icon === null ? null : String(icon.className),
          iconColor: icon === null ? null : getComputedStyle(icon).color,
          iconBackground: icon === null ? null : getComputedStyle(icon).backgroundColor,
          iconSvgChildren: svg === null ? null : [...svg.children].map((c) => c.tagName),
        }
      }
      const fail = rows.find((row) => row.getAttribute('data-step-kind') === 'error'
        && String(row.querySelector('.ttl-stepIcon')?.className ?? '').includes('ttl-tone-error')
        && (row.querySelector('.ttl-stepName')?.textContent ?? '').trim() === 'playwright')
      const success = rows.filter((row) => (row.getAttribute('data-step-kind') ?? '') !== 'error'
        && String(row.querySelector('.ttl-stepIcon')?.className ?? '').includes('ttl-tone-mcp'))
      return {
        listRect: [Math.round(lb.x), Math.round(lb.y), Math.round(lb.width), Math.round(lb.height)],
        failure: fail === undefined ? null : describe(fail),
        successes: success.slice(0, 8).map(describe),
      }
    })
    const clipShot = async (name, clip) => {
      await park()
      const file = path.join(OUT_DIR, name)
      await page.screenshot({ path: file, clip, animations: 'disabled' })
      log('shot', name)
      return file
    }
    const listBox = mcpFix.listRect
    let errorFile = null
    let okFile = null
    if (mcpFix.failure !== null) {
      const failRect = mcpFix.failure.rect
      // local frame around the failing row (row + 2 neighbours)
      const errTop = Math.max(listBox[1], failRect[1] - 34)
      const errHeight = Math.min(3 * 34 + 12, listBox[1] + listBox[3] - errTop)
      errorFile = await clipShot('panel-fix-mcp-error.png', { x: listBox[0], y: errTop, width: listBox[2], height: errHeight })
      // local frame of the success rows above the failing row
      const okBottom = failRect[1] - 4
      const okTop = Math.max(listBox[1], okBottom - 5 * 34 - 8)
      const okHeight = Math.min(okBottom - okTop, listBox[1] + listBox[3] - okTop)
      if (okHeight > 60) okFile = await clipShot('panel-fix-mcp-ok.png', { x: listBox[0], y: okTop, width: listBox[2], height: okHeight })
    }
    out.frames.mcpErrorFix = {
      errorFile,
      okFile,
      failure: mcpFix.failure,
      successes: mcpFix.successes,
      expected: {
        failureKind: 'error',
        failureStatus: '✗',
        failureRowBackground: 'rgba(242, 114, 111, 0.08)',
        failureDescColor: 'red (--dsw-alias-state-error-primary)',
        failureIcon: 'red plug (ttl-tone-error + mcp svg)',
        successKind: 'tool',
        successStatus: '✓',
        successIcon: 'green plug (ttl-tone-mcp, rgb(52,211,153))',
      },
    }
    log('mcp-error local frame:', JSON.stringify({ failure: mcpFix.failure, okFile: okFile !== null }).slice(0, 900))

    // ── (3) generic tools (cube) + one error row (alert) ───────────────────
    await collapseAll()
    await expandTurn('#1')
    const genericScrolled = await scrollRowToMiddle('spawn_teammate')
    if (genericScrolled === null) await scrollRowToMiddle('team_task_create')
    await sleep(page, 500)
    const genericProbe = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const inView = (el) => { const b = el.getBoundingClientRect(); return b.bottom > lb.top && b.top < lb.bottom }
      const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')].filter(inView)
      const describe = (row) => {
        const icon = row.querySelector('.ttl-stepIcon')
        const inner = row.querySelector('.ttl-stepIcon .ttl-rowIcon')
        const svg = row.querySelector('.ttl-stepIcon svg')
        const cs = icon === null ? null : getComputedStyle(icon)
        return {
          name: (row.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
          kind: row.getAttribute('data-step-kind'),
          chipClass: icon === null ? null : String(icon.className),
          chipColor: cs === null ? null : cs.color,
          chipBackground: cs === null ? null : cs.backgroundColor,
          innerClass: inner === null ? null : String(inner.className),
          svgChildren: svg === null ? null : [...svg.children].map((c) => c.tagName),
          svgFirstPathD: svg === null ? null : (svg.querySelector('path')?.getAttribute('d') ?? null),
        }
      }
      const unknown = rows.filter((r) => ['spawn_teammate', 'spawn_subagent', 'team_task_create', 'team_task_update', 'team_task_list', 'wait_agent', 'list_agents', 'send_message', 'job_list'].includes((r.querySelector('.ttl-stepName')?.textContent ?? '').trim()))
      const errorRows = rows.filter((r) => r.getAttribute('data-step-kind') === 'error')
      return {
        unknownRows: unknown.length,
        unknownSamples: unknown.slice(0, 6).map(describe),
        errorRows: errorRows.length,
        errorSamples: errorRows.slice(0, 2).map(describe),
      }
    })
    const genericFile = await shotList('panel-fix-generic.png')
    out.frames.generic = { file: genericFile, scroll: await listScroll(), probe: genericProbe }
    log('generic frame:', JSON.stringify(genericProbe).slice(0, 800))

    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'fix-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('fix metrics →', path.join(OUT_DIR, 'fix-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'fix-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-fix.mjs failed:', error?.message ?? error)
  process.exit(1)
})
