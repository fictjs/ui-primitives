/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { FocusScope } from '../src/index.js'

function pressTab(target: Element, options: { shift?: boolean } = {}): boolean {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Tab',
    shiftKey: options.shift ?? false,
  })

  return target.dispatchEvent(event)
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

function createScopedForm(options: { firstTabIndex?: number; withOuter?: boolean } = {}) {
  const firstInputProps =
    options.firstTabIndex === undefined ? {} : { tabIndex: options.firstTabIndex }

  return (
    <div>
      <FocusScope asChild loop trapped>
        <form>
          <label>
            <span>Name</span>
            <input data-testid="name" type="text" {...firstInputProps} />
          </label>
          <label>
            <span>Email</span>
            <input data-testid="email" type="text" />
          </label>
          <button data-testid="submit" type="button">
            Submit
          </button>
        </form>
      </FocusScope>
      {options.withOuter ? (
        <button data-testid="outer" type="button">
          Outer
        </button>
      ) : null}
    </div>
  )
}

describe('@fictjs/focus-scope', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('loops focus from the last element back to the first', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => createScopedForm(), container)

    await flushEffects()

    const first = container.querySelector('[data-testid="name"]') as HTMLInputElement
    const last = container.querySelector('[data-testid="submit"]') as HTMLButtonElement

    last.focus()
    pressTab(last)
    await flushEffects()

    expect(document.activeElement).toBe(first)
  })

  it('loops focus from the first element to the last on shift+tab', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => createScopedForm(), container)

    await flushEffects()

    const first = container.querySelector('[data-testid="name"]') as HTMLInputElement
    const last = container.querySelector('[data-testid="submit"]') as HTMLButtonElement

    first.focus()
    pressTab(first, { shift: true })
    await flushEffects()

    expect(document.activeElement).toBe(last)
  })

  it('skips negative tabindex elements when looping', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => createScopedForm({ firstTabIndex: -1 }), container)

    await flushEffects()

    const second = container.querySelector('[data-testid="email"]') as HTMLInputElement
    const last = container.querySelector('[data-testid="submit"]') as HTMLButtonElement

    last.focus()
    pressTab(last)
    await flushEffects()

    expect(document.activeElement).toBe(second)
  })

  it('keeps focus trapped inside the scope', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => createScopedForm({ withOuter: true }), container)

    await flushEffects()

    const first = container.querySelector('[data-testid="name"]') as HTMLInputElement
    const outer = container.querySelector('[data-testid="outer"]') as HTMLButtonElement

    first.focus()
    outer.focus()
    await flushEffects()

    expect(document.activeElement).toBe(first)
  })
})
