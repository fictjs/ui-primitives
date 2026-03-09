/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRef, render } from '@fictjs/runtime'

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

    const dispose = render(() => (
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
    ), container)

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

    render(() => (
      <Slot class="trigger" data-slot="root">
        <span>left</span>
        <Slottable>
          <button type="button">center</button>
        </Slottable>
        <span>right</span>
      </Slot>
    ), container)

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.className).toBe('trigger')
    expect(button?.dataset.slot).toBe('root')
    expect(button?.textContent).toBe('leftcenterright')
  })

  it('returns null when more than one direct child is provided to SlotClone', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(() => (
      <Slot>
        <span>first</span>
        <span>second</span>
      </Slot>
    ), container)

    expect(container.innerHTML).toBe('')
  })
})
