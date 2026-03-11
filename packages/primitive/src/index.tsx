import { createElement, mergeProps, type FictNode, type JSX } from '@fictjs/runtime'

import { createSlot } from '@fictjs/slot'

type RefCallback<T> = { bivarianceHack(node: T | null): void }['bivarianceHack']
type PossibleRef<T> = RefCallback<T> | { current: T | null } | undefined

const NODES = [
  'a',
  'button',
  'div',
  'form',
  'h2',
  'h3',
  'img',
  'input',
  'label',
  'li',
  'nav',
  'ol',
  'p',
  'select',
  'span',
  'svg',
  'ul',
] as const

type PrimitiveNode = (typeof NODES)[number]

type PrimitivePropsWithRef<E extends PrimitiveNode> = Omit<JSX.IntrinsicElements[E], 'ref'> & {
  asChild?: boolean
  ref?: PossibleRef<Element>
}

type PrimitiveComponent<E extends PrimitiveNode> = ((
  props: PrimitivePropsWithRef<E>,
) => FictNode) & {
  displayName?: string
}

type Primitives = {
  [E in PrimitiveNode]: PrimitiveComponent<E>
}

const Primitive = NODES.reduce<Primitives>((primitive, node) => {
  const Slot = createSlot(`Primitive.${node}`)

  const Node = ((props: PrimitivePropsWithRef<typeof node>) => {
    const asChild = props.asChild
    const forwardedRef = props.ref
    const primitiveProps = mergeProps(() => props as Record<string, unknown>, {
      asChild: undefined,
      ref: undefined,
    })
    const Comp = asChild ? Slot : node

    if (typeof window !== 'undefined') {
      ;(window as unknown as Window & Record<PropertyKey, unknown>)[Symbol.for('radix-ui')] = true
    }

    return createElement({
      type: Comp as string | ((props: Record<string, unknown>) => FictNode),
      props:
        forwardedRef === undefined
          ? (primitiveProps as Record<string, unknown>)
          : (mergeProps(primitiveProps as Record<string, unknown>, {
              ref: forwardedRef,
            }) as Record<string, unknown>),
      key: undefined,
    })
  }) as PrimitiveComponent<typeof node>

  Node.displayName = `Primitive.${node}`

  return {
    ...primitive,
    [node]: Node,
  }
}, {} as Primitives)

function dispatchDiscreteCustomEvent(target: EventTarget | null, event: CustomEvent): void {
  target?.dispatchEvent(event)
}

const Root = Primitive

export { Primitive, Root, dispatchDiscreteCustomEvent }
export type { PrimitivePropsWithRef }
