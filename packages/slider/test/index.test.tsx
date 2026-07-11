/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

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

  it('updates a single-thumb slider from pointer interactions without rendering a bubble input outside forms', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const onValueCommit = vi.fn()

    mount(
      () => (
        <Root defaultValue={[25]} max={100} onValueCommit={onValueCommit}>
          <Track data-testid="track">
            <Range data-testid="range" />
          </Track>
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const slider = container.querySelector('[data-orientation="horizontal"]') as HTMLSpanElement
    const range = container.querySelector('[data-testid="range"]') as HTMLSpanElement

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
    expect(container.querySelector('input')).toBeNull()
    expect(onValueCommit).toHaveBeenCalledWith([50])
  })

  it('invokes the latest commit handler through the orientation wrappers', async () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const onValueCommit = createSignal<(value: number[]) => void>(firstHandler)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root
          defaultValue={[25]}
          max={100}
          onValueCommit={prop(() => onValueCommit()) as unknown as (value: number[]) => void}
        >
          <Track />
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    onValueCommit(secondHandler)

    const slider = container.querySelector('[data-orientation="horizontal"]') as HTMLSpanElement
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
    pointer(slider, 'pointerup', 100)
    await waitForEffects()

    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledWith([50])
  })

  it('preserves the slide baseline while invoking the latest root pointer handler', async () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const onPointerDown = createSignal<(event: PointerEvent) => void>(firstHandler)
    const onValueCommit = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root
          max={100}
          onPointerDown={prop(() => onPointerDown()) as unknown as (event: PointerEvent) => void}
          onValueCommit={onValueCommit}
          value={[25]}
        >
          <Track />
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    onPointerDown(secondHandler)

    const slider = container.querySelector('[data-orientation="horizontal"]') as HTMLSpanElement
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

    pointer(slider, 'pointerdown', 50)
    pointer(slider, 'pointerup', 50)
    await waitForEffects()

    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledOnce()
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  it('tracks the focused thumb while invoking its latest focus handler', async () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const onFocus = createSignal<(event: FocusEvent) => void>(firstHandler)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue={[20, 80]} step={10}>
          <Track>
            <Range />
          </Track>
          <Thumb />
          <Thumb onFocus={prop(() => onFocus()) as unknown as (event: FocusEvent) => void} />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    onFocus(secondHandler)

    let thumbs = Array.from(container.querySelectorAll<HTMLSpanElement>('[role="slider"]'))
    ;(thumbs[1] as HTMLSpanElement).focus()
    keyDown(thumbs[1] as HTMLSpanElement, 'ArrowRight')
    await waitForEffects()

    thumbs = Array.from(container.querySelectorAll<HTMLSpanElement>('[role="slider"]'))
    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledOnce()
    expect(thumbs.map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(['20', '90'])
  })

  it('renders a bubble input with the current value when the slider participates in a form', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <form>
          <Root defaultValue={[25]} max={100} name="volume">
            <Track data-testid="track">
              <Range data-testid="range" />
            </Track>
            <Thumb />
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()

    const bubbleInput = container.querySelector('input') as HTMLInputElement

    expect(bubbleInput.name).toBe('volume')
    expect(bubbleInput.value).toBe('25')
  })

  it('restores all uncontrolled values on native form reset', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <form data-testid="form">
          <Root defaultValue={[20, 80]} step={10} name="range">
            <Track>
              <Range />
            </Track>
            <Thumb />
            <Thumb />
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const thumbs = Array.from(container.querySelectorAll<HTMLSpanElement>('[role="slider"]'))

    thumbs[0]?.focus()
    keyDown(thumbs[0] as HTMLSpanElement, 'ArrowRight')
    thumbs[1]?.focus()
    keyDown(thumbs[1] as HTMLSpanElement, 'ArrowLeft')
    await waitForEffects()

    expect(thumbs.map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(['30', '70'])
    expect(new FormData(form).getAll('range[]')).toEqual(['30', '70'])

    form.reset()
    await waitForEffects()

    expect(thumbs.map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(['20', '80'])
    expect(new FormData(form).getAll('range[]')).toEqual(['20', '80'])
  })

  it('steps the focused thumb with keyboard input', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue={[10]} step={5}>
          <Track>
            <Range />
          </Track>
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const thumb = container.querySelector('[role="slider"]') as HTMLSpanElement
    thumb.focus()
    keyDown(thumb, 'ArrowRight')
    await waitForEffects()

    expect(thumb.getAttribute('aria-valuenow')).toBe('15')
  })

  it('keeps the thumb wrapper position in sync with the current value', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue={[10]} step={5}>
          <Track>
            <Range />
          </Track>
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const thumb = container.querySelector('[role="slider"]') as HTMLSpanElement
    const wrapper = thumb.parentElement as HTMLSpanElement

    expect(wrapper.style.left).toBe('calc(10% + 0px)')

    thumb.focus()
    keyDown(thumb, 'ArrowRight')
    await waitForEffects()

    expect(thumb.getAttribute('aria-valuenow')).toBe('15')
    expect(wrapper.style.left).toBe('calc(15% + 0px)')
  })

  it('keeps vertical thumb wrapper position in sync with the current value', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue={[25]} orientation="vertical" step={25}>
          <Track>
            <Range />
          </Track>
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const thumb = container.querySelector('[role="slider"]') as HTMLSpanElement
    const wrapper = thumb.parentElement as HTMLSpanElement

    expect(wrapper.style.bottom).toBe('calc(25% + 0px)')

    thumb.focus()
    keyDown(thumb, 'ArrowUp')
    await waitForEffects()

    expect(thumb.getAttribute('aria-valuenow')).toBe('50')
    expect(wrapper.style.bottom).toBe('calc(50% + 0px)')
  })

  it('switches root behavior and pointer mapping when orientation changes', async () => {
    const container = document.createElement('div')
    const orientation = createSignal<'horizontal' | 'vertical'>('horizontal')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="slider" defaultValue={[25]} orientation={prop(() => orientation())}>
          <Track data-testid="track">
            <Range />
          </Track>
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    orientation('vertical')
    await waitForEffects()

    const slider = container.querySelector('[data-testid="slider"]') as HTMLSpanElement
    const track = container.querySelector('[data-testid="track"]') as HTMLSpanElement
    const thumb = container.querySelector('[role="slider"]') as HTMLSpanElement

    expect(slider.getAttribute('data-orientation')).toBe('vertical')
    expect(track.getAttribute('data-orientation')).toBe('vertical')
    expect(thumb.getAttribute('aria-orientation')).toBe('vertical')

    Object.defineProperty(slider, 'getBoundingClientRect', {
      value: () =>
        ({
          width: 20,
          height: 100,
          left: 0,
          top: 0,
          right: 20,
          bottom: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) satisfies DOMRect,
    })

    pointer(slider, 'pointerdown', 10, 25)
    pointer(slider, 'pointerup', 10, 25)
    await waitForEffects()

    expect(thumb.getAttribute('aria-valuenow')).toBe('75')
  })

  it('respects minStepsBetweenThumbs for multiple thumbs', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue={[20, 40]} step={10} minStepsBetweenThumbs={2}>
          <Track>
            <Range />
          </Track>
          <Thumb />
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const thumbs = Array.from(container.querySelectorAll('[role="slider"]')) as HTMLSpanElement[]
    thumbs[0]?.focus()
    keyDown(thumbs[0] as HTMLSpanElement, 'ArrowRight')
    await waitForEffects()

    expect((thumbs[0] as HTMLSpanElement).getAttribute('aria-valuenow')).toBe('20')
    expect((thumbs[1] as HTMLSpanElement).getAttribute('aria-valuenow')).toBe('40')
  })
})
