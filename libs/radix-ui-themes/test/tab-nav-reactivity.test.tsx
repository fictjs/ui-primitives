/** @jsxImportSource fict */

import { afterEach, describe, expect, it } from 'vitest'

import { prop, render } from 'fict'
import { createSignal } from 'fict/advanced'

import { TabNav, Theme } from '../src/index.js'

async function flushEffects(cycles = 6): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  for (let index = 0; index < cycles; index++) {
    await Promise.resolve()
  }
}

describe('themed TabNav reactivity', () => {
  const cleanups: Array<() => void> = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.innerHTML = ''
  })

  it('updates getter-backed link props without replacing the link', async () => {
    const active = createSignal(false)
    const className = createSignal('first-link')
    const label = createSignal('First label')
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <Theme>
            <TabNav.Root>
              <TabNav.Link
                active={prop(() => active()) as unknown as boolean}
                aria-label={prop(() => label()) as unknown as string}
                className={prop(() => className()) as unknown as string}
                href="#target"
              >
                Target
              </TabNav.Link>
            </TabNav.Root>
          </Theme>
        ),
        container,
      ),
    )

    await flushEffects()
    const link = container.querySelector('a[href="#target"]') as HTMLAnchorElement
    expect(link.hasAttribute('data-active')).toBe(false)
    expect(link.classList.contains('first-link')).toBe(true)
    expect(link.getAttribute('aria-label')).toBe('First label')

    active(true)
    className('second-link')
    label('Second label')
    await flushEffects()

    expect(container.querySelector('a[href="#target"]')).toBe(link)
    expect(link.hasAttribute('data-active')).toBe(true)
    expect(link.classList.contains('first-link')).toBe(false)
    expect(link.classList.contains('second-link')).toBe(true)
    expect(link.getAttribute('aria-label')).toBe('Second label')
  })
})
