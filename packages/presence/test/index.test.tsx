/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Presence } from '../src/index.js'

function flushMicrotasks(): Promise<void> {
  return Promise.resolve()
}

function dispatchAnimationEvent(node: HTMLElement, type: string, animationName: string): void {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'animationName', {
    configurable: true,
    value: animationName,
  })
  node.dispatchEvent(event)
}

describe('@fictjs/presence', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('mounts and unmounts content without exit animations', async () => {
    const present = createSignal(true)
    const container = document.createElement('div')

    render(() => (
      <Presence present={() => present()}>
        <div data-testid="content">Ready</div>
      </Presence>
    ), container)

    expect(container.textContent).toBe('Ready')

    present(false)
    await flushMicrotasks()

    expect(container.textContent).toBe('')
  })

  it('force mounts render-prop children and exposes present state', async () => {
    const present = createSignal(false)
    const container = document.createElement('div')

    render(() => (
      <Presence present={() => present()}>
        {({ present: isPresent }) => <div data-present={String(isPresent)}>Stateful</div>}
      </Presence>
    ), container)

    expect((container.firstElementChild as HTMLDivElement).dataset.present).toBe('false')

    present(true)
    await flushMicrotasks()

    expect((container.firstElementChild as HTMLDivElement).dataset.present).toBe('true')
  })

  it('keeps content mounted until the exit animation completes', async () => {
    const present = createSignal(true)
    const container = document.createElement('div')

    render(() => (
      <Presence present={() => present()}>
        <div data-testid="content" style={{ animationName: 'fade-in' }}>Animated</div>
      </Presence>
    ), container)

    const node = container.firstElementChild as HTMLDivElement
    expect(node.textContent).toBe('Animated')

    node.style.animationName = 'fade-out'
    present(false)
    await flushMicrotasks()

    expect(container.firstElementChild).not.toBeNull()

    const currentNode = container.firstElementChild as HTMLDivElement
    currentNode.style.animationName = 'fade-out'
    dispatchAnimationEvent(currentNode, 'animationstart', 'fade-out')
    dispatchAnimationEvent(currentNode, 'animationend', 'fade-out')
    await flushMicrotasks()

    expect(container.firstElementChild).toBeNull()
  })
})
