/**
 * desc-inject-switch.spec.tsx — the composer-row audit toggle's user-visible
 * behaviour against a fake audit route: it names itself for screen readers,
 * reflects the stored choice as `aria-pressed`, writes the opposite choice
 * back while the session is open, and — once the first turn seals it — stays
 * on screen locked instead of disappearing.
 *
 * v0.12.3: the control is an icon button (`button[aria-pressed]`), not a
 * labelled checkbox — the words now live in `aria-label` + `title` only.
 * v0.12.6: a sealed session renders the same button, `aria-disabled="true"`,
 * carrying the sealed state; clicking it must not call the route.
 */
import * as React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DescriptionSwitch, registerDescriptionSwitch } from '../src/client/desc-inject'

interface Status { enabled: boolean; sealed: boolean }

function runner(status: Status) {
  return {
    read: vi.fn(async () => status),
    write: vi.fn(async (enabled: boolean) => ({ enabled, sealed: false })),
  }
}

function findButton(container: HTMLElement): HTMLButtonElement {
  const found = container.querySelector('button')
  expect(found).not.toBeNull()
  return found as HTMLButtonElement
}

describe('DescriptionSwitch', () => {
  it('renders the stored off choice and enables it on click', async () => {
    const api = runner({ enabled: false, sealed: false })
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)

    const button = await waitFor(() => {
      expect(container.querySelector('button')).not.toBeNull()
      return findButton(container)
    })
    expect(button.getAttribute('aria-pressed')).toBe('false')
    // The words left the row, so the accessible name has to carry them.
    expect(button.getAttribute('aria-label')).toBeTruthy()
    expect(button.getAttribute('title')).toBeTruthy()
    expect(container.querySelector('label')).toBeNull()
    expect(container.querySelector('input')).toBeNull()

    fireEvent.click(button)
    await waitFor(() => expect(api.write).toHaveBeenCalledWith(true))
    await waitFor(() => expect(findButton(container).getAttribute('aria-pressed')).toBe('true'))
  })

  it('reflects a stored on choice and toggles it back off', async () => {
    const api = runner({ enabled: true, sealed: false })
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)
    const button = await waitFor(() => {
      expect(container.querySelector('button')).not.toBeNull()
      return findButton(container)
    })
    expect(button.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(button)
    await waitFor(() => expect(api.write).toHaveBeenCalledWith(false))
  })

  it('draws the audit glyph and is disabled while a write is in flight', async () => {
    let settle: (status: Status) => void = () => {}
    const api = {
      read: vi.fn(async () => ({ enabled: false, sealed: false })),
      write: vi.fn(() => new Promise<Status>((resolve) => { settle = resolve })),
    }
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)
    const button = await waitFor(() => {
      expect(container.querySelector('button')).not.toBeNull()
      return findButton(container)
    })
    expect(button.querySelectorAll('svg path').length).toBeGreaterThan(0)

    fireEvent.click(button)
    await waitFor(() => expect(findButton(container).disabled).toBe(true))
    settle({ enabled: true, sealed: false })
    await waitFor(() => expect(findButton(container).disabled).toBe(false))
    expect(findButton(container).getAttribute('aria-pressed')).toBe('true')
  })

  it('keeps the sealed choice on screen, locked, instead of vanishing', async () => {
    const api = runner({ enabled: true, sealed: true })
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)
    const button = await waitFor(() => {
      expect(container.querySelector('button')).not.toBeNull()
      return findButton(container)
    })
    // The state the conversation sealed with is still visible…
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('aria-disabled')).toBe('true')
    // …and the tooltip explains why it no longer reacts (jsdom runs the en
    // dictionary, so match either language).
    expect(button.getAttribute('title')).toMatch(/locked|无法再修改/)

    fireEvent.click(button)
    await waitFor(() => expect(api.write).not.toHaveBeenCalled())
    expect(container.querySelector('button')).not.toBeNull()
  })

  it('flips to locked when a write races the first turn, without disappearing', async () => {
    const api = {
      read: vi.fn(async () => ({ enabled: false, sealed: false })),
      // The Host refuses: the answer carries the sealed truth.
      write: vi.fn(async () => ({ enabled: false, sealed: true })),
    }
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)
    const button = await waitFor(() => {
      expect(container.querySelector('button')).not.toBeNull()
      return findButton(container)
    })

    fireEvent.click(button)
    await waitFor(() => expect(findButton(container).getAttribute('aria-disabled')).toBe('true'))
    expect(findButton(container).getAttribute('aria-pressed')).toBe('false')
  })

  it('renders nothing when the status route itself is unavailable', async () => {
    const api = {
      read: vi.fn(async () => { throw new Error('offline') }),
      write: vi.fn(async (enabled: boolean) => ({ enabled, sealed: false })),
    }
    const { container } = render(<DescriptionSwitch sessionId="s" read={api.read} write={api.write} />)
    await waitFor(() => expect(api.read).toHaveBeenCalled())
    expect(container.querySelector('button')).toBeNull()
  })
})

describe('registerDescriptionSwitch', () => {
  it('joins the composer tool row (conversation.input.left), not the hero row', () => {
    const injected: string[] = []
    const registered: Array<Record<string, unknown>> = []
    const ctx = {
      get: (name: string) => (name === 'slots'
        ? {
            inject: (slot: string, callback: () => unknown) => {
              injected.push(slot)
              callback()
            },
            register: (options: Record<string, unknown>) => {
              registered.push(options)
              return () => {}
            },
          }
        : undefined),
    }

    registerDescriptionSwitch(ctx)

    // The sandbox / plan seats are `single` slots; the audit toggle belongs to
    // the `list` slot that already carries the auto-continue and branch chips.
    expect(injected).toEqual(['conversation.input.left'])
    expect(registered).toHaveLength(1)
    expect(registered[0]).toMatchObject({
      name: 'conversation.input.left',
      id: 'trace-inspect-desc',
      order: 50,
    })
    expect(typeof registered[0].inject).toBe('function')
  })

  it('does nothing without a slots service', () => {
    expect(() => registerDescriptionSwitch({ get: () => undefined })).not.toThrow()
  })
})
