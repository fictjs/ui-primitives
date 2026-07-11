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

  const initialContainer = resolveContainer()
  if (!initialContainer) return null

  const portal = createFictPortal(
    initialContainer,
    () => <Primitive.div {...(portalProps as Record<string, unknown>)} />,
    createElement,
  )

  createEffect(() => {
    const container = resolveContainer()
    if (!container || portal.marker.parentNode === container) return

    // This portal always renders one wrapper immediately before the runtime marker.
    // Move that pair so retargeting does not register another cleanup on the parent root.
    const portalNode = portal.marker.previousSibling
    if (portalNode) {
      container.appendChild(portalNode)
    }
    container.appendChild(portal.marker)
  })

  return null
}

Portal.displayName = 'Portal'

const Root = Portal

export { Portal, Root }
export type { PortalProps }
