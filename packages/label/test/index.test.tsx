/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { Label } from '../src/index.js'

describe('@fictjs/label', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('prevents default selection on label double click', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(() => <Label>Name</Label>, container)

    const label = container.querySelector('label') as HTMLLabelElement
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, detail: 2 })
    label.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('does not prevent default when the target is an interactive control', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      () => (
        <Label>
          Name
          <input />
        </Label>
      ),
      container,
    )

    const input = container.querySelector('input') as HTMLInputElement
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true, detail: 2 })
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })
})
