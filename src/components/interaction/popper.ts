import { createContext, createEffect, useContext, type FictNode } from '@fictjs/runtime'

import { createId } from '../../internal/ids'

export type PopperPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'

export interface PopperRootProps {
  children?: FictNode
}

export interface PopperAnchorProps {
  children?: FictNode
  [key: string]: unknown
}

export interface PopperContentProps {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  strategy?: 'absolute' | 'fixed'
  children?: FictNode
  [key: string]: unknown
}

export interface PopperArrowProps {
  size?: number
  [key: string]: unknown
}

interface PopperContextValue {
  anchor: () => HTMLElement | null
  setAnchor: (node: HTMLElement | null) => void
  content: () => HTMLElement | null
  setContent: (node: HTMLElement | null) => void
  placement: () => PopperPlacement
  setPlacement: (placement: PopperPlacement) => void
}

const PopperContext = createContext<PopperContextValue | null>(null)

function computePosition(
  anchorRect: DOMRect,
  contentRect: DOMRect,
  side: 'top' | 'right' | 'bottom' | 'left',
  align: 'start' | 'center' | 'end',
  sideOffset: number,
  alignOffset: number,
): { x: number; y: number; placement: PopperPlacement } {
  let x: number
  let y: number

  if (side === 'bottom') {
    y = anchorRect.bottom + sideOffset
  } else if (side === 'top') {
    y = anchorRect.top - contentRect.height - sideOffset
  } else {
    y = anchorRect.top
  }

  if (side === 'right') {
    x = anchorRect.right + sideOffset
  } else if (side === 'left') {
    x = anchorRect.left - contentRect.width - sideOffset
  } else {
    x = anchorRect.left
  }

  if (side === 'top' || side === 'bottom') {
    if (align === 'center') {
      x = anchorRect.left + (anchorRect.width - contentRect.width) / 2
    } else if (align === 'end') {
      x = anchorRect.right - contentRect.width
    }
    x += alignOffset
  } else {
    if (align === 'center') {
      y = anchorRect.top + (anchorRect.height - contentRect.height) / 2
    } else if (align === 'end') {
      y = anchorRect.bottom - contentRect.height
    }
    y += alignOffset
  }

  const placement =
    align === 'center' ? (side as PopperPlacement) : (`${side}-${align}` as PopperPlacement)

  return { x, y, placement }
}

export function PopperRoot(props: PopperRootProps): FictNode {
  let anchorNode: HTMLElement | null = null
  let contentNode: HTMLElement | null = null
  let currentPlacement: PopperPlacement = 'bottom'

  const context: PopperContextValue = {
    anchor: () => anchorNode,
    setAnchor: node => {
      anchorNode = node
    },
    content: () => contentNode,
    setContent: node => {
      contentNode = node
    },
    placement: () => currentPlacement,
    setPlacement: placement => {
      currentPlacement = placement
    },
  }

  return {
    type: PopperContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function PopperAnchor(props: PopperAnchorProps): FictNode {
  const context = useContext(PopperContext)
  if (!context) {
    throw new Error('PopperAnchor must be used inside PopperRoot')
  }

  return {
    type: 'div',
    props: {
      ...props,
      ref: (node: HTMLElement | null) => {
        context.setAnchor(node)
        if (typeof props.ref === 'function') {
          props.ref(node)
        }
      },
      'data-popper-anchor': '',
      children: props.children,
    },
  }
}

export function PopperContent(props: PopperContentProps): FictNode {
  const context = useContext(PopperContext)
  if (!context) {
    throw new Error('PopperContent must be used inside PopperRoot')
  }

  const side = props.side ?? 'bottom'
  const align = props.align ?? 'center'
  const sideOffset = props.sideOffset ?? 8
  const alignOffset = props.alignOffset ?? 0
  const strategy = props.strategy ?? 'absolute'
  const contentId = createId('popper-content')

  const update = () => {
    const anchor = context.anchor()
    const content = context.content()
    if (!anchor || !content) return

    const anchorRect = anchor.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    const { x, y, placement } = computePosition(
      anchorRect,
      contentRect,
      side,
      align,
      sideOffset,
      alignOffset,
    )

    content.style.position = strategy
    content.style.left = `${Math.round(x)}px`
    content.style.top = `${Math.round(y)}px`
    content.dataset.placement = placement
    context.setPlacement(placement)
  }

  createEffect(() => {
    update()
    const anchor = context.anchor()
    if (!anchor) return

    const doc = anchor.ownerDocument ?? document
    const onWindowUpdate = () => update()

    doc.defaultView?.addEventListener('resize', onWindowUpdate)
    doc.addEventListener('scroll', onWindowUpdate, true)

    return () => {
      doc.defaultView?.removeEventListener('resize', onWindowUpdate)
      doc.removeEventListener('scroll', onWindowUpdate, true)
    }
  })

  return {
    type: 'div',
    props: {
      ...props,
      side: undefined,
      align: undefined,
      sideOffset: undefined,
      alignOffset: undefined,
      strategy: undefined,
      id: props.id ?? contentId,
      ref: (node: HTMLElement | null) => {
        context.setContent(node)
        if (typeof props.ref === 'function') {
          props.ref(node)
        }
      },
      role: props.role ?? 'dialog',
      'data-popper-content': '',
      'data-placement': () => context.placement(),
      children: props.children,
    },
  }
}

export function PopperArrow(props: PopperArrowProps): FictNode {
  const size = props.size ?? 8

  return {
    type: 'span',
    props: {
      ...props,
      size: undefined,
      'data-popper-arrow': '',
      style: {
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-block',
        transform: 'rotate(45deg)',
        ...(typeof props.style === 'object' && props.style !== null
          ? (props.style as Record<string, unknown>)
          : {}),
      },
    },
  }
}
