type MaybeAccessor<T> = T | (() => T)

const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

function resolveRecord<T extends object>(record: T): T {
  const nextRecord = {} as T

  for (const [key, value] of Object.entries(record)) {
    ;(nextRecord as Record<string, unknown>)[key] = readValue(value as MaybeAccessor<unknown>)
  }

  return nextRecord
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (a == null || b == null) return false

  const keysA = Object.keys(a as Record<string, unknown>)
  const keysB = Object.keys(b as Record<string, unknown>)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) return false
  }

  return true
}

export { readValue, resolveRecord, shallowEqual }
export type { MaybeAccessor }
