/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { RadioGroup, RadioGroupIndicator, RadioGroupItem } from '../src/index.js'
import { Radio } from '../src/radio.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

function pressKey(target: Element, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
    }),
  )
}

async function flushEffects(cycles = 4): Promise<void> {
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

async function waitForUpdates(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await flushEffects(6)
}

describe('@fictjs/radio-group', () => {
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

  it('renders a radiogroup and updates checked state on click', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <form>
          <RadioGroup defaultValue="two" name="plan">
            <RadioGroupItem data-testid="one" value="one">
              One
            </RadioGroupItem>
            <RadioGroupItem data-testid="two" value="two">
              <RadioGroupIndicator data-testid="indicator" />
              Two
            </RadioGroupItem>
          </RadioGroup>
        </form>
      ),
      container,
    )

    const getGroup = () => container.querySelector('[role="radiogroup"]') as HTMLDivElement
    const getButtons = () => {
      const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
      const two = container.querySelector('[data-testid="two"]') as HTMLButtonElement
      return [one, two] as const
    }
    const group = getGroup()
    let [one, two] = getButtons()

    expect(group).not.toBeNull()
    expect(two.getAttribute('aria-checked')).toBe('true')
    expect(container.querySelector('[data-testid="indicator"]')).not.toBeNull()

    click(one)
    await waitForUpdates()
    ;[one, two] = getButtons()

    expect(one.getAttribute('aria-checked')).toBe('true')
    expect(two.getAttribute('aria-checked')).toBe('false')
  })

  it('invokes the latest reactive radio check handler', async () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const onCheck = createSignal<() => void>(firstHandler)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => <Radio data-testid="radio" onCheck={prop(() => onCheck()) as unknown as () => void} />,
      container,
    )

    await waitForUpdates()
    onCheck(secondHandler)
    click(container.querySelector('[data-testid="radio"]') as HTMLButtonElement)
    await waitForUpdates()

    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalledOnce()
  })

  it('checks the next item when focused via arrow navigation', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <RadioGroup defaultValue="one">
          <RadioGroupItem data-testid="one" value="one">
            One
          </RadioGroupItem>
          <RadioGroupItem data-testid="two" value="two">
            Two
          </RadioGroupItem>
        </RadioGroup>
      ),
      container,
    )

    const getButtons = () => {
      const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
      const two = container.querySelector('[data-testid="two"]') as HTMLButtonElement
      return [one, two] as const
    }
    const [one] = getButtons()
    one.focus()
    pressKey(one, 'ArrowRight')
    await waitForUpdates()

    const [, two] = getButtons()
    expect(document.activeElement).toBe(two)
    expect(two.getAttribute('aria-checked')).toBe('true')
  })

  it('keeps the root direction attribute and navigation context in sync', async () => {
    const direction = createSignal<'ltr' | 'rtl'>('ltr')
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <RadioGroup data-testid="root" defaultValue="two" dir={prop(() => direction())}>
          <RadioGroupItem data-testid="one" value="one">
            One
          </RadioGroupItem>
          <RadioGroupItem data-testid="two" value="two">
            Two
          </RadioGroupItem>
          <RadioGroupItem data-testid="three" value="three">
            Three
          </RadioGroupItem>
        </RadioGroup>
      ),
      container,
    )

    await waitForUpdates()
    const root = container.querySelector('[data-testid="root"]') as HTMLDivElement
    const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
    const two = container.querySelector('[data-testid="two"]') as HTMLButtonElement
    const three = container.querySelector('[data-testid="three"]') as HTMLButtonElement

    expect(root.getAttribute('dir')).toBe('ltr')
    two.focus()
    pressKey(two, 'ArrowRight')
    await waitForUpdates()
    expect(document.activeElement).toBe(three)

    direction('rtl')
    await waitForUpdates()
    expect(root.getAttribute('dir')).toBe('rtl')
    two.focus()
    pressKey(two, 'ArrowRight')
    await waitForUpdates()
    expect(document.activeElement).toBe(one)
  })

  it('preserves root focus entry while invoking the latest focus handler', async () => {
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const onFocus = createSignal<(event: FocusEvent) => void>(firstHandler)
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <RadioGroup
          defaultValue="two"
          onFocus={prop(() => onFocus()) as unknown as (event: FocusEvent) => void}
          tabIndex={0}
        >
          <RadioGroupItem data-testid="one" value="one">
            One
          </RadioGroupItem>
          <RadioGroupItem data-testid="two" value="two">
            Two
          </RadioGroupItem>
        </RadioGroup>
      ),
      container,
    )

    await waitForUpdates()
    onFocus(secondHandler)
    ;(container.querySelector('[role="radiogroup"]') as HTMLDivElement).focus()
    await waitForUpdates()

    expect(firstHandler).not.toHaveBeenCalled()
    expect(secondHandler).toHaveBeenCalled()
    expect(document.activeElement).toBe(container.querySelector('[data-testid="two"]'))
  })

  it('propagates disabled state from the group', () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <RadioGroup disabled>
          <RadioGroupItem data-testid="item" value="one">
            One
          </RadioGroupItem>
        </RadioGroup>
      ),
      container,
    )

    const item = container.querySelector('[data-testid="item"]') as HTMLButtonElement
    expect(item.disabled).toBe(true)
    expect(item.getAttribute('data-disabled')).toBe('')
  })

  it('keeps form association props on the hidden radio input instead of the button', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <form id="billing-form" />
          <RadioGroup name="plan" required defaultValue="pro">
            <RadioGroupItem data-testid="item" form="billing-form" value="pro">
              Pro
            </RadioGroupItem>
          </RadioGroup>
        </>
      ),
      container,
    )

    expect(container.querySelector('input[type="radio"]')).toBeNull()

    await waitForUpdates()

    const form = container.querySelector('#billing-form') as HTMLFormElement
    const button = container.querySelector('[data-testid="item"]') as HTMLButtonElement
    const input = container.querySelector('input[type="radio"]') as HTMLInputElement

    expect(button.hasAttribute('form')).toBe(false)
    expect(button.hasAttribute('name')).toBe(false)
    expect(button.hasAttribute('required')).toBe(false)
    expect(input.getAttribute('form')).toBe('billing-form')
    expect(input.getAttribute('name')).toBe('plan')
    expect(input.hasAttribute('required')).toBe(true)
    expect(input.value).toBe('pro')
    expect(input.isConnected).toBe(true)
    expect(input.form).toBe(form)
  })

  it('submits the checked value when the group is nested in a form', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <form data-testid="form">
          <RadioGroup name="plan" defaultValue="pro">
            <RadioGroupItem value="basic">Basic</RadioGroupItem>
            <RadioGroupItem value="pro">Pro</RadioGroupItem>
          </RadioGroup>
        </form>
      ),
      container,
    )

    expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(0)

    await waitForUpdates()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const inputs = form.querySelectorAll<HTMLInputElement>('input[type="radio"][name="plan"]')

    expect(inputs).toHaveLength(2)
    expect(Array.from(inputs).every((input) => input.isConnected && input.form === form)).toBe(true)
    expect(new FormData(form).get('plan')).toBe('pro')
  })

  it('waits for a detached radio group to connect before mounting native inputs', async () => {
    const container = document.createElement('div')

    render(
      () => (
        <form data-testid="form">
          <RadioGroup defaultValue="pro" name="plan">
            <RadioGroupItem value="pro">Pro</RadioGroupItem>
          </RadioGroup>
        </form>
      ),
      container,
    )

    await waitForUpdates()
    expect(container.querySelector('input[type="radio"]')).toBeNull()

    document.body.append(container)
    await waitForUpdates()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const input = container.querySelector('input[type="radio"]') as HTMLInputElement
    expect(input.isConnected).toBe(true)
    expect(input.form).toBe(form)
    expect(new FormData(form).get('plan')).toBe('pro')
  })

  it('does not render native inputs when the group has no form owner', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <RadioGroup name="plan" defaultValue="pro">
          <RadioGroupItem value="pro">Pro</RadioGroupItem>
        </RadioGroup>
      ),
      container,
    )

    await waitForUpdates()

    expect(container.querySelector('input[type="radio"]')).toBeNull()
  })

  it('restores ancestor-form state and submission value on reset', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <form data-testid="form">
          <RadioGroup name="plan" defaultValue="pro">
            <RadioGroupItem data-testid="basic" value="basic">
              Basic
            </RadioGroupItem>
            <RadioGroupItem data-testid="pro" value="pro">
              Pro
            </RadioGroupItem>
          </RadioGroup>
        </form>
      ),
      container,
    )

    await waitForUpdates()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const basic = container.querySelector('[data-testid="basic"]') as HTMLButtonElement
    const pro = container.querySelector('[data-testid="pro"]') as HTMLButtonElement

    click(basic)
    await waitForUpdates()
    expect(new FormData(form).get('plan')).toBe('basic')

    form.reset()
    await waitForUpdates()

    expect(basic.getAttribute('aria-checked')).toBe('false')
    expect(pro.getAttribute('aria-checked')).toBe('true')
    expect(new FormData(form).get('plan')).toBe('pro')
  })

  it('restores explicitly associated radio state and submission value on reset', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <form id="billing-form" data-testid="form" />
          <RadioGroup name="plan" defaultValue="pro">
            <RadioGroupItem data-testid="basic" form="billing-form" value="basic">
              Basic
            </RadioGroupItem>
            <RadioGroupItem data-testid="pro" form="billing-form" value="pro">
              Pro
            </RadioGroupItem>
          </RadioGroup>
        </>
      ),
      container,
    )

    await waitForUpdates()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const basic = container.querySelector('[data-testid="basic"]') as HTMLButtonElement
    const pro = container.querySelector('[data-testid="pro"]') as HTMLButtonElement

    click(basic)
    await waitForUpdates()
    expect(new FormData(form).get('plan')).toBe('basic')

    form.reset()
    await waitForUpdates()

    expect(basic.getAttribute('aria-checked')).toBe('false')
    expect(pro.getAttribute('aria-checked')).toBe('true')
    expect(new FormData(form).get('plan')).toBe('pro')
  })

  it('moves the only tab stop when the current item becomes disabled', async () => {
    const container = document.createElement('div')
    const firstDisabled = createSignal(false)
    document.body.append(container)

    mount(
      () => (
        <RadioGroup defaultValue="one">
          <RadioGroupItem data-testid="one" value="one" disabled={firstDisabled}>
            One
          </RadioGroupItem>
          <RadioGroupItem data-testid="two" value="two">
            Two
          </RadioGroupItem>
        </RadioGroup>
      ),
      container,
    )

    await waitForUpdates()

    const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
    const two = container.querySelector('[data-testid="two"]') as HTMLButtonElement
    expect(one.tabIndex).toBe(0)
    expect(two.tabIndex).toBe(-1)

    firstDisabled(true)
    await waitForUpdates()

    expect(one.tabIndex).toBe(-1)
    expect(two.tabIndex).toBe(0)
    expect(
      Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]')).filter(
        (item) => item.tabIndex === 0,
      ),
    ).toHaveLength(1)
  })

  it('uses current DOM order for arrow navigation after items are reordered', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <RadioGroup defaultValue="one" orientation="horizontal">
          <div data-testid="one-wrapper">
            <RadioGroupItem data-testid="one" value="one">
              One
            </RadioGroupItem>
          </div>
          <div data-testid="two-wrapper">
            <RadioGroupItem data-testid="two" value="two">
              Two
            </RadioGroupItem>
          </div>
          <div data-testid="three-wrapper">
            <RadioGroupItem data-testid="three" value="three">
              Three
            </RadioGroupItem>
          </div>
        </RadioGroup>
      ),
      container,
    )

    await waitForUpdates()

    const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
    const twoWrapper = container.querySelector('[data-testid="two-wrapper"]') as HTMLDivElement
    const threeWrapper = container.querySelector('[data-testid="three-wrapper"]') as HTMLDivElement
    twoWrapper.parentElement?.insertBefore(threeWrapper, twoWrapper)

    one.focus()
    pressKey(one, 'ArrowRight')
    await waitForUpdates()

    const three = container.querySelector('[data-testid="three"]') as HTMLButtonElement
    expect(document.activeElement).toBe(three)
    expect(three.getAttribute('aria-checked')).toBe('true')
  })
})
