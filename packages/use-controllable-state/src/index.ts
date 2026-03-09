type MaybeAccessor<T> = T | (() => T)

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

import { createSignal } from '@fictjs/runtime/advanced'

import { useEffectEvent } from '@fictjs/use-effect-event'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type ChangeHandler<T> = (state: T) => void
type SetStateFn<T> = (value: T | ((prev: T) => T)) => void

interface UseControllableStateParams<T> {
  prop?: MaybeAccessor<T | undefined>
  defaultProp: MaybeAccessor<T>
  onChange?: ChangeHandler<T>
  caller?: string
}

const noop = () => {}

function useControllableState<T>({
  prop,
  defaultProp,
  onChange = noop as ChangeHandler<T>,
  caller,
}: UseControllableStateParams<T>): [() => T, SetStateFn<T>] {
  const uncontrolled = createSignal(readValue(defaultProp))
  const emitChange = useEffectEvent(onChange)
  const controlledState = () => (prop === undefined ? undefined : readValue(prop))
  const value = () => {
    const currentProp = controlledState()
    return currentProp !== undefined ? currentProp : uncontrolled()
  }

  let lastMode = controlledState() !== undefined
  useLayoutEffect(() => {
    const nextMode = controlledState() !== undefined

    if (process.env.NODE_ENV !== 'production' && lastMode !== nextMode) {
      const from = lastMode ? 'controlled' : 'uncontrolled'
      const to = nextMode ? 'controlled' : 'uncontrolled'
      const label = caller ?? 'useControllableState'
      console.warn(
        label +
          ' is changing from ' +
          from +
          ' to ' +
          to +
          '. Components should stay either controlled or uncontrolled for their lifetime.',
      )
    }

    lastMode = nextMode
  })

  const setValue: SetStateFn<T> = (nextValue) => {
    const current = value()
    const resolved =
      typeof nextValue === 'function' ? (nextValue as (prev: T) => T)(current) : nextValue

    if (controlledState() !== undefined) {
      if (!Object.is(current, resolved)) {
        emitChange(resolved)
      }
      return
    }

    if (!Object.is(current, resolved)) {
      uncontrolled(resolved)
      emitChange(resolved)
    }
  }

  return [value, setValue]
}

export { useControllableState }
export type { ChangeHandler, SetStateFn, UseControllableStateParams }
