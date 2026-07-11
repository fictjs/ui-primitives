import { createElement, mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { isReactive } from '@fictjs/runtime/advanced'

import { createSlot } from '@fictjs/slot'

type RefCallback<T> = { bivarianceHack(node: T | null): void }['bivarianceHack']
type PossibleRef<T> = RefCallback<T> | { current: T | null } | undefined

function readStructuralValue(value: unknown): unknown {
  let currentValue = value

  for (let depth = 0; depth < 10 && isReactive(currentValue); depth += 1) {
    const nextValue = currentValue()
    if (nextValue === currentValue) break
    currentValue = nextValue
  }

  return currentValue
}

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
    const rawProps = mergeProps({}, props as unknown as Record<string, unknown>)
    const asChildProp = rawProps.asChild
    const forwardedRef = props.ref
    const primitiveProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        asChild: undefined,
        children: undefined,
        ref: undefined,
      },
    )
    const elementProps = mergeProps(
      primitiveProps as Record<string, unknown>,
      forwardedRef === undefined
        ? {
            children: props.children,
          }
        : {
            children: props.children,
            ref: forwardedRef,
          },
    ) as Record<string, unknown>

    if (typeof window !== 'undefined') {
      ;(window as unknown as Window & Record<PropertyKey, unknown>)[Symbol.for('radix-ui')] = true
    }

    const createNode = (type: string | ((props: Record<string, unknown>) => FictNode)) => ({
      type,
      props: elementProps,
      key: undefined,
    })
    const createPrimitive = (asChild: boolean) =>
      createElement(
        createNode(
          asChild ? (Slot as unknown as (props: Record<string, unknown>) => FictNode) : node,
        ),
      )

    // Fict 0.26 conditional branches flush their lifecycle while a nested parent is still
    // detached. Resolve structural props once so descendants mount only after the real tree is
    // committed. Ordinary DOM props remain reactive through `elementProps`.
    return createPrimitive(Boolean(readStructuralValue(asChildProp)))
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
