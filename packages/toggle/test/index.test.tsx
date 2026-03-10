/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { Root } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

describe('@fictjs/toggle', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('renders with off state by default and toggles on click', () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => <Root>Like</Root>, container)

    const button = container.querySelector('button') as HTMLButtonElement

    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('off')

    click(button)

    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('on')
  })

  it('supports an initial pressed state', () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => <Root defaultPressed>Like</Root>, container)

    const button = container.querySelector('button') as HTMLButtonElement

    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('on')

    click(button)

    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('off')
  })

  it('does not toggle when disabled', () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => <Root disabled>Like</Root>, container)

    const button = container.querySelector('button') as HTMLButtonElement

    expect(button.getAttribute('disabled')).toBe('')
    expect(button.getAttribute('data-disabled')).toBe('')

    click(button)

    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('off')
  })

  it('stays controlled and emits the next value', () => {
    const onPressedChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    render(() => (
      <Root pressed onPressedChange={onPressedChange}>
        Like
      </Root>
    ), container)

    const button = container.querySelector('button') as HTMLButtonElement

    click(button)

    expect(onPressedChange).toHaveBeenCalledTimes(1)
    expect(onPressedChange).toHaveBeenCalledWith(false)
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.getAttribute('data-state')).toBe('on')
  })

  it('respects preventDefault from the consumer click handler', () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => (
      <Root
        onClick={(event) => {
          event.preventDefault()
        }}
      >
        Like
      </Root>
    ), container)

    const button = container.querySelector('button') as HTMLButtonElement

    click(button)

    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.getAttribute('data-state')).toBe('off')
  })
})
