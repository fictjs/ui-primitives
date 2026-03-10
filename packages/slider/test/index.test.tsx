/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Range, Root, Thumb, Track } from '../src/index.js'

function pointer(target: Element, type: string, clientX: number, clientY = 0): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
      pointerId: 1,
    }),
  )
}

function keyDown(target: Element, key: string, init: KeyboardEventInit = {}): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
      ...init,
    }),
  )
}

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

describe('@fictjs/slider', () => {
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

  it('updates a single-thumb slider from pointer interactions and mirrors the value to the bubble input', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const onValueCommit = vi.fn()

    mount(() => (
      <Root defaultValue={[25]} max={100} onValueCommit={onValueCommit}>
        <Track data-testid="track">
          <Range data-testid="range" />
        </Track>
        <Thumb />
      </Root>
    ), container)

    await waitForEffects()

    const slider = container.querySelector('[data-orientation="horizontal"]') as HTMLSpanElement
    const range = container.querySelector('[data-testid="range"]') as HTMLSpanElement
    const bubbleInput = container.querySelector('input') as HTMLInputElement

    Object.defineProperty(slider, 'getBoundingClientRect', {
      value: () =>
        ({
          width: 200,
          height: 20,
          left: 0,
          top: 0,
          right: 200,
          bottom: 20,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) satisfies DOMRect,
    })

    pointer(slider, 'pointerdown', 100)
    pointer(slider, 'pointermove', 100)
    pointer(slider, 'pointerup', 100)
    await waitForEffects()

    expect(range.style.left).toBe('0%')
    expect(range.style.right).toBe('50%')
    expect(bubbleInput.value).toBe('50')
    expect(onValueCommit).toHaveBeenCalledWith([50])
  })

  it('steps the focused thumb with keyboard input', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <Root defaultValue={[10]} step={5}>
        <Track>
          <Range />
        </Track>
        <Thumb />
      </Root>
    ), container)

    await waitForEffects()

    const thumb = container.querySelector('[role="slider"]') as HTMLSpanElement
    thumb.focus()
    keyDown(thumb, 'ArrowRight')
    await waitForEffects()

    expect(thumb.getAttribute('aria-valuenow')).toBe('15')
  })

  it('respects minStepsBetweenThumbs for multiple thumbs', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <Root defaultValue={[20, 40]} step={10} minStepsBetweenThumbs={2}>
        <Track>
          <Range />
        </Track>
        <Thumb />
        <Thumb />
      </Root>
    ), container)

    await waitForEffects()

    const thumbs = Array.from(container.querySelectorAll('[role="slider"]')) as HTMLSpanElement[]
    thumbs[0]?.focus()
    keyDown(thumbs[0] as HTMLSpanElement, 'ArrowRight')
    await waitForEffects()

    expect((thumbs[0] as HTMLSpanElement).getAttribute('aria-valuenow')).toBe('20')
    expect((thumbs[1] as HTMLSpanElement).getAttribute('aria-valuenow')).toBe('40')
  })
})
