import { createContext, useContext, type FictNode } from '@fictjs/runtime'

export interface ScrollAreaProps {
  children?: FictNode
  [key: string]: unknown
}

export interface ScrollAreaViewportProps {
  children?: FictNode
  [key: string]: unknown
}

export interface ScrollAreaScrollbarProps {
  orientation?: 'vertical' | 'horizontal'
  children?: FictNode
  [key: string]: unknown
}

export interface ScrollAreaThumbProps {
  children?: FictNode
  [key: string]: unknown
}

interface ScrollAreaContextValue {
  viewportRef: { current: HTMLElement | null }
}

const ScrollAreaContext = createContext<ScrollAreaContextValue | null>(null)

function useScrollAreaContext(component: string): ScrollAreaContextValue {
  const context = useContext(ScrollAreaContext)
  if (!context) {
    throw new Error(`${component} must be used inside ScrollArea`)
  }
  return context
}

export function ScrollArea(props: ScrollAreaProps): FictNode {
  const context: ScrollAreaContextValue = {
    viewportRef: { current: null },
  }

  return {
    type: ScrollAreaContext.Provider,
    props: {
      value: context,
      children: {
        type: 'div',
        props: {
          ...props,
          'data-scroll-area': '',
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function ScrollAreaViewport(props: ScrollAreaViewportProps): FictNode {
  const context = useScrollAreaContext('ScrollAreaViewport')

  return {
    type: 'div',
    props: {
      ...props,
      ref: (node: HTMLElement | null) => {
        context.viewportRef.current = node
      },
      style: {
        overflow: 'auto',
        ...(typeof props.style === 'object' && props.style !== null
          ? (props.style as Record<string, unknown>)
          : {}),
      },
      'data-scroll-area-viewport': '',
      children: props.children,
    },
  }
}

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps): FictNode {
  const orientation = props.orientation ?? 'vertical'

  return {
    type: 'div',
    props: {
      ...props,
      orientation: undefined,
      'data-orientation': orientation,
      'data-scroll-area-scrollbar': '',
      children: props.children,
    },
  }
}

export function ScrollAreaThumb(props: ScrollAreaThumbProps): FictNode {
  return {
    type: 'div',
    props: {
      ...props,
      'data-scroll-area-thumb': '',
      children: props.children,
    },
  }
}
