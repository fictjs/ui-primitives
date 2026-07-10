import { createEffect, mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

import { createContextScope, type Scope } from '@fictjs/context'
import { Primitive } from '@fictjs/primitive'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeProgress?: Scope<ProgressContextValue | undefined> }
type ProgressState = 'indeterminate' | 'complete' | 'loading'

const PROGRESS_NAME = 'Progress'
const INDICATOR_NAME = 'ProgressIndicator'
const DEFAULT_MAX = 100

const [createProgressContext, createProgressScope] = createContextScope(PROGRESS_NAME)

type ProgressContextValue = {
  value: () => number | null
  max: () => number
}

const [ProgressProvider, useProgressContext] =
  createProgressContext<ProgressContextValue>(PROGRESS_NAME)

type ProgressProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
  value?: MaybeAccessor<number | null | undefined>
  max?: MaybeAccessor<number | undefined>
  getValueLabel?: (value: number, max: number) => string
}

type ProgressIndicatorProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

function defaultGetValueLabel(value: number, max: number): string {
  return `${Math.round((value / max) * 100)}%`
}

function getProgressState(value: number | null | undefined, maxValue: number): ProgressState {
  return value == null ? 'indeterminate' : value === maxValue ? 'complete' : 'loading'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

function isValidMaxNumber(max: unknown): max is number {
  return isNumber(max) && !Number.isNaN(max) && max > 0
}

function isValidValueNumber(value: unknown, max: number): value is number {
  return isNumber(value) && !Number.isNaN(value) && value >= 0 && value <= max
}

function getInvalidMaxError(propValue: string, componentName: string): string {
  return `Invalid prop \`max\` of value \`${propValue}\` supplied to \`${componentName}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`
}

function getInvalidValueError(propValue: string, componentName: string): string {
  return `Invalid prop \`value\` of value \`${propValue}\` supplied to \`${componentName}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${DEFAULT_MAX} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`
}

function Progress(props: ScopedProps<ProgressProps>): FictNode {
  const max = () => {
    const candidate = props.max === undefined ? undefined : readValue(props.max)
    return isValidMaxNumber(candidate) ? candidate : DEFAULT_MAX
  }

  const value = () => {
    const candidate = readValue(props.value ?? null)
    return isValidValueNumber(candidate, max()) ? candidate : null
  }

  const valueLabel = () => {
    const currentValue = value()
    return isNumber(currentValue)
      ? (props.getValueLabel ?? defaultGetValueLabel)(currentValue, max())
      : undefined
  }

  createEffect(() => {
    const candidateMax = props.max === undefined ? undefined : readValue(props.max)
    const candidateValue = readValue(props.value ?? null)

    if ((candidateMax || candidateMax === 0) && !isValidMaxNumber(candidateMax)) {
      console.error(getInvalidMaxError(String(candidateMax), PROGRESS_NAME))
    }

    if (
      candidateValue !== null &&
      candidateValue !== undefined &&
      !isValidValueNumber(candidateValue, max())
    ) {
      console.error(getInvalidValueError(String(candidateValue), PROGRESS_NAME))
    }
  })

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeProgress: undefined,
      value: undefined,
      max: undefined,
      getValueLabel: undefined,
      'aria-valuemax': prop(max),
      'aria-valuemin': 0,
      'aria-valuenow': prop(() => {
        const currentValue = value()
        return isNumber(currentValue) ? currentValue : undefined
      }),
      'aria-valuetext': prop(valueLabel),
      role: 'progressbar',
      'data-state': prop(() => getProgressState(value(), max())),
      'data-value': prop(() => value() ?? undefined),
      'data-max': prop(max),
    },
  )

  return (
    <ProgressProvider scope={props.__scopeProgress} value={value} max={max}>
      <Primitive.div {...primitiveProps} />
    </ProgressProvider>
  )
}

Progress.displayName = PROGRESS_NAME

function ProgressIndicator(props: ScopedProps<ProgressIndicatorProps>): FictNode {
  const context = useProgressContext(INDICATOR_NAME, props.__scopeProgress)
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeProgress: undefined,
      'data-state': prop(() => getProgressState(context.value(), context.max())),
      'data-value': prop(() => context.value() ?? undefined),
      'data-max': prop(context.max),
    },
  )

  return <Primitive.div {...primitiveProps} />
}

ProgressIndicator.displayName = INDICATOR_NAME

const Root = Progress
const Indicator = ProgressIndicator

export { createProgressScope, Progress, ProgressIndicator, Root, Indicator }
export type { ProgressProps, ProgressIndicatorProps }
