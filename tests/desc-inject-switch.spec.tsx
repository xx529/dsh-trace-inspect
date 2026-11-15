/**
 * desc-inject-switch.spec.tsx — the New Session hero switch's user-visible
 * behaviour against a fake audit route: it appears only while the conversation
 * is open, reflects the stored choice, and writes the opposite choice back.
 */
import * as React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DescriptionSwitch } from '../src/client/desc-inject'

interface Status { enabled: boolean; sealed: boolean }

function runner(status: Status) {
  return {
    read: vi.fn(async () => status),
    write: vi.fn(async (enabled: boolean) => ({ enabled, sealed: false })),
  }
}

describe('DescriptionSwitch', () => {
  it('renders the stored off choice and enables it on click', async () => {
    const api = runner({ enabled: false, sealed: false })
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)

    const input = await waitFor(() => {
      const found = container.querySelector('input')
      expect(found).not.toBeNull()
      return found as HTMLInputElement
    })
    expect(input.checked).toBe(false)

    fireEvent.click(input)
    await waitFor(() => expect(api.write).toHaveBeenCalledWith(true))
    await waitFor(() => expect((container.querySelector('input') as HTMLInputElement).checked).toBe(true))
  })

  it('reflects a stored on choice', async () => {
    const api = runner({ enabled: true, sealed: false })
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)
    const input = await waitFor(() => {
      const found = container.querySelector('input')
      expect(found).not.toBeNull()
      return found as HTMLInputElement
    })
    expect(input.checked).toBe(true)
  })

  it('renders nothing once the conversation sealed its choice', async () => {
    const api = runner({ enabled: true, sealed: true })
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)
    await waitFor(() => expect(container.querySelector('input')).toBeNull())
  })
})
