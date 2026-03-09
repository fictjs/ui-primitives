/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { Arrow } from '../src/index.js'

describe('@fictjs/arrow', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the default arrow polygon', () => {
    const container = document.createElement('div')

    render(() => <Arrow data-testid="arrow" />, container)

    const svg = container.querySelector('[data-testid="arrow"]') as SVGSVGElement
    const polygon = svg.querySelector('polygon')

    expect(svg.getAttribute('width')).toBe('10')
    expect(svg.getAttribute('height')).toBe('5')
    expect(svg.getAttribute('viewBox')).toBe('0 0 30 10')
    expect(svg.getAttribute('preserveAspectRatio')).toBe('none')
    expect(polygon?.getAttribute('points')).toBe('0,0 30,0 15,10')
  })

  it('slots custom svg children when using asChild', () => {
    const container = document.createElement('div')

    render(() => (
      <Arrow asChild width={24} height={12} data-arrow="custom">
        <svg>
          <rect width="24" height="12" />
        </svg>
      </Arrow>
    ), container)

    const svg = container.querySelector('svg') as SVGSVGElement

    expect(svg.dataset.arrow).toBe('custom')
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('height')).toBe('12')
    expect(svg.querySelector('rect')).not.toBeNull()
    expect(svg.querySelector('polygon')).toBeNull()
  })
})
