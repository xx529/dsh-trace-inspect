/**
 * First-screen toggle for the opt-in tool audit (`description` parameter).
 *
 * The control lives in `conversation.hero.options`, which the Conversation
 * renders only for a blank New Session — the same blankness the Host uses to
 * seal the choice at the first `turn/start`. It therefore reads as a
 * per-conversation, choose-before-you-start control with no global settings.
 *
 * v0.12.3: it is an icon toggle, not a labelled switch. The composer row it
 * sits in is all 28px ghost icon buttons (sandbox / mode / branch), and a
 * switch plus the words 「工具审计」 was the only text control in it. The glyph
 * is the audit log itself (Lucide scroll-text); the styling comes entirely
 * from DSH alias tokens, so the off state is the host's tertiary grey and the
 * on state is the host's own business tint + ink.
 *
 * Transport: the read/write route `/trace-inspect/api/tool-audit` (same-origin,
 * behind the Host's loopback fence). It deliberately does NOT run
 * `/desc-inject`, because executing a command writes a `command/run` row into
 * the transcript — mounting the switch would then litter every new chat.
 *
 * A sealed session renders nothing here; the Host also refuses writes (409).
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
}

/** What the toggle has learned about this session's choice. */
type ChoiceState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'hidden' }
  | { readonly kind: 'ready'; readonly enabled: boolean }

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
 * @returns the icon button, or null while unknown / sealed / unavailable.
 */
export function DescriptionSwitch(props: DescriptionSwitchInjected): React.ReactElement | null {
  const [state, setState] = useState<ChoiceState>({ kind: 'loading' })
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    void props.read().then((status) => {
      if (cancelled) return
      setState(status.sealed ? { kind: 'hidden' } : { kind: 'ready', enabled: status.enabled })
    }, () => {
      if (!cancelled) setState({ kind: 'hidden' })
    })
    return () => { cancelled = true }
  }, [props.sessionId])

  if (state.kind !== 'ready') return null

  const lang = detectLang()
  const label = lang === 'zh' ? '工具审计' : 'Tool audit'
  const title = lang === 'zh'
    ? '开启后，MCP 等注入类工具会多一个 description 参数，记录这次调用做什么（仅用于轮次轨迹审计，本对话内不可再修改）'
    : 'Adds a description argument to injected tools so each call records what it does (trace audit only; sealed once the first turn starts)'

  const change = (enabled: boolean): void => {
    if (pending) return
    setPending(true)
    void props.write(enabled).then((status) => {
      setState(status.sealed ? { kind: 'hidden' } : { kind: 'ready', enabled: status.enabled })
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
      disabled: pending,
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
 * Register the switch into the Conversation hero's option row.
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

  slots.inject('conversation.hero.options', () => slots.register({
    name: 'conversation.hero.options',
    id: 'trace-inspect-desc',
    inject: (sessionId: string): DescriptionSwitchInjected => ({
      sessionId,
      read: () => requestAudit(sessionId),
      write: (enabled: boolean) => requestAudit(sessionId, enabled),
    }),
  }, DescriptionSwitch))
}
