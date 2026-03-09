import type {
  ComputePositionConfig,
  ComputePositionReturn,
  MiddlewareData,
  Padding,
  Placement,
  Platform,
  Strategy,
  VirtualElement,
} from '@floating-ui/dom'

export type {
  AlignedPlacement,
  Alignment,
  AutoPlacementOptions,
  AutoUpdateOptions,
  Axis,
  Boundary,
  ClientRectObject,
  ComputePositionConfig,
  ComputePositionReturn,
  Coords,
  Derivable,
  DetectOverflowOptions,
  Dimensions,
  ElementContext,
  ElementRects,
  Elements,
  FlipOptions,
  FloatingElement,
  HideOptions,
  InlineOptions,
  Length,
  Middleware,
  MiddlewareArguments,
  MiddlewareData,
  MiddlewareReturn,
  MiddlewareState,
  NodeScroll,
  OffsetOptions,
  Padding,
  Placement,
  Platform,
  Rect,
  ReferenceElement,
  RootBoundary,
  ShiftOptions,
  Side,
  SideObject,
  SizeOptions,
  Strategy,
  VirtualElement,
} from '@floating-ui/dom'

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Accessor<T> = () => T

export type MaybeAccessor<T> = T | Accessor<T>

export interface RefLike<T> {
  current: T | null
}

export type MaybeElement<T> = T | RefLike<T> | null | undefined

export type ReferenceType = Element | VirtualElement

export type ElementSource<T> = MaybeAccessor<MaybeElement<T>>

export type FloatingStyles = Record<string, string | number> & {
  position: Strategy
  left: number | string
  top: number | string
  transform?: string
  willChange?: string
}

export type UseFloatingData = Prettify<ComputePositionReturn & { isPositioned: boolean }>

export interface UseFloatingRefs<RT extends ReferenceType = ReferenceType> {
  reference: RefLike<RT>
  floating: RefLike<HTMLElement>
  setReference: (node: RT | null) => void
  setFloating: (node: HTMLElement | null) => void
}

export interface UseFloatingElements<RT extends ReferenceType = ReferenceType> {
  readonly reference: RT | null
  readonly floating: HTMLElement | null
}

export type UseFloatingReturn<RT extends ReferenceType = ReferenceType> = Prettify<{
  x: Accessor<number>
  y: Accessor<number>
  strategy: Accessor<Strategy>
  placement: Accessor<Placement>
  middlewareData: Accessor<MiddlewareData>
  isPositioned: Accessor<boolean>
  floatingStyles: FloatingStyles
  update: () => void
  refs: UseFloatingRefs<RT>
  elements: UseFloatingElements<RT>
}>

export type UseFloatingOptions<RT extends ReferenceType = ReferenceType> = Prettify<
  Omit<ComputePositionConfig, 'middleware' | 'placement' | 'platform' | 'strategy'> & {
    placement?: MaybeAccessor<Placement | undefined>
    strategy?: MaybeAccessor<Strategy | undefined>
    middleware?: MaybeAccessor<ComputePositionConfig['middleware'] | undefined>
    platform?: MaybeAccessor<Platform | undefined>
    whileElementsMounted?: (
      reference: RT,
      floating: HTMLElement,
      update: () => void,
    ) => void | (() => void)
    elements?: {
      reference?: ElementSource<RT>
      floating?: ElementSource<HTMLElement>
    }
    open?: MaybeAccessor<boolean | undefined>
    transform?: MaybeAccessor<boolean | undefined>
  }
>

export interface ArrowOptions {
  element: ElementSource<Element>
  padding?: Padding
}
