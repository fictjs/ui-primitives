import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

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

  it('supports controlled select value and emits onValueChange', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const value = createSignal('a')
    const changes: string[] = []

    const dispose = render(
      () => ({
        type: SelectRoot,
        props: {
          value: () => value(),
          onValueChange: (next: string) => changes.push(next),
          defaultOpen: true,
          children: [
            {
              type: SelectTrigger,
              props: {
                'data-testid': 'controlled-trigger',
                children: { type: SelectValue, props: { placeholder: 'Pick one' } },
              },
            },
            {
              type: SelectContent,
              props: {
                forceMount: true,
                children: [
                  { type: SelectItem, props: { value: 'a', children: 'A' } },
                  { type: SelectItem, props: { value: 'b', 'data-testid': 'controlled-b', children: 'B' } },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="controlled-b"]') as HTMLElement)
    await Promise.resolve()

    expect(changes).toEqual(['b'])
    expect(container.querySelector('[data-select-value]')?.textContent).toContain('a')

    value('b')
    await Promise.resolve()
    expect(container.querySelector('[data-select-value]')?.textContent).toContain('b')

    dispose()
    container.remove()
  })

  it('supports select forceMount while closed', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: SelectRoot,
        props: {
          defaultOpen: false,
          children: {
            type: SelectContent,
            props: {
              forceMount: true,
              children: 'Mounted while closed',
            },
          },
        },
      }),
      container,
    )

    await Promise.resolve()
    expect(container.querySelector('[data-select-content]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('supports asChild on select trigger and item', async () => {
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
                asChild: true,
                children: {
                  type: 'div',
                  props: {
                    role: 'button',
                    'data-testid': 'trigger-as-child',
                    children: { type: SelectValue, props: { placeholder: 'Pick one' } },
                  },
                },
              },
            },
            {
              type: SelectContent,
              props: {
                children: [
                  { type: SelectItem, props: { value: 'a', children: 'A' } },
                  {
                    type: SelectItem,
                    props: {
                      value: 'b',
                      asChild: true,
                      children: {
                        type: 'span',
                        props: { role: 'option', 'data-testid': 'item-b-as-child', children: 'B' },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="trigger-as-child"]') as HTMLElement)
    fireEvent.click(container.querySelector('[data-testid="item-b-as-child"]') as HTMLElement)
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

  it('filters combobox items by input query', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ComboboxRoot,
        props: {
          defaultOpen: true,
          children: [
            { type: ComboboxInput, props: { 'data-testid': 'filter-input' } },
            {
              type: ComboboxList,
              props: {
                forceMount: true,
                children: [
                  { type: ComboboxItem, props: { value: 'Apple', children: 'Apple' } },
                  { type: ComboboxItem, props: { value: 'Banana', children: 'Banana' } },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    const input = container.querySelector('[data-testid="filter-input"]') as HTMLInputElement
    input.value = 'ban'
    fireEvent.input(input)
    await Promise.resolve()

    expect(container.querySelector('[data-combobox-item="Banana"]')).not.toBeNull()
    expect(container.querySelector('[data-combobox-item="Apple"]')).toBeNull()

    dispose()
    container.remove()
  })

  it('supports asChild on combobox item', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ComboboxRoot,
        props: {
          defaultOpen: true,
          children: [
            { type: ComboboxInput, props: { 'data-testid': 'combo-input-as-child' } },
            {
              type: ComboboxList,
              props: {
                children: {
                  type: ComboboxItem,
                  props: {
                    value: 'Banana',
                    asChild: true,
                    children: {
                      type: 'div',
                      props: { role: 'option', 'data-testid': 'banana-as-child', children: 'Banana' },
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

    fireEvent.click(container.querySelector('[data-testid="banana-as-child"]') as HTMLElement)
    await Promise.resolve()

    expect((container.querySelector('[data-testid="combo-input-as-child"]') as HTMLInputElement).value).toBe('Banana')

    dispose()
    container.remove()
  })
})
