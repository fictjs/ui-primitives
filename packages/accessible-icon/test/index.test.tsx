/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

import { AccessibleIcon } from '../src/index.js'

describe('@fictjs/accessible-icon', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('renders a hidden text label and hides the icon from assistive tech', () => {
    const container = document.createElement('div')

    render(
      () => (
        <AccessibleIcon label="Close">
          <svg data-testid="icon" viewBox="0 0 32 32">
            <path d="M2 30 L30 2 M30 30 L2 2" />
          </svg>
        </AccessibleIcon>
      ),
      container,
    )

    const icon = container.querySelector('[data-testid="icon"]') as SVGSVGElement

    expect(container.textContent).toContain('Close')
    expect(icon.getAttribute('aria-hidden')).toBe('true')
    expect(icon.getAttribute('focusable')).toBe('false')
  })

  it('throws when rendered without a single child element', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      render(() => <AccessibleIcon label="Close" />, document.createElement('div')),
    ).toThrowError()

    errorSpy.mockRestore()
  })
})
