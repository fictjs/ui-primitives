/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Announce } from '../src/index.js'

function flushMicrotasks(): Promise<void> {
  return Promise.resolve()
}

describe('@fictjs/announce', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('creates a live region and mirrors the announced content', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(() => <Announce data-testid="announce">Saved</Announce>, container)
    await flushMicrotasks()

    const visible = container.querySelector('[data-testid="announce"]') as HTMLDivElement
    const liveRegion = document.body.querySelector('[data-radix-announce-region]') as HTMLDivElement

    expect(visible.textContent).toBe('Saved')
    expect(liveRegion).not.toBeNull()
    expect(liveRegion.getAttribute('aria-live')).toBe('polite')
    expect(liveRegion.getAttribute('aria-atomic')).toBe('false')
    expect(liveRegion.getAttribute('role')).toBe('status')
    expect(liveRegion.textContent).toBe('Saved')
    expect(container.querySelector('[data-radix-announce-region]')).toBeNull()
  })

  it('reuses a shared live region when type and identifier match', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <>
          <Announce regionIdentifier="toast">First</Announce>
          <Announce regionIdentifier="toast">Second</Announce>
        </>
      ),
      container,
    )
    await flushMicrotasks()

    const liveRegions = document.body.querySelectorAll('[data-radix-announce-region-toast]')

    expect(liveRegions).toHaveLength(1)
    expect(liveRegions[0]?.textContent).toBe('FirstSecond')
  })

  it('turns the live region off while the document is hidden', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    let hidden = false
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    })

    render(() => <Announce type="assertive">Alert</Announce>, container)
    await flushMicrotasks()

    const liveRegion = document.body.querySelector('[data-radix-announce-region]') as HTMLDivElement

    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    expect(liveRegion.getAttribute('aria-live')).toBe('off')
    expect(liveRegion.getAttribute('role')).toBe('none')

    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    expect(liveRegion.getAttribute('aria-live')).toBe('assertive')
    expect(liveRegion.getAttribute('role')).toBe('alert')
  })

  it('removes the shared listener and owned region after the final instance unmounts', async () => {
    const firstContainer = document.createElement('div')
    const secondContainer = document.createElement('div')
    document.body.append(firstContainer, secondContainer)
    const addEventListener = vi.spyOn(document, 'addEventListener')
    const removeEventListener = vi.spyOn(document, 'removeEventListener')

    const disposeFirst = render(
      () => <Announce regionIdentifier="shared">First</Announce>,
      firstContainer,
    )
    const disposeSecond = render(
      () => <Announce regionIdentifier="shared">Second</Announce>,
      secondContainer,
    )
    await flushMicrotasks()

    const liveRegion = document.querySelector('[data-radix-announce-region-shared]')
    const visibilityListener = addEventListener.mock.calls.find(
      ([eventName]) => eventName === 'visibilitychange',
    )?.[1]

    expect(liveRegion).not.toBeNull()
    expect(visibilityListener).toBeTypeOf('function')

    disposeFirst()
    expect(liveRegion?.isConnected).toBe(true)

    disposeSecond()
    expect(liveRegion?.isConnected).toBe(false)
    expect(removeEventListener).toHaveBeenCalledWith('visibilitychange', visibilityListener)

    addEventListener.mockRestore()
    removeEventListener.mockRestore()
  })
})
