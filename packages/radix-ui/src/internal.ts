import {
  Primitive as BasePrimitive,
  Root as PrimitiveRoot,
  dispatchDiscreteCustomEvent,
} from '@fictjs/primitive'

export * as Arrow from '@fictjs/arrow'
export * as Collection from '@fictjs/collection'
export { composeRefs, useComposedRefs } from '@fictjs/compose-refs'
export * as Context from '@fictjs/context'
export * as DismissableLayer from '@fictjs/dismissable-layer'
export * as FocusGuards from '@fictjs/focus-guards'
export * as FocusScope from '@fictjs/focus-scope'
export * as Menu from '@fictjs/menu'
export * as Popper from '@fictjs/popper'
export * as Presence from '@fictjs/presence'
export type { PrimitivePropsWithRef } from '@fictjs/primitive'
export * as RovingFocus from '@fictjs/roving-focus'
export { useCallbackRef } from '@fictjs/use-callback-ref'
export { useControllableState, useControllableStateReducer } from '@fictjs/use-controllable-state'
export { useEffectEvent } from '@fictjs/use-effect-event'
export { useEscapeKeydown } from '@fictjs/use-escape-keydown'
export { useIsHydrated } from '@fictjs/use-is-hydrated'
export { useLayoutEffect } from '@fictjs/use-layout-effect'
export { useSize } from '@fictjs/use-size'
export { composeEventHandlers } from '@fictjs/core-primitive'

const Primitive = BasePrimitive as typeof BasePrimitive & {
  Root: typeof PrimitiveRoot
  dispatchDiscreteCustomEvent: typeof dispatchDiscreteCustomEvent
}

Primitive.dispatchDiscreteCustomEvent = dispatchDiscreteCustomEvent
Primitive.Root = PrimitiveRoot

export { Primitive }
