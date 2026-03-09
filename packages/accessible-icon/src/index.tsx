import { type FictNode, type FictVNode } from '@fictjs/runtime'

import { VisuallyHidden } from '@fictjs/visually-hidden'

interface AccessibleIconProps {
  children?: FictNode | FictNode[]
  label: string
}

function isVNode(node: unknown): node is FictVNode {
  return !!node && typeof node === 'object' && 'type' in (node as FictVNode)
}

function flattenChildren(children: FictNode | FictNode[] | undefined, result: FictNode[] = []): FictNode[] {
  if (Array.isArray(children)) {
    for (const child of children) {
      flattenChildren(child, result)
    }
    return result
  }

  if (children !== undefined && children !== null && children !== false) {
    result.push(children)
  }

  return result
}

function getOnlyChild(children: FictNode | FictNode[] | undefined): FictNode | null {
  const flattened = flattenChildren(children)
  if (flattened.length !== 1) return null
  return flattened[0] ?? null
}

function cloneVNode(node: FictVNode, props: Record<string, unknown>): FictVNode {
  return {
    ...node,
    props: {
      ...(node.props as Record<string, unknown> | null | undefined),
      ...props,
    },
  }
}

function AccessibleIcon(props: AccessibleIconProps): FictNode {
  const child = getOnlyChild(props.children)

  if (!child || !isVNode(child)) {
    throw new Error('AccessibleIcon expects a single element child.')
  }

  const icon = cloneVNode(child, {
    'aria-hidden': 'true',
    focusable: 'false',
  })

  return (
    <>
      {icon}
      <VisuallyHidden>{props.label}</VisuallyHidden>
    </>
  )
}

AccessibleIcon.displayName = 'AccessibleIcon'

const Root = AccessibleIcon

export { AccessibleIcon, Root }
export type { AccessibleIconProps }
