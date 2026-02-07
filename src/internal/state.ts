import { createSignal } from '@fictjs/runtime/advanced'

import { read } from './accessor'
import type { MaybeAccessor } from './types'

export interface ControllableStateOptions<T> {
  value?: MaybeAccessor<T | undefined>
  defaultValue: T
  onChange?: (next: T) => void
  equals?: (a: T, b: T) => boolean
}

export interface ControllableStateHandle<T> {
  get: () => T
  set: (next: T) => void
  isControlled: () => boolean
}

export function createControllableState<T>(
  options: ControllableStateOptions<T>,
): ControllableStateHandle<T> {
  const uncontrolled = createSignal(options.defaultValue)

  const isControlled = () => options.value !== undefined

  const get = () => {
    if (isControlled()) {
      return read(options.value, options.defaultValue) as T
    }
    return uncontrolled()
  }

  const set = (next: T) => {
    const prev = get()
    const equals = options.equals ?? Object.is
    if (equals(prev, next)) return

    if (!isControlled()) {
      uncontrolled(next)
    }

    options.onChange?.(next)
  }

  return { get, set, isControlled }
}
