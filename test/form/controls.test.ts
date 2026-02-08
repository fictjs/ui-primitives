import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  Checkbox,
  RadioGroup,
  RadioItem,
  Switch,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from '../../src/components/form'

describe('Form controls', () => {
  it('toggles checkbox state', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(() => ({ type: Checkbox, props: { 'data-testid': 'checkbox', children: 'X' } }), container)

    const checkbox = container.querySelector('[data-testid="checkbox"]') as HTMLElement
    expect(checkbox.getAttribute('data-state')).toBe('unchecked')

    fireEvent.click(checkbox)
    await Promise.resolve()

    expect(checkbox.getAttribute('data-state')).toBe('checked')

    dispose()
    container.remove()
  })

  it('selects radio item in group', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: RadioGroup,
        props: {
          defaultValue: 'a',
          children: [
            { type: RadioItem, props: { value: 'a', 'data-testid': 'a', children: 'A' } },
            { type: RadioItem, props: { value: 'b', 'data-testid': 'b', children: 'B' } },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="b"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-testid="b"]')?.getAttribute('data-state')).toBe('checked')

    dispose()
    container.remove()
  })

  it('supports switch and toggle states', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: 'div',
        props: {
          children: [
            { type: Switch, props: { 'data-testid': 'switch', children: 'S' } },
            { type: Toggle, props: { 'data-testid': 'toggle', children: 'T' } },
            {
              type: ToggleGroup,
              props: {
                type: 'single',
                children: [
                  { type: ToggleGroupItem, props: { value: 'x', 'data-testid': 'gx', children: 'X' } },
                  { type: ToggleGroupItem, props: { value: 'y', 'data-testid': 'gy', children: 'Y' } },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="switch"]') as HTMLElement)
    fireEvent.click(container.querySelector('[data-testid="toggle"]') as HTMLElement)
    fireEvent.click(container.querySelector('[data-testid="gy"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-testid="switch"]')?.getAttribute('data-state')).toBe('checked')
    expect(container.querySelector('[data-testid="toggle"]')?.getAttribute('data-state')).toBe('on')
    expect(container.querySelector('[data-testid="gy"]')?.getAttribute('data-state')).toBe('on')

    dispose()
    container.remove()
  })

  it('supports asChild for radio and toggle group items', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: 'div',
        props: {
          children: [
            {
              type: RadioGroup,
              props: {
                defaultValue: 'a',
                children: [
                  {
                    type: RadioItem,
                    props: {
                      value: 'a',
                      asChild: true,
                      children: {
                        type: 'span',
                        props: { role: 'radio', 'data-testid': 'radio-a-child', children: 'A' },
                      },
                    },
                  },
                  {
                    type: RadioItem,
                    props: {
                      value: 'b',
                      asChild: true,
                      children: {
                        type: 'span',
                        props: { role: 'radio', 'data-testid': 'radio-b-child', children: 'B' },
                      },
                    },
                  },
                ],
              },
            },
            {
              type: ToggleGroup,
              props: {
                type: 'single',
                children: {
                  type: ToggleGroupItem,
                  props: {
                    value: 'x',
                    asChild: true,
                    children: {
                      type: 'div',
                      props: { role: 'button', 'data-testid': 'toggle-child', children: 'Toggle' },
                    },
                  },
                },
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="radio-b-child"]') as HTMLElement)
    fireEvent.click(container.querySelector('[data-testid="toggle-child"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-testid="radio-b-child"]')?.getAttribute('data-state')).toBe('checked')
    expect(container.querySelector('[data-testid="toggle-child"]')?.getAttribute('data-state')).toBe('on')

    dispose()
    container.remove()
  })
})
