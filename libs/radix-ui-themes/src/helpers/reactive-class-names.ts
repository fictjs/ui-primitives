import { prop } from 'fict'
import baseClassNames from 'classnames'

import { readPropValue } from './extract-props.js'

type ClassNameArgument = classNames.Argument | (() => unknown)

function resolveArgument(value: ClassNameArgument): classNames.Argument {
  const resolvedValue = readPropValue(value)
  if (resolvedValue !== value) {
    return resolveArgument(resolvedValue)
  }

  if (Array.isArray(resolvedValue)) {
    return resolvedValue.map((item) => resolveArgument(item as ClassNameArgument))
  }

  if (resolvedValue && typeof resolvedValue === 'object') {
    return Object.fromEntries(
      Object.entries(resolvedValue).map(([key, item]) => [
        key,
        resolveArgument(item as ClassNameArgument),
      ]),
    )
  }

  return resolvedValue as classNames.Argument
}

/**
 * Joins class names without eagerly consuming Fict prop getters.
 *
 * `extractProps` returns its derived class name as a prop getter so a styling prop can update the
 * mounted element in place. Keeping the joined value as a prop getter lets the DOM or next
 * component own the reactive binding instead of turning it into a one-time string here.
 */
function classNames(...args: ClassNameArgument[]): string {
  return prop(() =>
    baseClassNames(...(args.map(resolveArgument) as classNames.ArgumentArray)),
  ) as unknown as string
}

export { classNames }
