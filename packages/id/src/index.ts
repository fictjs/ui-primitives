type MaybeAccessor<T> = T | (() => T)

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

import { createSignal } from '@fictjs/runtime/advanced'

import { useLayoutEffect } from '@fictjs/use-layout-effect'

let idCounter = 0

function useId(determinedId?: MaybeAccessor<string | undefined>): () => string {
  const initialId = readValue(determinedId ?? 'fict-' + ++idCounter)
  const resolved = createSignal(initialId)

  useLayoutEffect(() => {
    const next = readValue(determinedId ?? resolved())

    if (next !== undefined && next !== resolved()) {
      resolved(next)
    }
  })

  return resolved as () => string
}

export { useId }
