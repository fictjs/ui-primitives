import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { Primitive } from '@fictjs/primitive'
import { useCallbackRef } from '@fictjs/use-callback-ref'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type FocusableTarget = HTMLElement | { focus: (options?: FocusOptions) => void }
type FocusScopeProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
  loop?: MaybeAccessor<boolean | undefined>
  trapped?: MaybeAccessor<boolean | undefined>
  onMountAutoFocus?: (event: Event) => void
  onUnmountAutoFocus?: (event: Event) => void
}

const AUTOFOCUS_ON_MOUNT = 'focusScope.autoFocusOnMount'
const AUTOFOCUS_ON_UNMOUNT = 'focusScope.autoFocusOnUnmount'
const EVENT_OPTIONS = { bubbles: false, cancelable: true }
const FOCUS_SCOPE_NAME = 'FocusScope'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

function FocusScope(props: FocusScopeProps): FictNode {
  const container = createSignal<HTMLElement | null>(null)
  const loop = () => Boolean(readValue(props.loop as MaybeAccessor<boolean | undefined>))
  const trapped = () => Boolean(readValue(props.trapped as MaybeAccessor<boolean | undefined>))
  const onMountAutoFocus = useCallbackRef(props.onMountAutoFocus)
  const onUnmountAutoFocus = useCallbackRef(props.onUnmountAutoFocus)
  const lastFocusedElementRef = { current: null as HTMLElement | null }
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLDivElement>, (node) =>
    container(node),
  )
  const focusScope = {
    paused: false,
    pause() {
      this.paused = true
    },
    resume() {
      this.paused = false
    },
  }

  useLayoutEffect(() => {
    const currentContainer = container()
    if (!trapped() || !currentContainer) {
      return
    }

    const ownerDocument = currentContainer.ownerDocument

    const handleFocusIn = (event: FocusEvent) => {
      if (focusScope.paused) return

      const target = event.target as HTMLElement | null
      if (currentContainer.contains(target)) {
        lastFocusedElementRef.current = target
      } else {
        focus(lastFocusedElementRef.current, { select: true })
      }
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (focusScope.paused) return

      const relatedTarget = event.relatedTarget as HTMLElement | null
      if (relatedTarget === null) return

      if (!currentContainer.contains(relatedTarget)) {
        focus(lastFocusedElementRef.current, { select: true })
      }
    }

    const handleMutations = (mutations: MutationRecord[]) => {
      const focusedElement = ownerDocument.activeElement as HTMLElement | null
      if (focusedElement !== ownerDocument.body) return

      for (const mutation of mutations) {
        if (mutation.removedNodes.length > 0) {
          focus(currentContainer)
          return
        }
      }
    }

    ownerDocument.addEventListener('focusin', handleFocusIn)
    ownerDocument.addEventListener('focusout', handleFocusOut)

    const mutationObserver = new MutationObserver(handleMutations)
    mutationObserver.observe(currentContainer, { childList: true, subtree: true })

    return () => {
      ownerDocument.removeEventListener('focusin', handleFocusIn)
      ownerDocument.removeEventListener('focusout', handleFocusOut)
      mutationObserver.disconnect()
    }
  })

  useLayoutEffect(() => {
    const currentContainer = container()
    if (!currentContainer) {
      return
    }

    const focusScopesStack = getFocusScopesStack(currentContainer.ownerDocument)
    focusScopesStack.add(focusScope)
    const previouslyFocusedElement = currentContainer.ownerDocument
      .activeElement as HTMLElement | null
    const hasFocusedCandidate = currentContainer.contains(previouslyFocusedElement)

    if (!hasFocusedCandidate) {
      const mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT, EVENT_OPTIONS)
      currentContainer.addEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus as EventListener)
      currentContainer.dispatchEvent(mountEvent)

      if (!mountEvent.defaultPrevented) {
        focusFirst(removeLinks(getTabbableCandidates(currentContainer)), { select: true })
        if (currentContainer.ownerDocument.activeElement === previouslyFocusedElement) {
          focus(currentContainer)
        }
      }
    }

    return () => {
      const ownerWindow = currentContainer.ownerDocument.defaultView ?? window
      currentContainer.removeEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus as EventListener)

      ownerWindow.setTimeout(() => {
        const unmountEvent = new CustomEvent(AUTOFOCUS_ON_UNMOUNT, EVENT_OPTIONS)
        currentContainer.addEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus as EventListener)
        currentContainer.dispatchEvent(unmountEvent)

        if (!unmountEvent.defaultPrevented) {
          focus(previouslyFocusedElement ?? currentContainer.ownerDocument.body, { select: true })
        }

        currentContainer.removeEventListener(
          AUTOFOCUS_ON_UNMOUNT,
          onUnmountAutoFocus as EventListener,
        )
        focusScopesStack.remove(focusScope)
      }, 0)
    }
  })

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<HTMLDivElement>
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

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((!loop() && !trapped()) || focusScope.paused) return

    const isTabKey = event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey
    const currentContainer = event.currentTarget as HTMLElement
    const focusedElement = currentContainer.ownerDocument.activeElement as HTMLElement | null

    if (isTabKey && focusedElement) {
      const [first, last] = getTabbableEdges(currentContainer)
      const hasTabbableElementsInside = first && last

      if (!hasTabbableElementsInside) {
        if (focusedElement === currentContainer) {
          event.preventDefault()
        }
      } else {
        if (!event.shiftKey && focusedElement === last) {
          event.preventDefault()
          if (loop()) focus(first, { select: true })
        } else if (event.shiftKey && focusedElement === first) {
          event.preventDefault()
          if (loop()) focus(last, { select: true })
        }
      }
    }
  }

  const primitiveProps = mergeProps(
    {
      tabIndex: -1,
    },
    prop(() => props as Record<string, unknown>),
    {
      loop: undefined,
      onKeyDown: handleKeyDown,
      onMountAutoFocus: undefined,
      onUnmountAutoFocus: undefined,
      ref: undefined,
      trapped: undefined,
    },
  )

  return <Primitive.div {...primitiveProps} ref={composedRefs} />
}

FocusScope.displayName = FOCUS_SCOPE_NAME

function focusFirst(candidates: HTMLElement[], { select = false }: { select?: boolean } = {}) {
  const ownerDocument = candidates[0]?.ownerDocument
  const previouslyFocusedElement = ownerDocument?.activeElement

  for (const candidate of candidates) {
    focus(candidate, { select })
    if (candidate.ownerDocument.activeElement !== previouslyFocusedElement) return
  }
}

function getTabbableEdges(container: HTMLElement) {
  const candidates = getTabbableCandidates(container)
  const first = findVisible(candidates, container)
  const last = findVisible([...candidates].reverse(), container)
  return [first, last] as const
}

function getTabbableCandidates(container: HTMLElement) {
  const nodes: HTMLElement[] = []
  const ownerWindow = container.ownerDocument.defaultView
  const nodeFilter = ownerWindow?.NodeFilter ?? NodeFilter
  const walker = container.ownerDocument.createTreeWalker(container, nodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const element = node as HTMLElement & { disabled?: boolean; type?: string }
      const isHiddenInput = element.tagName === 'INPUT' && element.type === 'hidden'

      if (element.disabled || element.hidden || isHiddenInput) {
        return nodeFilter.FILTER_SKIP
      }

      return element.tabIndex >= 0 ? nodeFilter.FILTER_ACCEPT : nodeFilter.FILTER_SKIP
    },
  })

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as HTMLElement)
  }

  return nodes
}

function findVisible(elements: HTMLElement[], container: HTMLElement) {
  for (const element of elements) {
    if (!isHidden(element, { upTo: container })) return element
  }
}

function isHidden(node: HTMLElement, { upTo }: { upTo?: HTMLElement }) {
  const getStyle = node.ownerDocument.defaultView?.getComputedStyle.bind(
    node.ownerDocument.defaultView,
  )
  if (getStyle?.(node).visibility === 'hidden') return true

  let currentNode: HTMLElement | null = node
  while (currentNode) {
    if (upTo !== undefined && currentNode === upTo) return false
    if (getStyle?.(currentNode).display === 'none') return true
    currentNode = currentNode.parentElement
  }

  return false
}

function isSelectableInput(element: unknown): element is HTMLInputElement {
  if (!element || typeof element !== 'object' || !('ownerDocument' in element)) return false
  const candidate = element as HTMLElement
  const Input = candidate.ownerDocument.defaultView?.HTMLInputElement
  return Boolean(Input && candidate instanceof Input && 'select' in candidate)
}

function focus(element?: FocusableTarget | null, { select = false }: { select?: boolean } = {}) {
  if (element && typeof element.focus === 'function') {
    const ownerDocument =
      typeof element === 'object' && 'ownerDocument' in element
        ? (element as HTMLElement).ownerDocument
        : globalThis.document
    const previouslyFocusedElement = ownerDocument.activeElement
    element.focus({ preventScroll: true })

    if (element !== previouslyFocusedElement && isSelectableInput(element) && select) {
      element.select()
    }
  }
}

type FocusScopeAPI = { paused: boolean; pause(): void; resume(): void }

const focusScopesStacks = new WeakMap<Document, ReturnType<typeof createFocusScopesStack>>()

function getFocusScopesStack(ownerDocument: Document) {
  const existing = focusScopesStacks.get(ownerDocument)
  if (existing) return existing

  const stack = createFocusScopesStack()
  focusScopesStacks.set(ownerDocument, stack)
  return stack
}

function createFocusScopesStack() {
  let stack: FocusScopeAPI[] = []

  return {
    add(focusScope: FocusScopeAPI) {
      const activeFocusScope = stack[0]
      if (focusScope !== activeFocusScope) {
        activeFocusScope?.pause()
      }

      stack = arrayRemove(stack, focusScope)
      stack.unshift(focusScope)
    },
    remove(focusScope: FocusScopeAPI) {
      stack = arrayRemove(stack, focusScope)
      stack[0]?.resume()
    },
  }
}

function arrayRemove<T>(array: T[], item: T) {
  const updatedArray = [...array]
  const index = updatedArray.indexOf(item)

  if (index !== -1) {
    updatedArray.splice(index, 1)
  }

  return updatedArray
}

function removeLinks(items: HTMLElement[]) {
  return items.filter((item) => item.tagName !== 'A')
}

const Root = FocusScope

export { FocusScope, Root }
export type { FocusScopeProps }
