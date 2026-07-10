/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import {
  BubbleInput,
  Indicator,
  Root,
  Trigger,
  unstable_CheckboxProvider as CheckboxProvider,
} from '../src/index.js'

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

describe('@fictjs/checkbox', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('toggles checked state and indicator visibility', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <Root aria-label="notifications">
          <Indicator data-testid="indicator" />
        </Root>
      ),
      container,
    )

    await flushEffects()

    let button = container.querySelector('button') as HTMLButtonElement

    expect(button.getAttribute('role')).toBe('checkbox')
    expect(button.getAttribute('aria-checked')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('unchecked')
    expect(container.querySelector('[data-testid="indicator"]')).toBeNull()

    click(button)
    await flushEffects()
    button = container.querySelector('button') as HTMLButtonElement

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(container.querySelector('[data-testid="indicator"]')).not.toBeNull()

    click(button)
    await flushEffects()
    button = container.querySelector('button') as HTMLButtonElement

    expect(button.getAttribute('aria-checked')).toBe('false')
    expect(container.querySelector('[data-testid="indicator"]')).toBeNull()
  })

  it('promotes indeterminate state to checked on first click', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <Root aria-label="terms" defaultChecked="indeterminate">
          <Indicator data-testid="indicator" />
        </Root>
      ),
      container,
    )

    await flushEffects()

    let button = container.querySelector('button') as HTMLButtonElement

    expect(button.getAttribute('aria-checked')).toBe('mixed')
    expect(button.getAttribute('data-state')).toBe('indeterminate')
    expect(container.querySelector('[data-testid="indicator"]')).not.toBeNull()

    click(button)
    await flushEffects()
    button = container.querySelector('button') as HTMLButtonElement

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
  })

  it('does not toggle when disabled', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <Root aria-label="disabled checkbox" disabled>
          <Indicator />
        </Root>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('button') as HTMLButtonElement

    click(button)
    await flushEffects()

    expect(button.disabled).toBe(true)
    expect(button.getAttribute('data-disabled')).toBe('')
    expect(button.getAttribute('aria-checked')).toBe('false')
  })

  it('supports a controlled checked signal and emits the next state', async () => {
    const checked = createSignal<false | true | 'indeterminate'>(false)
    const onCheckedChange = vi.fn((nextChecked: false | true | 'indeterminate') => {
      checked(nextChecked)
    })
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <Root aria-label="wifi" checked={checked} onCheckedChange={onCheckedChange}>
          <Indicator />
        </Root>
      ),
      container,
    )

    await flushEffects()

    let button = container.querySelector('button') as HTMLButtonElement

    click(button)
    await flushEffects()
    button = container.querySelector('button') as HTMLButtonElement

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
          <Root name="newsletter" checked={checked} onCheckedChange={onCheckedChange} />
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
    expect(new FormData(form).get('newsletter')).toBeNull()

    checked(true)
    await flushEffects()

    expect(input.checked).toBe(true)
    expect(new FormData(form).get('newsletter')).toBe('on')
  })

  it('bubbles form click events through the hidden checkbox input', async () => {
    const formChanges = vi.fn((checked: boolean) => checked)
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <form
          onChange={(event) => {
            const target = event.target as HTMLInputElement
            formChanges(target.checked)
          }}
        >
          <CheckboxProvider defaultChecked="indeterminate" name="newsletter">
            <Trigger aria-label="newsletter">
              <Indicator data-testid="indicator" />
            </Trigger>
            <BubbleInput />
          </CheckboxProvider>
        </form>
      ),
      container,
    )

    await flushEffects()

    const button = container.querySelector('button') as HTMLButtonElement
    let input = container.querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(input).not.toBeNull()
    expect(input.defaultChecked).toBe(false)
    expect(input.getAttribute('name')).toBe('newsletter')

    click(button)
    await flushEffects()
    input = container.querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(formChanges).toHaveBeenCalledWith(true)
    expect(input.checked).toBe(true)
  })

  it('dispatches form changes when a controlled checkbox updates externally', async () => {
    const checked = createSignal<CheckedState>(false)
    const formChanges = vi.fn((nextChecked: boolean) => nextChecked)
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <form
          onChange={(event) => {
            const target = event.target as HTMLInputElement
            formChanges(target.checked)
          }}
        >
          <CheckboxProvider checked={checked} onCheckedChange={checked}>
            <Trigger aria-label="controlled">
              <Indicator />
            </Trigger>
            <BubbleInput />
          </CheckboxProvider>
          <button
            type="button"
            data-testid="external"
            onClick={() => {
              checked(!checked())
            }}
          >
            Toggle
          </button>
        </form>
      ),
      container,
    )

    await flushEffects()

    const externalButton = container.querySelector('[data-testid="external"]') as HTMLButtonElement
    click(externalButton)
    await flushEffects()

    expect(formChanges).toHaveBeenCalledWith(true)
  })

  it('forwards ref mount and cleanup through the checkbox root', async () => {
    const calls: Array<string | null> = []
    const container = document.createElement('div')
    document.body.append(container)

    const dispose = render(
      () => (
        <Root
          aria-label="ref test"
          ref={(node) => {
            calls.push(node?.tagName ?? null)
          }}
        >
          <Indicator />
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

type CheckedState = false | true | 'indeterminate'
