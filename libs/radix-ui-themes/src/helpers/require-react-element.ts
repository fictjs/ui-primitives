import * as React from './element.js'

function isElementNode(value: unknown): value is Element {
  return typeof Element !== 'undefined' && value instanceof Element
}

export const requireReactElement = <T extends React.ReactNode>(children: T): T => {
  const isReactElement = React.isValidElement(children) || isElementNode(children)

  if (!isReactElement) {
    throw Error(
      `Expected a single React Element child, but got: ${React.Children.toArray(children)
        .map((child) =>
          child && typeof child === 'object' && 'type' in child && typeof child.type === 'string'
            ? child.type
            : typeof child,
        )
        .join(', ')}`,
    )
  }

  return children
}
