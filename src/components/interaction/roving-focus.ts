import { createContext, onDestroy, onMount, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { read } from '../../internal/accessor'
import { useId } from '../../internal/ids'
import { composeRefs } from '../../internal/ref'
import type { MaybeAccessor } from '../../internal/types'
import { Primitive } from '../core/primitive'

export interface RovingFocusGroupProps {
  orientation?: MaybeAccessor<'horizontal' | 'vertical'>
  loop?: MaybeAccessor<boolean>
  children?: FictNode
  [key: string]: unknown
}

export interface RovingFocusItemProps {
  disabled?: MaybeAccessor<boolean>
  children?: FictNode
  as?: string
  asChild?: boolean
  onFocus?: (event: FocusEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  [key: string]: unknown
}

interface ItemRecord {
  id: string
  element: HTMLElement
  disabled: boolean
}

interface RovingContextValue {
  orientation: () => 'horizontal' | 'vertical'
  loop: () => boolean
  currentId: () => string | null
  setCurrentId: (id: string | null) => void
  register: (item: ItemRecord) => () => void
  getItems: () => ItemRecord[]
  moveFocus: (direction: 1 | -1) => void
  focusFirst: () => void
  focusLast: () => void
}

const RovingContext = createContext<RovingContextValue | null>(null)

export function RovingFocusGroup(props: RovingFocusGroupProps): FictNode {
  const currentIdSignal = createSignal<string | null>(null)
  const items: ItemRecord[] = []
  let groupNode: HTMLElement | null = null

  const syncDomState = (activeId: string | null) => {
    for (const item of items) {
      const isActive = item.id === activeId && !item.disabled
      item.element.tabIndex = isActive ? 0 : -1
      if (isActive) {
        item.element.setAttribute('data-active', '')
      } else {
        item.element.removeAttribute('data-active')
      }
    }
  }

  const moveFocus = (direction: 1 | -1) => {
    const activeItems = context.getItems().filter(item => !item.disabled)
    if (activeItems.length === 0) return

    const currentId = context.currentId()
    const currentIndex = activeItems.findIndex(item => item.id === currentId)
    const baseIndex = currentIndex >= 0 ? currentIndex : 0

    let nextIndex = baseIndex + direction
    if (nextIndex < 0) {
      nextIndex = context.loop() ? activeItems.length - 1 : 0
    } else if (nextIndex >= activeItems.length) {
      nextIndex = context.loop() ? 0 : activeItems.length - 1
    }

    const nextItem = activeItems[nextIndex]
    if (!nextItem) return

    context.setCurrentId(nextItem.id)
    nextItem.element.focus()
  }

  const focusFirst = () => {
    const first = context.getItems().find(item => !item.disabled)
    if (!first) return
    context.setCurrentId(first.id)
    first.element.focus()
  }

  const focusLast = () => {
    const reversed = context
      .getItems()
      .slice()
      .reverse()
    const last = reversed.find(item => !item.disabled)
    if (!last) return
    context.setCurrentId(last.id)
    last.element.focus()
  }

  const context: RovingContextValue = {
    orientation: () => read(props.orientation, 'horizontal'),
    loop: () => read(props.loop, true),
    currentId: () => currentIdSignal(),
    setCurrentId: id => {
      currentIdSignal(id)
      syncDomState(id)
    },
    register: item => {
      items.push(item)
      if (!currentIdSignal() && !item.disabled) {
        context.setCurrentId(item.id)
      } else {
        syncDomState(currentIdSignal())
      }
      return () => {
        const index = items.findIndex(entry => entry.id === item.id)
        if (index >= 0) {
          items.splice(index, 1)
        }
        if (currentIdSignal() === item.id) {
          context.setCurrentId(items.find(entry => !entry.disabled)?.id ?? null)
        } else {
          syncDomState(currentIdSignal())
        }
      }
    },
    getItems: () => items.slice(),
    moveFocus,
    focusFirst,
    focusLast,
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const orientation = context.orientation()
    const key = event.key

    if (orientation === 'horizontal') {
      if (key === 'ArrowRight') {
        event.preventDefault()
        moveFocus(1)
      } else if (key === 'ArrowLeft') {
        event.preventDefault()
        moveFocus(-1)
      }
    }

    if (orientation === 'vertical') {
      if (key === 'ArrowDown') {
        event.preventDefault()
        moveFocus(1)
      } else if (key === 'ArrowUp') {
        event.preventDefault()
        moveFocus(-1)
      }
    }

    if (key === 'Home') {
      event.preventDefault()
      context.focusFirst()
    }

    if (key === 'End') {
      event.preventDefault()
      context.focusLast()
    }
  }

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    const target = event.target
    if (!groupNode || !(target instanceof Node)) return
    if (!groupNode.contains(target)) return
    onKeyDown(event)
  }

  onMount(() => {
    const doc = groupNode?.ownerDocument ?? (typeof document !== 'undefined' ? document : null)
    if (!doc) return
    doc.addEventListener('keydown', onDocumentKeyDown, true)
  })

  onDestroy(() => {
    const doc = groupNode?.ownerDocument ?? (typeof document !== 'undefined' ? document : null)
    if (!doc) return
    doc.removeEventListener('keydown', onDocumentKeyDown, true)
  })

  return {
    type: RovingContext.Provider,
    props: {
      value: context,
      children: {
        type: 'div',
        props: {
          ...props,
          orientation: undefined,
          loop: undefined,
          role: 'group',
          'data-roving-focus-group': '',
          ref: (node: HTMLElement | null) => {
            groupNode = node
            const refProp = props.ref as
              | ((el: HTMLElement | null) => void)
              | { current: HTMLElement | null }
              | undefined
            if (typeof refProp === 'function') {
              refProp(node)
            } else if (refProp) {
              refProp.current = node
            }
          },
          onKeyDown,
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function RovingFocusItem(props: RovingFocusItemProps): FictNode {
  const context = useContext(RovingContext)
  if (!context) {
    throw new Error('RovingFocusItem must be used inside RovingFocusGroup')
  }

  const id = useId(props.id as string | undefined, 'rf-item')
  const tag = props.as ?? 'button'
  let cleanup: (() => void) | null = null
  let removeKeydownListener: (() => void) | null = null

  const register = (node: HTMLElement | null) => {
    cleanup?.()
    removeKeydownListener?.()
    cleanup = null
    removeKeydownListener = null

    if (!node) return

    node.addEventListener('keydown', onKeyDown)
    removeKeydownListener = () => {
      node.removeEventListener('keydown', onKeyDown)
    }

    cleanup = context.register({
      id,
      element: node,
      disabled: read(props.disabled, false),
    })
  }

  const onFocus = (event: FocusEvent) => {
    props.onFocus?.(event)
    context.setCurrentId(id)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    props.onKeyDown?.(event)
    if (event.defaultPrevented) return

    const orientation = context.orientation()
    if (orientation === 'horizontal') {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        context.moveFocus(1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        context.moveFocus(-1)
      }
    } else if (orientation === 'vertical') {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        context.moveFocus(1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        context.moveFocus(-1)
      }
    }

    if (event.key === 'Home') {
      event.preventDefault()
      context.focusFirst()
    }
    if (event.key === 'End') {
      event.preventDefault()
      context.focusLast()
    }
  }

  return Primitive({
    ...props,
    as: tag,
    disabled: read(props.disabled, false),
    ref: composeRefs(props.ref as ((node: HTMLElement | null) => void) | { current: HTMLElement | null }, register),
    tabIndex: -1,
    'data-roving-focus-item': '',
    onFocus,
    children: props.children,
  })
}
