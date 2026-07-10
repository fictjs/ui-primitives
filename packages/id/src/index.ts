type MaybeAccessor<T> = T | (() => T)

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

import { createSignal } from '@fictjs/runtime/advanced'
import { __fictGetCurrentSSRSession } from '@fictjs/runtime/internal'

import { useLayoutEffect } from '@fictjs/use-layout-effect'

let clientIdCounter = 0
const serverIdCounters = new WeakMap<object, number>()

function getNextGeneratedId(): string {
  const serverSession = __fictGetCurrentSSRSession()
  if (!serverSession) {
    clientIdCounter += 1
    return 'fict-' + clientIdCounter
  }

  const nextCounter = (serverIdCounters.get(serverSession) ?? 0) + 1
  serverIdCounters.set(serverSession, nextCounter)
  return 'fict-' + nextCounter
}

function useId(determinedId?: MaybeAccessor<string | undefined>): () => string {
  let generatedId: string | undefined
  const getGeneratedId = () => (generatedId ??= getNextGeneratedId())
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
