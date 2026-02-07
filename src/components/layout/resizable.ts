import type { FictNode } from '@fictjs/runtime'

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

    const onMove = (moveEvent: PointerEvent) => {
      const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY
      const delta = currentPos - startPos

      const nextPrevPx = prevStart + delta
      const nextNextPx = nextStart - delta

      const nextPrevPercent = clamp((nextPrevPx / groupSize) * 100, minPrev, maxPrev)
      const nextNextPercent = clamp((nextNextPx / groupSize) * 100, minNext, maxNext)

      prev.style.flexBasis = `${nextPrevPercent}%`
      next.style.flexBasis = `${nextNextPercent}%`
    }

    const stop = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', stop)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stop)
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
