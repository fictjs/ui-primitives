/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { AspectRatio } from '../src/index.js'

describe('@fictjs/aspect-ratio', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a ratio wrapper and absolutely positioned content', () => {
    const container = document.createElement('div')

    render(() => (
      <div style={{ width: 500 }}>
        <AspectRatio ratio={1 / 2} id="content">
          <span>Hello</span>
        </AspectRatio>
      </div>
    ), container)

    const wrapper = container.querySelector('[data-radix-aspect-ratio-wrapper]') as HTMLDivElement
    const content = container.querySelector('#content') as HTMLDivElement

    expect(wrapper.style.position).toBe('relative')
    expect(wrapper.style.width).toBe('100%')
    expect(wrapper.style.paddingBottom).toBe('200%')
    expect(content.style.position).toBe('absolute')
    expect(content.style.top).toBe('0px')
    expect(content.style.right).toBe('0px')
    expect(content.style.bottom).toBe('0px')
    expect(content.style.left).toBe('0px')
    expect(content.textContent).toBe('Hello')
  })

  it('merges caller styles onto the inner element', () => {
    const container = document.createElement('div')

    render(() => (
      <AspectRatio style={{ backgroundColor: 'red' }}>
        <span>Styled</span>
      </AspectRatio>
    ), container)

    const content = container.querySelector('[data-radix-aspect-ratio-wrapper] > div') as HTMLDivElement

    expect(content.style.backgroundColor).toBe('red')
    expect(content.style.position).toBe('absolute')
  })
})
