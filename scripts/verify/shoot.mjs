#!/usr/bin/env node
/**
 * scripts/verify/shoot.mjs — deterministic live-browser screenshot pipeline for
 * the `轮次轨迹` (turn outline) tab of dsh-trace-inspect.
 *
 * It drives a running *independent* DSH web instance with Playwright + the
 * system Google Chrome, opens the recorded long session, docks the right
 * sidebar at ~400px and captures the same frames every run:
 *
 *   01-collapsed.png          folded turn list (all turns collapsed, list at top)
 *   02-expanded-parallel.png  latest turn carrying a ∥ badge, expanded
 *   03-detail-band.png        inline detail band of a long `bash` step
 *   04-zoom.png               ⤢ full-size viewer overlay of the same step
 *   05-mcp.png                (extra) one real `mcp__*` step + its detail band
 *
 * plus element-only shots for pixel comparison against the 400px prototype
 * (`panel-01-collapsed.png`, `panel-02-expanded.png`, `panel-03-detail.png`,
 * `panel-04-zoomPanel.png`, `panel-05-mcp.png`) and `metrics.json` with the
 * measured dock width, typography, key colours, detail-band / zoom geometry
 * and the surrounding state, so a `before` and an `after` run can be compared
 * numerically as well as by pixel.
 *
 * The script is UI-variant aware: it works both on the v0.8 shipped UI
 * (`ttl-row` / `ttl-dtab-*` / `ttl-turnRow`) and on the v0.9 redesigned UI
 * (`ttl-step` / `ttl-detail-tab-*` / `.ttl-turn` + `.ttl-stepDesc`), and records
 * which variant it found.
 *
 * Usage:
 *   node scripts/verify/shoot.mjs [--mode before|after] [--port 19487]
 *        [--token <token>] [--url <full token url>] [--out <dir>]
 *        [--session <title substring>] [--dock-width 400]
 *        [--lib <path to served lib/client.js>] [--src <src dir>]
 *
 * Token resolution order: --url, --token, $DSH_URL, then the last
 * `dsh web: http://127.0.0.1:<port>/...?token=…` line of --server-log.
 * Output defaults to /tmp/verify/<mode>/.
 *
 * Serving the v0.8 (pre-redesign) baseline without touching the working tree:
 *   git archive HEAD | tar -x -C /tmp/verify/repo-v08     # committed lib/ is v0.8
 *   # profile `trace-verify-v08` = copy of trace-verify with
 *   # node_modules/dsh-trace-inspect → /tmp/verify/repo-v08
 *   DSH_HOME=/tmp/verify/dsh-home dsh --profile trace-verify-v08 --no-open --port 19488
 *   node scripts/verify/shoot.mjs --mode before --port 19488 \
 *        --server-log /tmp/verify/server-v08.log \
 *        --lib /tmp/verify/repo-v08/lib/client.js --src /tmp/verify/repo-v08/src
 *
 * The `after` run against the working tree needs `pnpm build` + an instance
 * restart, because the host serves the built `lib/` and caches it per page load.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { pathToFileURL } from 'node:url'

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const MODE = arg('mode', 'before')
if (MODE !== 'before' && MODE !== 'after') {
  console.error(`--mode must be before|after, got ${MODE}`)
  process.exit(2)
}
const PORT = Number(arg('port', '19487'))
const DOCK_TARGET = Number(arg('dock-width', '400'))
const SESSION_TITLE = arg('session', '优化侧边查看插件并推送')
const OUT_DIR = path.resolve(arg('out', `/tmp/verify/${MODE}`))
const SERVER_LOG = arg('server-log', `/tmp/verify/server${PORT === 19487 ? '' : `-${PORT}`}.log`)
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const SERVED_LIB = path.resolve(arg('lib', path.join(REPO, 'lib/client.js')))
const SRC_DIR = path.resolve(arg('src', path.join(REPO, 'src')))
const LONG_ROW_TEXT = arg('long-row', 'Add locale keys and styles for value blocks/viewer')

function resolveUrl() {
  const explicit = arg('url', process.env.DSH_URL)
  if (explicit) return explicit
  let token = arg('token', process.env.DSH_TOKEN)
  if (!token) {
    try {
      const text = fs.readFileSync(SERVER_LOG, 'utf8')
      const byPort = [...text.matchAll(new RegExp(`:${PORT}/\\?token=([A-Za-z0-9_\\-]+)`, 'g'))]
      const any = [...text.matchAll(/[?&]token=([A-Za-z0-9_\-]+)/g)]
      if (byPort.length > 0) token = byPort[byPort.length - 1][1]
      else if (any.length > 0) token = any[any.length - 1][1]
    } catch { /* fall through */ }
  }
  if (!token) {
    console.error(`cannot resolve token: pass --token/--url, or make ${SERVER_LOG} contain "dsh web: http://127.0.0.1:${PORT}/?token=…"`)
    process.exit(2)
  }
  return `http://127.0.0.1:${PORT}/?token=${token}`
}
const URL_WITH_TOKEN = resolveUrl()

// ── playwright (installed globally for the user's MCP servers) ─────────────
const PW_CANDIDATES = [
  process.env.PLAYWRIGHT_CORE,
  path.join(process.env.HOME || '', '.dsh/mcp-servers/mobile-mcp/node_modules/playwright-core/index.mjs'),
  path.join(process.env.HOME || '', '.dsh/mcp-servers/mobile-mcp/node_modules/playwright/index.mjs'),
].filter(Boolean)

async function loadPlaywright() {
  const errors = []
  for (const candidate of PW_CANDIDATES) {
    try {
      const mod = await import(pathToFileURL(candidate).href)
      return mod.chromium
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`)
    }
  }
  throw new Error(`playwright-core not loadable:\n  ${errors.join('\n  ')}`)
}

// ── small helpers ──────────────────────────────────────────────────────────
const t0 = Date.now()
const log = (...parts) => {
  const sec = ((Date.now() - t0) / 1000).toFixed(1).padStart(5, ' ')
  console.log(`[${sec}s]`, ...parts)
}
const sleep = (page, ms) => page.waitForTimeout(ms)

function sha256File(file) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  } catch {
    return null
  }
}
function gitHead() {
  try {
    const head = fs.readFileSync(path.join(REPO, '.git/HEAD'), 'utf8').trim()
    if (head.startsWith('ref: ')) {
      const ref = head.slice(5)
      return fs.readFileSync(path.join(REPO, '.git', ref), 'utf8').trim()
    }
    return head
  } catch {
    return null
  }
}
/** Order-independent fingerprint of a source tree (path + content sha256). */
function treeFingerprint(dir) {
  try {
    const files = []
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.isFile()) files.push(full)
      }
    }
    walk(dir)
    files.sort()
    const hash = crypto.createHash('sha256')
    for (const file of files) {
      hash.update(path.relative(dir, file))
      hash.update('\0')
      hash.update(fs.readFileSync(file))
      hash.update('\0')
    }
    return { sha256: hash.digest('hex'), files: files.length }
  } catch {
    return null
  }
}

/** Bounding rect / computed style of the first element matching each selector. */
async function collectStyles(page, selectors) {
  return page.evaluate((sels) => {
    const out = {}
    for (const [key, sel] of Object.entries(sels)) {
      const el = document.querySelector(sel)
      if (el === null) { out[key] = null; continue }
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      out[key] = {
        selector: sel,
        rect: [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)],
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderTopColor: cs.borderTopColor,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        height: cs.height,
        width: cs.width,
        overflowY: cs.overflowY,
      }
    }
    return out
  }, selectors)
}

/** Selectors are comma unions so one run covers both the v0.8 and v0.9 DOM. */
const STYLE_SELECTORS = {
  dockPanel: '[class*=Dv5QdW_panel]',
  tabHost: '[class*=_tabHost_]',
  tabBar: '[class*=_tabHostHeader_]',
  trailRoot: '[data-testid="ttl-root"]',
  header: '.ttl-header',
  title: '.ttl-title',
  count: '[data-testid="ttl-count"]',
  followToggle: '.ttl-toggle, .ttl-follow, [data-testid="ttl-follow-toggle"]',
  searchInput: '[data-testid="ttl-search"], .ttl-searchInput',
  chipsRow: '[data-testid="ttl-chips"]',
  chip: '.ttl-chip',
  chipNum: '.ttl-chipNum, .ttl-chipCount',
  list: '[data-testid="ttl-list"]',
  turnRow: '[data-testid="ttl-turn"]',
  turnBody: '.ttl-turnBody',
  turnHead: '.ttl-turnHead',
  turnToggle: '.ttl-turnToggle',
  turnTag: '[data-testid="ttl-turn-tag"]',
  turnPreview: '[data-testid="ttl-turn-preview"], .ttl-turnPreview',
  stepsNum: '[data-testid="ttl-steps-count"]',
  parallelBadge: '[data-testid="ttl-turn-parallel"]',
  parallelGroup: '[data-testid="ttl-parallel-group"]',
  parallelHead: '.ttl-parallelHead',
  parallelBody: '.ttl-parallelBody',
  stepWrap: '[data-testid="ttl-step-wrap"]',
  row: '[data-testid="ttl-step"]',
  rowName: '.ttl-rowName, .ttl-stepName',
  rowArgs: '.ttl-rowArgs, .ttl-stepDesc',
  rowDot: '.ttl-rowDot',
  caret: '.ttl-caret, .ttl-chevron',
  jump: '.ttl-jump, .ttl-stepJump',
  detail: '[data-testid="ttl-detail"]',
  detailHead: '.ttl-detailHead',
  detailName: '.ttl-detailName',
  detailDesc: '.ttl-detailDesc',
  dtab: '.ttl-dtab, .ttl-tab',
  dtabSelected: '.ttl-tabSelected, [role=tab][aria-selected="true"], .ttl-dtabSelected',
  detailBar: '.ttl-detailBar, .ttl-tabs',
  detailBody: '.ttl-detailBody',
  detailFoot: '.ttl-detailFoot',
  sectionLabel: '.ttl-sectionLabel',
  codeText: '.ttl-codeText',
  code: '.ttl-code',
  kvKey: '.ttl-kvKey',
  jpLong: '.ttl-jpLong',
  jpLongMeta: '[data-testid="ttl-json-long-meta"]',
  jpRestored: '[data-testid="ttl-json-long-body"]',
  jsonKey: '.ttl-jsonKey, .ttl-kvKey',
  zoom: '[data-testid="ttl-zoom"]',
  zoomPanel: '[data-testid="ttl-zoom-panel"]',
  zoomTitle: '[data-testid="ttl-zoom-title"]',
  zoomOutline: '[data-testid="ttl-zoom-outline"], .ttl-zoomOutline',
  zoomFoot: '.ttl-zoomFoot',
  errorBlock: '.ttl-errorBlock',
  errorName: '.ttl-errorName',
}

const CSS_VARS = [
  '--dsh-sidebar-width',
  '--ttl-panel',
  '--ttl-bg',
  '--ttl-layer2',
  '--ttl-tx1',
  '--ttl-tx2',
  '--ttl-tx3',
  '--ttl-blue',
  '--ttl-green',
  '--ttl-red',
  '--ttl-amber',
  '--dsw-alias-label-primary',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-border-l1',
  '--dsh-font-family-code-default',
  '--dsw-font-family',
]

async function collectCssVars(page) {
  return page.evaluate((names) => {
    const root = getComputedStyle(document.documentElement)
    const panel = document.querySelector('[class*=Dv5QdW_panel]')
    const panelStyle = panel === null ? null : getComputedStyle(panel)
    const out = {}
    for (const name of names) {
      out[name] = panelStyle === null ? root.getPropertyValue(name).trim() : (panelStyle.getPropertyValue(name).trim() || root.getPropertyValue(name).trim())
    }
    return out
  }, CSS_VARS)
}

/** Filter chips (`全部 763`, `失败 16`, …) as label/count pairs. */
async function collectChips(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="ttl-chips"] .ttl-chip')].map((chip) => {
      const labelEl = chip.querySelector('.ttl-chipLabel')
        || [...chip.querySelectorAll('span')].find((el) => (el.textContent ?? '').trim().length > 0)
      const countEl = chip.querySelector('.ttl-chipCount, .ttl-chipNum')
      return {
        label: (labelEl?.textContent ?? '').trim(),
        count: (countEl?.textContent ?? '').trim(),
        pressed: chip.getAttribute('aria-pressed'),
      }
    }))
}

/** Parallel badges + groups currently rendered. */
async function collectParallel(page) {
  return page.evaluate(() => ({
    badges: [...document.querySelectorAll('[data-testid="ttl-turn-parallel"]')].map((el) => ({
      text: (el.textContent ?? '').trim(),
      title: el.getAttribute('title'),
      ariaLabel: el.getAttribute('aria-label'),
    })),
    groups: [...document.querySelectorAll('[data-testid="ttl-parallel-group"]')].map((el) => ({
      text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200),
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
    })),
  }))
}

/** Real `mcp__*` rows: robust across the v0.8 `mcp:server` label and the
 *  v0.9 `server` label + `ttl-tone-mcp` icon. */
async function collectMcpRows(page) {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('[data-testid="ttl-step"]')].filter((row) => {
      const name = (row.querySelector('.ttl-rowName, .ttl-stepName')?.textContent ?? '').trim()
      const iconCls = String(row.querySelector('.ttl-stepIcon, .ttl-rowIcon')?.className ?? '')
      return name.startsWith('mcp:') || iconCls.includes('ttl-tone-mcp')
    })
    return rows.slice(0, 8).map((row) => ({
      name: (row.querySelector('.ttl-rowName, .ttl-stepName')?.textContent ?? '').trim(),
      args: (row.querySelector('.ttl-rowArgs, .ttl-stepDesc')?.textContent ?? '').trim().slice(0, 120),
      kind: row.getAttribute('data-step-kind'),
      title: row.getAttribute('title'),
    }))
  })
}

/** Per-turn summary rows (tag / step count / parallel badge / collapsed). */
async function collectTurns(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="ttl-turn"]')].map((el) => {
      const rect = el.getBoundingClientRect()
      return {
        tag: (el.querySelector('[data-testid="ttl-turn-tag"]')?.textContent ?? '').trim(),
        steps: (el.querySelector('[data-testid="ttl-steps-count"]')?.textContent ?? '').trim(),
        parallel: (el.querySelector('[data-testid="ttl-turn-parallel"]')?.textContent ?? '').trim() || null,
        parallelTitle: el.querySelector('[data-testid="ttl-turn-parallel"]')?.getAttribute('title') ?? null,
        collapsed: el.getAttribute('data-collapsed'),
        height: Math.round(rect.height),
      }
    }))
}

/** Counts + scroll state of the trail list (used to prove folded/expanded). */
async function collectListState(page) {
  return page.evaluate(() => {
    const list = document.querySelector('[data-testid="ttl-list"]')
    const root = document.querySelector('[data-testid="ttl-root"]')
    const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
    return {
      turnCount: document.querySelectorAll('[data-testid="ttl-turn"]').length,
      stepRowCount: document.querySelectorAll('[data-testid="ttl-step"]').length,
      expandedTurnCount: document.querySelectorAll('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]').length,
      listRect: list === null ? null : r(list),
      rootRect: root === null ? null : r(root),
      listScrollTop: list === null ? null : Math.round(list.scrollTop),
      listScrollHeight: list === null ? null : Math.round(list.scrollHeight),
      listClientHeight: list === null ? null : Math.round(list.clientHeight),
      followPaused: document.querySelector('[data-testid="ttl-to-bottom"]') !== null,
      countLabel: (document.querySelector('[data-testid="ttl-count"]')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      chips: [...document.querySelectorAll('[data-testid="ttl-chips"] .ttl-chip')].length,
    }
  })
}

/** Text snippets that make the frames self-describing in metrics.json. */
async function collectTexts(page) {
  return page.evaluate(() => {
    const txt = (sel) => (document.querySelector(sel)?.textContent ?? '').replace(/\s+/g, ' ').trim()
    return {
      tabLabels: [...document.querySelectorAll('[class*=_tab_6nhg2]')].map((el) => (el.textContent ?? '').trim()).slice(0, 8),
      guideEntries: [...document.querySelectorAll('button.F6Huca_entry')].map((el) => (el.textContent ?? '').trim().slice(0, 20)),
      tabBarButtons: [...(document.querySelector('[class*=_tabHostHeader_]')?.querySelectorAll('button') ?? [])].map((b) => ({
        text: (b.textContent ?? '').trim().slice(0, 16),
        ariaLabel: b.getAttribute('aria-label'),
        cls: String(b.className).slice(0, 48),
      })),
      headerTitle: txt('.ttl-title'),
      chatHeader: txt('[class*=_titleRow] h1, [class*=sessionTitle]'),
    }
  })
}

/**
 * The extra DOM metrics requested for the v0.9 frame comparison: root/header/
 * step-row/detail geometry, detail-name + code typography, tab colours,
 * parallel-group indent and the background colours of the surface layers.
 */
async function collectRedesignMetrics(page) {
  return page.evaluate(() => {
    const r = (el) => { if (el === null || el === undefined) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
    const style = (el, props) => {
      if (el === null || el === undefined) return null
      const cs = getComputedStyle(el)
      const out = {}
      for (const prop of props) out[prop] = cs[prop]
      return out
    }
    const root = document.querySelector('[data-testid="ttl-root"]')
    const header = document.querySelector('.ttl-header')
    const list = document.querySelector('[data-testid="ttl-list"]')
    const steps = [...document.querySelectorAll('[data-testid="ttl-step"]')]
    const heights = steps.map((el) => Math.round(el.getBoundingClientRect().height))
    const mostCommon = (values) => {
      const counts = new Map()
      for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    }
    const detail = document.querySelector('[data-testid="ttl-detail"]')
    const detailName = document.querySelector('.ttl-detailName')
    const codeText = document.querySelector('.ttl-codeText')
    const code = document.querySelector('.ttl-code')
    const tabs = [...document.querySelectorAll('.ttl-tab, .ttl-dtab')].map((el) => ({
      text: (el.textContent ?? '').trim(),
      selected: el.getAttribute('aria-selected') === 'true' || el.classList.contains('ttl-tabSelected') || el.classList.contains('ttl-dtabSelected'),
      rect: r(el),
      style: style(el, ['color', 'backgroundColor', 'borderTopColor', 'fontSize', 'fontWeight', 'borderRadius', 'padding']),
    }))
    const parallel = document.querySelector('[data-testid="ttl-parallel-group"]')
    const turnBody = parallel === null ? null : parallel.parentElement
    const normalRow = turnBody === null ? null : turnBody.querySelector('[data-testid="ttl-step"]')
    const parallelRows = [...(turnBody?.querySelectorAll('[data-testid="ttl-step"]') ?? [])]
      .filter((row) => parallel !== null && parallel.contains(row))
    const delta = (a, b) => (a === null || b === null ? null : Math.round(a - b))
    const left = (el) => (el === null ? null : Math.round(el.getBoundingClientRect().left))
    return {
      root: {
        rect: r(root),
        style: style(root, ['backgroundColor', 'color', 'borderTopColor', 'borderRadius', 'fontFamily', 'fontSize']),
      },
      header: {
        rect: r(header),
        style: style(header, ['backgroundColor', 'borderTopColor', 'padding', 'gap']),
      },
      list: {
        rect: r(list),
        style: style(list, ['backgroundColor', 'padding', 'overflowY']),
      },
      stepRow: {
        count: steps.length,
        heightPx: mostCommon(heights),
        heightsSample: heights.slice(0, 8),
        style: style(steps[0] ?? null, ['fontFamily', 'fontSize', 'lineHeight', 'color', 'backgroundColor', 'borderRadius', 'padding', 'height']),
        nameStyle: style(document.querySelector('.ttl-stepName, .ttl-rowName'), ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color']),
        descStyle: style(document.querySelector('.ttl-stepDesc, .ttl-rowArgs'), ['fontFamily', 'fontSize', 'lineHeight', 'color']),
      },
      detail: {
        rect: r(detail),
        style: style(detail, ['backgroundColor', 'borderTopColor', 'borderRadius', 'padding', 'fontFamily']),
        nameStyle: style(detailName, ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'letterSpacing']),
        descStyle: style(document.querySelector('.ttl-detailDesc'), ['fontFamily', 'fontSize', 'lineHeight', 'color']),
        metaText: (document.querySelector('.ttl-detailMeta')?.textContent ?? '').replace(/\s+/g, ' ').trim() || null,
      },
      code: {
        rect: r(code),
        style: style(code, ['backgroundColor', 'borderTopColor', 'borderRadius', 'padding']),
        textStyle: style(codeText, ['fontFamily', 'fontSize', 'lineHeight', 'color', 'letterSpacing']),
        lineCount: document.querySelectorAll('.ttl-codeLine').length,
      },
      tabs,
      parallel: {
        rect: r(parallel),
        headPadding: style(document.querySelector('.ttl-parallelHead'), ['padding', 'paddingLeft', 'marginLeft']),
        bodyPadding: style(document.querySelector('.ttl-parallelBody'), ['padding', 'paddingLeft', 'marginLeft']),
        indentPx: delta(left(parallel), left(normalRow)),
        firstParallelRowIndentPx: delta(left(parallelRows[0] ?? null), left(normalRow)),
        expectedIndentPx: 0,
        groups: document.querySelectorAll('[data-testid="ttl-parallel-group"]').length,
      },
      turnHeight: (() => {
        const list = [...document.querySelectorAll('[data-testid="ttl-turn"]')]
        return {
          count: list.length,
          heightsSample: list.slice(0, 6).map((el) => Math.round(el.getBoundingClientRect().height)),
          collapsedCount: list.filter((el) => el.getAttribute('data-collapsed') === 'true').length,
        }
      })(),
      stepIcon: (() => {
        const wrapper = document.querySelector('.ttl-stepIcon')
        const svg = document.querySelector('.ttl-stepIcon svg')
        const wb = wrapper?.getBoundingClientRect()
        const sb = svg?.getBoundingClientRect()
        return {
          wrapperRect: wb ? [Math.round(wb.width), Math.round(wb.height)] : null,
          svgRect: sb ? [Math.round(sb.width), Math.round(sb.height)] : null,
          svgAttrs: svg ? { width: svg.getAttribute('width'), height: svg.getAttribute('height'), viewBox: svg.getAttribute('viewBox') } : null,
          expectedCssPx: 16,
        }
      })(),
      locateBtn: (() => {
        const btn = document.querySelector('[data-testid="ttl-locate"]')
        if (btn === null) return null
        const cs = getComputedStyle(btn)
        return { opacity: cs.opacity, visibility: cs.visibility, rect: r(btn), expectedInitialOpacity: 0, expectedHoverOpacity: 1 }
      })(),
      section: (() => {
        const section = document.querySelector('.ttl-section')
        return section === null ? null : { display: getComputedStyle(section).display, rect: r(section), expectedDisplay: 'block' }
      })(),
      kvKey: (() => {
        const key = document.querySelector('.ttl-kvKey')
        if (key === null) return null
        return {
          rect: r(key),
          widthPx: Math.round(key.getBoundingClientRect().width),
          style: style(key, ['width', 'minWidth', 'fontSize', 'color', 'whiteSpace', 'overflow', 'textOverflow']),
        }
      })(),
      detailWidthExpectedPx: 372,
      filters: (() => {
        const box = document.querySelector('[data-testid="ttl-chips"]')
        if (box === null) return null
        const cs = getComputedStyle(box)
        return {
          rect: r(box),
          scrollWidth: box.scrollWidth,
          clientWidth: box.clientWidth,
          overflowX: cs.overflowX,
          fits: box.scrollWidth <= box.clientWidth,
          chips: [...box.querySelectorAll('.ttl-chip')].map((chip) => ({
            text: (chip.textContent ?? '').replace(/\s+/g, ' ').trim(),
            cls: String(chip.className).slice(0, 48),
          })),
          toolChipCount: [...box.querySelectorAll('.ttl-chip')].filter((chip) => !chip.classList.contains('ttl-moreChip') && !/全部|失败/.test(chip.textContent ?? '')).length,
        }
      })(),
      codeFoot: (() => {
        const foot = document.querySelector('.ttl-codeFoot')
        if (foot === null) return null
        const cs = getComputedStyle(foot)
        const kids = [...foot.children].map((el) => ({
          text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
          cls: String(el.className).slice(0, 40),
          rect: r(el),
        }))
        const fb = foot.getBoundingClientRect()
        const leftKid = kids[0] ?? null
        const rightKid = kids.length > 1 ? kids[kids.length - 1] : null
        return {
          rect: r(foot),
          display: cs.display,
          justifyContent: cs.justifyContent,
          alignItems: cs.alignItems,
          children: kids,
          leftChildAtLeftEdge: leftKid !== null && leftKid.rect[0] - Math.round(fb.x) <= 4,
          rightChildAtRightEdge: rightKid !== null && Math.round(fb.right) - (rightKid.rect[0] + rightKid.rect[2]) <= 4,
          leftRightDistributed: leftKid !== null && rightKid !== null
            && leftKid.rect[0] + leftKid.rect[2] < Math.round(fb.x + fb.width / 2)
            && rightKid.rect[0] > Math.round(fb.x + fb.width / 2),
        }
      })(),
      toBottom: (() => {
        const pill = document.querySelector('[data-testid="ttl-to-bottom"]')
        const bar = document.querySelector('[data-testid="ttl-statusbar"], [class*="ttl-statusBar"], [class*="ttl-statusbar"]')
        const list = document.querySelector('[data-testid="ttl-list"]')
        const overlap = (a, b) => {
          const left = Math.max(a.left, b.left)
          const right = Math.min(a.right, b.right)
          const top = Math.max(a.top, b.top)
          const bottom = Math.min(a.bottom, b.bottom)
          return { width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
        }
        let overlapsListContent = null
        let probe = null
        if (pill !== null && list !== null) {
          const lb = list.getBoundingClientRect()
          const pb = pill.getBoundingClientRect()
          const inter = overlap(lb, pb)
          overlapsListContent = inter.width > 0 && inter.height > 0
          // Probe the centre of the bottom-most text line that is fully inside the list.
          const textEls = [...list.querySelectorAll('[data-testid="ttl-step"] .ttl-stepDesc, [data-testid="ttl-step"] .ttl-rowArgs, .ttl-turnPreview, .ttl-turnFoot, [data-testid="ttl-step"]')]
          const inList = textEls.filter((el) => {
            const b = el.getBoundingClientRect()
            return b.width > 0 && b.height > 0 && b.top >= lb.top - 1 && b.bottom <= lb.bottom + 1
          })
          const lastText = inList[inList.length - 1]
          // Fallback when the inline band fills the list viewport: probe the
          // centre of the bottom-most content line of the list itself.
          const x = lastText !== undefined
            ? Math.round(lastText.getBoundingClientRect().x + lastText.getBoundingClientRect().width / 2)
            : Math.round(lb.x + lb.width / 2)
          const y = lastText !== undefined
            ? Math.round(lastText.getBoundingClientRect().y + lastText.getBoundingClientRect().height / 2)
            : Math.round(lb.bottom - 8)
          const el = document.elementFromPoint(x, y)
          probe = {
            point: [x, y],
            probeKind: lastText !== undefined ? 'bottom-visible-text-line' : 'list-bottom-8px',
            text: lastText === undefined ? null : (lastText.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 50),
            hitTag: el === null ? null : el.tagName,
            hitTestId: el === null ? null : el.getAttribute('data-testid'),
            hitClass: el === null ? null : String(el.className).slice(0, 60),
            insideToBottom: el !== null && (pill === el || pill.contains(el)),
            insideStatusbar: el !== null && (bar !== null && (bar === el || bar.contains(el))),
            insideList: el !== null && (list === el || list.contains(el)),
            insideText: el !== null && (lastText !== undefined && (lastText === el || lastText.contains(el))),
          }
        }
        return {
          exists: pill !== null,
          pillRect: r(pill),
          pillText: (pill?.textContent ?? '').replace(/\s+/g, ' ').trim() || null,
          parentTag: pill?.parentElement?.tagName ?? null,
          parentClass: pill?.parentElement === null || pill?.parentElement === undefined ? null : String(pill.parentElement.className),
          parentTestId: pill?.parentElement?.getAttribute('data-testid') ?? null,
          statusbarRect: r(bar),
          statusbarClass: bar === null ? null : String(bar.className),
          overlapsListContent,
          coversContent: probe === null ? null : (probe.insideToBottom === true || probe.insideStatusbar === true),
          elementFromPoint: probe,
          expectedParentClass: 'ttl-statusbar',
        }
      })(),
      expandedInputRow: (() => {
        const el = document.querySelector('[data-testid="ttl-item-input"]')
        return {
          exists: el !== null,
          display: el === null ? null : getComputedStyle(el).display,
          visibility: el === null ? null : getComputedStyle(el).visibility,
          expectedDisplay: 'none',
        }
      })(),
      codeCap: (() => {
        const toggle = document.querySelector('[data-testid="ttl-code-toggle"]')
        return {
          renderedLines: document.querySelectorAll('.ttl-codeLine').length,
          expectedCap: 12,
          toggleText: (toggle?.textContent ?? '').replace(/\s+/g, ' ').trim() || null,
          toggleRect: r(toggle),
        }
      })(),
      surfaces: {
        panelBackground: style(document.querySelector('[class*=Dv5QdW_panel]'), ['backgroundColor']),
        tabBodyBackground: style(document.querySelector('[class*=_tabHostBody_]'), ['backgroundColor']),
        turnBackground: style(document.querySelector('[data-testid="ttl-turn"]'), ['backgroundColor', 'borderTopColor']),
        detailBackground: style(detail, ['backgroundColor']),
        codeBackground: style(code, ['backgroundColor']),
        chipBackground: style(document.querySelector('.ttl-chip'), ['backgroundColor', 'borderTopColor', 'color']),
      },
    }
  })
}

// ── flow steps ─────────────────────────────────────────────────────────────
async function openLongSession(page) {
  const row = page.locator('.JoiKIa_sessionRow', { hasText: SESSION_TITLE })
  await row.waitFor({ state: 'visible', timeout: 30000 })
  await row.first().click()
  await sleep(page, 5000)
}

async function ensureRightSidebar(page) {
  const openButton = page.getByRole('button', { name: '打开右侧边栏' })
  if (await openButton.count() > 0 && await openButton.first().isVisible().catch(() => false)) {
    await openButton.first().click()
    await sleep(page, 1200)
  }
  await page.waitForSelector('[class*=Dv5QdW_panel]', { timeout: 20000 })
}

/** Drag the dock divider so the right panel is `target` CSS px wide.
 *  Measured behaviour: panel.left follows the pointer x exactly; min 300,
 *  max = viewportWidth - 680; default = 45% of viewport. */
async function resizeDock(page, target) {
  const panel = page.locator('[class*=Dv5QdW_panel]').first()
  const handle = page.locator('.PIRFFq_handle').last()
  await handle.waitFor({ state: 'visible', timeout: 10000 })
  const hb = await handle.boundingBox()
  const pb = await panel.boundingBox()
  const viewport = page.viewportSize()
  const startX = hb.x + hb.width / 2
  const y = Math.max(40, Math.round(viewport.height / 3))
  const targetX = viewport.width - target
  const dx = targetX - startX
  await page.mouse.move(startX, y)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) await page.mouse.move(startX + (dx * i) / 12, y)
  await page.mouse.up()
  await sleep(page, 500)
  const after = await panel.boundingBox()
  return {
    before: [Math.round(pb.x), Math.round(pb.width)],
    after: [Math.round(after.x), Math.round(after.width)],
    style: await panel.getAttribute('style'),
    cssVar: await panel.evaluate((el) => el.style.getPropertyValue('--dsh-sidebar-width')),
    handle: { cls: await handle.getAttribute('class'), width: Math.round(hb.width) },
  }
}

async function openTrailTab(page) {
  const existing = page.locator('[class*=_tab_6nhg2]', { hasText: '轮次轨迹' })
  if (await existing.count() > 0) {
    await existing.first().click()
    await sleep(page, 1000)
    return { path: 'existing-tab' }
  }
  let addPath = 'guide-card'
  const addTab = page.getByRole('button', { name: '新标签页' })
  if (await addTab.count() > 0 && await addTab.first().isVisible().catch(() => false)) {
    await addTab.first().click()
    await sleep(page, 1000)
    addPath = 'plus-menu'
  }
  const entry = page.locator('button.F6Huca_entry', { hasText: '轮次轨迹' })
  if (await entry.count() === 0) {
    const fallback = page.locator('button[title="轮次轨迹"], .nArs4W_paneCard', { hasText: '轮次轨迹' })
    await fallback.first().click()
  } else {
    await entry.first().click()
  }
  await sleep(page, 2000)
  return { path: addPath }
}

async function waitTrailReady(page) {
  await page.waitForSelector('[data-testid="ttl-root"]', { timeout: 30000 })
  await page.waitForSelector('[data-testid="ttl-list"]', { timeout: 30000 })
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="ttl-turn"]').length >= 5,
    null,
    { timeout: 90000 },
  )
  await sleep(page, 2500)
}

async function collapseAllTurns(page) {
  for (let guard = 0; guard < 60; guard += 1) {
    const expanded = page.locator('[data-testid="ttl-turn"] .ttl-turnToggle[aria-expanded="true"]')
    if (await expanded.count() === 0) break
    await expanded.first().click()
    await sleep(page, 120)
  }
  await page.evaluate(() => { const list = document.querySelector('[data-testid="ttl-list"]'); if (list !== null) list.scrollTop = 0 })
  await sleep(page, 600)
}

async function expandTurn(page, turnTag) {
  const turn = page.locator('[data-testid="ttl-turn"]').filter({ hasText: turnTag })
  await turn.first().waitFor({ state: 'visible', timeout: 15000 })
  const toggle = turn.first().locator('.ttl-turnToggle')
  if (await toggle.getAttribute('aria-expanded') !== 'true') {
    await toggle.click()
    await sleep(page, 1500)
  }
  await page.evaluate(() => { const list = document.querySelector('[data-testid="ttl-list"]'); if (list !== null) list.scrollTop = list.scrollHeight })
  await sleep(page, 800)
}

/** Open the inline detail band of the row whose text contains `rowText`.
 *  v0.8: switch to the 参数 tab and unfold the long-value block.
 *  v0.9: the default 摘要 pane already renders the segmented long command. */
async function openStepDetail(page, rowText) {
  const row = page.locator('[data-testid="ttl-step"]', { hasText: rowText })
  await row.first().waitFor({ state: 'visible', timeout: 20000 })
  await row.first().scrollIntoViewIfNeeded()
  await row.first().click()
  await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 20000 })
  await sleep(page, 2500)
  let pane = 'default'
  const summaryTab = page.locator('[data-testid="ttl-detail-tab-summary"]')
  const paramsTab = page.locator('[data-testid="ttl-dtab-params"]')
  if (await summaryTab.count() > 0) {
    pane = 'summary'
  } else if (await paramsTab.count() > 0) {
    await paramsTab.first().click()
    pane = 'params'
    await sleep(page, 1000)
  }
  const longToggle = page.locator('[data-testid="ttl-json-long-toggle"]')
  if (await longToggle.count() > 0) {
    const open = await longToggle.first().evaluate((el) => el.getAttribute('aria-expanded'))
    if (open !== 'true') { await longToggle.first().click(); await sleep(page, 800) }
  }
  await page.evaluate(() => {
    const band = document.querySelector('[data-testid="ttl-detail"]')
    if (band !== null) band.scrollIntoView({ block: 'start' })
  })
  await sleep(page, 600)
  return pane
}

async function collectDetailMetrics(page) {
  return page.evaluate(() => {
    const r = (el) => { if (el === null) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
    const band = document.querySelector('[data-testid="ttl-detail"]')
    const body = document.querySelector('[data-testid^="ttl-detail-body-"], .ttl-detailBody')
    const restored = document.querySelector('[data-testid="ttl-json-long-body"]')
    const foot = document.querySelector('.ttl-detailFoot, [data-testid="ttl-detail-foot"]')
    const seq = document.querySelector('[data-testid="ttl-detail-seq"], [data-testid="ttl-detail-foot-seq"]')
    return {
      rect: r(band),
      bandClass: band === null ? null : band.getAttribute('class'),
      dataTab: band === null ? null : band.getAttribute('data-tab'),
      bodyRect: r(body),
      seq: (seq?.textContent ?? '').trim(),
      tabs: [...(band?.querySelectorAll('[role=tab]') ?? [])].map((el) => ({
        text: (el.textContent ?? '').trim(),
        testid: el.getAttribute('data-testid'),
        selected: el.getAttribute('aria-selected'),
      })),
      footText: (foot?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      metaText: (document.querySelector('.ttl-detailMeta')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      longValue: {
        meta: (document.querySelector('[data-testid="ttl-json-long-meta"]')?.textContent ?? '').trim() || null,
        expanded: restored !== null,
        chars: restored === null ? null : restored.textContent.length,
        lines: restored === null ? null : restored.textContent.split('\n').length,
        height: restored === null ? null : Math.round(restored.getBoundingClientRect().height),
      },
      jsonLineCount: document.querySelectorAll('.ttl-jpLine').length,
      codeLineCount: document.querySelectorAll('.ttl-codeLine').length,
      rawCount: document.querySelectorAll('[data-testid="ttl-md-raw"]').length,
      kvCount: document.querySelectorAll('.ttl-kvRow').length,
    }
  })
}

async function collectZoomMetrics(page) {
  return page.evaluate(() => {
    const r = (el) => { if (el === null) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] }
    const active = document.querySelector('[data-testid^="ttl-zoom-tab-"][aria-selected="true"]')
    const head = document.querySelector('[data-testid="ttl-zoom-head"], .ttl-zoomHead')
    const headButtons = [...(head?.querySelectorAll('button') ?? [])].map((el) => {
      const b = el.getBoundingClientRect()
      return {
        text: (el.textContent ?? '').trim(),
        rect: r(el),
        writingMode: getComputedStyle(el).writingMode,
        transform: getComputedStyle(el).transform,
        vertical: b.height > b.width * 2 && (el.textContent ?? '').trim().length > 1,
      }
    })
    const verticalTexts = [...document.querySelectorAll('[data-testid="ttl-zoom"] *')]
      .filter((el) => {
        const b = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        if (el.children.length > 0) return false
        if ((el.textContent ?? '').trim().length === 0) return false
        return cs.writingMode === 'vertical-rl' || cs.writingMode === 'vertical-lr' || b.height > b.width * 2.5
      })
      .map((el) => ({ text: (el.textContent ?? '').trim().slice(0, 30), rect: r(el), writingMode: getComputedStyle(el).writingMode, transform: getComputedStyle(el).transform }))
    return {
      rootRect: r(document.querySelector('[data-testid="ttl-zoom"]')),
      panelRect: r(document.querySelector('[data-testid="ttl-zoom-panel"]')),
      title: (document.querySelector('[data-testid="ttl-zoom-title"]')?.textContent ?? '').trim(),
      seq: (document.querySelector('[data-testid="ttl-zoom-seq"]')?.textContent ?? '').trim(),
      outlineRows: document.querySelectorAll('.ttl-zoomOutlineRow').length,
      activeTab: (active?.textContent ?? '').trim(),
      footText: (document.querySelector('.ttl-zoomFoot')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      panelSize: (() => { const b = document.querySelector('[data-testid="ttl-zoom-panel"]')?.getBoundingClientRect(); return b ? { width: Math.round(b.width), height: Math.round(b.height) } : null })(),
      expectedSize: { width: 1280, height: 800, tolerancePx: 2 },
      fitsInViewport: (() => {
        const b = document.querySelector('[data-testid="ttl-zoom-panel"]')?.getBoundingClientRect()
        if (!b) return null
        return b.left >= 0 && b.top >= 0 && b.right <= window.innerWidth && b.bottom <= window.innerHeight
      })(),
      zoomHead: {
        rect: r(head),
        testid: head?.getAttribute('data-testid') ?? null,
        buttons: headButtons,
        verticalTexts: verticalTexts.slice(0, 8),
        hasHorizontalCopyCommand: headButtons.some((b) => /复制命令/.test(b.text) && b.vertical === false),
        hasVerticalCopyCommand: verticalTexts.some((t) => /复制命令/.test(t.text)) || headButtons.some((b) => /复制命令/.test(b.text) && b.vertical === true),
      },
    }
  })
}

/** Detect which UI generation the served build renders. */
async function detectUiVariant(page) {
  return page.evaluate(() => {
    if (document.querySelector('[data-testid="ttl-detail-tab-summary"]') !== null) return 'v0.9-redesign'
    if (document.querySelector('.ttl-stepDesc') !== null) return 'v0.9-redesign'
    if (document.querySelector('[data-testid="ttl-dtab-params"], .ttl-rowName, .ttl-turnRow') !== null) return 'v0.8-shipped'
    return 'unknown'
  })
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const consoleErrors = []
  const chromium = await loadPlaywright()
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: ['--disable-blink-features=AutomationControlled'],
  })
  log('browser:', await browser.version())

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 240))
  })
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${String(error).slice(0, 240)}`))

  const shots = []
  const elementShots = []
  /** Park the pointer at the viewport corner so no :hover state leaks into a frame. */
  const parkMouse = async () => {
    await page.mouse.move(2, 2).catch(() => {})
    await sleep(page, 250)
  }
  const shot = async (name, options = {}) => {
    if (options.keepHover !== true) await parkMouse()
    const file = path.join(OUT_DIR, name)
    await page.screenshot({ path: file, fullPage: false, animations: 'disabled' })
    shots.push(file)
    log('shot', name)
  }
  /** Element-only frame (deviceScaleFactor applies), for 400px prototype diffs. */
  const elementShot = async (selector, name, options = {}) => {
    if (options.keepHover !== true) await parkMouse()
    const file = path.join(OUT_DIR, name)
    try {
      const locator = page.locator(selector).first()
      await locator.waitFor({ state: 'visible', timeout: 8000 })
      await locator.screenshot({ path: file, animations: 'disabled' })
      elementShots.push(file)
      log('element shot', name)
    } catch (error) {
      log('element shot skipped:', name, String(error).split('\n')[0])
    }
  }

  try {
    await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await sleep(page, 3500)
    const htmlLang = await page.evaluate(() => document.documentElement.lang)
    const navigatorLanguage = await page.evaluate(() => navigator.language)
    log('page loaded, lang =', htmlLang)

    await openLongSession(page)
    await ensureRightSidebar(page)
    const dock = await resizeDock(page, DOCK_TARGET)
    log('dock:', dock.after[1], 'px')
    const tab = await openTrailTab(page)
    await waitTrailReady(page)
    const uiVariant = await detectUiVariant(page)
    log('ui variant:', uiVariant, '| tab via', tab.path)

    // ── 01 folded list ────────────────────────────────────────────────────
    await collapseAllTurns(page)
    const stateCollapsed = await collectListState(page)
    const turnsCollapsed = await collectTurns(page)
    await shot('01-collapsed.png')
    await elementShot('[data-testid="ttl-root"]', 'panel-01-collapsed.png')
    // element-style top clip: header + search + chips + overview + first two turn cards
    const rootBox = await page.locator('[data-testid="ttl-root"]').first().boundingBox()
    if (rootBox !== null) {
      const topPath = path.join(OUT_DIR, 'panel-01-top.png')
      await page.screenshot({
        path: topPath,
        clip: { x: rootBox.x, y: rootBox.y, width: rootBox.width, height: Math.min(500, rootBox.height) },
        animations: 'disabled',
      })
      elementShots.push(topPath)
      log('element shot panel-01-top.png')
      // chips close-up: search + chips + overview band only
      const searchBox = await page.locator('.ttl-searchRow').first().boundingBox()
      const summaryBox = await page.locator('.ttl-summary').first().boundingBox()
      if (searchBox !== null && summaryBox !== null) {
        const chipsPath = path.join(OUT_DIR, 'panel-01-chips.png')
        await page.screenshot({
          path: chipsPath,
          clip: {
            x: rootBox.x,
            y: searchBox.y,
            width: rootBox.width,
            height: Math.round(summaryBox.y + summaryBox.height - searchBox.y),
          },
          animations: 'disabled',
        })
        elementShots.push(chipsPath)
        log('element shot panel-01-chips.png')
      }
    }

    // ── 02 expanded turn with a ∥ badge (last one → the recorded turn 11) ─
    const turns = await collectTurns(page)
    const targetTurn = [...turns].reverse().find((turn) => turn.parallel !== null)
      ?? turns[turns.length - 1]
    await expandTurn(page, targetTurn.tag)
    const stateExpanded = await collectListState(page)
    const parallel = await collectParallel(page)
    const mcpRows = await collectMcpRows(page)
    await shot('02-expanded-parallel.png')
    await elementShot('[data-testid="ttl-root"]', 'panel-02-expanded.png')
    const expandedProbe = await page.evaluate(() => {
      const inputItem = document.querySelector('[data-testid="ttl-item-input"]')
      const toBottom = document.querySelector('[data-testid="ttl-to-bottom"]')
      return {
        inputItem: inputItem === null
          ? { exists: false, expectedDisplay: 'none' }
          : { exists: true, display: getComputedStyle(inputItem).display, visibility: getComputedStyle(inputItem).visibility, expectedDisplay: 'none' },
        toBottomExists: toBottom !== null,
        toBottomParentClass: toBottom?.parentElement === null || toBottom?.parentElement === undefined ? null : String(toBottom.parentElement.className),
      }
    })
    // hover a step row that is fully inside the list viewport: the row-level ↗
    // (ttl-stepJump, CSS display:none → inline-flex on .ttl-stepWrap:hover) appears;
    // the turn-head locate button (ttl-locateBtn, opacity 0) stays hidden.
    await page.mouse.move(600, 120)
    await sleep(page, 250)
    const hoverRowIndex = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const lb = list.getBoundingClientRect()
      const wraps = [...document.querySelectorAll('[data-testid="ttl-step-wrap"]')]
      return wraps.findIndex((wrap) => {
        const b = wrap.getBoundingClientRect()
        return b.top >= lb.top + 12 && b.bottom <= lb.bottom - 12
      })
    })
    let locateHovered = null
    if (hoverRowIndex >= 0) {
      const hoverWrap = page.locator('[data-testid="ttl-step-wrap"]').nth(hoverRowIndex)
      const jumpLocator = hoverWrap.locator('[data-testid="ttl-step-jump"]')
      const jumpInitial = await jumpLocator.evaluate((el) => ({ display: getComputedStyle(el).display, opacity: getComputedStyle(el).opacity })).catch(() => null)
      const locateInitial = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="ttl-locate"]')
        return btn === null ? null : { opacity: getComputedStyle(btn).opacity, display: getComputedStyle(btn).display }
      })
      const box = await hoverWrap.boundingBox()
      if (box !== null) {
        // raw mouse move instead of locator.hover(): the list auto-scrolls, so
        // Playwright's actionability wait can stall; a coordinate hover is exact.
        await page.mouse.move(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2))
        await sleep(page, 450)
      }
      const hoverState = await hoverWrap.evaluate((wrap) => {
        const jump = wrap.querySelector('[data-testid="ttl-step-jump"]')
        const row = wrap.querySelector('[data-testid="ttl-step"]')
        const jb = jump === null ? null : jump.getBoundingClientRect()
        return {
          jumpDisplay: jump === null ? null : getComputedStyle(jump).display,
          jumpOpacity: jump === null ? null : getComputedStyle(jump).opacity,
          rowText: (row?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 70),
          jumpRect: jb === null ? null : [Math.round(jb.x), Math.round(jb.y), Math.round(jb.width), Math.round(jb.height)],
          wrapHovered: wrap.matches(':hover'),
        }
      })
      await elementShot('[data-testid="ttl-root"]', 'panel-02-hover-step.png', { keepHover: true })
      locateHovered = { rowIndex: hoverRowIndex, jumpInitial, locateBtnInitial: locateInitial, ...hoverState }
      await page.mouse.move(600, 120)
      await sleep(page, 250)
    } else {
      log('no step row fully inside the list viewport for the hover frame')
    }
    log('expanded:', JSON.stringify({ turn: targetTurn.tag, rows: stateExpanded.stepRowCount, parallelGroups: parallel.groups.length, mcpRows: mcpRows.length, locateHovered }))

    // panel-02-header: turn head + first 6 step rows inside the list viewport
    const headerScroll = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const turn = document.querySelectorAll('[data-testid="ttl-turn"]')[document.querySelectorAll('[data-testid="ttl-turn"]').length - 1]
      if (list === null || turn === undefined) return null
      const lb = list.getBoundingClientRect()
      const tb = turn.getBoundingClientRect()
      list.scrollTop += (tb.top - lb.top) - 6
      return { turnTopBefore: Math.round(tb.top - lb.top) }
    })
    await sleep(page, 500)
    const headerFrame = await page.evaluate(() => {
      const list = document.querySelector('[data-testid="ttl-list"]')
      const turns = [...document.querySelectorAll('[data-testid="ttl-turn"]')]
      const turn = turns[turns.length - 1]
      const rows = [...turn.querySelectorAll('[data-testid="ttl-step"]')].slice(0, 6)
      const lb = list.getBoundingClientRect()
      const inside = (el) => { const b = el.getBoundingClientRect(); return b.top >= lb.top - 1 && b.bottom <= lb.bottom + 1 }
      return {
        turnHeadRect: (() => { const b = turn.querySelector('.ttl-turnHead')?.getBoundingClientRect(); return b ? [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] : null })(),
        turnRect: (() => { const b = turn.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] })(),
        firstSixRows: rows.map((row) => { const b = row.getBoundingClientRect(); return { text: (row.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 48), rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], inList: inside(row) } }),
        allFirstSixInList: rows.every(inside),
        listRect: [Math.round(lb.x), Math.round(lb.y), Math.round(lb.width), Math.round(lb.height)],
      }
    })
    await elementShot('[data-testid="ttl-root"]', 'panel-02-header.png')
    log('header frame:', JSON.stringify(headerFrame).slice(0, 400))

    // ── 03 inline detail band of a long bash step ─────────────────────────
    const pane = await openStepDetail(page, LONG_ROW_TEXT)
    const detail = await collectDetailMetrics(page)
    const redesign = await collectRedesignMetrics(page)
    const detailStyles = await collectStyles(page, {
      detail: STYLE_SELECTORS.detail,
      detailHead: STYLE_SELECTORS.detailHead,
      detailName: STYLE_SELECTORS.detailName,
      detailDesc: STYLE_SELECTORS.detailDesc,
      detailBar: STYLE_SELECTORS.detailBar,
      detailBody: STYLE_SELECTORS.detailBody,
      detailFoot: STYLE_SELECTORS.detailFoot,
      dtab: STYLE_SELECTORS.dtab,
      dtabSelected: STYLE_SELECTORS.dtabSelected,
      sectionLabel: STYLE_SELECTORS.sectionLabel,
      code: STYLE_SELECTORS.code,
      codeText: STYLE_SELECTORS.codeText,
      kvKey: STYLE_SELECTORS.kvKey,
      jpLong: STYLE_SELECTORS.jpLong,
      jpLongMeta: STYLE_SELECTORS.jpLongMeta,
      jpRestored: STYLE_SELECTORS.jpRestored,
      jsonKey: STYLE_SELECTORS.jsonKey,
    })
    await shot('03-detail-band.png')
    await elementShot('[data-testid="ttl-root"]', 'panel-03-detail.png')
    log('detail pane:', pane, '| seq:', detail.seq, '| rect:', JSON.stringify(detail.rect), '| longValue:', JSON.stringify(detail.longValue), '| codeLines:', detail.codeLineCount)

    // ── long-command cap (12 segments) + expanded frame ───────────────────
    let longCommand = null
    try {
      const readCap = () => page.evaluate(() => {
        const band = document.querySelector('[data-testid="ttl-detail"]')
        const toggle = document.querySelector('[data-testid="ttl-code-toggle"]')
        const foot = document.querySelector('.ttl-codeFoot')
        return {
          bandHeight: band === null ? null : Math.round(band.getBoundingClientRect().height),
          renderedLines: document.querySelectorAll('.ttl-codeLine').length,
          toggleText: (toggle?.textContent ?? '').replace(/\s+/g, ' ').trim() || null,
          footText: (foot?.textContent ?? '').replace(/\s+/g, ' ').trim() || null,
        }
      })
      const folded = await readCap()
      await elementShot('[data-testid="ttl-detail"]', 'panel-03-longcmd.png')
      const toggle = page.locator('[data-testid="ttl-code-toggle"]')
      let expanded = null
      if (await toggle.count() > 0) {
        await toggle.first().click()
        await sleep(page, 1200)
        expanded = await readCap()
        await page.evaluate(() => {
          const band = document.querySelector('[data-testid="ttl-detail"]')
          if (band !== null) band.scrollIntoView({ block: 'start' })
        })
        await sleep(page, 500)
        const detailBox = await page.locator('[data-testid="ttl-detail"]').first().boundingBox()
        const listBox = await page.locator('[data-testid="ttl-list"]').first().boundingBox()
        if (detailBox !== null && listBox !== null) {
          const expandedPath = path.join(OUT_DIR, 'panel-03-longcmd-expanded.png')
          const top = Math.max(detailBox.y, listBox.y)
          const height = Math.min(1200, listBox.y + listBox.height - top)
          await page.screenshot({
            path: expandedPath,
            clip: { x: Math.round(detailBox.x), y: Math.round(top), width: Math.round(detailBox.width), height: Math.round(height) },
            animations: 'disabled',
          })
          elementShots.push(expandedPath)
          log('element shot panel-03-longcmd-expanded.png')
        }
        // restore the folded state so the following frames match the others
        await toggle.first().click()
        await sleep(page, 800)
      }
      longCommand = { rowText: LONG_ROW_TEXT, folded, expanded }
      log('long command:', JSON.stringify(longCommand))
    } catch (error) {
      log('long-command cap frames skipped:', String(error).split('\n')[0])
      longCommand = { rowText: LONG_ROW_TEXT, error: String(error).split('\n')[0] }
    }

    // ── 04 full-size viewer overlay (⤢ / 在中央查看) ───────────────────────
    const zoomButton = page.locator('[data-testid="ttl-detail-zoom"], [data-testid="ttl-detail-view-center"]')
    await zoomButton.first().waitFor({ state: 'visible', timeout: 10000 })
    await zoomButton.first().click()
    await page.waitForSelector('[data-testid="ttl-zoom"]', { timeout: 15000 })
    await sleep(page, 1200)
    const zoom = await collectZoomMetrics(page)
    const zoomStyles = await collectStyles(page, {
      zoom: STYLE_SELECTORS.zoom,
      zoomPanel: STYLE_SELECTORS.zoomPanel,
      zoomTitle: STYLE_SELECTORS.zoomTitle,
      zoomOutline: STYLE_SELECTORS.zoomOutline,
      zoomFoot: STYLE_SELECTORS.zoomFoot,
      tabs: STYLE_SELECTORS.dtab,
      codeText: STYLE_SELECTORS.codeText,
    })
    await shot('04-zoom.png')
    await elementShot('[data-testid="ttl-zoom-panel"]', 'panel-04-zoomPanel.png')
    log('zoom:', JSON.stringify({ panel: zoom.panelRect, title: zoom.title }))
    await page.keyboard.press('Escape')
    await sleep(page, 600)

    // ── 05 (extra) real MCP step row + its detail band ────────────────────
    let mcpDetail = null
    let mcpRedesign = null
    if (mcpRows.length > 0) {
      const mcpName = mcpRows[0].name
      const mcpRow = page.locator('[data-testid="ttl-step"]').filter({ hasText: mcpName }).last()
      await mcpRow.scrollIntoViewIfNeeded()
      await mcpRow.click()
      await page.waitForSelector('[data-testid="ttl-detail"]', { timeout: 20000 })
      await sleep(page, 2000)
      mcpDetail = await collectDetailMetrics(page)
      mcpRedesign = await collectRedesignMetrics(page)
      await page.evaluate(() => {
        const band = document.querySelector('[data-testid="ttl-detail"]')
        if (band !== null) band.scrollIntoView({ block: 'start' })
      })
      await sleep(page, 600)
      await shot('05-mcp.png')
      await elementShot('[data-testid="ttl-root"]', 'panel-05-mcp.png')
      log('mcp detail:', JSON.stringify({ seq: mcpDetail.seq, name: mcpName }))
    } else {
      log('no rendered mcp__* row in the expanded turn — 05-mcp.png skipped')
    }

    // ── extra: detail band of a short, non-heredoc, multi-segment command ──
    // `cd … && pnpm install 2>&1 | tail -4 && echo … && pnpm build 2>&1 | tail -3`
    // (seq 519, turn 1 step 72) — 3 × && with two `| tail`, no heredoc.
    const COMMAND_ROW = 'Verify install and build succeed again'
    let extraCommand = null
    try {
      await collapseAllTurns(page)
      const turns2 = await collectTurns(page)
      const firstTurn = turns2[0]
      await expandTurn(page, firstTurn.tag)
      const pane2 = await openStepDetail(page, COMMAND_ROW)
      const detail2 = await collectDetailMetrics(page)
      const redesign2 = await collectRedesignMetrics(page)
      await elementShot('[data-testid="ttl-root"]', 'panel-03-command.png')
      extraCommand = {
        rowText: COMMAND_ROW,
        turnTag: firstTurn.tag,
        pane: pane2,
        detail: detail2,
        redesign: {
          detail: redesign2.detail,
          code: redesign2.code,
          section: redesign2.section,
          kvKey: redesign2.kvKey,
        },
      }
      log('extra command detail:', JSON.stringify({ pane: pane2, seq: detail2.seq, codeLines: detail2.codeLineCount }))
    } catch (error) {
      log('panel-03-command.png skipped:', String(error).split('\n')[0])
      extraCommand = { error: String(error).split('\n')[0], rowText: COMMAND_ROW }
    }

    // ── typography / colours ───────────────────────────────────────────────
    const styles = await collectStyles(page, STYLE_SELECTORS)
    const cssVars = await collectCssVars(page)
    const texts = await collectTexts(page)
    const srcFingerprint = treeFingerprint(SRC_DIR)
    const servedFingerprint = {
      libClient: { path: SERVED_LIB, sha256: sha256File(SERVED_LIB), bytes: (() => { try { return fs.statSync(SERVED_LIB).size } catch { return null } })() },
      libIndex: { path: path.join(path.dirname(SERVED_LIB), 'index.js'), sha256: sha256File(path.join(path.dirname(SERVED_LIB), 'index.js')) },
      src: { dir: SRC_DIR, ...(srcFingerprint ?? {}) },
    }

    const metrics = {
      meta: {
        script: 'scripts/verify/shoot.mjs',
        mode: MODE,
        generatedAt: new Date().toISOString(),
        url: URL_WITH_TOKEN.replace(/token=[^&]+/, 'token=***'),
        port: PORT,
        profile: PORT === 19488 ? 'trace-verify-v08 (served artifact /tmp/verify/repo-v08)' : 'trace-verify',
        dshHome: process.env.DSH_HOME ?? '(inherited)',
        sessionTitle: SESSION_TITLE,
        repo: REPO,
        gitHead: gitHead(),
        uiVariant,
        served: servedFingerprint,
      },
      browser: {
        engine: 'chromium (system Google Chrome via channel:chrome)',
        version: await browser.version(),
        headless: true,
        viewport: { width: 1440, height: 900, deviceScaleFactor: 2, screenshotPixels: [2880, 1800] },
        locale: { context: 'zh-CN', timezoneId: 'Asia/Shanghai', colorScheme: 'dark' },
        htmlLang,
        navigatorLanguage,
        chineseUi: /轮次轨迹|详情|参数|结果/.test(await page.evaluate(() => document.body.innerText.slice(0, 4000))),
      },
      session: {
        selected: SESSION_TITLE,
        id: await page.evaluate(() => {
          try { return JSON.parse(localStorage.getItem('dsh.sessions.current') ?? '{}').sessionId ?? null } catch { return null }
        }),
        countLabel: stateExpanded.countLabel,
        turns: turns.length,
        chips: await collectChips(page),
        tabLabels: texts.tabLabels,
      },
      dock: {
        measuredWidthPx: dock.after[1],
        defaultWidthPx: dock.before[1],
        defaultRule: 'default = 45% of viewport width (648 @ 1440)',
        minWidthPx: 300,
        maxWidthPx: 760,
        maxRule: 'max = viewportWidth - 680 (left sidebar 280 + chat min 400) → 760 @ 1440',
        targetWidthPx: DOCK_TARGET,
        cssVar: '--dsh-sidebar-width (mirrored as inline `width`)',
        inlineStyle: dock.style,
        cssVarValue: dock.cssVar,
        resizeHandle: { cls: dock.handle.cls, widthPx: dock.handle.width, cursor: 'col-resize' },
        dragResult: { beforeWidthPx: dock.before[1], afterWidthPx: dock.after[1] },
        persistedInLocalStorage: false,
        storageKeys: Object.keys(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))),
        note: 'DSH web app right dock (not better-sidebar): width is per page session; a reload resets it to 45%. The script drags the divider on every run so before/after stay comparable.',
      },
      betterSidebar: {
        plugin: 'dsh-better-sidebar@0.28.0',
        trailTabTitle: '轮次轨迹',
        howAdded: tab.path,
        treeWidth: {
          default: 240,
          min: 160,
          max: 480,
          appliesTo: '文件 tab 内部目录树 (tab meta treeWidth) — 与右侧轨迹面板宽度无关',
          source: '~/.dsh/profiles/trace-verify/node_modules/dsh-better-sidebar/lib/client.js (TREE_WIDTH_* / treeWidthOf)',
          persisted: 'better-sidebar tab meta, localStorage dsh.sidebar-right.v1.session-<sid>',
        },
      },
      screenshots: shots.map((file) => path.basename(file)),
      elementScreenshots: elementShots.map((file) => path.basename(file)),
      state: {
        collapsed: { ...stateCollapsed, turns: turnsCollapsed, assertion: 'every turn folded, no step rows mounted' },
        expanded: { turn: targetTurn.tag, parallel, list: stateExpanded, mcpRows },
        detail: { pane, ...detail, styles: detailStyles },
        zoom: { ...zoom, styles: zoomStyles },
        mcpDetail,
      },
      redesign,
      redesignMcp: mcpRedesign,
      extraCommand,
      longCommand,
      locateHovered,
      expandedProbe,
      typography: styles,
      colors: Object.fromEntries(Object.entries(styles).map(([key, value]) => [key, value === null ? null : {
        color: value.color,
        backgroundColor: value.backgroundColor,
        borderTopColor: value.borderTopColor,
      }])),
      cssVars,
      consoleErrors: consoleErrors.slice(0, 30),
    }
    const metricsPath = path.join(OUT_DIR, 'metrics.json')
    fs.writeFileSync(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`)
    log('metrics →', metricsPath)
    log('screenshots →', shots.map((file) => path.basename(file)).join(', '))
    log('element screenshots →', elementShots.map((file) => path.basename(file)).join(', '))
    log('done:', OUT_DIR)
  } catch (error) {
    const failure = path.join(OUT_DIR, 'error.png')
    await page.screenshot({ path: failure, fullPage: false }).catch(() => {})
    fs.writeFileSync(path.join(OUT_DIR, 'error.json'), `${JSON.stringify({
      when: new Date().toISOString(),
      mode: MODE,
      url: URL_WITH_TOKEN.replace(/token=[^&]+/, 'token=***'),
      error: String(error?.stack ?? error),
      consoleErrors: consoleErrors.slice(0, 40),
      shots,
    }, null, 2)}\n`)
    throw error
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

main().catch((error) => {
  console.error('\nshoot.mjs failed:', error?.message ?? error)
  process.exit(1)
})
