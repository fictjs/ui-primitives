import {
  createElement,
  createPortal as createFictPortal,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'

import { Primitive } from '@fictjs/primitive'

type PortalProps = JSX.IntrinsicElements['div'] & {
  container?: Element | DocumentFragment | null
}

function Portal(props: PortalProps): FictNode {
  const { container: containerProp, ...portalProps } = props

  const resolveContainer = () => containerProp ?? globalThis.document?.body ?? null

  return (
    <>
      {() => {
        const container = resolveContainer()
        if (!container) return null

        return createFictPortal(
          container,
          () => <Primitive.div {...(portalProps as Record<string, unknown>)} />,
          createElement,
        )
      }}
    </>
  )
}

Portal.displayName = 'Portal'

const Root = Portal

export { Portal, Root }
export type { PortalProps }
