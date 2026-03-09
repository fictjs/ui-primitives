import type { Component } from 'fict'

import {
  styleHookSingleton,
  type DynamicInput,
  type MaybeReactive,
  type StyleInput,
} from './hook.js'

export type StyleSingletonProps = Record<string, unknown> & {
  /**
   * Styles to inject.
   */
  styles: StyleInput
  /**
   * Reapplies the stylesheet when the styles input changes.
   *
   * With multiple mounted instances this remains undefined behavior, matching
   * the original singleton design.
   */
  dynamic?: DynamicInput
}

function resolveProp<T>(value: MaybeReactive<T>): T {
  if (typeof value === 'function') {
    const getter = value as () => T
    return getter()
  }

  return value
}

export function styleSingleton(): Component<StyleSingletonProps> {
  const useStyle = styleHookSingleton()

  const Sheet: Component<StyleSingletonProps> = (props) => {
    useStyle(
      () => resolveProp(props.styles),
      () => (props.dynamic === undefined ? undefined : resolveProp(props.dynamic)),
    )

    return []
  }

  return Sheet
}
