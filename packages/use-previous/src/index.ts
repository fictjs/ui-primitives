type MaybeAccessor<T> = T | (() => T)

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

import { createSignal } from '@fictjs/runtime/advanced'

import { useLayoutEffect } from '@fictjs/use-layout-effect'

function usePrevious<T>(value: MaybeAccessor<T>): () => T | undefined {
  const previous = createSignal<T | undefined>(undefined)
  let current = readValue(value)

  useLayoutEffect(() => {
    const next = readValue(value)

    if (!Object.is(current, next)) {
      previous(current)
      current = next
    }
  })

  return previous
}

export { usePrevious }
