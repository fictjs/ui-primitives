import { createEffect } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { observeElementRect, type Measurable } from '@fictjs/rect'

type MaybeAccessor<T> = T | (() => T)
type RefObjectLike<T> = { current: T | null }
type RectTarget<T extends Measurable> = MaybeAccessor<T | null> | RefObjectLike<T>

function isRefObject<T>(value: unknown): value is RefObjectLike<T> {
  return typeof value === 'object' && value !== null && 'current' in (value as RefObjectLike<T>)
}

function readTarget<T extends Measurable>(target: RectTarget<T>): T | null {
  if (isRefObject<T>(target)) {
    return target.current
  }

  if (typeof target === 'function' && target.length === 0) {
    return (target as () => T | null)()
  }

  return target as T | null
}

function useRect(target: RectTarget<Measurable>): () => DOMRect | undefined {
  const rect = createSignal<DOMRect | undefined>(undefined)

  createEffect(() => {
    let cleanup: (() => void) | undefined
    let cancelled = false

    const attach = (measurable: Measurable | null) => {
      cleanup?.()
      cleanup = undefined

      if (!measurable) {
        rect(undefined)
        return
      }

      const unobserve = observeElementRect(measurable, (nextRect) => {
        rect(nextRect)
      })

      cleanup = () => {
        rect(undefined)
        unobserve()
      }
    }

    attach(readTarget(target))

    if (isRefObject(target)) {
      queueMicrotask(() => {
        if (!cancelled) {
          attach(target.current)
        }
      })
    }

    return () => {
      cancelled = true
      cleanup?.()
    }
  })

  return rect
}

export { useRect }
export type { RectTarget }
