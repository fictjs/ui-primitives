import { arrow as arrowCore, type Derivable, type Middleware } from '@floating-ui/dom'

import type { ArrowOptions } from './types.js'
import { toValue } from './utils/toValue.js'
import { unwrapElement } from './utils/unwrapElement.js'

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * This wraps the core `arrow` middleware to allow Fict refs and accessors.
 */
export const arrow = (options: ArrowOptions | Derivable<ArrowOptions>): Middleware => ({
  name: 'arrow',
  options,
  fn(state) {
    const resolvedOptions = typeof options === 'function' ? options(state) : options
    const element = unwrapElement(toValue(resolvedOptions.element))

    if (!element) {
      return {}
    }

    const config =
      resolvedOptions.padding === undefined
        ? { element }
        : { element, padding: resolvedOptions.padding }

    return arrowCore(config).fn(state)
  },
})
