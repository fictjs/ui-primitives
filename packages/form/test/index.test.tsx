/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Control, Field, Form, Label, Message, Submit, ValidityState } from '../src/index.js'

function changeInput(target: HTMLInputElement, value: string): void {
  target.value = value
  target.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
}

function invalid(target: HTMLInputElement): void {
  target.dispatchEvent(new Event('invalid', { bubbles: false, cancelable: true }))
}

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
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

describe('@fictjs/form', () => {
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

  it('surfaces built-in validity and associates messages through aria-describedby', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="email">
            <Label>Email</Label>
            <Control required />
            <Message match="valueMissing">Email is required</Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    let input = container.querySelector('input') as HTMLInputElement
    invalid(input)
    await waitForEffects()
    const label = container.querySelector('label') as HTMLLabelElement
    input = container.querySelector('input') as HTMLInputElement
    const message = container.querySelector('span') as HTMLSpanElement

    expect(label.getAttribute('for')).toBe(input.id)
    expect(input.getAttribute('data-invalid')).toBe('true')
    expect(label.getAttribute('data-invalid')).toBe('true')
    expect(message.textContent).toBe('Email is required')
    expect(input.getAttribute('aria-describedby')).toBe(message.id)
  })

  it('keeps the initial matcher while reactive message inputs continue to update', async () => {
    const container = document.createElement('div')
    const customMatcher = vi.fn(() => true)
    const match = createSignal<'valueMissing' | typeof customMatcher>('valueMissing')
    const name = createSignal('primary')
    const forceMatch = createSignal(true)
    const text = createSignal('Initial message')
    const state = createSignal('initial')
    const calls: string[] = []
    const onClick = createSignal<() => void>(() => calls.push('initial'))
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="primary">
            <Control required />
            <Message
              data-testid="message"
              data-state={prop(() => state()) as unknown as string}
              forceMatch={prop(() => forceMatch()) as unknown as boolean}
              match={prop(() => match()) as unknown as 'valueMissing'}
              name={prop(() => name()) as unknown as string}
              onClick={prop(() => onClick()) as unknown as () => void}
            >
              {prop(() => text()) as unknown as string}
            </Message>
          </Field>
          <Field name="secondary">
            <Control required />
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[]
    const message = container.querySelector('[data-testid="message"]') as HTMLSpanElement
    expect(message.textContent).toBe('Initial message')
    expect(message.dataset.state).toBe('initial')
    expect(inputs[0]?.getAttribute('aria-describedby')).toBe(message.id)

    match(customMatcher)
    name('secondary')
    forceMatch(false)
    text('Updated message')
    state('updated')
    onClick(() => calls.push('updated'))
    await waitForEffects()

    expect(container.querySelector('[data-testid="message"]')).toBe(message)
    expect(message.hidden).toBe(true)
    expect(message.dataset.state).toBe('updated')
    expect(inputs[0]?.getAttribute('aria-describedby')).toBeNull()

    invalid(inputs[1] as HTMLInputElement)
    await waitForEffects()

    expect(message.hidden).toBe(false)
    expect(message.textContent).toBe('Updated message')
    expect(customMatcher).not.toHaveBeenCalled()
    expect(inputs[0]?.getAttribute('aria-describedby')).toBeNull()
    expect(inputs[1]?.getAttribute('aria-describedby')).toBe(message.id)

    message.click()
    expect(calls).toEqual(['updated'])
  })

  it('updates default message text without switching its initial implementation', async () => {
    const container = document.createElement('div')
    const match = createSignal<'valueMissing' | undefined>(undefined)
    const text = createSignal('Initial default')
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="email">
            <Control required />
            <Message data-testid="message" match={prop(() => match()) as unknown as 'valueMissing'}>
              {prop(() => text()) as unknown as string}
            </Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    const message = container.querySelector('[data-testid="message"]') as HTMLSpanElement
    expect(message.textContent).toBe('Initial default')

    match('valueMissing')
    text('Updated default')
    await waitForEffects()

    expect(container.querySelector('[data-testid="message"]')).toBe(message)
    expect(message.hidden).toBe(false)
    expect(message.textContent).toBe('Updated default')
  })

  it('preserves caller visibility styles while default message text updates', async () => {
    const container = document.createElement('div')
    const text = createSignal('Initial hidden message')
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="email">
            <Message data-testid="message" hidden style={{ display: 'none' }}>
              {prop(() => text()) as unknown as string}
            </Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()
    const message = container.querySelector('[data-testid="message"]') as HTMLSpanElement
    expect(message.hidden).toBe(true)
    expect(message.style.display).toBe('none')

    text('Updated hidden message')
    await waitForEffects()

    expect(message.textContent).toBe('Updated hidden message')
    expect(message.hidden).toBe(true)
    expect(message.style.display).toBe('none')
  })

  it('keeps the initial default message VNode structure', async () => {
    const container = document.createElement('div')
    const children = createSignal<unknown>(<strong data-testid="initial-child">Initial</strong>)
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="email">
            <Message data-testid="message">{prop(() => children()) as unknown as string}</Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    const message = container.querySelector('[data-testid="message"]') as HTMLSpanElement
    const initialChild = container.querySelector('[data-testid="initial-child"]')
    expect(initialChild?.textContent).toBe('Initial')

    children(<em data-testid="next-child">Next</em>)
    await waitForEffects()

    expect(container.querySelector('[data-testid="message"]')).toBe(message)
    expect(container.querySelector('[data-testid="initial-child"]')).toBe(initialChild)
    expect(container.querySelector('[data-testid="next-child"]')).toBeNull()
  })

  it('invokes the latest form and control handlers from getter-backed props', async () => {
    const container = document.createElement('div')
    const calls: string[] = []
    const onSubmit = createSignal<(event: SubmitEvent) => void>(() => calls.push('submit:first'))
    const onClearServerErrors = createSignal<() => void>(() => calls.push('clear:first'))
    const onChange = createSignal<(event: Event) => void>(() => calls.push('change:first'))
    const onInvalid = createSignal<(event: Event) => void>(() => calls.push('invalid:first'))
    document.body.append(container)

    mount(
      () => (
        <Form
          onSubmit={prop(() => onSubmit()) as unknown as (event: SubmitEvent) => void}
          onClearServerErrors={prop(() => onClearServerErrors()) as unknown as () => void}
        >
          <Field name="email">
            <Control
              onChange={prop(() => onChange()) as unknown as (event: Event) => void}
              onInvalid={prop(() => onInvalid()) as unknown as (event: Event) => void}
            />
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()
    onSubmit(() => calls.push('submit:second'))
    onClearServerErrors(() => calls.push('clear:second'))
    onChange(() => calls.push('change:second'))
    onInvalid(() => calls.push('invalid:second'))

    const input = container.querySelector('input') as HTMLInputElement
    const form = container.querySelector('form') as HTMLFormElement
    changeInput(input, 'latest')
    invalid(input)
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }))
    await waitForEffects()

    expect(calls).toEqual(['change:second', 'invalid:second', 'submit:second', 'clear:second'])
  })

  it('preserves caller ARIA attributes while adding internal descriptions', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="email">
            <Control required aria-describedby="help" aria-invalid="true" />
            <span id="help">Use a work address</span>
            <Message match="valueMissing">Email is required</Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    const input = container.querySelector('input') as HTMLInputElement
    expect(input.getAttribute('aria-describedby')).toBe('help')
    expect(input.getAttribute('aria-invalid')).toBe('true')

    invalid(input)
    await waitForEffects()

    const message = container.querySelector('span:not(#help)') as HTMLSpanElement
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual(['help', message.id])
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('runs custom matchers against form data', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="password">
            <Label>Password</Label>
            <Control />
          </Field>
          <Field name="passwordConfirm">
            <Label>Confirm</Label>
            <Control />
            <Message match={(value, formData) => value !== formData.get('password')}>
              Passwords must match
            </Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    const inputs = Array.from(container.querySelectorAll('input')) as HTMLInputElement[]
    changeInput(inputs[0] as HTMLInputElement, 'secret')
    changeInput(inputs[1] as HTMLInputElement, 'mismatch')
    await waitForEffects()

    const confirmInput = container.querySelectorAll('input')[1] as HTMLInputElement
    const message = container.querySelector('span') as HTMLSpanElement

    expect(message.textContent).toBe('Passwords must match')
    expect(confirmInput.getAttribute('data-invalid')).toBe('true')
  })

  it('shows only the custom message whose matcher failed', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="username">
            <Control />
            <Message data-testid="reserved" match={(value) => value === 'admin'}>
              Username is reserved
            </Message>
            <Message data-testid="length" match={(value) => value.length < 3}>
              Username is too short
            </Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()
    changeInput(container.querySelector('input') as HTMLInputElement, 'admin')
    await waitForEffects()

    const reservedMessage = container.querySelector('[data-testid="reserved"]') as HTMLSpanElement
    const lengthMessage = container.querySelector('[data-testid="length"]') as HTMLSpanElement

    expect(reservedMessage.hidden).toBe(false)
    expect(reservedMessage.textContent).toBe('Username is reserved')
    expect(lengthMessage.hidden).toBe(true)
    expect(lengthMessage.textContent).toBe('')
  })

  it('invokes a promise-returning matcher once per validation', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const match = vi.fn(() => Promise.resolve(false))

    mount(
      () => (
        <Form>
          <Field name="username">
            <Control />
            <Message match={match}>Username is unavailable</Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    const input = container.querySelector('input') as HTMLInputElement
    changeInput(input, 'ada')
    await waitForEffects()

    expect(match).toHaveBeenCalledTimes(1)
    expect(match).toHaveBeenCalledWith('ada', expect.any(FormData))
    expect(input.validity.valid).toBe(true)
  })

  it('ignores async validation results superseded by a newer value', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const firstResult = deferred<boolean>()
    const secondResult = deferred<boolean>()
    const match = vi
      .fn<(value: string) => Promise<boolean>>()
      .mockReturnValueOnce(firstResult.promise)
      .mockReturnValueOnce(secondResult.promise)

    mount(
      () => (
        <Form>
          <Field name="username">
            <Control />
            <Message match={match}>Username is unavailable</Message>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    const input = container.querySelector('input') as HTMLInputElement
    changeInput(input, 'old')
    changeInput(input, 'new')
    expect(match).toHaveBeenCalledTimes(2)

    secondResult.resolve(false)
    await waitForEffects()
    expect(input.validity.valid).toBe(true)
    expect(input.getAttribute('data-invalid')).toBeNull()

    firstResult.resolve(true)
    await waitForEffects()
    expect(input.validity.valid).toBe(true)
    expect(input.getAttribute('data-invalid')).toBeNull()
  })

  it('clears server errors on submit and exposes validity state render props', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const onClearServerErrors = vi.fn()

    mount(
      () => (
        <Form onClearServerErrors={onClearServerErrors}>
          <Field name="name" serverInvalid>
            <Control value="Ada" />
            <ValidityState>
              {(validity) => <output>{validity?.valid ? 'valid' : 'unset'}</output>}
            </ValidityState>
          </Field>
          <Submit>Save</Submit>
        </Form>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('form') as HTMLFormElement
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await waitForEffects()

    expect(onClearServerErrors).toHaveBeenCalledTimes(1)
    expect(container.querySelector('output')?.textContent).toBe('unset')
  })

  it('updates validity state render props after validation', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Form>
          <Field name="email">
            <Control required />
            <ValidityState>
              {(validity) => (
                <output>{validity ? (validity.valid ? 'valid' : 'invalid') : 'unset'}</output>
              )}
            </ValidityState>
          </Field>
        </Form>
      ),
      container,
    )

    await waitForEffects()
    expect(container.querySelector('output')?.textContent).toBe('unset')

    invalid(container.querySelector('input') as HTMLInputElement)
    await waitForEffects()

    expect(container.querySelector('output')?.textContent).toBe('invalid')
  })
})
