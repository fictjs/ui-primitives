type ComparableRecord = Record<string, unknown> & {
  $$typeof?: unknown
}

function isComparableRecord(value: unknown): value is ComparableRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Fork of `fast-deep-equal` that only does the comparisons we need and compares
// functions.
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (typeof a !== typeof b) {
    return false
  }

  if (
    typeof a === 'function' &&
    typeof b === 'function' &&
    Function.prototype.toString.call(a) === Function.prototype.toString.call(b)
  ) {
    return true
  }

  let length: number
  let index: number
  let keys: string[]

  if (Array.isArray(a) && Array.isArray(b)) {
    length = a.length
    if (length !== b.length) {
      return false
    }

    for (index = length; index-- !== 0; ) {
      if (!deepEqual(a[index], b[index])) {
        return false
      }
    }

    return true
  }

  if (isComparableRecord(a) && isComparableRecord(b)) {
    keys = Object.keys(a)
    length = keys.length
    if (length !== Object.keys(b).length) {
      return false
    }

    for (index = length; index-- !== 0; ) {
      const key = keys[index]!
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false
      }
    }

    for (index = length; index-- !== 0; ) {
      const key = keys[index]!
      if (key === '_owner' && a.$$typeof) {
        continue
      }

      if (!deepEqual(a[key], b[key])) {
        return false
      }
    }

    return true
  }

  return Number.isNaN(a) && Number.isNaN(b)
}
