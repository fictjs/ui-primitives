import type { FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { useEventListener } from '@fictjs/hooks'

export interface ResizablePanelGroupProps {
  direction?: 'horizontal' | 'vertical'
  children?: FictNode
  [key: string]: unknown
}

export interface ResizablePanelProps {
  defaultSize?: number
  minSize?: number
  maxSize?: number
  children?: FictNode
  [key: string]: unknown
}

export interface ResizableHandleProps {
  withHandle?: boolean
  [key: string]: unknown
}

interface ResizeDragState {
  direction: 'horizontal' | 'vertical'
  startPos: number
  prevStart: number
  nextStart: number
  groupSize: number
  minPrev: number
  minNext: number
  maxPrev: number
  maxNext: number
  prev: HTMLElement
  next: HTMLElement
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function ResizablePanelGroup(props: ResizablePanelGroupProps): FictNode {
  const direction = props.direction ?? 'horizontal'

  return {
    type: 'div',
    props: {
      ...props,
      direction: undefined,
      'data-resizable-panel-group': '',
      'data-direction': direction,
      style: {
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        ...(typeof props.style === 'object' && props.style !== null
          ? (props.style as Record<string, unknown>)
          : {}),
      },
      children: props.children,
    },
  }
}

export function ResizablePanel(props: ResizablePanelProps): FictNode {
  const defaultSize = props.defaultSize ?? 50

  return {
    type: 'div',
    props: {
      ...props,
      defaultSize: undefined,
      minSize: undefined,
      maxSize: undefined,
      'data-resizable-panel': '',
      style: {
        flexBasis: `${defaultSize}%`,
        flexGrow: 0,
        flexShrink: 0,
        overflow: 'auto',
        ...(typeof props.style === 'object' && props.style !== null
          ? (props.style as Record<string, unknown>)
          : {}),
      },
      children: props.children,
    },
  }
}

export function ResizableHandle(props: ResizableHandleProps): FictNode {
  let node: HTMLElement | null = null
  const dragState = createSignal<ResizeDragState | null>(null)
  const targetWindow = () => (typeof window !== 'undefined' ? window : null)

  const onMove = (moveEvent: PointerEvent) => {
    const state = dragState()
    if (!state) return

    const currentPos = state.direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
    const delta = currentPos - state.startPos

    const nextPrevPx = state.prevStart + delta
    const nextNextPx = state.nextStart - delta

    const nextPrevPercent = clamp((nextPrevPx / state.groupSize) * 100, state.minPrev, state.maxPrev)
    const nextNextPercent = clamp((nextNextPx / state.groupSize) * 100, state.minNext, state.maxNext)

    state.prev.style.flexBasis = `${nextPrevPercent}%`
    state.next.style.flexBasis = `${nextNextPercent}%`
  }

  const moveListener = useEventListener<PointerEvent>(targetWindow, 'pointermove', onMove, {
    immediate: false,
  })
  const upListener = useEventListener<PointerEvent>(
    targetWindow,
    'pointerup',
    () => {
      dragState(null)
      moveListener.stop()
      upListener.stop()
    },
    { immediate: false },
  )

  const onPointerDown = (event: PointerEvent) => {
    if (!node) return

    const group = node.parentElement
    const prev = node.previousElementSibling as HTMLElement | null
    const next = node.nextElementSibling as HTMLElement | null

    if (!group || !prev || !next) return

    const direction = (group.getAttribute('data-direction') as 'horizontal' | 'vertical') ?? 'horizontal'
    const groupRect = group.getBoundingClientRect()

    const prevRect = prev.getBoundingClientRect()
    const nextRect = next.getBoundingClientRect()

    const startPos = direction === 'horizontal' ? event.clientX : event.clientY
    const prevStart = direction === 'horizontal' ? prevRect.width : prevRect.height
    const nextStart = direction === 'horizontal' ? nextRect.width : nextRect.height
    const groupSize = direction === 'horizontal' ? groupRect.width : groupRect.height

    const minPrev = Number(prev.getAttribute('data-min-size') ?? '5')
    const minNext = Number(next.getAttribute('data-min-size') ?? '5')
    const maxPrev = Number(prev.getAttribute('data-max-size') ?? '95')
    const maxNext = Number(next.getAttribute('data-max-size') ?? '95')
    dragState({
      direction,
      startPos,
      prevStart,
      nextStart,
      groupSize,
      minPrev,
      minNext,
      maxPrev,
      maxNext,
      prev,
      next,
    })
    moveListener.start()
    upListener.start()
  }

  return {
    type: 'div',
    props: {
      ...props,
      withHandle: undefined,
      ref: (el: HTMLElement | null) => {
        node = el
      },
      role: 'separator',
      tabIndex: 0,
      'data-resizable-handle': '',
      onPointerDown,
      children: props.withHandle
        ? {
            type: 'div',
            props: {
              'data-resizable-handle-grip': '',
            },
          }
        : null,
    },
  }
}
