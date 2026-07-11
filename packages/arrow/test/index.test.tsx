/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { onMount, prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

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

    render(
      () => (
        <Arrow asChild width={24} height={12} data-arrow="custom">
          <svg>
            <rect width="24" height="12" />
          </svg>
        </Arrow>
      ),
      container,
    )

    const svg = container.querySelector('svg') as SVGSVGElement

    expect(container.childNodes).toHaveLength(1)
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(svg.dataset.arrow).toBe('custom')
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('height')).toBe('12')
    expect(svg.hasAttribute('asChild')).toBe(false)
    expect(svg.querySelector('rect')).not.toBeNull()
    expect(svg.querySelector('polygon')).toBeNull()
  })

  it('resolves accessor-backed asChild synchronously without detached child lifecycle', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const asChild = createSignal(true)
    const mountedWhileConnected: boolean[] = []
    let mountedSvg: SVGSVGElement | null = null

    const CustomArrow = () => {
      onMount(() => {
        mountedWhileConnected.push(mountedSvg?.isConnected ?? false)
      })

      return (
        <svg
          ref={(node) => {
            mountedSvg = node
          }}
        >
          <rect width="24" height="12" />
        </svg>
      )
    }

    const dispose = render(
      () => (
        <Arrow
          asChild={prop(() => asChild()) as unknown as boolean}
          className="dynamic-arrow"
          data-arrow="dynamic"
        >
          <CustomArrow />
        </Arrow>
      ),
      container,
    )

    await Promise.resolve()

    const svg = container.querySelector('svg') as SVGSVGElement
    expect(container.childNodes).toHaveLength(1)
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(svg).toBe(mountedSvg)
    expect(svg.querySelector('rect')).not.toBeNull()
    expect(svg.querySelector('polygon')).toBeNull()
    expect(mountedWhileConnected).toEqual([true])

    asChild(false)
    await Promise.resolve()

    expect(container.querySelector('svg')).toBe(svg)
    expect(mountedWhileConnected).toEqual([true])

    dispose()
  })

  it('applies class and className props to the rendered svg element', async () => {
    const container = document.createElement('div')

    render(
      () => <Arrow data-testid="arrow" class="slot-class" className="theme-class" />,
      container,
    )

    await Promise.resolve()

    const svg = container.querySelector('[data-testid="arrow"]') as SVGSVGElement

    expect(svg.getAttribute('class')).toBe('slot-class theme-class')
  })
})
