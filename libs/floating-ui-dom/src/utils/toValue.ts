export function toValue<T>(value: T | (() => T)): T
export function toValue<T>(value: T | (() => T) | undefined): T | undefined
export function toValue<T>(value: T | (() => T) | undefined): T | undefined {
  if (typeof value === 'function') {
    return (value as () => T)()
  }

  return value
}
