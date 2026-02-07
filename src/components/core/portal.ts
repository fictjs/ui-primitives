import {
  createContext,
  createPortal,
  createElement,
  type FictNode,
  useContext,
  createMemo,
} from '@fictjs/runtime'

import { read } from '../../internal/accessor'
import type { MaybeAccessor } from '../../internal/types'

export interface PortalHostProps {
  container?: MaybeAccessor<HTMLElement | null | undefined>
  children?: FictNode
}

export interface PortalProps {
  container?: MaybeAccessor<HTMLElement | null | undefined>
  disabled?: MaybeAccessor<boolean>
  children?: FictNode
}

const PortalContainerContext = createContext<() => HTMLElement | null>(() =>
  typeof document !== 'undefined' ? document.body : null,
)

function resolveContainer(
  container?: MaybeAccessor<HTMLElement | null | undefined>,
): HTMLElement | null {
  if (container === undefined) {
    return null
  }

  return read(container, null) ?? null
}

export function PortalHost(props: PortalHostProps): FictNode {
  const container = createMemo(() => resolveContainer(props.container))
  return {
    type: PortalContainerContext.Provider,
    props: {
      value: container,
      children: props.children,
    },
  } as unknown as FictNode
}

export function Portal(props: PortalProps): FictNode {
  if (read(props.disabled, false)) {
    return props.children ?? null
  }

  const hostContainerAccessor = useContext(PortalContainerContext)
  const container =
    (props.container !== undefined ? resolveContainer(props.container) : hostContainerAccessor()) ??
    (typeof document !== 'undefined' ? document.body : null)

  if (!container) {
    return null
  }

  return createPortal(container, () => props.children ?? null, createElement) as unknown as FictNode
}
