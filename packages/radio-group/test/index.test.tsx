/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { RadioGroup, RadioGroupIndicator, RadioGroupItem } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    })
  )
}

function pressKey(target: Element, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key
    })
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

    mount(() => (
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
    ), container)

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

  it('checks the next item when focused via arrow navigation', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <RadioGroup defaultValue="one">
        <RadioGroupItem data-testid="one" value="one">
          One
        </RadioGroupItem>
        <RadioGroupItem data-testid="two" value="two">
          Two
        </RadioGroupItem>
      </RadioGroup>
    ), container)

    const getButtons = () => {
      const one = container.querySelector('[data-testid="one"]') as HTMLButtonElement
      const two = container.querySelector('[data-testid="two"]') as HTMLButtonElement
      return [one, two] as const
    }
    let [one] = getButtons()
    one.focus()
    pressKey(one, 'ArrowRight')
    await waitForUpdates()

    const [, two] = getButtons()
    expect(document.activeElement).toBe(two)
    expect(two.getAttribute('aria-checked')).toBe('true')
  })

  it('propagates disabled state from the group', () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <RadioGroup disabled>
        <RadioGroupItem data-testid="item" value="one">
          One
        </RadioGroupItem>
      </RadioGroup>
    ), container)

    const item = container.querySelector('[data-testid="item"]') as HTMLButtonElement
    expect(item.disabled).toBe(true)
    expect(item.getAttribute('data-disabled')).toBe('')
  })

  it('keeps form association props on the hidden radio input instead of the button', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <>
        <form id="billing-form" />
        <RadioGroup name="plan" required defaultValue="pro">
          <RadioGroupItem data-testid="item" form="billing-form" value="pro">
            Pro
          </RadioGroupItem>
        </RadioGroup>
      </>
    ), container)

    await waitForUpdates()

    const button = container.querySelector('[data-testid="item"]') as HTMLButtonElement
    const input = container.querySelector('input[type="radio"]') as HTMLInputElement

    expect(button.hasAttribute('form')).toBe(false)
    expect(button.hasAttribute('name')).toBe(false)
    expect(button.hasAttribute('required')).toBe(false)
    expect(input.getAttribute('form')).toBe('billing-form')
    expect(input.getAttribute('name')).toBe('plan')
    expect(input.hasAttribute('required')).toBe(true)
    expect(input.value).toBe('pro')
  })
})
