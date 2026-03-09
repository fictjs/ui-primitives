/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { VISUALLY_HIDDEN_STYLES, VisuallyHidden } from '../src/index.js'

describe('@fictjs/visually-hidden', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('applies the expected visually hidden styles', () => {
    const container = document.createElement('div')

    render(() => <VisuallyHidden data-testid="hidden">Hidden content</VisuallyHidden>, container)

    const node = container.querySelector('[data-testid="hidden"]') as HTMLSpanElement
    expect(node.style.position).toBe(String(VISUALLY_HIDDEN_STYLES.position))
    expect(node.style.overflow).toBe(String(VISUALLY_HIDDEN_STYLES.overflow))
    expect(node.style.whiteSpace).toBe(String(VISUALLY_HIDDEN_STYLES.whiteSpace))
    expect(node.textContent).toBe('Hidden content')
  })
})
