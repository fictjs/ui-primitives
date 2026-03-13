import type * as React from './element.js'

type LazyReactNode = React.ReactNode | (() => React.ReactNode)

function renderChildren(children: LazyReactNode): React.ReactNode {
  return typeof children === 'function' ? (children as () => React.ReactNode)() : children
}

export { renderChildren }
