import type { FictNode } from '@fictjs/runtime'

export type MaybeAccessor<T> = T | (() => T)

export interface VNodeLike {
  type: unknown
  props: Record<string, unknown> | null
  key?: string | number
}

export type PrimitiveChild = FictNode | VNodeLike | null | undefined
