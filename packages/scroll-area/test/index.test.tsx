/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { Corner, Root, Scrollbar, Thumb, Viewport } from '../src/index.js'

async function waitForEffects(cycles = 6): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  for (let index = 0; index < cycles; index++) {
    await new Promise<void>((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(resolve)
        return
      }

      Promise.resolve().then(resolve)
    })
  }
}

describe('@fictjs/scroll-area', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
  })

  it('updates a vertical thumb size and offset from viewport scroll state', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Viewport data-testid="viewport">
            <div style={{ height: '400px' }}>Content</div>
          </Viewport>
          <Scrollbar data-testid="scrollbar" orientation="vertical">
            <Thumb data-testid="thumb" />
          </Scrollbar>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    const scrollbar = container.querySelector('[data-testid="scrollbar"]') as HTMLDivElement
    const thumb = container.querySelector('[data-testid="thumb"]') as HTMLDivElement

    Object.defineProperty(viewport, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(viewport, 'scrollHeight', { value: 400, configurable: true })
    Object.defineProperty(viewport, 'scrollTop', { value: 100, configurable: true, writable: true })
    Object.defineProperty(scrollbar, 'clientHeight', { value: 80, configurable: true })

    viewport.dispatchEvent(new Event('scroll'))
    await waitForEffects()

    expect(thumb.style.height).toBe('20px')
    expect(thumb.style.transform).toBe('translate3d(0, 20px, 0)')
  })

  it('renders a corner when both scrollbars are present', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Viewport />
          <Scrollbar orientation="horizontal">
            <Thumb />
          </Scrollbar>
          <Scrollbar orientation="vertical">
            <Thumb />
          </Scrollbar>
          <Corner data-testid="corner" />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    expect(container.querySelector('[data-testid="corner"]')).not.toBeNull()
  })
})
