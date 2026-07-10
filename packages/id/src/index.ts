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
  let generatedId: string | undefined
  const getGeneratedId = () => (generatedId ??= 'fict-' + ++idCounter)
  const getDeterminedId = () => (determinedId === undefined ? undefined : readValue(determinedId))
  const initialId = getDeterminedId() ?? getGeneratedId()
  const resolved = createSignal(initialId)

  useLayoutEffect(() => {
    const next = getDeterminedId() ?? getGeneratedId()

    if (next !== resolved()) {
      resolved(next)
    }
  })

  return resolved as () => string
}

export { useId }
