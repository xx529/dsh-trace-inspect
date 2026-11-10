#!/usr/bin/env node
/**
 * scripts/verify/auto-open-first-turn.mjs — live E2E acceptance for v0.11.0
 * 「首轮自动打开」(src/client/auto-open.ts + its 侧边卡片 switch).
 *
 * WHAT IT CHECKS (each item reported separately, exit code 2 if any fails):
 *   1. POSITIVE / time-correct — on a brand-new conversation the right column
 *      must stay CLOSED while the conversation has 0 turns, then the FIRST
 *      message must expand it with the 「轮次轨迹」 page active and
 *      `[data-testid="ttl-list"]` carrying ≥1 turn, WITHOUT the test ever
 *      clicking the sidebar toggle or the tab. A column that opens before the
 *      message is a PREMATURE open and fails the item; the attribution block
 *      records `expandedChangedByTheTurn`.
 *   2. NEGATIVE / history — a conversation that already has a turn must NOT
 *      auto-open. The script collapses the column, reloads with that session
 *      current, and asserts the trace-inspect page never appears for 6s.
 *   3. SETTING — 账号菜单 → 设置 → 侧边卡片 → 「轮次轨迹」→ 功能设置 renders the
 *      `首轮自动打开` switch AND, on a fresh home, it renders CHECKED (the
 *      renderless default panel materialises `autoOpenFirstTurn: true`).
 *   4. SWITCH OFF — turning that switch off must suppress the auto-open: a new
 *      conversation plus a first message must leave the column closed.
 *   5. NO console errors / pageerrors for the whole run.
 *
 * It drives a SEPARATE `dsh web` instance (never the Desktop app) and launches
 * nothing itself. Start the server first, then pass its log so the token can be
 * scraped from the `dsh web: http://127.0.0.1:<port>/?token=…` line:
 *
 *   # isolated home + the profile whose node_modules/dsh-trace-inspect is a
 *   # symlink to this checkout (so the already-built lib/client.js is live):
 *   mkdir -p /tmp/verify/dsh-home/profiles/trace-verify
 *   cp ~/.dsh/profiles/trace-verify/{package.json,cordis.patch.yml,cordis.yml,pnpm-workspace.yaml,pnpm-lock.yaml} \
 *      /tmp/verify/dsh-home/profiles/trace-verify/
 *   ln -sfn ~/.dsh/profiles/trace-verify/node_modules \
 *      /tmp/verify/dsh-home/profiles/trace-verify/node_modules
 *   cp ~/.dsh/.credentials.yaml /tmp/verify/dsh-home/.credentials.yaml   # only if the prompt is refused
 *   DSH_HOME=/tmp/verify/dsh-home dsh --profile trace-verify --no-open --port 19487 \
 *     > /tmp/verify/server.log 2>&1 &
 *   node scripts/verify/auto-open-first-turn.mjs --port 19487 --server-log /tmp/verify/server.log
 *
 * Flags: --port <n> --url <full token URL> --server-log <file> --out <dir>
 *        --message <text>   --keep-open (leave the browser open; off by default)
 *
 * Frames (1440×1000 @2x, dark, zh-CN): baseline.png, positive.png, negative.png,
 * settings.png, switch-off.png + metrics.json.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i !== -1 && argv[i + 1] !== undefined ? argv[i + 1] : fallback
}
const flag = (name) => argv.includes(`--${name}`)

const PORT = Number(arg('port', '19487'))
const OUT_DIR = path.resolve(arg('out', '/tmp/verify/autoopen'))
const SERVER_LOG = arg('server-log', '/tmp/verify/server.log')
/** Isolated DSH_HOME the server was started with (recorded, not used to boot). */
const HOME_DIR = arg('home', '/tmp/verify/dsh-home')
const MESSAGE = arg('message', '第一轮：只回一个词：好')
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
const REDACTED_URL = URL_WITH_TOKEN.replace(/token=[^&]+/, 'token=***')

/** The built client bundle under test (the profile symlinks this checkout). */
function builtBundle() {
  try {
    const file = path.resolve('lib/client.js')
    const buf = fs.readFileSync(file)
    return {
      file,
      size: buf.length,
      sha256: createHash('sha256').update(buf).digest('hex'),
      mtime: fs.statSync(file).mtime.toISOString(),
    }
  } catch {
    return null
  }
}

const PW = process.env.PLAYWRIGHT_CORE
  || path.join(process.env.HOME || '', '.dsh/mcp-servers/mobile-mcp/node_modules/playwright-core/index.mjs')
const { chromium } = await import(pathToFileURL(PW).href)

const T0 = Date.now()
const elapsed = () => Number(((Date.now() - T0) / 1000).toFixed(2))
const log = (...parts) => console.log(`[${String(elapsed()).padStart(6)}s]`, ...parts)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const consoleErrors = []
const pageErrors = []
const requests = { prompt: [], traceInspectEvents: [], sidebarSettings: [] }

const browser = await chromium.launch({ headless: !flag('keep-open'), channel: 'chrome' })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 2,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  colorScheme: 'dark',
  reducedMotion: 'reduce',
})
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 400)) })
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 400)))
page.on('response', (r) => {
  const url = r.url()
  if (r.request().method() !== 'POST') return
  if (url.includes('/api/session/prompt')) requests.prompt.push({ status: r.status(), at: elapsed() })
  if (url.includes('/trace-inspect/api/events')) requests.traceInspectEvents.push({ status: r.status(), at: elapsed() })
  if (url.includes('/sidebar/api/settings')) requests.sidebarSettings.push({ url: url.replace(/^.*?19\d{3}/, ''), status: r.status(), at: elapsed() })
})

/* ── page probes ─────────────────────────────────────────────────────────── */

/**
 * Whole observable state of the feature surface.
 *
 * "Expanded" is geometric on purpose: the native right column keeps its tab
 * strip MOUNTED while collapsed (translated off-frame), and the conversation
 * view carries its own `[role=tablist]`, so neither "a tablist exists" nor "a
 * collapse button exists" proves anything. The composer geometry does: with the
 * column open the conversation pane is squeezed well inside the frame.
 */
const uiState = () => page.evaluate(() => {
  const isVisible = (el) => {
    if (el === null) return false
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
  }
  const countText = (document.querySelector('[data-testid="ttl-count"]')?.textContent || '').trim()
  const turns = Number((countText.match(/(\d+)\s*轮/) || [])[1] ?? NaN)
  const composer = document.querySelector('[role=textbox]')
  const composerBox = composer === null ? null : composer.getBoundingClientRect()
  const expanded = composerBox !== null && composerBox.width > 0
    ? composerBox.right < window.innerWidth * 0.82
    : false
  const activeTabs = [...document.querySelectorAll('[role=tab][aria-selected="true"], [role=tabpage][aria-selected="true"]')]
    .map((el) => (el.textContent || '').trim())
  let sessionId = null
  try { sessionId = JSON.parse(localStorage.getItem('dsh.sessions.current') || '{}').sessionId ?? null } catch { /* ignore */ }
  return {
    expanded,
    composerRight: composerBox === null ? null : Math.round(composerBox.right),
    ttlRoot: isVisible(document.querySelector('[data-testid="ttl-root"]')),
    ttlList: isVisible(document.querySelector('[data-testid="ttl-list"]')),
    ttlEmpty: isVisible(document.querySelector('[data-testid="ttl-empty"]')),
    countText,
    turns,
    activeTabs,
    activeTabIsTraceInspect: activeTabs.some((t) => t.includes('轮次轨迹')),
    sessionId,
  }
})

/** The plugin's own confirm probe: the durable event log of one session. */
const probeEvents = (sessionId) => page.evaluate(async (id) => {
  try {
    const r = await fetch('/trace-inspect/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: id, afterSeq: 0 }),
    })
    const json = await r.json()
    const events = Array.isArray(json.events) ? json.events : []
    return { status: r.status, count: events.length, types: [...new Set(events.map((e) => e.type))].slice(0, 14) }
  } catch (error) {
    return { status: 0, count: -1, types: [], error: String(error).slice(0, 200) }
  }
}, sessionId)

const shot = async (name) => {
  const file = path.join(OUT_DIR, name)
  await page.screenshot({ path: file })
  return file
}

/** Poll the page state until `predicate(state)` holds; returns the last state. */
async function until(predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let last = null
  while (Date.now() < deadline) {
    last = await uiState()
    if (predicate(last)) return last
    await sleep(250)
  }
  return last
}

/** Watch for a trace-inspect page appearing at all (a premature auto-open). */
async function watchForTracePage(ms) {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    const seen = await page.evaluate(() => document.querySelector('[data-testid="ttl-root"]') !== null)
    if (seen) return { appeared: true, at: elapsed() }
    await sleep(200)
  }
  return { appeared: false, at: null }
}

/** What sits on top of the composer — diagnoses an overlay-blocked click. */
const clickBlockProbe = () => page.evaluate(() => {
  const input = document.querySelector('[role=textbox]')
  const rect = input === null ? null : input.getBoundingClientRect()
  const point = rect === null ? null : document.elementFromPoint(Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2))
  const dialogs = [...document.querySelectorAll('[role=dialog]')].map((d) => (d.textContent || '').trim().slice(0, 40))
  return {
    composerRect: rect === null ? null : { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    topElement: point === null ? null : { tag: point.tagName, role: point.getAttribute('role'), cls: (point.className || '').toString().slice(0, 50) },
    dialogs,
    popupOpen: document.body.innerText.includes('首轮自动打开'),
  }
})

/** Click a message send for the current conversation. */
async function sendMessage(text) {
  const editor = page.locator('[role=textbox]').first()
  await editor.click()
  await sleep(150)
  await page.keyboard.type(text, { delay: 12 })
  await sleep(200)
  const at = elapsed()
  await page.locator('button[aria-label="发送消息"]').first().click()
  return at
}

/* ── 0. boot ─────────────────────────────────────────────────────────────── */

const errors = []
const metrics = {
  feature: 'v0.11.0 auto-open first turn',
  url: REDACTED_URL,
  port: PORT,
  startedAt: new Date().toISOString(),
  launch: `DSH_HOME=${HOME_DIR} dsh --profile trace-verify --no-open --port ${PORT} > ${SERVER_LOG} 2>&1 &`,
  dshHome: HOME_DIR,
  serverLog: SERVER_LOG,
  profile: 'trace-verify (node_modules/dsh-trace-inspect → this checkout)',
  build: builtBundle(),
  viewport: '1440x1000 @2x dark zh-CN',
  steps: {},
  consoleErrors,
  pageErrors,
  requests,
  screenshots: {},
}

try {
  await page.goto(URL_WITH_TOKEN, { waitUntil: 'domcontentloaded', timeout: 60000 })
  // Let the shell create + mount the blank conversation, then watch: with the
  // P1 fix the trace page must NOT appear while the conversation has 0 turns.
  await page.waitForFunction(() => localStorage.getItem('dsh.sessions.current') !== null, { timeout: 45000 })
  await sleep(2500)
  const preOpenWatch = await watchForTracePage(6000)
  await sleep(500)
  const baseline = await uiState()
  const baselineEvents = baseline.sessionId === null ? null : await probeEvents(baseline.sessionId)
  metrics.steps.baseline = { at: elapsed(), state: baseline, events: baselineEvents, tracePageAppearedWhileIdle: preOpenWatch }
  metrics.screenshots.baseline = await shot('baseline.png')
  log('baseline', JSON.stringify({ expanded: baseline.expanded, ttl: baseline.ttlRoot, count: baseline.countText, events: baselineEvents?.count, premature: preOpenWatch.appeared }))

  /* ── 1. POSITIVE: new conversation → first message (time-correct) ──────── */

  const newConversation = page.locator('button[aria-label="新建会话"]').first()
  if (await newConversation.count() > 0) {
    await newConversation.click().catch(() => {})
    await sleep(1200)
  }
  const preTurn = await uiState()
  const preTurnEvents = preTurn.sessionId === null ? null : await probeEvents(preTurn.sessionId)
  metrics.steps.beforeFirstTurn = { at: elapsed(), state: preTurn, events: preTurnEvents }
  log('before first turn', JSON.stringify({ expanded: preTurn.expanded, ttl: preTurn.ttlRoot, count: preTurn.countText, events: preTurnEvents?.count }))

  const tSend = await sendMessage(MESSAGE)
  log('sent first message')

  // The turn itself may fail after admission (this host has no sandbox backend
  // for workspace-write); what must land is the durable event log + the panel.
  const afterTurn = await until((s) => s.expanded === true && s.ttlRoot === true && s.ttlList === true
    && Number.isFinite(s.turns) && s.turns >= 1, 30000)
  const afterEvents = afterTurn.sessionId === null ? null : await probeEvents(afterTurn.sessionId)
  metrics.steps.afterFirstTurn = { at: elapsed(), sendAt: tSend, state: afterTurn, events: afterEvents }
  metrics.screenshots.positive = await shot('positive.png')
  log('after first turn', JSON.stringify({ expanded: afterTurn.expanded, ttl: afterTurn.ttlRoot, list: afterTurn.ttlList, count: afterTurn.countText, active: afterTurn.activeTabs }))

  const stateAssertion = {
    rightColumnExpanded: afterTurn.expanded === true,
    activePageIsTraceInspect: afterTurn.ttlRoot === true && afterTurn.activeTabIsTraceInspect === true,
    ttlListWithTurn: afterTurn.ttlList === true && Number.isFinite(afterTurn.turns) && afterTurn.turns >= 1,
  }
  const attribution = {
    // Time-correctness: closed (and no trace page) before the message…
    columnClosedBeforeTurn: preTurn.expanded === false && preTurn.ttlRoot === false,
    // …and opened BY the message.
    expandedChangedByTheTurn: preTurn.expanded === false && afterTurn.expanded === true,
    prematureOpen: preOpenWatch.appeared || preTurn.ttlRoot === true,
    promptAdmitted: requests.prompt.some((p) => p.status === 200),
    beforeFirstTurn: { expanded: preTurn.expanded, ttlRoot: preTurn.ttlRoot, turns: Number.isFinite(preTurn.turns) ? preTurn.turns : null, countText: preTurn.countText },
    preTurnEventTypes: preTurnEvents?.types ?? [],
    afterTurns: Number.isFinite(afterTurn.turns) ? afterTurn.turns : null,
  }
  const positivePass = stateAssertion.rightColumnExpanded && stateAssertion.activePageIsTraceInspect
    && stateAssertion.ttlListWithTurn && attribution.columnClosedBeforeTurn
    && attribution.expandedChangedByTheTurn && attribution.prematureOpen === false
  metrics.steps.positive = {
    pass: positivePass,
    stateAssertion,
    attribution,
    verdict: positivePass
      ? 'PASS — closed on a 0-turn conversation, opened by the first turn'
      : !stateAssertion.rightColumnExpanded || !stateAssertion.activePageIsTraceInspect || !stateAssertion.ttlListWithTurn
        ? 'FAIL(state) — after the first message the column is not expanded on 轮次轨迹 with >=1 turn'
        : attribution.prematureOpen
          ? 'FAIL(trigger) — the panel was already open before the first message'
          : 'FAIL(trigger) — the column did not change from closed to open on the first turn',
  }
  if (!positivePass) errors.push('item 1 POSITIVE: ' + metrics.steps.positive.verdict)

  /* ── 2. NEGATIVE: a conversation that already has a turn ───────────────── */

  const historySession = afterTurn.sessionId
  const collapse = page.locator('button[aria-label="收起右侧边栏"]').first()
  if (await collapse.count() > 0) await collapse.click().catch(() => {})
  const collapsed = await until((s) => s.expanded === false, 4000)
  if (historySession !== null) {
    await page.evaluate((id) => localStorage.setItem('dsh.sessions.current', JSON.stringify({ sessionId: id })), historySession)
  }
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => localStorage.getItem('dsh.sessions.current') !== null, { timeout: 45000 })
  const samples = []
  let negativeState = null
  let ttlAppeared = false
  for (let i = 0; i < 24; i += 1) {
    await sleep(250)
    negativeState = await uiState()
    if (negativeState.ttlRoot === true || negativeState.ttlList === true) ttlAppeared = true
    if (i % 4 === 0) samples.push({ at: elapsed(), expanded: negativeState.expanded, ttlRoot: negativeState.ttlRoot })
  }
  const negEvents = negativeState?.sessionId === null ? null : await probeEvents(negativeState.sessionId)
  const historyProved = negEvents !== null && negEvents.count >= 3 && negEvents.types.includes('user/message')
  const sameSession = historySession !== null && negativeState?.sessionId === historySession
  const negative = {
    pass: sameSession && historyProved && ttlAppeared === false && negativeState?.expanded === false,
    collapsedBeforeReload: collapsed?.expanded === false,
    expectedSession: historySession,
    restoredSession: negativeState?.sessionId ?? null,
    sameSessionRestored: sameSession,
    historyProvedByEvents: historyProved,
    eventCountAfterReload: negEvents?.count ?? null,
    eventTypesAfterReload: negEvents?.types ?? [],
    traceInspectPageAppeared: ttlAppeared,
    expandedAfterReload: negativeState?.expanded ?? null,
    samples,
  }
  if (!negative.pass) {
    negative.reason = !sameSession
      ? 'inconclusive: the reload did not restore the same session'
      : !historyProved
        ? 'inconclusive: the restored session could not be proved to have history'
        : ttlAppeared
          ? 'the trace-inspect page auto-opened for a conversation that already had a turn'
          : 'the right column was left expanded after the reload'
  }
  metrics.steps.negative = negative
  metrics.screenshots.negative = await shot('negative.png')
  log('negative', JSON.stringify({ pass: negative.pass, same: sameSession, history: historyProved, ttlAppeared, expanded: negative.expandedAfterReload, reason: negative.reason }))
  if (!negative.pass) errors.push('item 2 NEGATIVE: ' + (negative.reason || 'failed'))

  /* ── 3. SETTING: switch row present and rendered CHECKED ────────────────── */

  const openSettings = async () => {
    await page.locator('button[aria-label="账号菜单"]').first().click()
    await sleep(700)
    await page.getByRole('menuitem', { name: '设置' }).first().click()
    await sleep(1600)
    await page.getByText('侧边卡片', { exact: true }).first().click()
    await sleep(1200)
    const gearClicked = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')].filter((b) => (b.textContent || '').trim() === '功能设置')
      for (const b of buttons) {
        let row = b
        for (let depth = 0; depth < 8; depth += 1) {
          row = row.parentElement
          if (row === null) break
          const text = row.textContent || ''
          if (text.includes('trace-inspect')) {
            if (!/editor|subagent|terminal-bottom/.test(text) && text.length < 200) {
              b.click()
              return true
            }
            break
          }
        }
      }
      return false
    })
    await sleep(1400)
    return gearClicked
  }
  /** The 首轮自动打开 row's switch (checkbox input) + full row context. */
  const readSwitch = () => page.evaluate(() => {
    const text = document.body.innerText
    const index = text.indexOf('首轮自动打开')
    let control = null
    const title = [...document.querySelectorAll('*')].find((el) => el.children.length === 0
      && (el.textContent || '').trim() === '首轮自动打开')
    if (title !== undefined) {
      let row = title
      for (let depth = 0; depth < 6; depth += 1) {
        row = row.parentElement
        if (row === null) break
        const found = row.querySelector('[role=switch],[aria-checked],input[type=checkbox]')
        if (found !== null) {
          const rect = found.getBoundingClientRect()
          control = {
            tag: found.tagName,
            role: found.getAttribute('role'),
            ariaChecked: found.getAttribute('aria-checked'),
            checked: typeof found.checked === 'boolean' ? found.checked : null,
            clickable: rect.width > 0 && rect.height > 0,
            center: { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y + rect.height / 2) },
          }
          break
        }
      }
    }
    return {
      hasRow: index !== -1,
      context: index === -1 ? null : text.slice(Math.max(0, index - 260), index + 300).replace(/\n+/g, ' | '),
      control,
    }
  })

  let setting = { pass: false }
  let gearClicked = false
  let switchRead = null
  try {
    gearClicked = await openSettings()
    switchRead = await readSwitch()
    // The renderless default panel writes `autoOpenFirstTurn: true` on open; the
    // declarative row then re-renders checked. Give that round trip a moment.
    for (let i = 0; i < 12 && switchRead.control?.checked !== true; i += 1) {
      await sleep(350)
      switchRead = await readSwitch()
    }
    metrics.screenshots.settings = await shot('settings.png')
    setting = {
      pass: gearClicked && switchRead.hasRow && switchRead.control?.checked === true,
      gearClicked,
      rowPresent: switchRead.hasRow,
      renderedSwitch: switchRead.control,
      context: switchRead.context,
      defaultMaterialised: switchRead.control?.checked === true,
    }
    log('setting', JSON.stringify({ pass: setting.pass, gear: gearClicked, row: switchRead.hasRow, checked: switchRead.control?.checked }))
  } catch (error) {
    setting = { pass: false, reason: String(error).slice(0, 300) }
    log('setting failed', setting.reason)
  }
  metrics.steps.setting = setting
  if (!setting.pass) errors.push('item 3 SETTING: ' + (setting.reason || '首轮自动打开 row missing or not checked by default'))

  /* ── 4. SWITCH OFF suppresses the auto-open ────────────────────────────── */

  let switchOff = { pass: false }
  try {
    // Turn the switch off inside the same popup.
    let before = await readSwitch()
    let toggled = false
    if (before.control?.checked === true && before.control.clickable) {
      await page.mouse.click(before.control.center.x, before.control.center.y)
      toggled = await page.evaluate(() => true)
      // Confirm the row flipped before closing the popup.
      let after = before
      for (let i = 0; i < 12 && after.control?.checked !== false; i += 1) {
        await sleep(300)
        after = await readSwitch()
      }
      before = after
    }
    const switchOffPersisted = before.control?.checked === false
    // Close the feature popup with its own 完成 button (plain-button text match —
    // the role/name lookup can resolve to an unrelated hidden button and burn the
    // click timeout), polling until the popup row is gone.
    const popupOpenNow = () => page.evaluate(() => document.body.innerText.includes('首轮自动打开'))
    const doneBtn = page.locator('button', { hasText: /^完成$/ })
    for (let i = 0; i < 6; i += 1) {
      if (!(await popupOpenNow())) break
      if (await doneBtn.count() > 0) await doneBtn.first().click({ timeout: 4000 }).catch(() => {})
      await sleep(700)
    }
    const popupClosed = !(await popupOpenNow())
    // Then close the settings sheet through its own header 关闭 button (no
    // aria-label, and other "关闭" buttons exist → scope to [role=dialog]).
    const dialogClose = page.locator('[role=dialog] button', { hasText: /^关闭$/ })
    for (let i = 0; i < 4; i += 1) {
      const stillOpen = await page.evaluate(() => document.querySelector('[role=dialog]') !== null)
      if (!stillOpen) break
      if (await dialogClose.count() > 0) await dialogClose.first().click({ timeout: 4000 }).catch(() => {})
      else await page.keyboard.press('Escape')
      await sleep(800)
    }
    // "Closed" means the composer is hit-testable again — a dismissed sheet can
    // keep a zero-hit-area [role=dialog] node around during its exit transition,
    // so poll the hit test instead of reading the dialog node once.
    const composerHitTest = () => page.evaluate(() => {
      const input = document.querySelector('[role=textbox]')
      if (input === null) return false
      const r = input.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return false
      const top = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2))
      return top !== null && (top === input || input.contains(top) || top.contains(input))
    })
    let settingsClosed = false
    for (let i = 0; i < 20; i += 1) {
      settingsClosed = await composerHitTest()
      if (settingsClosed) break
      await sleep(250)
    }
    const dialogStillMounted = await page.evaluate(() => document.querySelector('[role=dialog]') !== null)
    // The composer must be interactive again before the next conversation.
    await page.locator('[role=textbox]').first().waitFor({ state: 'visible', timeout: 15000 })
    await sleep(500)

    // A brand-new conversation + its first message: the panel must stay closed.
    try {
      await page.locator('button[aria-label="新建会话"]').first().click({ timeout: 8000 })
    } catch {
      await page.keyboard.press('Alt+Meta+n')
    }
    await sleep(1400)
    const preTurnOff = await uiState()
    const beforeSendProbe = await clickBlockProbe()
    metrics.screenshots['switch-off-before-send'] = await shot('switch-off-before-send.png')
    let tSendOff = null
    try {
      tSendOff = await sendMessage('第二轮：只回一个词：好')
    } catch (firstError) {
      // A stray overlay (settings sheet / popup) is the usual blocker: dismiss
      // anything modal, click a neutral spot, then retry once and record it.
      await page.keyboard.press('Escape')
      await sleep(600)
      await page.mouse.click(20, Math.round(1000 / 2))
      await sleep(600)
      try {
        tSendOff = await sendMessage('第二轮：只回一个词：好')
      } catch (secondError) {
        throw new Error('composer not clickable for the second conversation: '
          + String(secondError).slice(0, 200) + ' | probe=' + JSON.stringify(beforeSendProbe))
      }
    }
    let ttlAppeared = false
    const samples = []
    for (let i = 0; i < 32; i += 1) {
      await sleep(300)
      const s = await uiState()
      if (s.ttlRoot === true || s.ttlList === true) ttlAppeared = true
      if (i % 5 === 0) samples.push({ at: elapsed(), expanded: s.expanded, ttlRoot: s.ttlRoot, countText: s.countText })
    }
    const finalOff = await uiState()
    const offEvents = finalOff.sessionId === null ? null : await probeEvents(finalOff.sessionId)
    // Preconditions: the message really landed (otherwise "no open" proves nothing).
    const turnProved = offEvents !== null && offEvents.types.includes('user/message')
    metrics.screenshots['switch-off'] = await shot('switch-off.png')
    switchOff = {
      pass: toggled && switchOffPersisted && popupClosed && settingsClosed && turnProved
        && ttlAppeared === false && finalOff.expanded === false,
      switchToggled: toggled,
      switchOffPersisted,
      popupClosed,
      settingsClosed,
      dialogStillMounted,
      preTurnExpanded: preTurnOff.expanded,
      beforeSendProbe,
      traceInspectPageAppeared: ttlAppeared,
      firstTurnProvedByEvents: turnProved,
      eventCount: offEvents?.count ?? null,
      eventTypes: offEvents?.types ?? [],
      expandedAfterTurn: finalOff.expanded,
      samples,
    }
    if (!switchOff.pass) {
      switchOff.reason = !toggled
        ? 'the switch could not be clicked programmatically'
        : !switchOffPersisted
          ? 'the switch did not persist OFF'
          : !settingsClosed
            ? 'the settings dialog did not close'
            : !turnProved
              ? 'inconclusive: the second conversation has no first-turn event'
              : 'the panel auto-opened even though the switch is OFF'
    }
    log('switch off', JSON.stringify({ pass: switchOff.pass, persisted: switchOffPersisted, ttlAppeared, expanded: finalOff.expanded, reason: switchOff.reason }))
  } catch (error) {
    switchOff = { pass: false, reason: String(error).slice(0, 300) }
    log('switch-off failed', switchOff.reason)
  }
  metrics.steps.switchOff = switchOff
  if (!switchOff.pass) errors.push('item 4 SWITCH OFF: ' + (switchOff.reason || 'auto-open not suppressed'))

  /* ── 5. console ────────────────────────────────────────────────────────── */

  metrics.steps.console = { pass: consoleErrors.length === 0 && pageErrors.length === 0, consoleErrors, pageErrors }
  if (!metrics.steps.console.pass) errors.push(`item 5 CONSOLE: ${consoleErrors.length} console error(s), ${pageErrors.length} pageerror(s)`)

  /* ── version + verdict ─────────────────────────────────────────────────── */

  metrics.dshVersion = await page.evaluate(() => window.__DSH_BOOT__?.release?.version ?? null).catch(() => null)
  metrics.timings = { startedAt: metrics.startedAt, finishedAt: new Date().toISOString(), totalSeconds: elapsed() }
  metrics.ok = errors.length === 0
  metrics.failures = errors
  metrics.pass = {
    '1 positive (closed before turn, opened by turn)': metrics.steps.positive.pass,
    '2 negative (session with history)': metrics.steps.negative.pass,
    '3 setting row 首轮自动打开 checked': metrics.steps.setting.pass,
    '4 switch OFF suppresses auto-open': metrics.steps.switchOff.pass,
    '5 no console errors': metrics.steps.console.pass,
  }
  fs.writeFileSync(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2))

  log('──────────────────────────────────────────────')
  for (const [name, pass] of Object.entries(metrics.pass)) log(pass ? 'PASS' : 'FAIL', name)
  log('build', metrics.build?.sha256?.slice(0, 16), metrics.build?.size, '| dsh', metrics.dshVersion, '| out:', OUT_DIR)
  if (errors.length > 0) {
    log('FAILURES:')
    for (const error of errors) log('  -', error)
  }
} catch (error) {
  metrics.crash = String(error?.stack ?? error).slice(0, 3000)
  metrics.failures = [...errors, 'crashed: ' + String(error).slice(0, 400)]
  metrics.ok = false
  try { fs.writeFileSync(path.join(OUT_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2)) } catch { /* ignore */ }
  log('CRASH', String(error?.stack ?? error).slice(0, 2000))
  if (!flag('keep-open')) await browser.close()
  process.exit(2)
}

if (!flag('keep-open')) await browser.close()
process.exit(metrics.ok ? 0 : 2)
