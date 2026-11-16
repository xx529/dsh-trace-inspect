/**
 * Composer-row toggle for the opt-in tool audit (`description` parameter).
 *
 * v0.12.4: the control lives in `conversation.input.left` — the composer tool
 * row, next to the sandbox pill, the auto-continue chip and the branch chip
 * (the slot's `list` cells are ordered by `order`, then registration order;
 * sandbox/plan are `single` slots and cannot host a second occupant). It
 * renders only while this session has not yet sealed its choice — the same
 * blankness the Host uses at the first `turn/start` — so it reads as a
 * per-conversation, choose-before-you-start control with no global settings.
 *
 * v0.12.3: it is an icon toggle, not a labelled switch. The row it sits in is
 * all 28px ghost icon buttons, and a switch plus the words 「工具审计」 was the
 * only text control in it. The glyph is the audit log itself (Lucide
 * scroll-text); the styling comes entirely from DSH alias tokens, so the off
 * state is the host's tertiary grey and the on state is the host's own
 * business tint + ink.
 *
 * Transport: the read/write route `/trace-inspect/api/tool-audit` (same-origin,
 * behind the Host's loopback fence). It deliberately does NOT run
 * `/desc-inject`, because executing a command writes a `command/run` row into
 * the transcript — mounting the toggle would then litter every new chat.
 *
 * The control is permanent: once the first turn seals the choice it stays in
 * the row showing the state it sealed with (aria-disabled + a tooltip saying
 * the choice cannot change any more). It only disappears when the status route
 * itself is unavailable — never because a click was refused.
 */
import * as React from 'react'
import { detectLang } from './locales'

const { useEffect, useState } = React

/** The route's status payload. */
export interface AuditStatus {
  readonly enabled: boolean
  readonly sealed: boolean
}

/** Props injected into the switch by the hosting slot registration. */
export interface DescriptionSwitchInjected {
  /** Session the switch belongs to (supplied by the slot runtime). */
  readonly sessionId: string
  /** Read this session's current choice. */
  read(): Promise<AuditStatus>
  /** Persist a new choice (the Host refuses once sealed). */
  write(enabled: boolean): Promise<AuditStatus>
  /**
   * Optional: tell the toggle when the session itself changed (a turn started
   * or finished), so a control mounted on a blank session locks as soon as the
   * conversation seals instead of waiting for a click to be refused.
   */
  watch?(onChange: () => void): () => void
}

/** What the toggle has learned about this session's choice. */
type ChoiceState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'hidden' }
  | { readonly kind: 'ready'; readonly enabled: boolean; readonly sealed: boolean }

/**
 * The audit log, as the toggle's only ink (Lucide scroll-text, 24 grid).
 * A scroll of appended lines is what the switch turns on, so the glyph says
 * what the control does instead of naming it in words.
 */
const AUDIT_GLYPH: readonly string[] = [
  'M15 12h-5',
  'M15 8h-5',
  'M19 17V5a2 2 0 0 0-2-2H4',
  'M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3',
]

/**
 * Render the opt-in toggle.
 * @param props - injected session identity and route helpers.
 * @returns the icon button; null only while loading or if the route is gone.
 */
export function DescriptionSwitch(props: DescriptionSwitchInjected): React.ReactElement | null {
  const [state, setState] = useState<ChoiceState>({ kind: 'loading' })
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    const apply = (next: AuditStatus): void => {
      // Sealed is not "hide": the row keeps showing the choice it sealed with,
      // locked. Only an unreachable route hides the control.
      if (!cancelled) setState({ kind: 'ready', enabled: next.enabled, sealed: next.sealed })
    }
    void props.read().then(apply, () => {
      if (!cancelled) setState({ kind: 'hidden' })
    })
    // A refresh never hides on failure: the last known state stays on screen.
    const refresh = (): void => { void props.read().then(apply, () => {}) }
    const stop = props.watch?.(() => { refresh() })
    return () => { cancelled = true; stop?.() }
  }, [props.sessionId])

  if (state.kind !== 'ready') return null

  const lang = detectLang()
  const label = lang === 'zh' ? '工具审计' : 'Tool audit'
  const locked = state.sealed
  const title = locked
    ? (lang === 'zh'
        ? '对话已经开始了，工具审计无法再修改（当前状态保持到本对话结束）'
        : 'This conversation has started — the tool audit choice is locked')
    : (lang === 'zh'
        ? '开启后，MCP 等注入类工具会多一个 description 参数，记录这次调用做什么（仅用于轮次轨迹审计，本对话内不可再修改）'
        : 'Adds a description argument to injected tools so each call records what it does (trace audit only; sealed once the first turn starts)')

  /** Re-read the Host's truth without ever hiding the control on failure. */
  const reread = (): void => {
    void props.read().then((next) => {
      setState({ kind: 'ready', enabled: next.enabled, sealed: next.sealed })
    }, () => {})
  }

  const change = (enabled: boolean): void => {
    if (pending || locked) return
    setPending(true)
    void props.write(enabled).then((status) => {
      // The Host answers with the sealed truth: a write that raced the first
      // turn flips the control to locked instead of making it vanish.
      setState({ kind: 'ready', enabled: status.enabled, sealed: status.sealed })
    }, () => {}).finally(() => { setPending(false) })
  }

  return React.createElement(
    'button',
    {
      type: 'button',
      className: 'ttl-descAudit',
      title,
      // The words left the row but not the accessibility tree: the button is
      // still named 「工具审计」, and `aria-pressed` carries on/off.
      'aria-label': label,
      'aria-pressed': state.enabled,
      // Locked, not hidden: `aria-disabled` keeps it focusable so the tooltip
      // (and the state) stay reachable, while the click is a no-op.
      'aria-disabled': locked || undefined,
      disabled: pending,
      // A hover is the moment before a click: re-read then, so a control whose
      // state went stale (session sealed while it was mounted) is already
      // locked by the time the pointer lands — no refused click needed.
      onMouseEnter: reread,
      onFocus: reread,
      onClick: () => change(!state.enabled),
    },
    React.createElement(
      'svg',
      { viewBox: '0 0 24 24', width: 15, height: 15, 'aria-hidden': 'true', focusable: 'false' },
      AUDIT_GLYPH.map((d, index) => React.createElement('path', {
        key: index,
        d,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      })),
    ),
  )
}

const AUDIT_ENDPOINT = '/trace-inspect/api/tool-audit'

/**
 * The composer's left tool group. Sandbox (`conversation.input.permission`) and
 * plan (`conversation.input.plan`) are `single` slots and cannot take a second
 * occupant, so the audit toggle joins the `list` slot that already carries the
 * auto-continue and branch chips.
 */
const AUDIT_SLOT = 'conversation.input.left'

/** The slice of the client session controller the toggle watches. */
interface SessionWatchFace {
  subscribe(listener: () => void): () => void
  getSnapshot(): { running?: boolean } | null
}

/** Session-controller service shape (optional — the toggle works without it). */
interface SessionsWatchFace {
  binding(sessionId: string): { session?: SessionWatchFace } | undefined
}


/**
 * Read or write one session's audit choice through the same-origin route.
 * @param sessionId - session whose choice is addressed.
 * @param enabled - when given, POST this choice instead of GET.
 * @returns the Host's status payload.
 */
async function requestAudit(sessionId: string, enabled?: boolean): Promise<AuditStatus> {
  const init: RequestInit = enabled === undefined
    ? { method: 'GET', headers: { accept: 'application/json' } }
    : {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ enabled }),
      }
  const response = await fetch(`${AUDIT_ENDPOINT}?sessionId=${encodeURIComponent(sessionId)}`, init)
  const payload = await response.json() as Partial<AuditStatus>
  return { enabled: payload.enabled === true, sealed: payload.sealed === true }
}

/**
 * Register the toggle into the composer's left tool group.
 * @param ctx - client context (slot and optional-services readers).
 */
export function registerDescriptionSwitch(ctx: unknown): void {
  const context = ctx as { get?: (name: string) => unknown }
  // `ctx.slots` would throw without an `inject` declaration on this client
  // plugin; the unchecked accessor is the safe read used for optional services.
  const slots = context.get?.('slots') as {
    inject(name: string, callback: () => unknown): void
    register(options: Record<string, unknown>, component: unknown): () => void
  } | undefined
  if (slots === undefined || typeof slots.inject !== 'function') return

  // The Host seals the choice at the first `turn/start`; the client session
  // controller flips `running` when that turn starts, which is the moment the
  // control must lock. The service is resolved when a session subscribes (the
  // registration itself can run before the controller is reachable); without
  // it the component still re-reads on hover/focus.
  const watch = (sessionId: string, onChange: () => void): (() => void) => {
    const sessions = context.get?.('sessions') as SessionsWatchFace | undefined
    const session = sessions?.binding(sessionId)?.session
    if (session === undefined) return () => {}
    let running = session.getSnapshot()?.running === true
    return session.subscribe(() => {
      const next = session.getSnapshot()?.running === true
      if (next === running) return
      running = next
      if (next) onChange()
    })
  }

  slots.inject(AUDIT_SLOT, () => slots.register({
    name: AUDIT_SLOT,
    id: 'trace-inspect-desc',
    // `list` cells sort by `order`, then registration order. 50 lands the
    // glyph between the default-order chips (auto-continue) and the branch
    // chip (order 100), i.e. inside the sandbox/branch control group.
    order: 50,
    inject: (sessionId: string): DescriptionSwitchInjected => ({
      sessionId,
      read: () => requestAudit(sessionId),
      write: (enabled: boolean) => requestAudit(sessionId, enabled),
      watch: (onChange: () => void) => watch(sessionId, onChange),
    }),
  }, DescriptionSwitch))
}
