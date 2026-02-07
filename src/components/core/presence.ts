import type { FictNode } from '@fictjs/runtime'

import { read } from '../../internal/accessor'
import type { MaybeAccessor } from '../../internal/types'

export interface PresenceProps {
  present?: MaybeAccessor<boolean>
  forceMount?: MaybeAccessor<boolean>
  children?: FictNode | ((state: { present: boolean }) => FictNode)
}

export function Presence(props: PresenceProps): () => FictNode {
  return () => {
    const present = read(props.present, true)
    const forceMount = read(props.forceMount, false)

    if (!present && !forceMount) {
      return null
    }

    if (typeof props.children === 'function') {
      return (props.children as (state: { present: boolean }) => FictNode)({ present })
    }

    return props.children ?? null
  }
}
