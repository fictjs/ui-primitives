import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { FocusScope } from '../../src/components/interaction/focus-scope'

describe('FocusScope', () => {
  it('autofocuses first focusable element on mount', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: FocusScope,
        props: {
          children: [
            { type: 'button', props: { 'data-testid': 'first', children: 'one' } },
            { type: 'button', props: { children: 'two' } },
          ],
        },
      }),
      container,
    )

    const first = container.querySelector('[data-testid="first"]') as HTMLButtonElement
    expect(document.activeElement).toBe(first)

    dispose()
    container.remove()
  })

  it('loops focus when tabbing from last to first', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: FocusScope,
        props: {
          trapped: true,
          loop: true,
          autoFocus: false,
          children: [
            { type: 'button', props: { 'data-testid': 'first', children: 'one' } },
            { type: 'button', props: { 'data-testid': 'last', children: 'two' } },
          ],
        },
      }),
      container,
    )

    const first = container.querySelector('[data-testid="first"]') as HTMLButtonElement
    const last = container.querySelector('[data-testid="last"]') as HTMLButtonElement

    last.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

    expect(document.activeElement).toBe(first)

    dispose()
    container.remove()
  })
})
