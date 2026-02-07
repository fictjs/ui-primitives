import type { FictNode } from '@fictjs/runtime'

import { cloneVNodeWithProps, isVNodeLike } from '../../internal/vnode'

export interface SlotProps {
  children?: FictNode
  [key: string]: unknown
}

function getFirstChild(children: FictNode): FictNode | null {
  if (Array.isArray(children)) {
    return (children.find(child => child !== null && child !== undefined && child !== false) ?? null) as
      | FictNode
      | null
  }
  return children ?? null
}

export function Slot(props: SlotProps): FictNode {
  const { children, ...slotProps } = props
  if (children === undefined || children === null) {
    return null
  }

  const child = getFirstChild(children)
  if (!child) {
    return null
  }

  if (!isVNodeLike(child)) {
    return child
  }

  return cloneVNodeWithProps(child, slotProps) as unknown as FictNode
}
