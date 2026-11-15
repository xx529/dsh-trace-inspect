/**
 * First-screen switch for the opt-in tool audit (`description` parameter).
 *
 * The switch lives in `conversation.hero.options`, which the Conversation
 * renders only for a blank New Session — the same blankness the Host uses to
 * seal the choice at the first `turn/start`. It therefore reads as a
 * per-conversation, choose-before-you-start control with no global settings.
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

/** What the switch has learned about this session's choice. */
type ChoiceState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'hidden' }
  | { readonly kind: 'ready'; readonly enabled: boolean }

/**
 * Render the opt-in switch.
 * @param props - injected session identity and route helpers.
 * @returns the switch, or null while unknown / sealed / unavailable.
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
    'label',
    { className: 'ttl-descSwitch', title },
    React.createElement('input', {
      type: 'checkbox',
      checked: state.enabled,
      disabled: pending,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => change(event.currentTarget.checked),
    }),
    React.createElement('span', null, label),
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
