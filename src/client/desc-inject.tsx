/**
 * First-screen switch for the opt-in `description` parameter.
 *
 * The switch lives in `conversation.hero.options`, which the Conversation
 * renders only for a blank New Session — the same blankness the Host uses to
 * seal the choice at the first `turn/start`. It therefore reads as a
 * per-conversation, choose-before-you-start control with no global settings.
 *
 * The Host remains authoritative:
 *   - `/desc-inject status` reports `on` / `off` (+ `(sealed)`),
 *   - `/desc-inject on|off` persists the choice and refuses after sealing.
 * A sealed session renders nothing here.
 */
import * as React from 'react'
import { detectLang } from './locales'

const { useEffect, useState } = React

/** The slice of a `remote.commands.execute` response this component reads. */
interface CommandResponse {
  readonly ok: boolean
  readonly value?: { readonly result: { readonly kind: string; readonly text: string } }
  readonly error?: { readonly message: string }
}

/** Props injected into the switch by the hosting slot registration. */
export interface DescriptionSwitchInjected {
  /** Session the switch belongs to (supplied by the slot runtime). */
  readonly sessionId: string
  /** Run one Host command in this session. */
  executeCommand(line: string): Promise<CommandResponse>
}

/** What the switch has learned about this session's choice. */
type ChoiceState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'hidden' }
  | { readonly kind: 'ready'; readonly enabled: boolean }

/**
 * Render the opt-in switch.
 * @param props - injected session identity and command runner.
 * @returns the switch, or null while unknown / sealed / unavailable.
 */
export function DescriptionSwitch(props: DescriptionSwitchInjected): React.ReactElement | null {
  const [state, setState] = useState<ChoiceState>({ kind: 'loading' })
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    void props.executeCommand('/desc-inject status').then((response) => {
      if (cancelled) return
      const text = response.ok && response.value !== undefined ? response.value.result.text : 'off (sealed)'
      if (/sealed/i.test(text)) {
        setState({ kind: 'hidden' })
        return
      }
      setState({ kind: 'ready', enabled: text.trim().toLowerCase().startsWith('on') })
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
    void props.executeCommand(`/desc-inject ${enabled ? 'on' : 'off'}`).then((response) => {
      if (response.ok) setState({ kind: 'ready', enabled })
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

/**
 * Register the switch into the Conversation hero's option row.
 * @param ctx - client context (slot, inject, and `remote.commands` services).
 */
export function registerDescriptionSwitch(ctx: unknown): void {
  const context = ctx as { get?: (name: string) => unknown }
  // `ctx.slots` / `ctx.remote` would throw without an `inject` declaration on
  // this client plugin; the unchecked accessor is the safe read used for
  // optional services (the same way the tab reads `betterSidebar`).
  const slots = context.get?.('slots') as {
    inject(name: string, callback: () => unknown): void
    register(options: Record<string, unknown>, component: unknown): () => void
  } | undefined
  const commands = context.get?.('remote.commands') as {
    execute?(sessionId: string, line: string, attachments: unknown[]): Promise<CommandResponse>
  } | undefined
  if (slots === undefined || typeof slots.inject !== 'function') return
  if (commands === undefined || typeof commands.execute !== 'function') return
  const execute = commands.execute.bind(commands)

  slots.inject('conversation.hero.options', () => slots.register({
    name: 'conversation.hero.options',
    id: 'trace-inspect-desc',
    inject: (sessionId: string): DescriptionSwitchInjected => ({
      sessionId,
      executeCommand: (line: string) => execute(sessionId, line, []),
    }),
  }, DescriptionSwitch))
}
