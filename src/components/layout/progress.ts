import type { FictNode } from '@fictjs/runtime'

export interface ProgressProps {
  value?: number
  max?: number
  children?: FictNode
  [key: string]: unknown
}

export interface MeterProps {
  value?: number
  min?: number
  max?: number
  low?: number
  high?: number
  optimum?: number
  children?: FictNode
  [key: string]: unknown
}

export function Progress(props: ProgressProps): FictNode {
  const max = props.max ?? 100
  const value = Math.min(max, Math.max(0, props.value ?? 0))

  return {
    type: 'div',
    props: {
      ...props,
      value: undefined,
      max: undefined,
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuenow': value,
      'data-progress': '',
      children: {
        type: 'div',
        props: {
          'data-progress-indicator': '',
          style: {
            width: `${(value / max) * 100}%`,
          },
        },
      },
    },
  }
}

export function Meter(props: MeterProps): FictNode {
  const min = props.min ?? 0
  const max = props.max ?? 100
  const value = Math.min(max, Math.max(min, props.value ?? 0))

  return {
    type: 'meter',
    props: {
      ...props,
      min,
      max,
      value,
      low: props.low,
      high: props.high,
      optimum: props.optimum,
      'data-meter': '',
      children: props.children,
    },
  }
}
