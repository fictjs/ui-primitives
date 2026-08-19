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

async function waitForConnectionPoll(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 48))
  await waitForEffects()
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

  it('merges reactive consumer styles without dropping range and thumb internals', async () => {
    const style = createSignal({ backgroundColor: 'red' })
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue={[25]} max={100}>
          <Track>
            <Range
              data-testid="range"
              style={prop(() => style()) as unknown as Record<string, string>}
            />
          </Track>
          <Thumb />
          <Thumb
            data-testid="hidden-thumb"
            style={prop(() => style()) as unknown as Record<string, string>}
          />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const range = container.querySelector('[data-testid="range"]') as HTMLSpanElement
    const hiddenThumb = container.querySelector('[data-testid="hidden-thumb"]') as HTMLSpanElement

    expect(range.style.backgroundColor).toBe('red')
    expect(range.style.left).toBe('0%')
    expect(range.style.right).toBe('75%')
    expect(hiddenThumb.style.backgroundColor).toBe('red')
    expect(hiddenThumb.style.display).toBe('none')

    style({ backgroundColor: 'blue' })
    await waitForEffects()
    expect(range.style.backgroundColor).toBe('blue')
    expect(range.style.left).toBe('0%')
    expect(range.style.right).toBe('75%')
    expect(hiddenThumb.style.backgroundColor).toBe('blue')
    expect(hiddenThumb.style.display).toBe('none')
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

  it('does not rescan the thumb DOM order when controlled values change', async () => {
    const values = createSignal([20, 80])
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root value={values}>
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

    const slider = container.querySelector('[data-orientation="horizontal"]') as HTMLSpanElement
    const querySelectorAll = vi.spyOn(slider, 'querySelectorAll')

    values([30, 70])
    await waitForEffects()

    const thumbs = Array.from(container.querySelectorAll<HTMLSpanElement>('[role="slider"]'))
    expect(thumbs.map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(['30', '70'])
    expect(querySelectorAll).not.toHaveBeenCalled()
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

  it('waits for a detached slider to connect before mounting its bubble input', async () => {
    const container = document.createElement('div')

    mount(
      () => (
        <form data-testid="form">
          <Root defaultValue={[25]} name="volume">
            <Track>
              <Range />
            </Track>
            <Thumb />
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()
    expect(container.querySelector('input')).toBeNull()

    document.body.append(container)
    await waitForEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const input = container.querySelector('input') as HTMLInputElement
    expect(input.isConnected).toBe(true)
    expect(input.form).toBe(form)
    expect(new FormData(form).get('volume')).toBe('25')
  })

  it('mounts its bubble input after adoption into an iframe document', async () => {
    const iframe = document.createElement('iframe')
    const container = document.createElement('div')
    const onInput = vi.fn()
    const onChange = vi.fn()
    document.body.append(iframe)

    mount(
      () => (
        <form data-testid="form">
          <Root defaultValue={[25]} name="volume">
            <Track>
              <Range />
            </Track>
            <Thumb />
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()
    const detachedForm = container.querySelector('[data-testid="form"]') as HTMLFormElement
    detachedForm.addEventListener('input', onInput)
    detachedForm.addEventListener('change', onChange)
    expect(container.querySelector('input')).toBeNull()

    const frameDocument = iframe.contentDocument as Document
    frameDocument.body.append(frameDocument.adoptNode(container))
    await waitForConnectionPoll()

    const form = frameDocument.querySelector('[data-testid="form"]') as HTMLFormElement
    const input = form.querySelector('input') as HTMLInputElement
    expect(input.ownerDocument).toBe(frameDocument)
    expect(input.form).toBe(form)
    expect(input.name).toBe('volume')
    expect(input.value).toBe('25')
    expect(new FormData(form).get('volume')).toBe('25')
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('mounts its bubble input when a connected slider gains explicit form ownership', async () => {
    const container = document.createElement('div')
    const form = document.createElement('form')
    const formId = createSignal<string | undefined>(undefined)
    form.id = 'volume-form'
    document.body.append(container, form)

    mount(
      () => (
        <Root defaultValue={[25]} form={formId} name="volume">
          <Track>
            <Range />
          </Track>
          <Thumb />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    expect(container.querySelector('input')).toBeNull()

    formId(form.id)
    await waitForEffects()

    const input = container.querySelector('input') as HTMLInputElement
    expect(input.form).toBe(form)
    expect(new FormData(form).get('volume')).toBe('25')
  })

  it('preserves a single thumb value in server-rendered form markup', () => {
    const ownerDocument = document
    const container = ownerDocument.createElement('div')

    vi.stubGlobal('document', undefined)
    try {
      mount(
        () => (
          <Root defaultValue={[25]} name="volume">
            <Track>
              <Range />
            </Track>
            <Thumb />
          </Root>
        ),
        container,
      )
    } finally {
      vi.stubGlobal('document', ownerDocument)
    }

    const thumb = container.querySelector('[role="slider"]') as HTMLSpanElement
    const input = container.querySelector('input') as HTMLInputElement
    expect(thumb.getAttribute('aria-valuenow')).toBe('25')
    expect(input.value).toBe('25')
  })

  it('preserves multiple thumb values in server-rendered form markup', () => {
    const ownerDocument = document
    const container = ownerDocument.createElement('div')

    vi.stubGlobal('document', undefined)
    try {
      mount(
        () => (
          <Root defaultValue={[20, 80]} name="range">
            <Track>
              <Range />
            </Track>
            <Thumb />
            <Thumb />
          </Root>
        ),
        container,
      )
    } finally {
      vi.stubGlobal('document', ownerDocument)
    }

    const thumbs = Array.from(container.querySelectorAll<HTMLSpanElement>('[role="slider"]'))
    const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input'))
    expect(thumbs.map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(['20', '80'])
    expect(thumbs.map((thumb) => thumb.getAttribute('aria-label'))).toEqual(['Minimum', 'Maximum'])
    expect(inputs.map((input) => input.value)).toEqual(['20', '80'])
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
