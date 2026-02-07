import type { FictNode } from '@fictjs/runtime'

import { read } from '../../internal/accessor'
import type { MaybeAccessor } from '../../internal/types'

export interface SeparatorProps {
  orientation?: MaybeAccessor<'horizontal' | 'vertical'>
  decorative?: MaybeAccessor<boolean>
  as?: string
  [key: string]: unknown
}

export function Separator(props: SeparatorProps): FictNode {
  const orientation = read(props.orientation, 'horizontal')
  const decorative = read(props.decorative, false)
  const tag = props.as ?? 'div'

  return {
    type: tag,
    props: {
      ...props,
      as: undefined,
      role: decorative ? 'presentation' : 'separator',
      'aria-orientation': orientation,
      'aria-hidden': decorative || undefined,
      'data-orientation': orientation,
    },
  }
}
