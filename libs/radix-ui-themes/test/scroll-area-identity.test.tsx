/** @jsxImportSource fict */

import { afterEach, describe, expect, it } from 'vitest'

import { prop, render } from 'fict'
import { createSignal } from 'fict/advanced'

import { ScrollArea, Theme } from '../src/index.js'

async function flushEffects(cycles = 6): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  for (let index = 0; index < cycles; index++) {
    await Promise.resolve()
  }
}

describe('themed ScrollArea identity', () => {
  const cleanups: Array<() => void> = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.innerHTML = ''
  })

  it('preserves the initial scrollbar structure while presentation props update', async () => {
    const scrollbars = createSignal<'vertical' | 'horizontal' | 'both'>('vertical')
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <Theme>
            <ScrollArea
              scrollbars={prop(() => scrollbars()) as unknown as 'vertical'}
              type="always"
            >
              Scrollable content
            </ScrollArea>
          </Theme>
        ),
        container,
      ),
    )

    await flushEffects()
    const vertical = container.querySelector(
      '.rt-ScrollAreaScrollbar[data-orientation="vertical"]',
    ) as HTMLElement
    vertical.tabIndex = 0
    vertical.focus()
    expect(document.activeElement).toBe(vertical)

    scrollbars('both')
    await flushEffects()

    expect(container.querySelector('.rt-ScrollAreaScrollbar[data-orientation="vertical"]')).toBe(
      vertical,
    )
    expect(
      container.querySelector('.rt-ScrollAreaScrollbar[data-orientation="horizontal"]'),
    ).toBeNull()
    expect(document.activeElement).toBe(vertical)

    scrollbars('horizontal')
    await flushEffects()

    expect(container.querySelector('.rt-ScrollAreaScrollbar[data-orientation="vertical"]')).toBe(
      vertical,
    )
    expect(
      container.querySelector('.rt-ScrollAreaScrollbar[data-orientation="horizontal"]'),
    ).toBeNull()
    expect(document.activeElement).toBe(vertical)
  })
})
