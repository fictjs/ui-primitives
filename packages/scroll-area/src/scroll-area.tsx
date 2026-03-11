import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { Primitive } from '@fictjs/primitive'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type ScopedProps<P> = P & { __scopeScrollArea?: Scope }
type MaybeAccessor<T> = T | (() => T)
type StyleRecord = Record<string, string | number>
type Orientation = 'horizontal' | 'vertical'
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type ScrollAreaContextValue = {
  viewportRef: { current: HTMLDivElement | null }
  hasHorizontalScrollbar: () => boolean
  hasVerticalScrollbar: () => boolean
  setHasHorizontalScrollbar(value: boolean): void
  setHasVerticalScrollbar(value: boolean): void
}
type ScrollbarContextValue = {
  orientation: () => Orientation
  scrollbarRef: { current: HTMLDivElement | null }
}

const ROOT_NAME = 'ScrollArea'
const VIEWPORT_NAME = 'ScrollAreaViewport'
const SCROLLBAR_NAME = 'ScrollAreaScrollbar'
const THUMB_NAME = 'ScrollAreaThumb'
const CORNER_NAME = 'ScrollAreaCorner'

const [createScrollAreaContext, createScrollAreaScope] = createContextScope(ROOT_NAME)
const [ScrollAreaProvider, useScrollAreaContext] =
  createScrollAreaContext<ScrollAreaContextValue>(ROOT_NAME)
const [ScrollbarProvider, useScrollbarContext] =
  createScrollAreaContext<ScrollbarContextValue>(SCROLLBAR_NAME)

type ScrollAreaProps = PrimitiveDivProps & {
  type?: MaybeAccessor<'auto' | 'always' | 'scroll' | 'hover' | undefined>
  scrollHideDelay?: MaybeAccessor<number | undefined>
}
type ScrollAreaViewportProps = PrimitiveDivProps
type ScrollAreaScrollbarProps = PrimitiveDivProps & {
  orientation: Orientation
}
type ScrollAreaThumbProps = PrimitiveDivProps
type ScrollAreaCornerProps = PrimitiveDivProps

function readStyle(value: unknown): StyleRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as StyleRecord
}

function ScrollArea(props: ScopedProps<ScrollAreaProps>): FictNode {
  const viewportRef = { current: null as HTMLDivElement | null }
  const hasHorizontalScrollbar = createSignal(false)
  const hasVerticalScrollbar = createSignal(false)

  return (
    <ScrollAreaProvider
      scope={props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>}
      viewportRef={viewportRef}
      hasHorizontalScrollbar={hasHorizontalScrollbar}
      hasVerticalScrollbar={hasVerticalScrollbar}
      setHasHorizontalScrollbar={hasHorizontalScrollbar}
      setHasVerticalScrollbar={hasVerticalScrollbar}
    >
      <Primitive.div
        {...(props as Record<string, unknown>)}
        style={{
          position: 'relative',
          ...readStyle(props.style),
        }}
      />
    </ScrollAreaProvider>
  )
}

ScrollArea.displayName = ROOT_NAME

function ScrollAreaViewport(props: ScopedProps<ScrollAreaViewportProps>): FictNode {
  const context = useScrollAreaContext(
    VIEWPORT_NAME,
    props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>,
  )

  return (
    <Primitive.div
      {...(props as Record<string, unknown>)}
      ref={(node: HTMLDivElement | null) => {
        context.viewportRef.current = node
        if (!props.ref) return
        if (typeof props.ref === 'function') {
          props.ref(node)
          return
        }
        props.ref.current = node
      }}
      style={{
        overflow: 'auto',
        width: '100%',
        height: '100%',
        ...readStyle(props.style),
      }}
    />
  )
}

ScrollAreaViewport.displayName = VIEWPORT_NAME

function ScrollAreaScrollbar(props: ScopedProps<ScrollAreaScrollbarProps>): FictNode {
  const context = useScrollAreaContext(
    SCROLLBAR_NAME,
    props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>,
  )
  const scrollbarRef = { current: null as HTMLDivElement | null }

  useLayoutEffect(() => {
    if (props.orientation === 'horizontal') {
      context.setHasHorizontalScrollbar(true)
      return () => {
        context.setHasHorizontalScrollbar(false)
      }
    }

    context.setHasVerticalScrollbar(true)
    return () => {
      context.setHasVerticalScrollbar(false)
    }
  })

  return (
    <ScrollbarProvider
      scope={props.__scopeScrollArea as Scope<ScrollbarContextValue | undefined>}
      orientation={() => props.orientation}
      scrollbarRef={scrollbarRef}
    >
      <Primitive.div
        {...(props as unknown as Record<string, unknown>)}
        ref={(node: HTMLDivElement | null) => {
          scrollbarRef.current = node
          if (!props.ref) return
          if (typeof props.ref === 'function') {
            props.ref(node)
            return
          }
          props.ref.current = node
        }}
        data-orientation={props.orientation}
      />
    </ScrollbarProvider>
  )
}

ScrollAreaScrollbar.displayName = SCROLLBAR_NAME

function ScrollAreaThumb(props: ScopedProps<ScrollAreaThumbProps>): FictNode {
  const rootContext = useScrollAreaContext(
    THUMB_NAME,
    props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>,
  )
  const scrollbarContext = useScrollbarContext(
    THUMB_NAME,
    props.__scopeScrollArea as Scope<ScrollbarContextValue | undefined>,
  )
  const thumbRef = { current: null as HTMLDivElement | null }
  const size = createSignal(0)
  const offset = createSignal(0)

  const update = () => {
    const viewport = rootContext.viewportRef.current
    const scrollbar = scrollbarContext.scrollbarRef.current
    if (!viewport || !scrollbar) return

    const isHorizontal = scrollbarContext.orientation() === 'horizontal'
    const viewportSize = isHorizontal ? viewport.clientWidth : viewport.clientHeight
    const scrollSize = isHorizontal ? viewport.scrollWidth : viewport.scrollHeight
    const scrollOffset = isHorizontal ? viewport.scrollLeft : viewport.scrollTop
    const trackSize = isHorizontal ? scrollbar.clientWidth : scrollbar.clientHeight

    if (viewportSize <= 0 || scrollSize <= 0 || trackSize <= 0) {
      size(0)
      offset(0)
      return
    }

    const ratio = Math.min(1, viewportSize / scrollSize)
    const thumbSize = Math.max(18, trackSize * ratio)
    const maxOffset = Math.max(0, trackSize - thumbSize)
    const maxScroll = Math.max(0, scrollSize - viewportSize)
    const thumbOffset = maxScroll === 0 ? 0 : (scrollOffset / maxScroll) * maxOffset

    size(thumbSize)
    offset(thumbOffset)

    const thumb = thumbRef.current
    if (!thumb) return

    if (isHorizontal) {
      thumb.style.width = `${thumbSize}px`
      thumb.style.transform = `translate3d(${thumbOffset}px, 0, 0)`
      return
    }

    thumb.style.height = `${thumbSize}px`
    thumb.style.transform = `translate3d(0, ${thumbOffset}px, 0)`
  }

  useLayoutEffect(() => {
    const viewport = rootContext.viewportRef.current
    if (!viewport) return

    update()
    viewport.addEventListener('scroll', update)
    window.addEventListener('resize', update)

    return () => {
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  })

  const style = () => {
    if (scrollbarContext.orientation() === 'horizontal') {
      return {
        width: `${size()}px`,
        transform: `translate3d(${offset()}px, 0, 0)`,
      }
    }

    return {
      height: `${size()}px`,
      transform: `translate3d(0, ${offset()}px, 0)`,
    }
  }

  const primitiveProps = mergeProps(
    {
      'data-orientation': prop(scrollbarContext.orientation),
    },
    () => props as Record<string, unknown>,
    {
      __scopeScrollArea: undefined,
    },
  )

  return (
    <Primitive.div
      {...primitiveProps}
      ref={(node: HTMLDivElement | null) => {
        thumbRef.current = node
        if (!props.ref) return
        if (typeof props.ref === 'function') {
          props.ref(node)
          return
        }
        props.ref.current = node
      }}
      style={{ ...style(), ...readStyle(props.style) }}
    />
  )
}

ScrollAreaThumb.displayName = THUMB_NAME

function ScrollAreaCorner(props: ScopedProps<ScrollAreaCornerProps>): FictNode {
  const context = useScrollAreaContext(
    CORNER_NAME,
    props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>,
  )

  return (
    <>
      {() =>
        context.hasHorizontalScrollbar() && context.hasVerticalScrollbar() ? (
          <Primitive.div {...(props as Record<string, unknown>)} />
        ) : null
      }
    </>
  )
}

ScrollAreaCorner.displayName = CORNER_NAME

const Root = ScrollArea
const Viewport = ScrollAreaViewport
const Scrollbar = ScrollAreaScrollbar
const Thumb = ScrollAreaThumb
const Corner = ScrollAreaCorner

export {
  createScrollAreaScope,
  ScrollArea,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaCorner,
  Root,
  Viewport,
  Scrollbar,
  Thumb,
  Corner,
}

export type {
  ScrollAreaProps,
  ScrollAreaViewportProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollAreaCornerProps,
}
