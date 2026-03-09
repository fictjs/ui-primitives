import { createEffect, onCleanup, untrack } from 'fict'

import { stylesheetSingleton } from './singleton.js'

export type MaybeReactive<T> = T | (() => T)
export type StyleInput = MaybeReactive<string>
export type DynamicInput = MaybeReactive<boolean | undefined>

/**
 * Creates a Fict style hook backed by a singleton stylesheet.
 *
 * Pass a getter when the styles should react to signal or prop changes.
 */
export type StyleSingletonHook = (styles: StyleInput, isDynamic?: DynamicInput) => void

function resolveReactive<T>(value: MaybeReactive<T>): T {
  if (typeof value === 'function') {
    const getter = value as () => T
    return getter()
  }

  return value
}

export function styleHookSingleton(): StyleSingletonHook {
  const sheet = stylesheetSingleton()

  return (styles, isDynamic = false) => {
    createEffect(() => {
      const dynamic = resolveReactive(isDynamic)
      const nextStyles = dynamic ? resolveReactive(styles) : untrack(() => resolveReactive(styles))

      sheet.add(nextStyles)

      onCleanup(() => {
        sheet.remove()
      })
    })
  }
}
