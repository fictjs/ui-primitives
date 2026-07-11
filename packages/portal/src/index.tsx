import {
  createElement,
  createEffect,
  createPortal as createFictPortal,
  createRoot,
  mergeProps,
  onCleanup,
  prop,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

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

  const documentVersion = createSignal(0)
  let version = 0
  let usesDocumentBoundary = false
  let currentContainer = initialContainer
  let currentDocument = initialContainer.ownerDocument
  const createPortalRoot = (container: Element | DocumentFragment) =>
    createRoot(
      () =>
        createFictPortal(
          container,
          () => <Primitive.div {...(portalProps as Record<string, unknown>)} />,
          createElement,
        ),
      { inherit: true },
    )
  let portalRoot = createPortalRoot(initialContainer)
  let portal = portalRoot.value

  onCleanup(() => portalRoot.dispose())

  createEffect(() => {
    const container = resolveContainer()
    if (!container) return

    currentContainer = container
    if (container.ownerDocument === currentDocument) {
      if (portal.marker.parentNode === container) return

      // This portal always renders one wrapper immediately before the runtime marker.
      // Move that pair for same-document retargets so node identity is preserved.
      const portalNode = portal.marker.previousSibling
      if (portalNode) {
        container.appendChild(portalNode)
      }
      container.appendChild(portal.marker)
      return
    }

    currentDocument = container.ownerDocument
    if (!usesDocumentBoundary) {
      portalRoot.dispose()
      usesDocumentBoundary = true
    }
    version += 1
    documentVersion(version)
  })

  function PortalInstance(): FictNode {
    const nextPortalRoot = createPortalRoot(currentContainer)
    portalRoot = nextPortalRoot
    portal = nextPortalRoot.value
    onCleanup(() => nextPortalRoot.dispose())

    return null
  }

  // After the first owner-document change, the reactive child owns one inherited root at a
  // time. Same-document container changes continue to move the active handle in place.
  return (
    <>
      {reactive(() => {
        documentVersion()
        return usesDocumentBoundary ? <PortalInstance /> : null
      })}
    </>
  )
}

Portal.displayName = 'Portal'

const Root = Portal

export { Portal, Root }
export type { PortalProps }
