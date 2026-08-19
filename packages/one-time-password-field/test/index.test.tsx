/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { HiddenInput, Input, Root } from '../src/index.js'

function changeInput(target: HTMLInputElement, value: string): void {
  target.value = value
  target.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  target.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
}

function paste(target: Element, value: string): void {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent & {
    clipboardData: DataTransfer
  }
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: () => value,
    },
  })
  target.dispatchEvent(event)
}

function keyDown(target: Element, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
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

describe('@fictjs/one-time-password-field', () => {
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

  it('updates the hidden input as characters are entered', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Input />
          <Input />
          <Input />
          <HiddenInput name="code" />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const inputs = Array.from(
      container.querySelectorAll('input:not([type="hidden"])'),
    ) as HTMLInputElement[]
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement

    changeInput(inputs[0] as HTMLInputElement, '1')
    await waitForEffects()
    changeInput(inputs[1] as HTMLInputElement, '2')
    await waitForEffects()
    changeInput(inputs[2] as HTMLInputElement, '3')
    await waitForEffects()

    expect(hiddenInput.value).toBe('123')
  })

  it('reuses the registered input order when a controlled value changes', async () => {
    const value = createSignal('')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="root" value={value}>
          <Input />
          <Input />
          <Input />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const root = container.querySelector('[data-testid="root"]') as HTMLDivElement
    const querySelectorAll = vi.spyOn(root, 'querySelectorAll')

    value('123')
    await waitForEffects()

    const inputs = Array.from(
      container.querySelectorAll('input:not([type="hidden"])'),
    ) as HTMLInputElement[]
    expect(inputs.map((input) => input.value)).toEqual(['1', '2', '3'])
    expect(querySelectorAll).not.toHaveBeenCalled()
  })

  it('keeps the computed root direction attribute reactive', async () => {
    const direction = createSignal<'ltr' | 'rtl'>('ltr')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root data-testid="root" dir={prop(() => direction())}>
          <Input />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const root = container.querySelector('[data-testid="root"]') as HTMLDivElement
    expect(root.getAttribute('dir')).toBe('ltr')

    direction('rtl')
    await waitForEffects()
    expect(root.getAttribute('dir')).toBe('rtl')
  })

  it('uses a reactive input orientation without forwarding it to the DOM', async () => {
    const orientation = createSignal<'horizontal' | 'vertical'>('horizontal')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Input data-testid="one" />
          <Input
            data-testid="two"
            orientation={prop(() => orientation()) as unknown as 'horizontal'}
          />
          <Input data-testid="three" />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const two = container.querySelector('[data-testid="two"]') as HTMLInputElement
    const three = container.querySelector('[data-testid="three"]') as HTMLInputElement
    expect(two.hasAttribute('orientation')).toBe(false)

    two.focus()
    keyDown(two, 'ArrowDown')
    expect(document.activeElement).toBe(two)

    orientation('vertical')
    await waitForEffects()
    expect(two.hasAttribute('orientation')).toBe(false)
    keyDown(two, 'ArrowDown')
    expect(document.activeElement).toBe(three)
  })

  it('updates a registered input index and restores its implicit index', async () => {
    const container = document.createElement('div')
    const index = createSignal<number | undefined>(2)
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Input data-testid="moving-index" index={prop(() => index()) as unknown as number} />
          <Input />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    const input = container.querySelector('[data-testid="moving-index"]') as HTMLInputElement
    expect(input.getAttribute('data-radix-index')).toBe('2')

    index(undefined)
    await waitForEffects()
    expect(input.getAttribute('data-radix-index')).toBe('0')
  })

  it('masks input values when type is password and mirrors them to the hidden input', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root type="password">
          <Input />
          <HiddenInput name="code" />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const input = container.querySelector('input:not([type="hidden"])') as HTMLInputElement
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement

    changeInput(input, '7')
    await waitForEffects()

    expect(input.type).toBe('password')
    expect(hiddenInput.value).toBe('7')
  })

  it('disables all visible inputs from the root and supports paste distribution', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root disabled>
          <Input />
          <Input />
          <Input />
          <HiddenInput name="code" />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    let inputs = Array.from(
      container.querySelectorAll('input:not([type="hidden"])'),
    ) as HTMLInputElement[]
    inputs.forEach((input) => {
      expect(input.getAttribute('disabled')).toBe('')
    })

    const cleanup = cleanups.pop()
    cleanup?.()
    container.innerHTML = ''

    mount(
      () => (
        <Root>
          <Input />
          <Input />
          <Input />
          <HiddenInput name="code" />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    inputs = Array.from(
      container.querySelectorAll('input:not([type="hidden"])'),
    ) as HTMLInputElement[]
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement

    paste(container.querySelector('[role="group"]') as HTMLElement, '1 2 3')
    await waitForEffects()

    expect(inputs.map((input) => input.value).join(',')).toBe('1,2,3')
    expect(hiddenInput.value).toBe('123')
  })

  it('preserves paste distribution while invoking the latest root paste handler', async () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const onPaste = createSignal<(event: ClipboardEvent) => void>(firstHandler)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root onPaste={prop(() => onPaste()) as unknown as (event: ClipboardEvent) => void}>
          <Input />
          <Input />
          <Input />
          <HiddenInput name="code" />
        </Root>
      ),
      container,
    )

    await waitForEffects()
    onPaste(secondHandler)

    paste(container.querySelector('[role="group"]') as HTMLElement, '4 5 6')
    await waitForEffects()

    const inputs = Array.from(
      container.querySelectorAll('input:not([type="hidden"])'),
    ) as HTMLInputElement[]
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement

    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledOnce()
    expect(inputs.map((input) => input.value).join('')).toBe('456')
    expect(hiddenInput.value).toBe('456')
  })

  it('inherits form association and name from the root hidden input contract', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <form id="verification-form" />
          <Root form="verification-form" name="code" defaultValue="12">
            <Input />
            <Input />
            <HiddenInput />
          </Root>
        </>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('form') as HTMLFormElement
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement

    expect(hiddenInput.form).toBe(form)
    expect(hiddenInput.name).toBe('code')
    expect(new FormData(form).get('code')).toBe('12')
  })

  it('excludes the hidden value from submission when the root is disabled', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <form>
          <Root name="code" defaultValue="12" disabled>
            <Input />
            <Input />
            <HiddenInput />
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('form') as HTMLFormElement
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement

    expect(hiddenInput.disabled).toBe(true)
    expect(new FormData(form).has('code')).toBe(false)
  })

  it('restores the initial default value when its form resets', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <form>
          <Root name="code" defaultValue="12">
            <Input />
            <Input />
            <HiddenInput />
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('form') as HTMLFormElement
    const visibleInputs = Array.from(
      container.querySelectorAll('input:not([type="hidden"])'),
    ) as HTMLInputElement[]
    const hiddenInput = container.querySelector('input[type="hidden"]') as HTMLInputElement

    changeInput(visibleInputs[0] as HTMLInputElement, '9')
    await waitForEffects()
    expect(hiddenInput.value).toBe('92')

    form.reset()
    await waitForEffects()

    expect(visibleInputs.map((input) => input.value)).toEqual(['1', '2'])
    expect(hiddenInput.value).toBe('12')
  })
})
