import type { FictNode } from '@fictjs/runtime'

import { Slot } from './slot'

type PrimitiveTag = string

export interface PrimitiveProps {
  as?: PrimitiveTag
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

export function Primitive(props: PrimitiveProps): FictNode {
  const { as = 'div', asChild = false, children, ...rest } = props

  if (asChild) {
    return Slot({ ...rest, children })
  }

  return {
    type: as,
    props: {
      ...rest,
      children,
    },
  }
}

function createPrimitive(tag: PrimitiveTag) {
  return (props: Omit<PrimitiveProps, 'as'>) => Primitive({ ...props, as: tag })
}

export const PrimitiveElements = {
  div: createPrimitive('div'),
  span: createPrimitive('span'),
  button: createPrimitive('button'),
  input: createPrimitive('input'),
  label: createPrimitive('label'),
  form: createPrimitive('form'),
  ul: createPrimitive('ul'),
  li: createPrimitive('li'),
  nav: createPrimitive('nav'),
  section: createPrimitive('section'),
  article: createPrimitive('article'),
} as const
