/**
 * desc-inject-switch.spec.tsx — the New Session hero switch's user-visible
 * behaviour against a fake command runner: it appears only when the Host says
 * the conversation is still open, reflects the stored choice, and writes the
 * opposite choice back through `/desc-inject`.
 */
import * as React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DescriptionSwitch } from '../src/client/desc-inject'

type Status = 'on' | 'off' | 'on (sealed)'

function runner(status: Status) {
  return vi.fn(async (line: string) => ({
    ok: true,
    value: { result: { kind: 'success', text: line.endsWith('status') ? status : line.endsWith('on') ? 'on' : 'off' } },
  }))
}

describe('DescriptionSwitch', () => {
  it('renders the stored off choice and enables it on click', async () => {
    const executeCommand = runner('off')
    const { container } = render(<DescriptionSwitch sessionId="s" executeCommand={executeCommand} />)

    const input = await waitFor(() => {
      const found = container.querySelector('input')
      expect(found).not.toBeNull()
      return found as HTMLInputElement
    })
    expect(input.checked).toBe(false)

    fireEvent.click(input)
    await waitFor(() => expect(executeCommand).toHaveBeenCalledWith('/desc-inject on'))
    await waitFor(() => expect((container.querySelector('input') as HTMLInputElement).checked).toBe(true))
  })

  it('reflects a stored on choice', async () => {
    const { container } = render(<DescriptionSwitch sessionId="s" executeCommand={runner('on')} />)
    const input = await waitFor(() => {
      const found = container.querySelector('input')
      expect(found).not.toBeNull()
      return found as HTMLInputElement
    })
    expect(input.checked).toBe(true)
  })

  it('renders nothing once the conversation sealed its choice', async () => {
    const { container } = render(<DescriptionSwitch sessionId="s" executeCommand={runner('on (sealed)')} />)
    await waitFor(() => expect(container.querySelector('input')).toBeNull())
  })
})
