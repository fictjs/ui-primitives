import type { FictNode, JSX } from '@fictjs/runtime'

import { createSlot } from '@fictjs/slot'

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

type PrimitivePropsWithRef<E extends PrimitiveNode> = JSX.IntrinsicElements[E] & {
  asChild?: boolean
}

type PrimitiveComponent<E extends PrimitiveNode> = ((props: PrimitivePropsWithRef<E>) => FictNode) & {
  displayName?: string
}

type Primitives = {
  [E in PrimitiveNode]: PrimitiveComponent<E>
}

const Primitive = NODES.reduce<Primitives>((primitive, node) => {
  const Slot = createSlot(`Primitive.${node}`)

  const Node = ((props: PrimitivePropsWithRef<typeof node>) => {
    const { asChild, ...primitiveProps } = props
    const Comp = asChild ? Slot : node

    if (typeof window !== 'undefined') {
      ;((window as unknown) as Window & Record<PropertyKey, unknown>)[Symbol.for('radix-ui')] = true
    }

    return <Comp {...(primitiveProps as Record<string, unknown>)} />
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
