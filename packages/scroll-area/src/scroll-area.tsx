import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'
import { jsx as createVNode } from '@fictjs/runtime/jsx-runtime'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type ScopedProps<P> = P & { __scopeScrollArea?: Scope }
type MaybeAccessor<T> = T | (() => T)
type StyleRecord = Record<string, string | number | undefined>
type Orientation = 'horizontal' | 'vertical'
type ScrollAreaType = 'auto' | 'always' | 'scroll' | 'hover'
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type ScrollAreaContextValue = {
  type: () => ScrollAreaType
  dir: () => Direction
  scrollHideDelay: () => number
  rootRef: { current: HTMLDivElement | null }
  viewportRef: { current: HTMLDivElement | null }
  contentRef: { current: HTMLDivElement | null }
  horizontalEnabled: () => boolean
  verticalEnabled: () => boolean
  horizontalScrollbarSize: () => number
  verticalScrollbarSize: () => number
  setHorizontalEnabled(value: boolean): void
  setVerticalEnabled(value: boolean): void
  setHorizontalScrollbarSize(value: number): void
  setVerticalScrollbarSize(value: number): void
}
type ScrollbarContextValue = {
  orientation: () => Orientation
  scrollbarRef: { current: HTMLDivElement | null }
  thumbRef: { current: HTMLDivElement | null }
  hasThumb: () => boolean
  thumbSize: () => number
  thumbOffset: () => number
  pointerOffsetRef: { current: number | null }
  update(): void
}

const ROOT_NAME = 'ScrollArea'
const VIEWPORT_NAME = 'ScrollAreaViewport'
const SCROLLBAR_NAME = 'ScrollAreaScrollbar'
const THUMB_NAME = 'ScrollAreaThumb'
const CORNER_NAME = 'ScrollAreaCorner'
const VIEWPORT_STYLE =
  '[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createScrollAreaContext, createScrollAreaScope] = createContextScope(ROOT_NAME)
const [ScrollAreaProvider, useScrollAreaContext] =
  createScrollAreaContext<ScrollAreaContextValue>(ROOT_NAME)
const [ScrollbarProvider, useScrollbarContext] =
  createScrollAreaContext<ScrollbarContextValue>(SCROLLBAR_NAME)

type ScrollAreaProps = Omit<PrimitiveDivProps, 'dir'> & {
  type?: MaybeAccessor<ScrollAreaType | undefined>
  scrollHideDelay?: MaybeAccessor<number | undefined>
  dir?: MaybeAccessor<Direction | undefined>
}
type ScrollAreaViewportProps = PrimitiveDivProps & {
  nonce?: string
}
type ScrollAreaScrollbarProps = PrimitiveDivProps & {
  orientation: Orientation
  forceMount?: MaybeAccessor<boolean | undefined>
}
type ScrollAreaThumbProps = PrimitiveDivProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}
type ScrollAreaCornerProps = PrimitiveDivProps

function isReadableAccessor<T>(value: MaybeAccessor<T>): value is () => T {
  return (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  )
}

function readValue<T>(value: MaybeAccessor<T>): T {
  let currentValue: unknown = value

  for (
    let depth = 0;
    depth < 10 && isReadableAccessor(currentValue as MaybeAccessor<unknown>);
    depth += 1
  ) {
    currentValue = (currentValue as () => unknown)()
  }

  return currentValue as T
}

function readStyle(value: unknown): StyleRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as StyleRecord
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function createComponentNode(component: unknown, props: Record<string, unknown>): FictNode {
  return createVNode(component as (props: Record<string, unknown>) => FictNode, props)
}

function ScrollArea(props: ScopedProps<ScrollAreaProps>): FictNode {
  const inheritedDirection = useDirection()
  const rootRef = { current: null as HTMLDivElement | null }
  const viewportRef = { current: null as HTMLDivElement | null }
  const contentRef = { current: null as HTMLDivElement | null }
  const horizontalEnabled = createSignal(false)
  const verticalEnabled = createSignal(false)
  const horizontalScrollbarSize = createSignal(0)
  const verticalScrollbarSize = createSignal(0)
  const type = () =>
    props.type === undefined
      ? 'hover'
      : (readValue(props.type as MaybeAccessor<ScrollAreaType | undefined>) ?? 'hover')
  const dir = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const scrollHideDelay = () =>
    props.scrollHideDelay === undefined
      ? 600
      : (readValue(props.scrollHideDelay as MaybeAccessor<number | undefined>) ?? 600)
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeScrollArea: undefined,
      dir: prop(dir),
      ref: undefined,
      scrollHideDelay: undefined,
      type: undefined,
      style: prop(() => ({
        position: 'relative',
        '--radix-scroll-area-corner-width': `${verticalScrollbarSize()}px`,
        '--radix-scroll-area-corner-height': `${horizontalScrollbarSize()}px`,
        ...readStyle(props.style),
      })),
    },
  )
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    rootRef as PossibleRef<HTMLDivElement>,
  )
  const rootNode = createComponentNode(
    Primitive.div,
    mergeProps(primitiveProps, { ref: composedRefs }),
  )

  return (
    <ScrollAreaProvider
      scope={props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>}
      type={type}
      dir={dir}
      scrollHideDelay={scrollHideDelay}
      rootRef={rootRef}
      viewportRef={viewportRef}
      contentRef={contentRef}
      horizontalEnabled={horizontalEnabled}
      verticalEnabled={verticalEnabled}
      horizontalScrollbarSize={horizontalScrollbarSize}
      verticalScrollbarSize={verticalScrollbarSize}
      setHorizontalEnabled={horizontalEnabled}
      setVerticalEnabled={verticalEnabled}
      setHorizontalScrollbarSize={horizontalScrollbarSize}
      setVerticalScrollbarSize={verticalScrollbarSize}
    >
      {rootNode}
    </ScrollAreaProvider>
  )
}

ScrollArea.displayName = ROOT_NAME

function ScrollAreaViewport(props: ScopedProps<ScrollAreaViewportProps>): FictNode {
  const context = useScrollAreaContext(
    VIEWPORT_NAME,
    props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>,
  )
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    context.viewportRef as PossibleRef<HTMLDivElement>,
  )
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeScrollArea: undefined,
      children: undefined,
      nonce: undefined,
      ref: undefined,
      'data-radix-scroll-area-viewport': '',
      style: prop(() => ({
        overflowX: context.horizontalEnabled() ? 'scroll' : 'hidden',
        overflowY: context.verticalEnabled() ? 'scroll' : 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        width: '100%',
        height: '100%',
        ...readStyle(props.style),
      })),
    },
  )
  const viewportContent = (
    <div
      data-radix-scroll-area-content=""
      ref={(node: HTMLDivElement | null) => {
        context.contentRef.current = node
      }}
      style={{ minWidth: '100%', display: 'table' }}
    >
      {props.children}
    </div>
  )
  const viewportNode = createComponentNode(
    Primitive.div,
    mergeProps(primitiveProps, { ref: composedRefs, children: viewportContent }),
  )

  return (
    <>
      <style {...(props.nonce === undefined ? {} : { nonce: props.nonce })}>{VIEWPORT_STYLE}</style>
      {viewportNode}
    </>
  )
}

ScrollAreaViewport.displayName = VIEWPORT_NAME

function ScrollAreaScrollbar(props: ScopedProps<ScrollAreaScrollbarProps>): FictNode {
  const context = useScrollAreaContext(
    SCROLLBAR_NAME,
    props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>,
  )
  const scrollbarRef = { current: null as HTMLDivElement | null }
  const thumbRef = { current: null as HTMLDivElement | null }
  const pointerOffsetRef = { current: null as number | null }
  const dragRectRef = { current: null as DOMRect | null }
  const draggingPointerRef = { current: null as number | null }
  const dragScrollbarRef = { current: null as HTMLDivElement | null }
  const dragViewportRef = { current: null as HTMLDivElement | null }
  const previousUserSelectRef = { current: '' }
  const previousWebkitUserSelectRef = { current: '' }
  const previousScrollBehaviorRef = { current: '' }
  const dragOwnerDocumentRef = { current: null as Document | null }
  const overflow = createSignal(false)
  const interactionVisible = createSignal(false)
  const scrollState = createSignal<'hidden' | 'scrolling' | 'interacting' | 'idle'>('hidden')
  const hasThumb = createSignal(false)
  const thumbSize = createSignal(0)
  const thumbOffset = createSignal(0)
  const paddingStart = createSignal(0)
  const paddingEnd = createSignal(0)
  let hideTimer = 0
  let hideTimerWindow: Window | null = null
  let scrollEndTimer = 0
  let scrollEndTimerWindow: Window | null = null
  let scrollbarResizeObserver: ResizeObserver | null = null

  const forceMount = () =>
    props.forceMount === undefined
      ? false
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const isHorizontal = () => props.orientation === 'horizontal'
  const sendScrollState = (
    event: 'SCROLL' | 'SCROLL_END' | 'POINTER_ENTER' | 'POINTER_LEAVE' | 'HIDE',
  ) => {
    const state = scrollState()

    if (event === 'SCROLL') {
      if (state === 'hidden' || state === 'idle') scrollState('scrolling')
      return
    }

    if (event === 'SCROLL_END') {
      if (state === 'scrolling') scrollState('idle')
      return
    }

    if (event === 'POINTER_ENTER') {
      if (state === 'scrolling' || state === 'idle') scrollState('interacting')
      return
    }

    if (event === 'POINTER_LEAVE') {
      if (state === 'interacting') scrollState('idle')
      return
    }

    if (state === 'idle') scrollState('hidden')
  }
  const clearHideTimer = () => {
    hideTimerWindow?.clearTimeout(hideTimer)
    hideTimer = 0
    hideTimerWindow = null
  }
  const clearScrollEndTimer = () => {
    scrollEndTimerWindow?.clearTimeout(scrollEndTimer)
    scrollEndTimer = 0
    scrollEndTimerWindow = null
  }
  const hideAfterDelay = () => {
    clearHideTimer()
    const ownerWindow = context.rootRef.current?.ownerDocument.defaultView ?? window
    hideTimerWindow = ownerWindow
    hideTimer = ownerWindow.setTimeout(() => {
      if (context.type() === 'scroll') sendScrollState('HIDE')
      else interactionVisible(false)
    }, context.scrollHideDelay())
  }
  const scheduleScrollEnd = () => {
    clearScrollEndTimer()
    const ownerWindow = context.rootRef.current?.ownerDocument.defaultView ?? window
    scrollEndTimerWindow = ownerWindow
    scrollEndTimer = ownerWindow.setTimeout(() => {
      sendScrollState('SCROLL_END')
      if (scrollState() === 'idle') hideAfterDelay()
    }, 100)
  }

  const setScrollbarSize = (size: number) => {
    if (isHorizontal()) {
      context.setHorizontalScrollbarSize(size)
    } else {
      context.setVerticalScrollbarSize(size)
    }
  }

  const updateScrollbarSize = (scrollbar: HTMLDivElement | null) => {
    if (!scrollbar) {
      setScrollbarSize(0)
      return
    }

    const rect = scrollbar.getBoundingClientRect()
    const size = isHorizontal()
      ? scrollbar.offsetHeight || rect.height || scrollbar.clientHeight
      : scrollbar.offsetWidth || rect.width || scrollbar.clientWidth
    setScrollbarSize(size)
  }

  const finishDrag = () => {
    const pointerId = draggingPointerRef.current
    if (pointerId === null) return

    const scrollbar = dragScrollbarRef.current
    if (scrollbar?.releasePointerCapture) {
      try {
        if (!scrollbar.hasPointerCapture || scrollbar.hasPointerCapture(pointerId)) {
          scrollbar.releasePointerCapture(pointerId)
        }
      } catch {
        // The browser may already have released capture while removing the element.
      }
    }

    const ownerDocument = dragOwnerDocumentRef.current
    if (ownerDocument) {
      ownerDocument.body.style.userSelect = previousUserSelectRef.current
      ownerDocument.body.style.webkitUserSelect = previousWebkitUserSelectRef.current
    }
    if (dragViewportRef.current) {
      dragViewportRef.current.style.scrollBehavior = previousScrollBehaviorRef.current
    }

    draggingPointerRef.current = null
    dragScrollbarRef.current = null
    dragViewportRef.current = null
    dragOwnerDocumentRef.current = null
    dragRectRef.current = null
    pointerOffsetRef.current = null
  }

  const update = () => {
    const viewport = context.viewportRef.current
    const scrollbar = scrollbarRef.current
    if (!viewport) return

    const viewportSize = isHorizontal() ? viewport.clientWidth : viewport.clientHeight
    const scrollSize = isHorizontal() ? viewport.scrollWidth : viewport.scrollHeight
    const nextOverflow = scrollSize > viewportSize && viewportSize > 0
    overflow(nextOverflow)

    if (!scrollbar) {
      hasThumb(nextOverflow)
      return
    }

    const trackSize = isHorizontal() ? scrollbar.clientWidth : scrollbar.clientHeight
    const ownerWindow = scrollbar.ownerDocument.defaultView ?? window
    const computedStyle = ownerWindow.getComputedStyle(scrollbar)
    const nextPaddingStart =
      Number.parseFloat(isHorizontal() ? computedStyle.paddingLeft : computedStyle.paddingTop) || 0
    const nextPaddingEnd =
      Number.parseFloat(
        isHorizontal() ? computedStyle.paddingRight : computedStyle.paddingBottom,
      ) || 0
    paddingStart(nextPaddingStart)
    paddingEnd(nextPaddingEnd)
    const usableTrackSize = Math.max(0, trackSize - nextPaddingStart - nextPaddingEnd)
    if (!nextOverflow || usableTrackSize <= 0 || scrollSize <= 0) {
      hasThumb(false)
      thumbSize(0)
      thumbOffset(0)
      return
    }

    const ratio = Math.min(1, viewportSize / scrollSize)
    const nextThumbSize = Math.min(usableTrackSize, Math.max(18, usableTrackSize * ratio))
    const maxThumbOffset = Math.max(0, usableTrackSize - nextThumbSize)
    const maxScroll = Math.max(0, scrollSize - viewportSize)
    const scrollOffset = isHorizontal() ? viewport.scrollLeft : viewport.scrollTop
    const scrollRatio =
      maxScroll === 0
        ? 0
        : isHorizontal() && context.dir() === 'rtl'
          ? clamp(scrollOffset / maxScroll, -1, 0)
          : clamp(scrollOffset / maxScroll, 0, 1)
    const nextThumbOffset = scrollRatio * maxThumbOffset

    hasThumb(true)
    thumbSize(nextThumbSize)
    thumbOffset(nextThumbOffset)
  }

  const updateScrollFromPointer = (event: PointerEvent) => {
    const viewport = context.viewportRef.current
    const scrollbar = scrollbarRef.current
    if (!viewport || !scrollbar) return

    const rect = dragRectRef.current ?? scrollbar.getBoundingClientRect()
    const trackSize = isHorizontal() ? scrollbar.clientWidth : scrollbar.clientHeight
    const usableTrackSize = Math.max(0, trackSize - paddingStart() - paddingEnd())
    const currentThumbSize = thumbSize()
    const maxThumbOffset = Math.max(0, usableTrackSize - currentThumbSize)
    const pointerPosition = isHorizontal() ? event.clientX - rect.left : event.clientY - rect.top
    const pointerOffset = pointerOffsetRef.current ?? currentThumbSize / 2
    const nextThumbOffset = clamp(
      pointerPosition - paddingStart() - pointerOffset,
      0,
      maxThumbOffset,
    )
    const ratio = maxThumbOffset === 0 ? 0 : nextThumbOffset / maxThumbOffset
    const maxScroll = isHorizontal()
      ? Math.max(0, viewport.scrollWidth - viewport.clientWidth)
      : Math.max(0, viewport.scrollHeight - viewport.clientHeight)
    const nextScroll = ratio * maxScroll

    if (isHorizontal()) {
      viewport.scrollLeft = context.dir() === 'rtl' ? nextScroll - maxScroll : nextScroll
    } else {
      viewport.scrollTop = nextScroll
    }
    update()
  }

  useLayoutEffect(() => {
    if (isHorizontal()) {
      context.setHorizontalEnabled(true)
      return () => context.setHorizontalEnabled(false)
    }

    context.setVerticalEnabled(true)
    return () => context.setVerticalEnabled(false)
  })

  useLayoutEffect(() => {
    const root = context.rootRef.current
    const viewport = context.viewportRef.current
    const content = context.contentRef.current
    if (!root || !viewport) return

    const handlePointerEnter = () => {
      clearHideTimer()
      if (context.type() === 'hover') interactionVisible(true)
    }
    const handlePointerLeave = () => {
      if (context.type() === 'hover') hideAfterDelay()
    }
    let previousScrollPosition = isHorizontal() ? viewport.scrollLeft : viewport.scrollTop
    const handleScroll = () => {
      update()
      if (context.type() === 'scroll') {
        const nextScrollPosition = isHorizontal() ? viewport.scrollLeft : viewport.scrollTop
        if (previousScrollPosition !== nextScrollPosition) {
          sendScrollState('SCROLL')
          scheduleScrollEnd()
          previousScrollPosition = nextScrollPosition
        }
      }
    }
    const ownerWindow = viewport.ownerDocument.defaultView ?? window
    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? globalThis.ResizeObserver
    const resizeObserver = ResizeObserverCtor ? new ResizeObserverCtor(update) : null

    update()
    root.addEventListener('pointerenter', handlePointerEnter)
    root.addEventListener('pointerleave', handlePointerLeave)
    viewport.addEventListener('scroll', handleScroll)
    ownerWindow.addEventListener('resize', update)
    resizeObserver?.observe(viewport)
    if (content) resizeObserver?.observe(content)

    return () => {
      clearHideTimer()
      clearScrollEndTimer()
      root.removeEventListener('pointerenter', handlePointerEnter)
      root.removeEventListener('pointerleave', handlePointerLeave)
      viewport.removeEventListener('scroll', handleScroll)
      ownerWindow.removeEventListener('resize', update)
      resizeObserver?.disconnect()
    }
  })

  useLayoutEffect(() => () => {
    clearHideTimer()
    clearScrollEndTimer()
    scrollbarResizeObserver?.disconnect()
    scrollbarResizeObserver = null
    finishDrag()
    setScrollbarSize(0)
  })

  const isVisible = () => {
    if (context.type() === 'always') return true
    if (!overflow()) return false
    if (context.type() === 'auto') return true
    if (context.type() === 'scroll') return scrollState() !== 'hidden'
    return interactionVisible()
  }
  const shouldPresent = () => forceMount() || isVisible()
  const scrollbarStyle = () =>
    isHorizontal()
      ? {
          position: 'absolute',
          left: context.dir() === 'rtl' ? 'var(--radix-scroll-area-corner-width, 0px)' : 0,
          right: context.dir() === 'ltr' ? 'var(--radix-scroll-area-corner-width, 0px)' : 0,
          bottom: 0,
          touchAction: 'none',
          ...readStyle(props.style),
        }
      : {
          position: 'absolute',
          top: 0,
          right: context.dir() === 'ltr' ? 0 : undefined,
          left: context.dir() === 'rtl' ? 0 : undefined,
          bottom: 'var(--radix-scroll-area-corner-height, 0px)',
          touchAction: 'none',
          ...readStyle(props.style),
        }
  const primitiveProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      __scopeScrollArea: undefined,
      forceMount: undefined,
      orientation: undefined,
      ref: undefined,
      'data-orientation': props.orientation,
      'data-state': prop(() => (isVisible() ? 'visible' : 'hidden')),
      style: prop(scrollbarStyle),
      onPointerEnter: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerEnter?.(event),
        () => {
          clearHideTimer()
          if (context.type() === 'scroll') {
            clearScrollEndTimer()
            sendScrollState('POINTER_ENTER')
          }
        },
      ),
      onPointerLeave: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerLeave?.(event),
        () => {
          if (context.type() === 'scroll') {
            sendScrollState('POINTER_LEAVE')
            if (scrollState() === 'idle') hideAfterDelay()
          }
        },
      ),
      onWheel: composeEventHandlers<WheelEvent>(
        (event) => props.onWheel?.(event),
        (event) => {
          const viewport = context.viewportRef.current
          if (!viewport) return
          const maxScroll = isHorizontal()
            ? Math.max(0, viewport.scrollWidth - viewport.clientWidth)
            : Math.max(0, viewport.scrollHeight - viewport.clientHeight)
          const currentScroll = isHorizontal() ? viewport.scrollLeft : viewport.scrollTop
          const delta = isHorizontal() ? event.deltaX : event.deltaY
          const minimum = isHorizontal() && context.dir() === 'rtl' ? -maxScroll : 0
          const maximum = isHorizontal() && context.dir() === 'rtl' ? 0 : maxScroll
          const nextScroll = clamp(currentScroll + delta, minimum, maximum)

          if (isHorizontal()) viewport.scrollLeft = nextScroll
          else viewport.scrollTop = nextScroll
          update()
          if (context.type() === 'scroll') {
            sendScrollState('SCROLL')
            scheduleScrollEnd()
          }
          if (nextScroll > minimum && nextScroll < maximum) event.preventDefault()
        },
      ),
      onPointerDown: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerDown?.(event),
        (event) => {
          if (event.button !== 0) return
          const scrollbar = scrollbarRef.current
          const viewport = context.viewportRef.current
          if (!scrollbar || !viewport) return

          finishDrag()
          if (context.type() === 'scroll') {
            clearScrollEndTimer()
            sendScrollState('POINTER_ENTER')
          } else {
            interactionVisible(true)
          }
          clearHideTimer()
          dragRectRef.current = scrollbar.getBoundingClientRect()
          draggingPointerRef.current = event.pointerId
          dragScrollbarRef.current = scrollbar
          dragViewportRef.current = viewport
          previousUserSelectRef.current = scrollbar.ownerDocument.body.style.userSelect
          previousWebkitUserSelectRef.current = scrollbar.ownerDocument.body.style.webkitUserSelect
          previousScrollBehaviorRef.current = viewport.style.scrollBehavior
          dragOwnerDocumentRef.current = scrollbar.ownerDocument
          scrollbar.ownerDocument.body.style.userSelect = 'none'
          scrollbar.ownerDocument.body.style.webkitUserSelect = 'none'
          viewport.style.scrollBehavior = 'auto'
          scrollbar.setPointerCapture?.(event.pointerId)
          updateScrollFromPointer(event)
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerMove?.(event),
        (event) => {
          if (draggingPointerRef.current !== event.pointerId) return
          updateScrollFromPointer(event)
        },
      ),
      onPointerUp: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerUp?.(event),
        (event) => {
          if (draggingPointerRef.current !== event.pointerId) return
          finishDrag()
          if (context.type() === 'scroll') {
            sendScrollState('POINTER_LEAVE')
            if (scrollState() === 'idle') hideAfterDelay()
          }
        },
      ),
      onPointerCancel: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerCancel?.(event),
        (event) => {
          if (draggingPointerRef.current !== event.pointerId) return
          finishDrag()
          if (context.type() === 'scroll') {
            sendScrollState('POINTER_LEAVE')
            if (scrollState() === 'idle') hideAfterDelay()
          }
        },
      ),
    },
  )
  const handleScrollbarRef = (node: HTMLDivElement | null) => {
    scrollbarResizeObserver?.disconnect()
    scrollbarResizeObserver = null

    if (!node) finishDrag()
    scrollbarRef.current = node
    updateScrollbarSize(node)

    if (!node) return
    const ownerWindow = node.ownerDocument.defaultView ?? window
    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? globalThis.ResizeObserver
    if (ResizeObserverCtor) {
      scrollbarResizeObserver = new ResizeObserverCtor(() => {
        updateScrollbarSize(node)
        update()
      })
      scrollbarResizeObserver.observe(node)
    }
    update()
  }
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLDivElement>, handleScrollbarRef)
  const scrollbarNode = createComponentNode(
    Primitive.div,
    mergeProps(primitiveProps, { ref: composedRefs }),
  )

  return (
    <ScrollbarProvider
      scope={props.__scopeScrollArea as Scope<ScrollbarContextValue | undefined>}
      orientation={() => props.orientation}
      scrollbarRef={scrollbarRef}
      thumbRef={thumbRef}
      hasThumb={hasThumb}
      thumbSize={thumbSize}
      thumbOffset={thumbOffset}
      pointerOffsetRef={pointerOffsetRef}
      update={update}
    >
      <Presence present={shouldPresent}>{scrollbarNode}</Presence>
    </ScrollbarProvider>
  )
}

ScrollAreaScrollbar.displayName = SCROLLBAR_NAME

function ScrollAreaThumb(props: ScopedProps<ScrollAreaThumbProps>): FictNode {
  const context = useScrollbarContext(
    THUMB_NAME,
    props.__scopeScrollArea as Scope<ScrollbarContextValue | undefined>,
  )
  const forceMount = () =>
    props.forceMount === undefined
      ? false
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    context.thumbRef as PossibleRef<HTMLDivElement>,
  )
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeScrollArea: undefined,
      forceMount: undefined,
      ref: undefined,
      'data-orientation': prop(context.orientation),
      'data-state': prop(() => (context.hasThumb() ? 'visible' : 'hidden')),
      style: prop(() => ({
        width: context.orientation() === 'horizontal' ? `${context.thumbSize()}px` : undefined,
        height: context.orientation() === 'vertical' ? `${context.thumbSize()}px` : undefined,
        transform:
          context.orientation() === 'horizontal'
            ? `translate3d(${context.thumbOffset()}px, 0, 0)`
            : `translate3d(0, ${context.thumbOffset()}px, 0)`,
        ...readStyle(props.style),
      })),
      onPointerDown: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerDown?.(event),
        (event) => {
          if (event.button !== 0) return
          const thumb = context.thumbRef.current
          if (!thumb) return
          const rect = thumb.getBoundingClientRect()
          context.pointerOffsetRef.current =
            context.orientation() === 'horizontal'
              ? event.clientX - rect.left
              : event.clientY - rect.top
        },
      ),
    },
  )

  useLayoutEffect(() => {
    context.update()
  })
  const thumbNode = createComponentNode(
    Primitive.div,
    mergeProps(primitiveProps, { ref: composedRefs }),
  )

  return <Presence present={() => forceMount() || context.hasThumb()}>{thumbNode}</Presence>
}

ScrollAreaThumb.displayName = THUMB_NAME

function ScrollAreaCorner(props: ScopedProps<ScrollAreaCornerProps>): FictNode {
  const context = useScrollAreaContext(
    CORNER_NAME,
    props.__scopeScrollArea as Scope<ScrollAreaContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeScrollArea: undefined,
      style: prop(() => ({
        position: 'absolute',
        right: context.dir() === 'ltr' ? 0 : undefined,
        left: context.dir() === 'rtl' ? 0 : undefined,
        bottom: 0,
        width: 'var(--radix-scroll-area-corner-width, 0px)',
        height: 'var(--radix-scroll-area-corner-height, 0px)',
        ...readStyle(props.style),
      })),
    },
  )
  const cornerNode = createComponentNode(Primitive.div, primitiveProps)

  return (
    <>
      {reactive(() =>
        context.type() !== 'scroll' &&
        context.horizontalEnabled() &&
        context.verticalEnabled() &&
        context.horizontalScrollbarSize() > 0 &&
        context.verticalScrollbarSize() > 0
          ? cornerNode
          : null,
      )}
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
  ScrollAreaType,
  ScrollAreaProps,
  ScrollAreaViewportProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
  ScrollAreaCornerProps,
}
