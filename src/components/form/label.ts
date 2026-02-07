import type { FictNode } from '@fictjs/runtime'

export interface LabelProps {
  htmlFor?: string
  children?: FictNode
  [key: string]: unknown
}

export function Label(props: LabelProps): FictNode {
  return {
    type: 'label',
    props: {
      ...props,
      'data-label': '',
      children: props.children,
    },
  }
}
