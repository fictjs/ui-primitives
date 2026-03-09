import type { RefLifecycleCallback, RefObject } from './types.js'

export function createRefFacade<T>(
  initialValue: T | null,
  callback: RefLifecycleCallback<T>,
): RefObject<T> {
  let current = initialValue

  return {
    get current() {
      return current
    },
    set current(value) {
      if (Object.is(current, value)) {
        return
      }

      const lastValue = current
      current = value
      callback(value, lastValue)
    },
  }
}
