import { createSignal } from '@fictjs/runtime/advanced'

import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type RefObjectLike<T> = { current: T | null }
type ElementTarget<T extends Element> = MaybeAccessor<T | null> | RefObjectLike<T>
type Size = { width: number; height: number }
type BorderBoxSize = { inlineSize: number; blockSize: number }

function isRefObject<T>(value: unknown): value is RefObjectLike<T> {
  return typeof value === 'object' && value !== null && 'current' in (value as RefObjectLike<T>)
}

function readTarget<T extends Element>(target: ElementTarget<T>): T | null {
  if (isRefObject<T>(target)) {
    return target.current
  }

  if (typeof target === 'function' && target.length === 0) {
    return (target as () => T | null)()
  }

  return target as T | null
}

function isBorderBoxSize(value: unknown): value is BorderBoxSize {
  return (
    typeof value === 'object' &&
    value !== null &&
    'inlineSize' in value &&
    'blockSize' in value &&
    typeof (value as BorderBoxSize).inlineSize === 'number' &&
    typeof (value as BorderBoxSize).blockSize === 'number'
  )
}

function isElement(value: unknown): value is HTMLElement {
  return typeof Element !== 'undefined' && value instanceof Element
}

function useSize(target: ElementTarget<HTMLElement>): () => Size | undefined {
  const size = createSignal<Size | undefined>(undefined)

  useLayoutEffect(() => {
    let cleanup: (() => void) | undefined
    let cancelled = false

    const attach = (element: HTMLElement | null) => {
      cleanup?.()
      cleanup = undefined

      if (!element || !isElement(element)) {
        size(undefined)
        return
      }

      size({ width: element.offsetWidth, height: element.offsetHeight })

      if (typeof ResizeObserver === 'undefined') {
        return
      }

      const resizeObserver = new ResizeObserver((entries) => {
        if (!Array.isArray(entries) || entries.length === 0) {
          return
        }

        const entry = entries[0]!
        let width: number
        let height: number

        if ('borderBoxSize' in entry) {
          const borderBoxEntry = entry.borderBoxSize
          const borderBox = Array.isArray(borderBoxEntry)
            ? (borderBoxEntry[0] as unknown)
            : (borderBoxEntry as unknown)
          if (isBorderBoxSize(borderBox)) {
            width = borderBox.inlineSize
            height = borderBox.blockSize
          } else {
            width = element.offsetWidth
            height = element.offsetHeight
          }
        } else {
          width = element.offsetWidth
          height = element.offsetHeight
        }

        size({ width, height })
      })

      resizeObserver.observe(element, { box: 'border-box' })
      cleanup = () => {
        resizeObserver.unobserve(element)
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

  return size
}

export { useSize }
export type { ElementTarget }
