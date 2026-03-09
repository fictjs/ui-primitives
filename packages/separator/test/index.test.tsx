/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { Separator } from '../src/index.js'

describe('@fictjs/separator', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a horizontal separator by default', () => {
    const container = document.createElement('div')

    render(() => <Separator />, container)

    const separator = container.firstElementChild as HTMLDivElement

    expect(separator.dataset.orientation).toBe('horizontal')
    expect(separator.getAttribute('role')).toBe('separator')
    expect(separator.hasAttribute('aria-orientation')).toBe(false)
  })

  it('renders a vertical separator when requested', () => {
    const container = document.createElement('div')

    render(() => <Separator orientation="vertical" />, container)

    const separator = container.firstElementChild as HTMLDivElement

    expect(separator.dataset.orientation).toBe('vertical')
    expect(separator.getAttribute('aria-orientation')).toBe('vertical')
  })

  it('drops accessibility semantics when decorative', () => {
    const container = document.createElement('div')

    render(() => <Separator decorative orientation="vertical" />, container)

    const separator = container.firstElementChild as HTMLDivElement

    expect(separator.getAttribute('role')).toBe('none')
    expect(separator.hasAttribute('aria-orientation')).toBe(false)
  })

  it('falls back to horizontal for invalid orientations', () => {
    const container = document.createElement('div')

    render(() => <Separator orientation={'diagonal' as never} />, container)

    const separator = container.firstElementChild as HTMLDivElement

    expect(separator.dataset.orientation).toBe('horizontal')
  })
})
