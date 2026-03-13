import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Root as ArrowRoot, type ArrowProps as ArrowPrimitiveProps } from '@fictjs/arrow'
import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import {
  arrow as floatingArrow,
  autoUpdate,
  flip,
  hide,
  limitShift,
  offset,
  shift,
  size,
  useFloating,
  type Middleware,
  type Placement,
  type ReferenceType,
} from '@fictjs/floating-ui-dom'
import { Primitive } from '@fictjs/primitive'
import type { Measurable } from '@fictjs/rect'
import { useCallbackRef } from '@fictjs/use-callback-ref'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { useSize } from '@fictjs/use-size'

const SIDE_OPTIONS = ['top', 'right', 'bottom', 'left'] as const
const ALIGN_OPTIONS = ['start', 'center', 'end'] as const

type Side = (typeof SIDE_OPTIONS)[number]
type Align = (typeof ALIGN_OPTIONS)[number]
type MaybeAccessor<T> = T | (() => T)
type Boundary = Element | null
type StyleRecord = Record<string, string | number>
type RefObjectLike<T> = { current: T | null }
type PopperAnchorElement = HTMLDivElement
type PopperContentElement = HTMLDivElement
type PopperArrowElement = SVGSVGElement
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type ScopedProps<P> = P & { __scopePopper?: Scope }

const POPPER_NAME = 'Popper'
const ANCHOR_NAME = 'PopperAnchor'
const CONTENT_NAME = 'PopperContent'
const ARROW_NAME = 'PopperArrow'

const [createPopperContext, createPopperScope] = createContextScope(POPPER_NAME)

type PopperContextValue = {
  anchor: () => Measurable | null
  onAnchorChange(anchor: Measurable | null): void
}

type PopperContentContextValue = {
  placedSide: () => Side
  onArrowChange(arrow: HTMLSpanElement | null): void
  arrowX: () => number | undefined
  arrowY: () => number | undefined
  shouldHideArrow: () => boolean
}

const [PopperProvider, usePopperContext] = createPopperContext<PopperContextValue>(POPPER_NAME)
const [PopperContentProvider, useContentContext] =
  createPopperContext<PopperContentContextValue>(CONTENT_NAME)

interface PopperProps {
  children?: FictNode
}

interface PopperAnchorProps extends PrimitiveDivProps {
  virtualRef?: MaybeAccessor<RefObjectLike<Measurable> | undefined>
}

interface PopperContentProps extends PrimitiveDivProps {
  side?: MaybeAccessor<Side | undefined>
  sideOffset?: MaybeAccessor<number | undefined>
  align?: MaybeAccessor<Align | undefined>
  alignOffset?: MaybeAccessor<number | undefined>
  arrowPadding?: MaybeAccessor<number | undefined>
  avoidCollisions?: MaybeAccessor<boolean | undefined>
  collisionBoundary?: MaybeAccessor<Boundary | Boundary[] | undefined>
  collisionPadding?: MaybeAccessor<number | Partial<Record<Side, number>> | undefined>
  sticky?: MaybeAccessor<'partial' | 'always' | undefined>
  hideWhenDetached?: MaybeAccessor<boolean | undefined>
  updatePositionStrategy?: MaybeAccessor<'optimized' | 'always' | undefined>
  onPlaced?: () => void
}

interface PopperArrowProps extends ArrowPrimitiveProps {}

const OPPOSITE_SIDE: Record<Side, Side> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

function readStyle(value: MaybeAccessor<unknown> | undefined): StyleRecord {
  const nextValue = value === undefined ? undefined : readValue(value as MaybeAccessor<unknown>)
  if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
    return {}
  }

  return nextValue as StyleRecord
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null
}

function isDefined<T>(value: T | false | null | undefined): value is T {
  return Boolean(value)
}

function getSideAndAlignFromPlacement(placement: Placement) {
  const [side, align = 'center'] = placement.split('-')
  return [side as Side, align as Align] as const
}

function transformOrigin(options: { arrowWidth: number; arrowHeight: number }): Middleware {
  return {
    name: 'transformOrigin',
    options,
    fn(data) {
      const { placement, rects, middlewareData } = data
      const cannotCenterArrow =
        middlewareData.arrow?.centerOffset !== undefined && middlewareData.arrow.centerOffset !== 0
      const isArrowHidden = cannotCenterArrow
      const arrowWidth = isArrowHidden ? 0 : options.arrowWidth
      const arrowHeight = isArrowHidden ? 0 : options.arrowHeight
      const [placedSide, placedAlign] = getSideAndAlignFromPlacement(placement)
      const noArrowAlign = { start: '0%', center: '50%', end: '100%' }[placedAlign]
      const arrowXCenter = (middlewareData.arrow?.x ?? 0) + arrowWidth / 2
      const arrowYCenter = (middlewareData.arrow?.y ?? 0) + arrowHeight / 2

      let x = ''
      let y = ''

      if (placedSide === 'bottom') {
        x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`
        y = `${-arrowHeight}px`
      } else if (placedSide === 'top') {
        x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`
        y = `${rects.floating.height + arrowHeight}px`
      } else if (placedSide === 'right') {
        x = `${-arrowHeight}px`
        y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`
      } else if (placedSide === 'left') {
        x = `${rects.floating.width + arrowHeight}px`
        y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`
      }

      return { data: { x, y } }
    },
  }
}

function Popper(props: ScopedProps<PopperProps>): FictNode {
  const anchor = createSignal<Measurable | null>(null)

  return (
    <PopperProvider
      scope={props.__scopePopper as Scope<PopperContextValue | undefined>}
      anchor={anchor}
      onAnchorChange={anchor}
    >
      {props.children}
    </PopperProvider>
  )
}

Popper.displayName = POPPER_NAME

function PopperAnchor(props: ScopedProps<PopperAnchorProps>): FictNode {
  const { __scopePopper, ...anchorProps } = props
  const context = usePopperContext(
    ANCHOR_NAME,
    __scopePopper as Scope<PopperContextValue | undefined>,
  )
  const node = createSignal<PopperAnchorElement | null>(null)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<PopperAnchorElement>, (nextNode) =>
    node(nextNode),
  )
  const virtualRef = () =>
    readValue(props.virtualRef as MaybeAccessor<RefObjectLike<Measurable> | undefined>)

  useLayoutEffect(() => {
    const nextAnchor = (virtualRef()?.current ?? node()) as Measurable | null
    context.onAnchorChange(nextAnchor)

    return () => {
      if (context.anchor() === nextAnchor) {
        context.onAnchorChange(null)
      }
    }
  })

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<PopperAnchorElement>
    if (!forwardedRef) {
      return
    }

    return () => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  if (virtualRef()) {
    return null
  }

  return <Primitive.div {...(anchorProps as Record<string, unknown>)} ref={composedRefs} />
}

PopperAnchor.displayName = ANCHOR_NAME

function PopperContent(props: ScopedProps<PopperContentProps>): FictNode {
  const {
    __scopePopper,
    side: sideProp = 'bottom',
    sideOffset: sideOffsetProp = 0,
    align: alignProp = 'center',
    alignOffset: alignOffsetProp = 0,
    arrowPadding: arrowPaddingProp = 0,
    avoidCollisions: avoidCollisionsProp = true,
    collisionBoundary: collisionBoundaryProp = [],
    collisionPadding: collisionPaddingProp = 0,
    sticky: stickyProp = 'partial',
    hideWhenDetached: hideWhenDetachedProp = false,
    updatePositionStrategy: updatePositionStrategyProp = 'optimized',
    onPlaced,
    ...contentProps
  } = props

  const context = usePopperContext(
    CONTENT_NAME,
    __scopePopper as Scope<PopperContextValue | undefined>,
  )
  const content = createSignal<PopperContentElement | null>(null)
  const arrow = createSignal<HTMLSpanElement | null>(null)
  const contentZIndex = createSignal<string | undefined>(undefined)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<PopperContentElement>, (nextNode) =>
    content(nextNode),
  )
  const arrowSize = useSize(() => arrow())
  const side = () => readValue(sideProp as MaybeAccessor<Side | undefined>) ?? 'bottom'
  const sideOffset = () => readValue(sideOffsetProp as MaybeAccessor<number | undefined>) ?? 0
  const align = () => readValue(alignProp as MaybeAccessor<Align | undefined>) ?? 'center'
  const alignOffset = () => readValue(alignOffsetProp as MaybeAccessor<number | undefined>) ?? 0
  const arrowPadding = () => readValue(arrowPaddingProp as MaybeAccessor<number | undefined>) ?? 0
  const avoidCollisions = () =>
    readValue(avoidCollisionsProp as MaybeAccessor<boolean | undefined>) ?? true
  const collisionBoundary = () =>
    readValue(collisionBoundaryProp as MaybeAccessor<Boundary | Boundary[] | undefined>) ?? []
  const collisionPadding = () =>
    readValue(
      collisionPaddingProp as MaybeAccessor<number | Partial<Record<Side, number>> | undefined>,
    ) ?? 0
  const sticky = () =>
    readValue(stickyProp as MaybeAccessor<'partial' | 'always' | undefined>) ?? 'partial'
  const hideWhenDetached = () =>
    readValue(hideWhenDetachedProp as MaybeAccessor<boolean | undefined>) ?? false
  const updatePositionStrategy = () =>
    readValue(updatePositionStrategyProp as MaybeAccessor<'optimized' | 'always' | undefined>) ??
    'optimized'
  const desiredPlacement = () => (side() + (align() !== 'center' ? `-${align()}` : '')) as Placement
  const placedSide = () => getSideAndAlignFromPlacement(floating.placement())[0]
  const placedAlign = () => getSideAndAlignFromPlacement(floating.placement())[1]
  const handlePlaced = useCallbackRef(onPlaced)

  const floating = useFloating({
    strategy: 'fixed',
    placement: desiredPlacement,
    whileElementsMounted: (reference, floatingElement, update) => {
      return autoUpdate(reference, floatingElement, update, {
        animationFrame: updatePositionStrategy() === 'always',
      })
    },
    elements: {
      reference: () => context.anchor() as ReferenceType | null,
    },
    middleware: () => {
      const currentArrowSize = arrowSize()
      const arrowWidth = currentArrowSize?.width ?? 0
      const arrowHeight = currentArrowSize?.height ?? 0
      const nextCollisionBoundary = collisionBoundary()
      const boundary = Array.isArray(nextCollisionBoundary)
        ? nextCollisionBoundary
        : [nextCollisionBoundary]
      const hasExplicitBoundaries = boundary.length > 0
      const nextCollisionPadding = collisionPadding()
      const detectOverflowOptions = {
        padding:
          typeof nextCollisionPadding === 'number'
            ? nextCollisionPadding
            : { top: 0, right: 0, bottom: 0, left: 0, ...nextCollisionPadding },
        boundary: boundary.filter(isNotNull),
        altBoundary: hasExplicitBoundaries,
      }

      return [
        offset({ mainAxis: sideOffset() + arrowHeight, alignmentAxis: alignOffset() }),
        avoidCollisions() &&
          shift({
            mainAxis: true,
            crossAxis: false,
            ...(sticky() === 'partial' ? { limiter: limitShift() } : {}),
            ...detectOverflowOptions,
          }),
        avoidCollisions() && flip(detectOverflowOptions),
        size({
          ...detectOverflowOptions,
          apply: ({ elements, rects, availableWidth, availableHeight }) => {
            const { width: anchorWidth, height: anchorHeight } = rects.reference
            const contentStyle = elements.floating.style

            contentStyle.setProperty('--radix-popper-available-width', `${availableWidth}px`)
            contentStyle.setProperty('--radix-popper-available-height', `${availableHeight}px`)
            contentStyle.setProperty('--radix-popper-anchor-width', `${anchorWidth}px`)
            contentStyle.setProperty('--radix-popper-anchor-height', `${anchorHeight}px`)
          },
        }),
        arrow() && floatingArrow({ element: arrow, padding: arrowPadding() }),
        transformOrigin({ arrowWidth, arrowHeight }),
        hideWhenDetached() && hide({ strategy: 'referenceHidden', ...detectOverflowOptions }),
      ].filter(isDefined)
    },
  })

  useLayoutEffect(() => {
    if (floating.isPositioned()) {
      handlePlaced?.()
    }
  })

  useLayoutEffect(() => {
    arrow()
    arrowSize()

    if (!context.anchor() || !content() || !arrow()) {
      return
    }

    floating.update()
  })

  useLayoutEffect(() => {
    const currentContent = content()
    if (!currentContent) {
      contentZIndex(undefined)
      return
    }

    contentZIndex(window.getComputedStyle(currentContent).zIndex)
  })

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<PopperContentElement>
    if (!forwardedRef) {
      return
    }

    return () => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  const wrapperProps = mergeProps({
    'data-radix-popper-content-wrapper': '',
    dir: prop(() => readValue(contentProps.dir as MaybeAccessor<string | undefined>) ?? undefined),
    style: prop(() => {
      floating.x()
      floating.y()
      floating.strategy()

      const positioned = floating.isPositioned()
      const middlewareData = floating.middlewareData()
      const nextStyles = {
        ...floating.floatingStyles,
      } as StyleRecord

      return {
        ...nextStyles,
        transform: positioned ? nextStyles.transform : 'translate(0, -200%)',
        minWidth: 'max-content',
        zIndex: contentZIndex() || undefined,
        ['--radix-popper-transform-origin' as string]: [
          middlewareData.transformOrigin?.x,
          middlewareData.transformOrigin?.y,
        ].join(' '),
        ...(middlewareData.hide?.referenceHidden
          ? {
              visibility: 'hidden',
              pointerEvents: 'none',
            }
          : {}),
      }
    }),
  })

  const primitiveProps = mergeProps(() => contentProps as Record<string, unknown>, {
    'data-side': prop(placedSide),
    'data-align': prop(placedAlign),
    style: prop(() => ({
      ...readStyle(contentProps.style as MaybeAccessor<unknown> | undefined),
      animation: !floating.isPositioned() ? 'none' : undefined,
    })),
  })

  return (
    <div {...(wrapperProps as Record<string, unknown>)} ref={floating.refs.setFloating}>
      <PopperContentProvider
        scope={__scopePopper as Scope<PopperContentContextValue | undefined>}
        placedSide={placedSide}
        onArrowChange={arrow}
        arrowX={() => floating.middlewareData().arrow?.x}
        arrowY={() => floating.middlewareData().arrow?.y}
        shouldHideArrow={() => {
          const centerOffset = floating.middlewareData().arrow?.centerOffset
          return centerOffset !== undefined && centerOffset !== 0
        }}
      >
        <Primitive.div {...(primitiveProps as Record<string, unknown>)} ref={composedRefs} />
      </PopperContentProvider>
    </div>
  )
}

PopperContent.displayName = CONTENT_NAME

function PopperArrow(props: ScopedProps<PopperArrowProps>): FictNode {
  const { __scopePopper, ref: forwardedRef, ...arrowProps } = props
  const contentContext = useContentContext(
    ARROW_NAME,
    __scopePopper as Scope<PopperContentContextValue | undefined>,
  )
  const wrapperStyle = () => {
    const placedSide = contentContext.placedSide()
    const baseSide = OPPOSITE_SIDE[placedSide]

    return {
      position: 'absolute',
      left: contentContext.arrowX(),
      top: contentContext.arrowY(),
      [baseSide]: 0,
      transformOrigin: {
        top: '',
        right: '0 0',
        bottom: 'center 0',
        left: '100% 0',
      }[placedSide],
      transform: {
        top: 'translateY(100%)',
        right: 'translateY(50%) rotate(90deg) translateX(-50%)',
        bottom: 'rotate(180deg)',
        left: 'translateY(50%) rotate(-90deg) translateX(50%)',
      }[placedSide],
      visibility: contentContext.shouldHideArrow() ? 'hidden' : undefined,
    } as StyleRecord
  }

  const primitiveProps = mergeProps(() => arrowProps as Record<string, unknown>, {
    style: prop(() => ({
      ...readStyle(arrowProps.style as MaybeAccessor<unknown> | undefined),
      display: 'block',
    })),
  })

  const wrapperProps = mergeProps({
    style: prop(wrapperStyle),
  })

  const rootProps = mergeProps(
    () => primitiveProps as Record<string, unknown>,
    forwardedRef === undefined ? {} : { ref: forwardedRef as PossibleRef<PopperArrowElement> },
  )

  return (
    <span {...(wrapperProps as Record<string, unknown>)} ref={contentContext.onArrowChange}>
      <ArrowRoot {...(rootProps as Record<string, unknown>)} />
    </span>
  )
}

PopperArrow.displayName = ARROW_NAME

const Root = Popper
const Anchor = PopperAnchor
const Content = PopperContent
const Arrow = PopperArrow

export {
  createPopperScope,
  Popper,
  PopperAnchor,
  PopperContent,
  PopperArrow,
  Root,
  Anchor,
  Content,
  Arrow,
  SIDE_OPTIONS,
  ALIGN_OPTIONS,
}

export type { PopperProps, PopperAnchorProps, PopperContentProps, PopperArrowProps }
