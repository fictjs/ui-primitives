import {
  createElement,
  createEffect,
  createPortal as createFictPortal,
  mergeProps,
  prop,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'

type PortalProps = JSX.IntrinsicElements['div'] & {
  container?: Element | DocumentFragment | null
}

function Portal(props: PortalProps): FictNode {
  const resolveContainer = () => props.container ?? globalThis.document?.body ?? null
  const portalProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      container: undefined,
    },
  )

  createEffect(() => {
    const container = resolveContainer()
    if (!container) return

    return createFictPortal(
      container,
      () => <Primitive.div {...(portalProps as Record<string, unknown>)} />,
      createElement,
    ).dispose
  })

  return null
}

Portal.displayName = 'Portal'

const Root = Portal

export { Portal, Root }
export type { PortalProps }
