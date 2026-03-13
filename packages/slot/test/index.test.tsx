/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRef, prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Slot, Slottable } from '../src/index.js'

describe('@fictjs/slot', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('merges props into a single child and composes event handlers', () => {
    const events: string[] = []
    const childRef = createRef<HTMLButtonElement>()
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => (
        <Slot
          class="slot"
          onClick={() => {
            events.push('slot')
          }}
          style={{ color: 'red' }}
        >
          <button
            class="child"
            onClick={() => {
              events.push('child')
            }}
            ref={childRef}
            style={{ backgroundColor: 'blue' }}
            type="button"
          >
            Click
          </button>
        </Slot>
      ),
      container,
    )

    const button = childRef.current
    expect(button).not.toBeNull()
    expect(button?.className).toBe('slot child')
    expect(button?.style.color).toBe('red')
    expect(button?.style.backgroundColor).toBe('blue')

    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(events).toEqual(['child', 'slot'])

    dispose()
  })

  it('uses Slottable children as the render target', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Slot class="trigger" data-slot="root">
          <span>left</span>
          <Slottable>
            <button type="button">center</button>
          </Slottable>
          <span>right</span>
        </Slot>
      ),
      container,
    )

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.className).toBe('trigger')
    expect(button?.dataset.slot).toBe('root')
    expect(button?.textContent).toBe('leftcenterright')
  })

  it('returns null when more than one direct child is provided to SlotClone', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Slot>
          <span>first</span>
          <span>second</span>
        </Slot>
      ),
      container,
    )

    expect(container.innerHTML).toBe('')
  })

  it('preserves reactive slot-side props on the slotted child', async () => {
    const container = document.createElement('div')
    const state = createSignal<'open' | 'closed'>('open')
    document.body.appendChild(container)

    render(
      () => (
        <Slot data-state={prop(() => state())}>
          <button data-testid="trigger" type="button">
            Trigger
          </button>
        </Slot>
      ),
      container,
    )

    await Promise.resolve()

    const button = container.querySelector('[data-testid="trigger"]')
    expect(button?.getAttribute('data-state')).toBe('open')

    state('closed')
    await Promise.resolve()

    expect(button?.getAttribute('data-state')).toBe('closed')
  })

  it('applies slot props directly onto DOM element children', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const anchor = document.createElement('a')
    anchor.href = '#direct-child'
    anchor.textContent = 'Direct child'
    anchor.className = 'child'

    render(
      () => (
        <Slot class="slot" data-slot="root">
          {anchor}
        </Slot>
      ),
      container,
    )

    await Promise.resolve()

    const link = container.querySelector('a')
    expect(link).not.toBeNull()
    expect(link?.className).toBe('slot child')
    expect(link?.getAttribute('data-slot')).toBe('root')
    expect(container.querySelector('div')).toBeNull()
  })
})
