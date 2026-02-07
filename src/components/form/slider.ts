import type { FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'

export interface SliderProps {
  value?: number | (() => number)
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onValueChange?: (value: number) => void
  [key: string]: unknown
}

export interface RangeSliderProps {
  value?: [number, number] | (() => [number, number])
  defaultValue?: [number, number]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onValueChange?: (value: [number, number]) => void
  [key: string]: unknown
}

export function Slider(props: SliderProps): FictNode {
  const valueState = createControllableState<number>({
    value: props.value,
    defaultValue: props.defaultValue ?? 0,
    onChange: props.onValueChange,
  })

  return {
    type: 'input',
    props: {
      ...props,
      type: 'range',
      min: props.min ?? 0,
      max: props.max ?? 100,
      step: props.step ?? 1,
      value: () => valueState.get(),
      disabled: props.disabled,
      'data-slider': '',
      onInput: (event: Event) => {
        ;(props.onInput as ((event: Event) => void) | undefined)?.(event)
        const target = event.target as HTMLInputElement | null
        if (!target) return
        valueState.set(Number(target.value))
      },
    },
  }
}

export function RangeSlider(props: RangeSliderProps): FictNode {
  const valueState = createControllableState<[number, number]>({
    value: props.value,
    defaultValue: props.defaultValue ?? [0, 100],
    onChange: props.onValueChange,
  })

  const min = props.min ?? 0
  const max = props.max ?? 100
  const step = props.step ?? 1

  const setStart = (nextStart: number) => {
    const [, end] = valueState.get()
    valueState.set([Math.min(nextStart, end), end])
  }

  const setEnd = (nextEnd: number) => {
    const [start] = valueState.get()
    valueState.set([start, Math.max(start, nextEnd)])
  }

  return {
    type: 'div',
    props: {
      ...props,
      'data-range-slider': '',
      children: [
        {
          type: 'input',
          props: {
            type: 'range',
            min,
            max,
            step,
            value: () => valueState.get()[0],
            disabled: props.disabled,
            'data-range-slider-start': '',
            onInput: (event: Event) => {
              ;(props.onInput as ((event: Event) => void) | undefined)?.(event)
              const target = event.target as HTMLInputElement | null
              if (!target) return
              setStart(Number(target.value))
            },
          },
        },
        {
          type: 'input',
          props: {
            type: 'range',
            min,
            max,
            step,
            value: () => valueState.get()[1],
            disabled: props.disabled,
            'data-range-slider-end': '',
            onInput: (event: Event) => {
              ;(props.onInput as ((event: Event) => void) | undefined)?.(event)
              const target = event.target as HTMLInputElement | null
              if (!target) return
              setEnd(Number(target.value))
            },
          },
        },
      ],
    },
  }
}
