/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Root, Thumb } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

async function flushEffects(cycles = 6): Promise<void> {
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

describe('@fictjs/switch', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('toggles its checked state and keeps the thumb in sync', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <Root>
          <Thumb data-testid="thumb" />
        </Root>
      ),
      container,
    )

    const button = container.querySelector('button') as HTMLButtonElement
    const thumb = container.querySelector('[data-testid="thumb"]') as HTMLSpanElement

    expect(button.getAttribute('role')).toBe('switch')
    expect(button.getAttribute('aria-checked')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('unchecked')
    expect(thumb.getAttribute('data-state')).toBe('unchecked')

    click(button)
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(thumb.getAttribute('data-state')).toBe('checked')
  })

  it('does not toggle when disabled', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <Root disabled>
          <Thumb />
        </Root>
      ),
      container,
    )

    const button = container.querySelector('button') as HTMLButtonElement

    click(button)
    await flushEffects()

    expect(button.disabled).toBe(true)
    expect(button.getAttribute('data-disabled')).toBe('')
    expect(button.getAttribute('aria-checked')).toBe('false')
  })

  it('supports a controlled checked signal and emits the next value', async () => {
    const checked = createSignal(false)
    const onCheckedChange = vi.fn((nextChecked: boolean) => {
      checked(nextChecked)
    })
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <Root checked={checked} onCheckedChange={onCheckedChange}>
          <Thumb />
        </Root>
      ),
      container,
    )

    const button = container.querySelector('button') as HTMLButtonElement

    click(button)
    await flushEffects()

    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    expect(button.getAttribute('aria-checked')).toBe('true')
  })

  it('keeps the hidden input at the controlled value when an update is rejected', async () => {
    const checked = createSignal(false)
    const onCheckedChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <form>
          <Root name="airplane-mode" checked={checked} onCheckedChange={onCheckedChange} />
        </form>
      ),
      container,
    )

    await flushEffects()

    const form = container.querySelector('form') as HTMLFormElement
    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement

    click(button)
    await flushEffects()

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(button.getAttribute('aria-checked')).toBe('false')
    expect(input.checked).toBe(false)
    expect(new FormData(form).get('airplane-mode')).toBeNull()
  })

  it('renders a hidden checkbox for forms and bubbles a single click event', async () => {
    const formClicks = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <form onClick={formClicks}>
          <Root name="airplane-mode" required value="enabled">
            <Thumb />
          </Root>
        </form>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(input).not.toBeNull()
    expect(input.getAttribute('name')).toBe('airplane-mode')
    expect(input.getAttribute('value')).toBe('enabled')
    expect(input.hasAttribute('required')).toBe(true)

    formClicks.mockClear()
    click(button)
    await flushEffects()

    expect(formClicks).toHaveBeenCalledTimes(1)
    expect(input.checked).toBe(true)
  })

  it('keeps form association props on the hidden input instead of the button', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <>
          <form id="settings-form" />
          <Root form="settings-form" name="airplane-mode" required value="enabled">
            <Thumb />
          </Root>
        </>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(button.hasAttribute('form')).toBe(false)
    expect(button.hasAttribute('name')).toBe(false)
    expect(button.hasAttribute('required')).toBe(false)
    expect(input.getAttribute('form')).toBe('settings-form')
    expect(input.getAttribute('name')).toBe('airplane-mode')
    expect(input.getAttribute('value')).toBe('enabled')
    expect(input.hasAttribute('required')).toBe(true)
  })

  it('restores each uncontrolled switch to its initial state on form reset', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <form data-testid="form">
          <Root data-testid="enabled" name="enabled" defaultChecked />
          <Root data-testid="disabled" name="disabled" />
        </form>
      ),
      container,
    )

    await flushEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const enabled = container.querySelector('[data-testid="enabled"]') as HTMLButtonElement
    const disabled = container.querySelector('[data-testid="disabled"]') as HTMLButtonElement

    click(enabled)
    click(disabled)
    await flushEffects()

    expect(enabled.getAttribute('aria-checked')).toBe('false')
    expect(disabled.getAttribute('aria-checked')).toBe('true')

    form.reset()
    await flushEffects()

    expect(enabled.getAttribute('aria-checked')).toBe('true')
    expect(disabled.getAttribute('aria-checked')).toBe('false')
    expect(new FormData(form).get('enabled')).toBe('on')
    expect(new FormData(form).get('disabled')).toBeNull()
  })

  it('preserves the current state when form reset is canceled', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <form
          data-testid="form"
          onReset={(event) => {
            event.preventDefault()
          }}
        >
          <Root data-testid="switch" name="airplane-mode" />
        </form>
      ),
      container,
    )

    await flushEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const button = container.querySelector('[data-testid="switch"]') as HTMLButtonElement

    click(button)
    await flushEffects()
    form.reset()
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(new FormData(form).get('airplane-mode')).toBe('on')
  })

  it('forwards ref mount and cleanup through the switch root', async () => {
    const calls: Array<string | null> = []
    const container = document.createElement('div')
    document.body.append(container)

    const dispose = render(
      () => (
        <Root
          ref={(node) => {
            calls.push(node?.tagName ?? null)
          }}
        >
          <Thumb />
        </Root>
      ),
      container,
    )

    await flushEffects()
    expect(calls).toEqual(['BUTTON'])

    dispose()

    await flushEffects()
    expect(calls).toEqual(['BUTTON', null])
  })
})
