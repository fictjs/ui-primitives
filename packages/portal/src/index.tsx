import { createElement, createPortal as createFictPortal, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Primitive } from '@fictjs/primitive'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type PortalProps = JSX.IntrinsicElements['div'] & {
  container?: Element | DocumentFragment | null
}

function Portal(props: PortalProps): FictNode {
  const { container: containerProp, ...portalProps } = props
  const mounted = createSignal(false)

  useLayoutEffect(() => {
    mounted(true)
  })

  const resolveContainer = () => containerProp ?? (mounted() ? globalThis.document?.body ?? null : null)

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
