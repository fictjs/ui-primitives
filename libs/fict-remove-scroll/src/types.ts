import type { Component, FictNode, Ref, StyleProp } from 'fict'
import type { SideCarComponent } from '@fictjs/use-sidecar'

export type Axis = 'v' | 'h'
export type GapMode = 'padding' | 'margin'
export type MaybeAccessor<T> = T | (() => T)

export interface RemoveScrollEffectCallbacks {
  onScrollCapture(event: Event): void
  onWheelCapture(event: WheelEvent): void
  onTouchMoveCapture(event: TouchEvent): void
}

export interface ChildrenNode {
  forwardProps?: false
  children: FictNode
}

export interface ChildrenForward {
  forwardProps: true
  children: FictNode
}

export type IRemoveScrollSelfProps = Record<string, unknown> & {
  ref?: Ref<HTMLElement>
  noRelative?: MaybeAccessor<boolean | undefined>
  noIsolation?: MaybeAccessor<boolean | undefined>
  inert?: MaybeAccessor<boolean | undefined>
  allowPinchZoom?: MaybeAccessor<boolean | undefined>
  enabled?: MaybeAccessor<boolean | undefined>
  removeScrollBar?: MaybeAccessor<boolean | undefined>
  className?: string
  style?: StyleProp
  shards?: MaybeAccessor<Array<HTMLElement | { current: HTMLElement | null }> | undefined>
  as?: string | Component<Record<string, unknown>>
  gapMode?: MaybeAccessor<GapMode | undefined>
}

export type IRemoveScrollProps = IRemoveScrollSelfProps & (ChildrenForward | ChildrenNode)

export type IRemoveScrollUIProps = IRemoveScrollProps & {
  // The sidecar component receives runtime accessor-wrapped props, so its concrete props stay opaque here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sideCar: SideCarComponent<any>
}

export type IRemoveScrollEffectProps = Record<string, unknown> & {
  noRelative?: MaybeAccessor<boolean | undefined>
  noIsolation?: MaybeAccessor<boolean | undefined>
  removeScrollBar?: MaybeAccessor<boolean | undefined>
  allowPinchZoom?: MaybeAccessor<boolean>
  inert?: MaybeAccessor<boolean | undefined>
  shards?: MaybeAccessor<Array<HTMLElement | { current: HTMLElement | null }> | undefined>
  lockRef: { current: HTMLElement | null }
  gapMode?: MaybeAccessor<GapMode | undefined>
  setCallbacks(cb: RemoveScrollEffectCallbacks): void
}

interface WithClassNames {
  classNames: {
    fullWidth: string
    zeroRight: string
  }
}

export type RemoveScrollType = ((props: IRemoveScrollProps) => FictNode) & WithClassNames
export type RemoveScrollUIType = ((props: IRemoveScrollUIProps) => FictNode) & WithClassNames
