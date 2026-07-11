/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { mergeProps, prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { jsx as createVNode } from '@fictjs/runtime/jsx-runtime'

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

async function waitForConnectionPoll(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 48))
  await flushEffects()
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
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

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

    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

    await flushEffects()

    const form = container.querySelector('form') as HTMLFormElement
    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(input.isConnected).toBe(true)
    expect(input.form).toBe(form)

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

  it('waits for connection and syncs the latest controlled state without bubbling', async () => {
    const checked = createSignal(false)
    const onInput = vi.fn()
    const onChange = vi.fn()
    const container = document.createElement('div')

    render(
      () => (
        <form onInput={onInput} onChange={onChange}>
          <Root name="newsletter" checked={checked} />
        </form>
      ),
      container,
    )

    checked(true)
    await flushEffects()
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

    document.body.append(container)
    await flushEffects()

    const form = container.querySelector('form') as HTMLFormElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input.isConnected).toBe(true)
    expect(input.checked).toBe(true)
    expect(new FormData(form).get('newsletter')).toBe('on')
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('mounts its native input after adoption into an iframe document', async () => {
    const iframe = document.createElement('iframe')
    const container = document.createElement('div')
    const onInput = vi.fn()
    const onChange = vi.fn()
    document.body.append(iframe)

    render(
      () => (
        <form data-testid="form">
          <Root defaultChecked name="newsletter" value="weekly" />
        </form>
      ),
      container,
    )

    await flushEffects()
    const detachedForm = container.querySelector('[data-testid="form"]') as HTMLFormElement
    detachedForm.addEventListener('input', onInput)
    detachedForm.addEventListener('change', onChange)
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

    const frameDocument = iframe.contentDocument as Document
    frameDocument.body.append(frameDocument.adoptNode(container))
    await waitForConnectionPoll()

    const form = frameDocument.querySelector('[data-testid="form"]') as HTMLFormElement
    const input = form.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input.ownerDocument).toBe(frameDocument)
    expect(input.form).toBe(form)
    expect(input.name).toBe('newsletter')
    expect(input.value).toBe('weekly')
    expect(input.checked).toBe(true)
    expect(new FormData(form).get('newsletter')).toBe('weekly')
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('mounts its native input inside a connected shadow tree', async () => {
    const host = document.createElement('div')
    const container = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const onInput = vi.fn()
    const onChange = vi.fn()
    document.body.append(host)

    render(
      () => (
        <form data-testid="form">
          <Root defaultChecked name="newsletter" value="daily" />
        </form>
      ),
      container,
    )

    await flushEffects()
    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    form.addEventListener('input', onInput)
    form.addEventListener('change', onChange)
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

    shadowRoot.append(container)
    await waitForConnectionPoll()

    const input = form.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input.getRootNode()).toBe(shadowRoot)
    expect(input.form).toBe(form)
    expect(input.checked).toBe(true)
    expect(new FormData(form).get('newsletter')).toBe('daily')
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('defers an explicitly associated hidden input until its owner can be resolved', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <>
          <form id="preferences-form" />
          <Root form="preferences-form" name="newsletter" required value="weekly" />
        </>
      ),
      container,
    )

    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

    await flushEffects()

    const form = container.querySelector('#preferences-form') as HTMLFormElement
    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(button.hasAttribute('form')).toBe(false)
    expect(button.hasAttribute('name')).toBe(false)
    expect(input.isConnected).toBe(true)
    expect(input.form).toBe(form)
    expect(input.getAttribute('form')).toBe('preferences-form')
    expect(input.getAttribute('name')).toBe('newsletter')
    expect(input.getAttribute('value')).toBe('weekly')
    expect(input.hasAttribute('required')).toBe(true)
  })

  it('restores an indeterminate checkbox owned by an ancestor form without bubbling', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <form data-testid="form">
          <Root defaultChecked="indeterminate" name="newsletter" value="weekly" />
        </form>
      ),
      container,
    )

    await flushEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    const onInput = vi.fn()
    const onChange = vi.fn()
    input.addEventListener('input', onInput)
    input.addEventListener('change', onChange)

    expect(button.getAttribute('aria-checked')).toBe('mixed')
    expect(button.getAttribute('data-state')).toBe('indeterminate')
    expect(input.checked).toBe(false)
    expect(input.indeterminate).toBe(true)
    expect(new FormData(form).get('newsletter')).toBeNull()

    click(button)
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(input.checked).toBe(true)
    expect(input.indeterminate).toBe(false)
    expect(new FormData(form).get('newsletter')).toBe('weekly')
    onInput.mockClear()
    onChange.mockClear()

    form.reset()
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('mixed')
    expect(button.getAttribute('data-state')).toBe('indeterminate')
    expect(input.checked).toBe(false)
    expect(input.indeterminate).toBe(true)
    expect(new FormData(form).get('newsletter')).toBeNull()
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('restores an indeterminate checkbox inside a shadow form without bubbling', async () => {
    const host = document.createElement('div')
    const container = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    document.body.append(host)
    shadowRoot.append(container)

    render(
      () => (
        <form data-testid="form">
          <Root defaultChecked="indeterminate" name="newsletter" value="weekly" />
        </form>
      ),
      container,
    )

    await flushEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    const onInput = vi.fn()
    const onChange = vi.fn()
    input.addEventListener('input', onInput)
    input.addEventListener('change', onChange)

    button.click()
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(input.checked).toBe(true)
    expect(input.indeterminate).toBe(false)
    expect(new FormData(form).get('newsletter')).toBe('weekly')
    onInput.mockClear()
    onChange.mockClear()

    form.reset()
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('mixed')
    expect(button.getAttribute('data-state')).toBe('indeterminate')
    expect(input.checked).toBe(false)
    expect(input.indeterminate).toBe(true)
    expect(new FormData(form).get('newsletter')).toBeNull()
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('restores a checkbox explicitly associated with a form without bubbling', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <>
          <form id="preferences-form" data-testid="form" />
          <Root defaultChecked form="preferences-form" name="newsletter" value="weekly" />
        </>
      ),
      container,
    )

    await flushEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    const onInput = vi.fn()
    const onChange = vi.fn()
    input.addEventListener('input', onInput)
    input.addEventListener('change', onChange)

    click(button)
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('unchecked')
    expect(input.checked).toBe(false)
    expect(input.indeterminate).toBe(false)
    expect(new FormData(form).get('newsletter')).toBeNull()
    onInput.mockClear()
    onChange.mockClear()

    form.reset()
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(input.checked).toBe(true)
    expect(input.indeterminate).toBe(false)
    expect(new FormData(form).get('newsletter')).toBe('weekly')
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('preserves checkbox state when form reset is canceled without bubbling', async () => {
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
          <Root name="newsletter" value="weekly" />
        </form>
      ),
      container,
    )

    await flushEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    const onInput = vi.fn()
    const onChange = vi.fn()
    input.addEventListener('input', onInput)
    input.addEventListener('change', onChange)

    click(button)
    await flushEffects()
    onInput.mockClear()
    onChange.mockClear()

    form.reset()
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(input.checked).toBe(true)
    expect(input.indeterminate).toBe(false)
    expect(new FormData(form).get('newsletter')).toBe('weekly')
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('retains controlled checkbox state across form reset without bubbling', async () => {
    const checked = createSignal<CheckedState>('indeterminate')
    const onCheckedChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    render(
      () => (
        <form data-testid="form">
          <Root
            checked={checked}
            name="newsletter"
            onCheckedChange={onCheckedChange}
            value="weekly"
          />
        </form>
      ),
      container,
    )

    await flushEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const button = container.querySelector('button') as HTMLButtonElement
    const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    const onInput = vi.fn()
    const onChange = vi.fn()
    input.addEventListener('input', onInput)
    input.addEventListener('change', onChange)

    checked(true)
    await flushEffects()

    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(input.checked).toBe(true)
    expect(input.indeterminate).toBe(false)
    expect(new FormData(form).get('newsletter')).toBe('weekly')
    onInput.mockClear()
    onChange.mockClear()

    form.reset()
    await flushEffects()

    expect(checked()).toBe(true)
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(button.getAttribute('aria-checked')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('checked')
    expect(input.checked).toBe(true)
    expect(input.indeterminate).toBe(false)
    expect(new FormData(form).get('newsletter')).toBe('weekly')
    expect(onInput).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
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

  it('syncs dynamic spread keys without replacing or blurring the trigger', async () => {
    const container = document.createElement('div')
    const rootProps = createSignal<Record<string, unknown>>({
      'aria-label': 'dynamic props',
      'data-mode': 'initial',
    })
    const dynamicProps = mergeProps(prop(() => rootProps()))
    document.body.append(container)

    render(
      () =>
        createVNode(
          Root as unknown as (props: Record<string, unknown>) => ReturnType<typeof Root>,
          dynamicProps,
        ),
      container,
    )

    await flushEffects()
    const initialButton = container.querySelector('button') as HTMLButtonElement
    initialButton.focus()

    expect(document.activeElement).toBe(initialButton)

    rootProps({
      'aria-label': 'dynamic props',
      'data-mode': 'updated',
    })
    await flushEffects()

    expect(container.querySelector('button')).toBe(initialButton)
    expect(document.activeElement).toBe(initialButton)
    expect(initialButton.getAttribute('data-mode')).toBe('updated')

    rootProps({
      'aria-label': 'dynamic props',
      'data-added': 'forwarded',
      'data-mode': 'updated',
      role: 'switch',
    })
    await flushEffects()

    expect(container.querySelector('button')).toBe(initialButton)
    expect(document.activeElement).toBe(initialButton)
    expect(initialButton.getAttribute('data-added')).toBe('forwarded')
    expect(initialButton.getAttribute('data-mode')).toBe('updated')
    expect(initialButton.getAttribute('role')).toBe('switch')

    rootProps({
      'aria-label': 'dynamic props',
    })
    await flushEffects()

    expect(container.querySelector('button')).toBe(initialButton)
    expect(document.activeElement).toBe(initialButton)
    expect(initialButton.hasAttribute('data-added')).toBe(false)
    expect(initialButton.hasAttribute('data-mode')).toBe(false)
    expect(initialButton.getAttribute('role')).toBe('checkbox')
  })
})

type CheckedState = false | true | 'indeterminate'
