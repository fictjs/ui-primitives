import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxRoot,
  RangeSlider,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  Slider,
} from '../../src/components/form'

describe('Advanced inputs', () => {
  it('updates slider and range-slider values', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: 'div',
        props: {
          children: [
            { type: Slider, props: { defaultValue: 10, 'data-testid': 'slider' } },
            { type: RangeSlider, props: { defaultValue: [20, 80] } },
          ],
        },
      }),
      container,
    )

    const slider = container.querySelector('[data-testid="slider"]') as HTMLInputElement
    slider.value = '40'
    fireEvent.input(slider)
    await Promise.resolve()

    expect(slider.value).toBe('40')

    dispose()
    container.remove()
  })

  it('selects value from select primitive', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: SelectRoot,
        props: {
          defaultValue: 'a',
          children: [
            {
              type: SelectTrigger,
              props: {
                'data-testid': 'trigger',
                children: { type: SelectValue, props: { placeholder: 'Pick one' } },
              },
            },
            {
              type: SelectContent,
              props: {
                children: [
                  { type: SelectItem, props: { value: 'a', children: 'A' } },
                  { type: SelectItem, props: { value: 'b', 'data-testid': 'item-b', children: 'B' } },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger"]') as HTMLElement)
    fireEvent.click(container.querySelector('[data-testid="item-b"]') as HTMLElement)
    await Promise.resolve()

    expect(container.querySelector('[data-select-value]')?.textContent).toContain('b')

    dispose()
    container.remove()
  })

  it('selects value from combobox item', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ComboboxRoot,
        props: {
          defaultOpen: true,
          children: [
            { type: ComboboxInput, props: { 'data-testid': 'input' } },
            {
              type: ComboboxList,
              props: {
                children: [
                  { type: ComboboxItem, props: { value: 'Apple', children: 'Apple' } },
                  { type: ComboboxItem, props: { value: 'Banana', 'data-testid': 'banana', children: 'Banana' } },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="banana"]') as HTMLElement)
    await Promise.resolve()

    expect((container.querySelector('[data-testid="input"]') as HTMLInputElement).value).toBe('Banana')

    dispose()
    container.remove()
  })
})
