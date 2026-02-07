import type { FictNode } from '@fictjs/runtime'

import { VisuallyHidden } from './visually-hidden'

export interface AccessibleIconProps {
  label: string
  children?: FictNode
  [key: string]: unknown
}

export function AccessibleIcon(props: AccessibleIconProps): FictNode {
  const { label, children, ...rest } = props

  return {
    type: 'span',
    props: {
      ...rest,
      children: [
        {
          type: 'span',
          props: {
            'aria-hidden': 'true',
            children,
          },
        },
        {
          type: VisuallyHidden,
          props: {
            children: label,
          },
        },
      ],
    },
  }
}
