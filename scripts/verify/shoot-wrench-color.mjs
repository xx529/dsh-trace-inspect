#!/usr/bin/env node
/**
 * scripts/verify/shoot-wrench-color.mjs — v0.9.9: the generic/unknown-tool wrench
 * is now pink `#f472b6` (row chip + overview legend dot + distribution segment),
 * distinct from bash purple / read blue / edit amber / mcp green / error red.
 *
 * Captures /tmp/verify/after/panel-fix-wrench-color.png — a 400px strip with the
 * overview legend on top and unknown-tool rows below — plus wrench-color-metrics.json.
 *
 * Usage: node scripts/verify/shoot-wrench-color.mjs [--port 19487]
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
    // turn #5 opens with list_agents / team_task_list / send_message / wait_agent
    await page.locator('[data-testid="ttl-turn"]').filter({ hasText: '#5' }).first().locator('.ttl-turnToggle').click()
    await sleep(page, 1600)
    // scroll so the first unknown-tool row (list_agents) sits at the top of the
    // list viewport — the legend stays pinned above it, so one clip shows both
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const row = [...document.querySelectorAll('[data-testid="ttl-step"]')]
        .find((r) => (r.querySelector('.ttl-stepIcon')?.className ?? '').includes('ttl-tone-generic'))
      if (list !== null && row !== undefined) {
        const lb = list.getBoundingClientRect()
        const rb = row.getBoundingClientRect()
        list.scrollTop += rb.top - lb.top - 8
      }
    })
    await sleep(page, 500)

    await park()
    const probe = await page.evaluate(({ wrenchPrefix }) => {
      const root = document.querySelector('[data-testid="ttl-root"]')
      const list = document.querySelector('[data-testid="ttl-list"]')
      const summary = document.querySelector('.ttl-summary')
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
      const generic = [...document.querySelectorAll('.ttl-stepIcon.ttl-tone-generic')]
      const genericInfo = (chip) => {
        const svg = chip.querySelector('svg')
        const paths = svg === null ? [] : [...svg.querySelectorAll('path')]
        const row = chip.closest('[data-testid="ttl-step"]')
        return {
          row: (row?.querySelector('.ttl-stepName')?.textContent ?? '').trim(),
          color: getComputedStyle(chip).color,
          background: getComputedStyle(chip).backgroundColor,
          svgChildren: svg === null ? null : [...svg.children].map((c) => c.tagName),
          isWrench: paths.some((p) => (p.getAttribute('d') ?? '').includes(wrenchPrefix)),
          strokeWidth: paths.length === 0 ? null : paths[0].getAttribute('stroke-width'),
        }
      }
      const errorChip = document.querySelector('.ttl-step[data-step-kind="error"] .ttl-stepIcon')
      const errorPaths = errorChip === null ? [] : [...errorChip.querySelectorAll('path')]
      return {
        summaryRect: r(summary),
        genericCount: generic.length,
        genericSamples: generic.slice(0, 5).map(genericInfo),
        legend: [...document.querySelectorAll('.ttl-legendDot')].map((el) => ({
          tone: [...el.classList].find((c) => c.startsWith('ttl-tone-')) ?? null,
          background: getComputedStyle(el).backgroundColor,
        })),
        segments: [...document.querySelectorAll('.ttl-distSeg')].map((el) => ({
          tone: [...el.classList].find((c) => c.startsWith('ttl-tone-')) ?? null,
          background: getComputedStyle(el).backgroundColor,
        })),
        tone: {
          genericIcon: generic.length === 0 ? null : genericInfo(generic[0]).color,
          genericIconBg: generic.length === 0 ? null : genericInfo(generic[0]).background,
          genericLegend: (() => { const el = document.querySelector('.ttl-legendDot.ttl-tone-generic'); return el === null ? null : getComputedStyle(el).backgroundColor })(),
          genericDist: (() => { const el = document.querySelector('.ttl-distSeg.ttl-tone-generic'); return el === null ? null : getComputedStyle(el).backgroundColor })(),
          editIcon: (() => { const el = document.querySelector('.ttl-stepIcon.ttl-tone-edit'); return el === null ? null : getComputedStyle(el).color })(),
          mcpIcon: (() => { const el = document.querySelector('.ttl-stepIcon.ttl-tone-mcp'); return el === null ? null : getComputedStyle(el).color })(),
          errorIcon: errorChip === null ? null : {
            color: getComputedStyle(errorChip).color,
            isAlert: errorPaths.some((p) => (p.getAttribute('d') ?? '').includes('M10.29 3.86')),
          },
          todoSynth: (() => {
            const el = document.createElement('span')
            el.className = 'ttl-stepIcon ttl-tone-todo'
            el.style.position = 'absolute'
            el.style.visibility = 'hidden'
            root.appendChild(el)
            const value = { color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }
            el.remove()
            return value
          })(),
        },
        horizontal: {
          rootScrollWidth: root.scrollWidth,
          rootClientWidth: root.clientWidth,
          listScrollWidth: list.scrollWidth,
          listClientWidth: list.clientWidth,
          bodyScrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          noHorizontalScrollbar: root.scrollWidth <= root.clientWidth + 1 && list.scrollWidth <= list.clientWidth + 1,
        },
        listScrollTop: Math.round(list.scrollTop),
      }
    }, { wrenchPrefix: 'M14.7 6.3' })
    log('probe:', JSON.stringify(probe).slice(0, 1200))

    // clip: overview legend + the unknown-tool rows at the top of the list
    const clip = {
      x: Math.round(probe.summaryRect[0]),
      y: Math.round(probe.summaryRect[1]),
      width: Math.round(probe.summaryRect[2]),
      height: 700,
    }
    const file = path.join(OUT_DIR, 'panel-fix-wrench-color.png')
    await page.screenshot({ path: file, clip, animations: 'disabled' })
    log('shot panel-fix-wrench-color.png', JSON.stringify(clip))

    out.frame = { file, clip, probe }
    out.expected = {
      genericIconColor: 'rgb(244, 114, 182)',
      genericIconBackground: 'rgba(244, 114, 182, 0.14)',
      genericLegendBackground: 'rgb(244, 114, 182)',
      genericDistBackground: 'rgb(244, 114, 182)',
      mcpIcon: 'rgb(52, 211, 153)',
      editIcon: 'rgb(242, 180, 92)',
      todoIcon: 'rgb(155, 161, 167)',
      errorIcon: 'rgb(242, 90, 90)',
    }
    out.consoleErrors = consoleErrors.slice(0, 20)
    fs.writeFileSync(path.join(OUT_DIR, 'wrench-color-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    log('metrics →', path.join(OUT_DIR, 'wrench-color-metrics.json'))
  } catch (error) {
    out.consoleErrors = consoleErrors.slice(0, 20)
    out.error = String(error?.stack ?? error)
    fs.writeFileSync(path.join(OUT_DIR, 'wrench-color-metrics.json'), `${JSON.stringify(out, null, 2)}\n`)
    throw error
  } finally {
    await ctx.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot-wrench-color.mjs failed:', error?.message ?? error)
  process.exit(1)
})
