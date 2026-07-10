import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { jsx as createVNode } from '@fictjs/runtime/jsx-runtime'

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function createComponentNode(component: unknown, props: Record<string, unknown>): FictNode {
  return createVNode(component as (props: Record<string, unknown>) => FictNode, props)
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
  const context = usePopperContext(
    ANCHOR_NAME,
    props.__scopePopper as Scope<PopperContextValue | undefined>,
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

  return createComponentNode(
    Primitive.div,
    mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        __scopePopper: undefined,
        ref: composedRefs,
        virtualRef: undefined,
      },
    ),
  )
}

PopperAnchor.displayName = ANCHOR_NAME

function PopperContent(props: ScopedProps<PopperContentProps>): FictNode {
  const context = usePopperContext(
    CONTENT_NAME,
    props.__scopePopper as Scope<PopperContextValue | undefined>,
  )
  const content = createSignal<PopperContentElement | null>(null)
  const arrow = createSignal<HTMLSpanElement | null>(null)
  const arrowOffsets = createSignal<{ x: number | undefined; y: number | undefined }>({
    x: undefined,
    y: undefined,
  })
  const contentZIndex = createSignal<string | undefined>(undefined)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<PopperContentElement>, (nextNode) =>
    content(nextNode),
  )
  const arrowSize = useSize(() => arrow())
  const side = () => readValue(props.side as MaybeAccessor<Side | undefined>) ?? 'bottom'
  const sideOffset = () => readValue(props.sideOffset as MaybeAccessor<number | undefined>) ?? 0
  const align = () => readValue(props.align as MaybeAccessor<Align | undefined>) ?? 'center'
  const alignOffset = () => readValue(props.alignOffset as MaybeAccessor<number | undefined>) ?? 0
  const arrowPadding = () => readValue(props.arrowPadding as MaybeAccessor<number | undefined>) ?? 0
  const avoidCollisions = () =>
    readValue(props.avoidCollisions as MaybeAccessor<boolean | undefined>) ?? true
  const collisionBoundary = () =>
    readValue(props.collisionBoundary as MaybeAccessor<Boundary | Boundary[] | undefined>) ?? []
  const collisionPadding = () =>
    readValue(
      props.collisionPadding as MaybeAccessor<number | Partial<Record<Side, number>> | undefined>,
    ) ?? 0
  const sticky = () =>
    readValue(props.sticky as MaybeAccessor<'partial' | 'always' | undefined>) ?? 'partial'
  const hideWhenDetached = () =>
    readValue(props.hideWhenDetached as MaybeAccessor<boolean | undefined>) ?? false
  const updatePositionStrategy = () =>
    readValue(props.updatePositionStrategy as MaybeAccessor<'optimized' | 'always' | undefined>) ??
    'optimized'
  const desiredPlacement = () => (side() + (align() !== 'center' ? `-${align()}` : '')) as Placement
  const placedSide = () => getSideAndAlignFromPlacement(floating.placement())[0]
  const placedAlign = () => getSideAndAlignFromPlacement(floating.placement())[1]
  const handlePlaced = useCallbackRef<() => void>(prop(() => props.onPlaced))

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
        avoidCollisions() && flip(detectOverflowOptions),
        avoidCollisions() &&
          shift({
            mainAxis: true,
            crossAxis: false,
            ...(sticky() === 'partial' ? { limiter: limitShift() } : {}),
            ...detectOverflowOptions,
          }),
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
    floating.isPositioned()
    floating.x()
    floating.y()
    floating.placement()
    floating.middlewareData()

    const middlewareArrow = floating.middlewareData().arrow
    const middlewareX = middlewareArrow?.x
    const middlewareY = middlewareArrow?.y

    if (middlewareX !== undefined || middlewareY !== undefined) {
      arrowOffsets({ x: middlewareX, y: middlewareY })
      return
    }

    const currentAnchor = context.anchor()
    const currentContent = content()
    const currentArrow = arrow()

    if (!currentAnchor || !currentContent || !currentArrow) {
      arrowOffsets({ x: undefined, y: undefined })
      return
    }

    const referenceRect = currentAnchor.getBoundingClientRect()
    const contentRect = currentContent.getBoundingClientRect()
    const arrowRect = currentArrow.getBoundingClientRect()

    if (placedSide() === 'top' || placedSide() === 'bottom') {
      arrowOffsets({
        x: clamp(
          referenceRect.left + referenceRect.width / 2 - contentRect.left - arrowRect.width / 2,
          0,
          Math.max(contentRect.width - arrowRect.width, 0),
        ),
        y: undefined,
      })
      return
    }

    arrowOffsets({
      x: undefined,
      y: clamp(
        referenceRect.top + referenceRect.height / 2 - contentRect.top - arrowRect.height / 2,
        0,
        Math.max(contentRect.height - arrowRect.height, 0),
      ),
    })
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
    dir: prop(() => readValue(props.dir as MaybeAccessor<string | undefined>) ?? undefined),
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

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopePopper: undefined,
      align: undefined,
      alignOffset: undefined,
      arrowPadding: undefined,
      avoidCollisions: undefined,
      collisionBoundary: undefined,
      collisionPadding: undefined,
      hideWhenDetached: undefined,
      onPlaced: undefined,
      ref: undefined,
      side: undefined,
      sideOffset: undefined,
      sticky: undefined,
      updatePositionStrategy: undefined,
      'data-side': prop(placedSide),
      'data-align': prop(placedAlign),
      style: prop(() => ({
        ...readStyle(props.style as MaybeAccessor<unknown> | undefined),
        animation: !floating.isPositioned() ? 'none' : undefined,
      })),
    },
  )
  const contentNode = createComponentNode(
    Primitive.div,
    mergeProps(primitiveProps, { ref: composedRefs }),
  )

  return (
    <div {...(wrapperProps as Record<string, unknown>)} ref={floating.refs.setFloating}>
      <PopperContentProvider
        scope={props.__scopePopper as Scope<PopperContentContextValue | undefined>}
        placedSide={placedSide}
        onArrowChange={arrow}
        arrowX={() => arrowOffsets().x}
        arrowY={() => arrowOffsets().y}
        shouldHideArrow={() => {
          const centerOffset = floating.middlewareData().arrow?.centerOffset
          return centerOffset !== undefined && centerOffset !== 0
        }}
      >
        {contentNode}
      </PopperContentProvider>
    </div>
  )
}

PopperContent.displayName = CONTENT_NAME

function PopperArrow(props: ScopedProps<PopperArrowProps>): FictNode {
  const contentContext = useContentContext(
    ARROW_NAME,
    props.__scopePopper as Scope<PopperContentContextValue | undefined>,
  )
  const node = createSignal<HTMLSpanElement | null>(null)
  const composedRefs = useComposedRefs(contentContext.onArrowChange, (nextNode) => node(nextNode))
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

  useLayoutEffect(() => {
    const currentNode = node()
    if (!currentNode) {
      return
    }

    const baseSide = OPPOSITE_SIDE[contentContext.placedSide()]
    const nextX = contentContext.arrowX()
    const nextY = contentContext.arrowY()

    if (nextX === undefined && baseSide !== 'left') {
      currentNode.style.removeProperty('left')
    } else if (nextX !== undefined) {
      currentNode.style.left = `${nextX}px`
    }

    if (nextY === undefined && baseSide !== 'top') {
      currentNode.style.removeProperty('top')
    } else if (nextY !== undefined) {
      currentNode.style.top = `${nextY}px`
    }
  })

  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopePopper: undefined,
      ref: undefined,
      style: prop(() => ({
        ...readStyle(props.style as MaybeAccessor<unknown> | undefined),
        display: 'block',
      })),
    },
  )

  const wrapperProps = mergeProps({
    style: prop(wrapperStyle),
  })

  const rootProps = mergeProps(
    prop(() => primitiveProps as Record<string, unknown>),
    props.ref === undefined ? {} : { ref: props.ref as PossibleRef<PopperArrowElement> },
  )
  const arrowNode = createComponentNode(ArrowRoot, rootProps)

  return (
    <span {...(wrapperProps as Record<string, unknown>)} ref={composedRefs}>
      {arrowNode}
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
