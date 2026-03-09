import type { RefLike } from '../types.js'

export function createManagedRef<T>(
  setCurrent: (value: T | null) => void,
  getCurrent: () => T | null,
): RefLike<T> {
  return {
    get current() {
      return getCurrent()
    },
    set current(value) {
      setCurrent(value)
    },
  }
}
