import {
  createElement,
  createPortal as createFictPortal,
  mergeProps,
  prop,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'
import { jsx as createVNode } from '@fictjs/runtime/jsx-runtime'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { DismissableLayer, type DismissableLayerProps } from '@fictjs/dismissable-layer'
import { useDirection, type Direction } from '@fictjs/direction'
import { useId } from '@fictjs/id'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeNavigationMenu?: Scope }
type Orientation = 'horizontal' | 'vertical'
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & { asChild?: boolean }
type PrimitiveListProps = JSX.IntrinsicElements['ul'] & { asChild?: boolean }
type PrimitiveItemProps = JSX.IntrinsicElements['li'] & { asChild?: boolean }
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & { asChild?: boolean }
type PrimitiveAnchorProps = JSX.IntrinsicElements['a'] & { asChild?: boolean }
type StyleRecord = Record<string, string | number | undefined>
type IndicatorPosition = { size: number; offset: number }
type NavigationMenuContextValue = {
  isRootMenu: boolean
  value: () => string
  previousValue: () => string
  dir: () => Direction
  orientation: () => Orientation
  rootRef: { current: HTMLElement | null }
  rootNavigationMenuRef: { current: HTMLElement | null }
  viewport: () => HTMLDivElement | null
  setViewport(node: HTMLDivElement | null): void
  indicatorTrack: () => HTMLDivElement | null
  setIndicatorTrack(node: HTMLDivElement | null): void
  activeContent: () => HTMLDivElement | null
  setActiveContent(node: HTMLDivElement | null): void
  triggers: Map<string, HTMLButtonElement>
  registerTrigger(value: string, node: HTMLButtonElement | null): void
  onTriggerEnter(value: string): void
  onTriggerLeave(): void
  onContentEnter(): void
  onContentLeave(): void
  onItemSelect(value: string): void
  onItemDismiss(): void
  onRootDismiss(): void
}
type NavigationMenuItemContextValue = {
  value: () => string
  triggerId: () => string
  contentId: () => string
  triggerRef: { current: HTMLButtonElement | null }
  contentRef: { current: HTMLDivElement | null }
  focusProxyRef: { current: HTMLSpanElement | null }
  wasEscapeCloseRef: { current: boolean }
  onContentEntry(side?: 'start' | 'end'): void
  onContentExit(): void
  restoreContentTabOrder(): void
}

const ROOT_NAME = 'NavigationMenu'
const SUB_NAME = 'NavigationMenuSub'
const LIST_NAME = 'NavigationMenuList'
const ITEM_NAME = 'NavigationMenuItem'
const TRIGGER_NAME = 'NavigationMenuTrigger'
const LINK_NAME = 'NavigationMenuLink'
const INDICATOR_NAME = 'NavigationMenuIndicator'
const CONTENT_NAME = 'NavigationMenuContent'
const VIEWPORT_NAME = 'NavigationMenuViewport'
const LINK_SELECT = 'navigationMenu.linkSelect'
const ROOT_CONTENT_DISMISS = 'navigationMenu.rootContentDismiss'
const FOCUS_GROUP_ATTRIBUTE = 'data-navigation-menu-focus-group'
const FOCUS_ITEM_ATTRIBUTE = 'data-navigation-menu-focus-item'
const ARROW_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createNavigationMenuContext, createNavigationMenuScope] = createContextScope(ROOT_NAME)
const [NavigationMenuProvider, useNavigationMenuContext] =
  createNavigationMenuContext<NavigationMenuContextValue>(ROOT_NAME)
const [NavigationMenuItemProvider, useNavigationMenuItemContext] =
  createNavigationMenuContext<NavigationMenuItemContextValue>(ITEM_NAME)

type NavigationMenuProps = PrimitiveDivProps & {
  value?: MaybeAccessor<string | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
  delayDuration?: MaybeAccessor<number | undefined>
  skipDelayDuration?: MaybeAccessor<number | undefined>
  orientation?: MaybeAccessor<Orientation | undefined>
  dir?: MaybeAccessor<Direction | undefined>
}
type NavigationMenuSubProps = Omit<
  NavigationMenuProps,
  'delayDuration' | 'skipDelayDuration' | 'dir'
>
type NavigationMenuListProps = PrimitiveListProps
type NavigationMenuItemProps = Omit<PrimitiveItemProps, 'value'> & {
  value?: MaybeAccessor<string | undefined>
}
type NavigationMenuTriggerProps = PrimitiveButtonProps
type NavigationMenuLinkProps = PrimitiveAnchorProps & {
  active?: MaybeAccessor<boolean | undefined>
  onSelect?: (event: Event) => void
}
type NavigationMenuIndicatorProps = PrimitiveDivProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}
type NavigationMenuContentProps = PrimitiveDivProps &
  Pick<
    DismissableLayerProps,
    'onEscapeKeyDown' | 'onFocusOutside' | 'onInteractOutside' | 'onPointerDownOutside'
  > & {
    forceMount?: MaybeAccessor<boolean | undefined>
  }
type NavigationMenuViewportProps = PrimitiveDivProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}

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
  let current: unknown = value
  for (
    let depth = 0;
    depth < 10 && isReadableAccessor(current as MaybeAccessor<unknown>);
    depth += 1
  ) {
    current = (current as () => unknown)()
  }
  return current as T
}

function readStyle(value: unknown): StyleRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as StyleRecord) : {}
}

function createComponentNode(component: unknown, props: Record<string, unknown>): FictNode {
  return createVNode(component as (props: Record<string, unknown>) => FictNode, props)
}

function getTabbableCandidates(container: HTMLElement): HTMLElement[] {
  const candidates: HTMLElement[] = []
  const NodeFilterCtor = container.ownerDocument.defaultView?.NodeFilter ?? globalThis.NodeFilter
  const walker = container.ownerDocument.createTreeWalker(container, NodeFilterCtor.SHOW_ELEMENT, {
    acceptNode: (node) => {
      const element = node as HTMLElement
      const isHiddenInput =
        element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'hidden'
      if (element.hidden || element.hasAttribute('disabled') || isHiddenInput) {
        return NodeFilterCtor.FILTER_SKIP
      }
      return element.tabIndex >= 0 ? NodeFilterCtor.FILTER_ACCEPT : NodeFilterCtor.FILTER_SKIP
    },
  })
  while (walker.nextNode()) candidates.push(walker.currentNode as HTMLElement)
  return candidates
}

function focusFirst(candidates: HTMLElement[]): boolean {
  const previous = candidates[0]?.ownerDocument.activeElement
  for (const candidate of candidates) {
    if (candidate === candidate.ownerDocument.activeElement) return true
    candidate.focus()
    if (candidate.ownerDocument.activeElement !== previous) return true
  }
  return false
}

function removeFromTabOrder(candidates: HTMLElement[]): () => void {
  const previousTabIndexes = new Map<HTMLElement, string | null>()
  for (const candidate of candidates) {
    previousTabIndexes.set(candidate, candidate.getAttribute('tabindex'))
    candidate.setAttribute('tabindex', '-1')
  }

  return () => {
    for (const [candidate, previousTabIndex] of previousTabIndexes) {
      if (previousTabIndex === null) candidate.removeAttribute('tabindex')
      else candidate.setAttribute('tabindex', previousTabIndex)
    }
  }
}

function getFocusGroupItems(current: HTMLElement): HTMLElement[] {
  const group = current.closest<HTMLElement>(`[${FOCUS_GROUP_ATTRIBUTE}]`)
  if (!group) return []

  return Array.from(group.querySelectorAll<HTMLElement>(`[${FOCUS_ITEM_ATTRIBUTE}]`)).filter(
    (item) =>
      item.closest(`[${FOCUS_GROUP_ATTRIBUTE}]`) === group &&
      !item.hasAttribute('disabled') &&
      item.getAttribute('aria-disabled') !== 'true',
  )
}

function handleFocusGroupKeyDown(event: KeyboardEvent, dir: Direction): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return false
  if (event.key !== 'Home' && event.key !== 'End' && !ARROW_KEYS.includes(event.key)) {
    return false
  }

  let candidates = getFocusGroupItems(event.currentTarget as HTMLElement)
  const previousItemKey = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
  if ([previousItemKey, 'ArrowUp', 'End'].includes(event.key)) candidates.reverse()
  if (ARROW_KEYS.includes(event.key)) {
    const currentIndex = candidates.indexOf(event.currentTarget as HTMLElement)
    candidates = candidates.slice(currentIndex + 1)
  }

  event.preventDefault()
  const ownerWindow = (event.currentTarget as HTMLElement).ownerDocument.defaultView ?? window
  ownerWindow.setTimeout(() => focusFirst(candidates))
  return true
}

function getOrderedTriggers(context: NavigationMenuContextValue): HTMLButtonElement[] {
  return Array.from(context.triggers.values())
    .filter((trigger) => !trigger.disabled)
    .sort((left, right) => {
      const position = left.compareDocumentPosition(right)
      const NodeCtor = left.ownerDocument.defaultView?.Node ?? globalThis.Node
      if (position & NodeCtor.DOCUMENT_POSITION_FOLLOWING) return -1
      if (position & NodeCtor.DOCUMENT_POSITION_PRECEDING) return 1
      return 0
    })
}

function getMotion(
  context: NavigationMenuContextValue,
  itemValue: string,
): 'from-start' | 'from-end' | 'to-start' | 'to-end' | undefined {
  const values = getOrderedTriggers(context).map(
    (trigger) => trigger.dataset.navigationMenuValue ?? '',
  )
  if (context.dir() === 'rtl') values.reverse()
  const nextIndex = values.indexOf(context.value())
  const previousIndex = values.indexOf(context.previousValue())
  const itemIndex = values.indexOf(itemValue)
  if (nextIndex === previousIndex || itemIndex === -1) return undefined
  if (itemIndex === nextIndex && previousIndex !== -1) {
    return nextIndex > previousIndex ? 'from-end' : 'from-start'
  }
  if (itemIndex === previousIndex && nextIndex !== -1) {
    return nextIndex > previousIndex ? 'to-start' : 'to-end'
  }
  return undefined
}

function createProviderState(
  props: ScopedProps<NavigationMenuProps>,
  name: string,
  isRootMenu: boolean,
  inheritedDirection: () => Direction,
  parentContext?: NavigationMenuContextValue,
) {
  const valueProp = () =>
    props.value === undefined
      ? undefined
      : readValue(props.value as MaybeAccessor<string | undefined>)
  const defaultValue = () =>
    props.defaultValue === undefined
      ? ''
      : (readValue(props.defaultValue as MaybeAccessor<string | undefined>) ?? '')
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: name,
    onChange: (nextValue) => props.onValueChange?.(nextValue),
  })
  const previousValue = createSignal('')
  const viewport = createSignal<HTMLDivElement | null>(null)
  const indicatorTrack = createSignal<HTMLDivElement | null>(null)
  const activeContent = createSignal<HTMLDivElement | null>(null)
  const rootRef = { current: null as HTMLElement | null }
  const rootNavigationMenuRef = parentContext?.rootNavigationMenuRef ?? rootRef
  const triggers = new Map<string, HTMLButtonElement>()
  const orientation = () =>
    props.orientation === undefined
      ? 'horizontal'
      : (readValue(props.orientation as MaybeAccessor<Orientation | undefined>) ?? 'horizontal')
  const dir = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const delayDuration = () =>
    props.delayDuration === undefined
      ? 200
      : (readValue(props.delayDuration as MaybeAccessor<number | undefined>) ?? 200)
  const skipDelayDuration = () =>
    props.skipDelayDuration === undefined
      ? 300
      : (readValue(props.skipDelayDuration as MaybeAccessor<number | undefined>) ?? 300)
  let openTimer = 0
  let closeTimer = 0
  let skipDelayTimer = 0
  let isOpenDelayed = true
  const ownerWindow = () => rootRef.current?.ownerDocument.defaultView ?? window
  const clearOpenTimer = () => ownerWindow().clearTimeout(openTimer)
  const clearCloseTimer = () => ownerWindow().clearTimeout(closeTimer)
  const changeValue = (nextValue: string) => {
    const currentValue = value()
    if (currentValue !== nextValue) previousValue(currentValue)
    setValue(nextValue)
    ownerWindow().clearTimeout(skipDelayTimer)
    if (nextValue) {
      isOpenDelayed = false
    } else if (skipDelayDuration() > 0) {
      skipDelayTimer = ownerWindow().setTimeout(() => {
        isOpenDelayed = true
      }, skipDelayDuration())
    } else {
      isOpenDelayed = true
    }
  }

  useLayoutEffect(() => {
    const initialOwnerWindow = ownerWindow()
    return () => {
      initialOwnerWindow.clearTimeout(openTimer)
      initialOwnerWindow.clearTimeout(closeTimer)
      initialOwnerWindow.clearTimeout(skipDelayTimer)
    }
  })

  const dismissRoot = () => {
    if (parentContext) {
      parentContext.onRootDismiss()
      return
    }

    const currentValue = value()
    const content = activeContent()
    const activeElement = content?.ownerDocument.activeElement ?? null
    const shouldRestoreFocus = Boolean(content?.contains(activeElement))
    const trigger = triggers.get(currentValue)
    changeValue('')
    if (shouldRestoreFocus) trigger?.focus()
  }

  const context: NavigationMenuContextValue = {
    isRootMenu,
    value,
    previousValue,
    dir,
    orientation,
    rootRef,
    rootNavigationMenuRef,
    viewport,
    setViewport: viewport,
    indicatorTrack,
    setIndicatorTrack: indicatorTrack,
    activeContent,
    setActiveContent: activeContent,
    triggers,
    registerTrigger(itemValue, node) {
      if (node) triggers.set(itemValue, node)
      else triggers.delete(itemValue)
    },
    onTriggerEnter(itemValue) {
      clearOpenTimer()
      clearCloseTimer()
      if (!isRootMenu || !isOpenDelayed || value() === itemValue) {
        changeValue(itemValue)
        return
      }
      openTimer = ownerWindow().setTimeout(() => changeValue(itemValue), delayDuration())
    },
    onTriggerLeave() {
      clearOpenTimer()
      if (!isRootMenu) return
      clearCloseTimer()
      closeTimer = ownerWindow().setTimeout(() => changeValue(''), 150)
    },
    onContentEnter() {
      clearCloseTimer()
    },
    onContentLeave() {
      if (!isRootMenu) return
      clearCloseTimer()
      closeTimer = ownerWindow().setTimeout(() => changeValue(''), 150)
    },
    onItemSelect(itemValue) {
      changeValue(value() === itemValue ? '' : itemValue)
    },
    onItemDismiss() {
      changeValue('')
    },
    onRootDismiss: dismissRoot,
  }

  let lastValue = value()
  useLayoutEffect(() => {
    const nextValue = value()
    if (nextValue === lastValue) return
    previousValue(lastValue)
    lastValue = nextValue
  })

  return context
}

function NavigationMenu(props: ScopedProps<NavigationMenuProps>): FictNode {
  const inheritedDirection = useDirection()
  const context = createProviderState(props, ROOT_NAME, true, inheritedDirection)
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      children: undefined,
      defaultValue: undefined,
      delayDuration: undefined,
      dir: prop(context.dir),
      onValueChange: undefined,
      orientation: undefined,
      ref: undefined,
      skipDelayDuration: undefined,
      value: undefined,
      'aria-label': prop(() => props['aria-label'] ?? 'Main'),
      'data-orientation': prop(context.orientation),
    },
  )
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLElement>,
    context.rootRef as PossibleRef<HTMLElement>,
  )
  const rootNode = createComponentNode(
    Primitive.nav,
    mergeProps(primitiveProps, { ref: composedRefs, children: prop(() => props.children) }),
  )

  useLayoutEffect(() => {
    const root = context.rootRef.current
    if (!root) return

    const handleRootContentDismiss = () => context.onRootDismiss()
    root.addEventListener(ROOT_CONTENT_DISMISS, handleRootContentDismiss)
    return () => root.removeEventListener(ROOT_CONTENT_DISMISS, handleRootContentDismiss)
  })

  return (
    <NavigationMenuProvider
      scope={props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>}
      {...context}
    >
      {rootNode}
    </NavigationMenuProvider>
  )
}

NavigationMenu.displayName = ROOT_NAME

function NavigationMenuSub(props: ScopedProps<NavigationMenuSubProps>): FictNode {
  const parentContext = useNavigationMenuContext(
    SUB_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const context = createProviderState(
    props as ScopedProps<NavigationMenuProps>,
    SUB_NAME,
    false,
    parentContext.dir,
    parentContext,
  )
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      orientation: undefined,
      ref: undefined,
      value: undefined,
      'data-orientation': prop(context.orientation),
    },
  )
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLElement>,
    context.rootRef as PossibleRef<HTMLElement>,
  )
  const subNode = createComponentNode(
    Primitive.div,
    mergeProps(primitiveProps, { ref: composedRefs }),
  )

  return (
    <NavigationMenuProvider
      scope={props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>}
      {...context}
    >
      {subNode}
    </NavigationMenuProvider>
  )
}

NavigationMenuSub.displayName = SUB_NAME

function NavigationMenuList(props: ScopedProps<NavigationMenuListProps>): FictNode {
  const context = useNavigationMenuContext(
    LIST_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const listProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      'data-orientation': prop(context.orientation),
      ...(context.isRootMenu ? { [FOCUS_GROUP_ATTRIBUTE]: '' } : {}),
    },
  )
  const listNode = createComponentNode(Primitive.ul, listProps)

  return (
    <Primitive.div
      ref={(node: HTMLDivElement | null) => context.setIndicatorTrack(node)}
      style={{ position: 'relative' }}
    >
      {listNode}
    </Primitive.div>
  )
}

NavigationMenuList.displayName = LIST_NAME

function NavigationMenuItem(props: ScopedProps<NavigationMenuItemProps>): FictNode {
  const generatedValue = useId()
  const baseId = useId()
  const value = () =>
    props.value === undefined
      ? generatedValue()
      : (readValue(props.value as MaybeAccessor<string | undefined>) ?? generatedValue())
  const triggerId = () => `${baseId()}-trigger-${value()}`
  const contentId = () => `${baseId()}-content-${value()}`
  const triggerRef = { current: null as HTMLButtonElement | null }
  const contentRef = { current: null as HTMLDivElement | null }
  const focusProxyRef = { current: null as HTMLSpanElement | null }
  const wasEscapeCloseRef = { current: false }
  const restoreContentTabOrderRef = { current: () => {} }
  const restoreContentTabOrder = () => {
    restoreContentTabOrderRef.current()
    restoreContentTabOrderRef.current = () => {}
  }
  const onContentEntry = (side: 'start' | 'end' = 'start') => {
    const content = contentRef.current
    if (!content) return
    restoreContentTabOrder()
    const candidates = getTabbableCandidates(content)
    focusFirst(side === 'start' ? candidates : candidates.reverse())
  }
  const onContentExit = () => {
    const content = contentRef.current
    if (!content) return
    restoreContentTabOrder()
    const candidates = getTabbableCandidates(content)
    if (candidates.length > 0) {
      restoreContentTabOrderRef.current = removeFromTabOrder(candidates)
    }
  }

  useLayoutEffect(() => () => restoreContentTabOrder())
  const itemProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      value: undefined,
    },
  )
  const itemNode = createComponentNode(Primitive.li, itemProps)

  return (
    <NavigationMenuItemProvider
      scope={props.__scopeNavigationMenu as Scope<NavigationMenuItemContextValue | undefined>}
      value={value}
      triggerId={triggerId}
      contentId={contentId}
      triggerRef={triggerRef}
      contentRef={contentRef}
      focusProxyRef={focusProxyRef}
      wasEscapeCloseRef={wasEscapeCloseRef}
      onContentEntry={onContentEntry}
      onContentExit={onContentExit}
      restoreContentTabOrder={restoreContentTabOrder}
    >
      {itemNode}
    </NavigationMenuItemProvider>
  )
}

NavigationMenuItem.displayName = ITEM_NAME

function NavigationMenuTrigger(props: ScopedProps<NavigationMenuTriggerProps>): FictNode {
  const rootContext = useNavigationMenuContext(
    TRIGGER_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const itemContext = useNavigationMenuItemContext(
    TRIGGER_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuItemContextValue | undefined>,
  )
  const open = () => rootContext.value() === itemContext.value()
  let hasPointerMoveOpened = false
  let wasClickClose = false
  const disabled = () => Boolean(props.disabled)
  const setTriggerRef = (node: HTMLButtonElement | null) => {
    itemContext.triggerRef.current = node
  }
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLButtonElement>, setTriggerRef)

  useLayoutEffect(() => {
    const itemValue = itemContext.value()
    const trigger = itemContext.triggerRef.current
    if (!trigger) return
    rootContext.registerTrigger(itemValue, trigger)
    return () => rootContext.registerTrigger(itemValue, null)
  })
  const primitiveProps = mergeProps(
    {
      type: 'button',
      id: prop(itemContext.triggerId),
      'data-navigation-menu-trigger': '',
      'data-navigation-menu-value': prop(itemContext.value),
      [FOCUS_ITEM_ATTRIBUTE]: '',
      'data-state': prop(() => (open() ? 'open' : 'closed')),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
      'aria-expanded': prop(open),
      'aria-controls': prop(() => (open() ? itemContext.contentId() : undefined)),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      ref: undefined,
      onPointerEnter: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerEnter?.(event),
        (event) => {
          if (event.pointerType && event.pointerType !== 'mouse') return
          wasClickClose = false
          itemContext.wasEscapeCloseRef.current = false
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerMove?.(event),
        (event) => {
          if (event.pointerType && event.pointerType !== 'mouse') return
          if (
            disabled() ||
            wasClickClose ||
            itemContext.wasEscapeCloseRef.current ||
            hasPointerMoveOpened
          ) {
            return
          }
          hasPointerMoveOpened = true
          rootContext.onTriggerEnter(itemContext.value())
        },
      ),
      onPointerLeave: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerLeave?.(event),
        (event) => {
          if (event.pointerType && event.pointerType !== 'mouse') return
          if (disabled()) return
          hasPointerMoveOpened = false
          rootContext.onTriggerLeave()
        },
      ),
      onClick: composeEventHandlers<MouseEvent>(
        (event) => props.onClick?.(event),
        () => {
          if (disabled()) return
          const wasOpen = open()
          rootContext.onItemSelect(itemContext.value())
          wasClickClose = wasOpen
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => props.onKeyDown?.(event),
        (event) => {
          if (disabled()) return
          const entryKey =
            rootContext.orientation() === 'horizontal'
              ? 'ArrowDown'
              : rootContext.dir() === 'rtl'
                ? 'ArrowLeft'
                : 'ArrowRight'
          if (open() && event.key === entryKey) {
            event.preventDefault()
            itemContext.onContentEntry()
            return
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            rootContext.onItemSelect(itemContext.value())
            return
          }
          handleFocusGroupKeyDown(event, rootContext.dir())
        },
      ),
    },
  )
  const triggerNode = createComponentNode(
    Primitive.button,
    mergeProps(primitiveProps, { ref: composedRefs }),
  )

  return (
    <>
      {triggerNode}
      {reactive(() =>
        open() ? (
          <>
            <Primitive.span
              aria-hidden="true"
              tabIndex={0}
              data-navigation-menu-focus-proxy=""
              ref={(node: HTMLSpanElement | null) => {
                itemContext.focusProxyRef.current = node
              }}
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
              onFocus={(event: FocusEvent) => {
                const content = itemContext.contentRef.current
                const previousFocusedElement = event.relatedTarget as HTMLElement | null
                const wasTriggerFocused = previousFocusedElement === itemContext.triggerRef.current
                const wasFocusFromContent = Boolean(
                  previousFocusedElement && content?.contains(previousFocusedElement),
                )

                if (wasTriggerFocused || !wasFocusFromContent) {
                  itemContext.onContentEntry(wasTriggerFocused ? 'start' : 'end')
                }
              }}
            />
            {rootContext.viewport() ? <Primitive.span aria-owns={itemContext.contentId()} /> : null}
          </>
        ) : null,
      )}
    </>
  )
}

NavigationMenuTrigger.displayName = TRIGGER_NAME

function NavigationMenuLink(props: ScopedProps<NavigationMenuLinkProps>): FictNode {
  const rootContext = useNavigationMenuContext(
    LINK_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const active = () =>
    props.active === undefined
      ? false
      : Boolean(readValue(props.active as MaybeAccessor<boolean | undefined>) ?? false)
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      active: undefined,
      onSelect: undefined,
      [FOCUS_ITEM_ATTRIBUTE]: '',
      'data-active': prop(() => (active() ? '' : undefined)),
      'aria-current': prop(() => (active() ? 'page' : undefined)),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => props.onKeyDown?.(event),
        (event) => {
          handleFocusGroupKeyDown(event, rootContext.dir())
        },
      ),
      onClick: composeEventHandlers<MouseEvent>(
        (event) => props.onClick?.(event),
        (event) => {
          const target = event.target as HTMLElement
          const selectEvent = new CustomEvent(LINK_SELECT, {
            bubbles: true,
            cancelable: true,
          })
          target.addEventListener(LINK_SELECT, (selectEvent) => props.onSelect?.(selectEvent), {
            once: true,
          })
          target.dispatchEvent(selectEvent)

          if (!selectEvent.defaultPrevented && !event.metaKey) {
            const dismissEvent = new CustomEvent(ROOT_CONTENT_DISMISS, {
              bubbles: true,
              cancelable: true,
            })
            target.dispatchEvent(dismissEvent)
            if (!rootContext.rootNavigationMenuRef.current?.contains(target)) {
              rootContext.onRootDismiss()
            }
          }
        },
        { checkForDefaultPrevented: false },
      ),
    },
  )

  return createComponentNode(Primitive.a, primitiveProps)
}

NavigationMenuLink.displayName = LINK_NAME

function NavigationMenuIndicator(props: ScopedProps<NavigationMenuIndicatorProps>): FictNode {
  const context = useNavigationMenuContext(
    INDICATOR_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const position = createSignal<IndicatorPosition | null>(null)
  const forceMount = () =>
    props.forceMount === undefined
      ? false
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const update = () => {
    const trigger = context.triggers.get(context.value())
    if (!trigger) {
      position(null)
      return
    }
    position({
      size: context.orientation() === 'horizontal' ? trigger.offsetWidth : trigger.offsetHeight,
      offset: context.orientation() === 'horizontal' ? trigger.offsetLeft : trigger.offsetTop,
    })
  }

  useLayoutEffect(() => {
    context.value()
    const trigger = context.triggers.get(context.value())
    const track = context.indicatorTrack()
    update()
    const ownerWindow = trigger?.ownerDocument.defaultView ?? window
    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? globalThis.ResizeObserver
    const observer = ResizeObserverCtor ? new ResizeObserverCtor(update) : null
    if (trigger) observer?.observe(trigger)
    if (track) observer?.observe(track)
    ownerWindow.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      ownerWindow.removeEventListener('resize', update)
    }
  })

  const renderIndicator = () => {
    const currentPosition = position()
    if (!currentPosition && !forceMount()) return null
    const horizontal = context.orientation() === 'horizontal'
    const indicatorProps = mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        __scopeNavigationMenu: undefined,
        forceMount: undefined,
        'aria-hidden': 'true',
        'data-state': context.value() ? 'visible' : 'hidden',
        'data-orientation': context.orientation(),
        style: {
          position: 'absolute',
          left: horizontal ? 0 : undefined,
          top: horizontal ? undefined : 0,
          width: horizontal ? `${currentPosition?.size ?? 0}px` : undefined,
          height: horizontal ? undefined : `${currentPosition?.size ?? 0}px`,
          transform: horizontal
            ? `translateX(${currentPosition?.offset ?? 0}px)`
            : `translateY(${currentPosition?.offset ?? 0}px)`,
          ...readStyle(props.style),
        } as unknown as Record<string, string | number>,
      },
    )
    return createComponentNode(Primitive.div, indicatorProps)
  }

  return (
    <>
      {reactive(() => {
        if (!context.value() && !forceMount()) return null
        const indicator = renderIndicator()
        const track = context.indicatorTrack()
        return track
          ? (createFictPortal(track, () => indicator, createElement) as unknown as FictNode)
          : indicator
      })}
    </>
  )
}

NavigationMenuIndicator.displayName = INDICATOR_NAME

function NavigationMenuContent(props: ScopedProps<NavigationMenuContentProps>): FictNode {
  const rootContext = useNavigationMenuContext(
    CONTENT_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const itemContext = useNavigationMenuItemContext(
    CONTENT_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuItemContextValue | undefined>,
  )
  const present = () => rootContext.value() === itemContext.value()
  const forceMount = () =>
    props.forceMount === undefined
      ? false
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const isPreviousViewportContent = () =>
    Boolean(rootContext.viewport()) &&
    !rootContext.value() &&
    rootContext.previousValue() === itemContext.value()
  const shouldPresent = () => forceMount() || present() || isPreviousViewportContent()
  let hasBeenActive = present()
  const setContentRef = (node: HTMLDivElement | null) => {
    const previousNode = itemContext.contentRef.current
    itemContext.contentRef.current = node
    if (node && (present() || isPreviousViewportContent())) {
      rootContext.setActiveContent(node)
    } else if (!node && rootContext.activeContent() === previousNode) {
      rootContext.setActiveContent(null)
    }
    if (!node) itemContext.restoreContentTabOrder()
    const forwardedRef = props.ref as PossibleRef<HTMLDivElement>
    if (!forwardedRef) return
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else forwardedRef.current = node
  }
  let previousMotion: ReturnType<typeof getMotion>
  const motion = () => {
    const itemValue = itemContext.value()
    const isSelected = rootContext.value() === itemValue
    const wasSelected = rootContext.previousValue() === itemValue
    if (!isSelected && !wasSelected) return previousMotion
    previousMotion = getMotion(rootContext, itemValue)
    return previousMotion
  }
  const contentProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      forceMount: undefined,
      ref: undefined,
      onEscapeKeyDown: undefined,
      onFocusOutside: undefined,
      onInteractOutside: undefined,
      onPointerDownOutside: undefined,
      id: prop(itemContext.contentId),
      'aria-labelledby': prop(itemContext.triggerId),
      [FOCUS_GROUP_ATTRIBUTE]: '',
      'data-state': prop(() => (present() ? 'open' : 'closed')),
      'data-orientation': prop(rootContext.orientation),
      'data-motion': prop(motion),
      style: prop(() => ({
        pointerEvents: !present() && rootContext.isRootMenu ? 'none' : undefined,
        ...readStyle(props.style),
      })),
      onPointerEnter: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerEnter?.(event),
        () => {
          rootContext.onContentEnter()
        },
      ),
      onPointerLeave: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerLeave?.(event),
        (event) => {
          if (event.pointerType && event.pointerType !== 'mouse') return
          rootContext.onContentLeave()
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => props.onKeyDown?.(event),
        (event) => {
          const isMetaKey = event.altKey || event.ctrlKey || event.metaKey
          if (event.key !== 'Tab' || isMetaKey) return

          const content = event.currentTarget as HTMLElement
          const candidates = getTabbableCandidates(content)
          const focusedElement = content.ownerDocument.activeElement
          const index = candidates.findIndex((candidate) => candidate === focusedElement)
          const nextCandidates = event.shiftKey
            ? candidates.slice(0, index).reverse()
            : candidates.slice(index + 1)

          if (focusFirst(nextCandidates)) event.preventDefault()
          else itemContext.focusProxyRef.current?.focus()
        },
      ),
    },
  )

  useLayoutEffect(() => {
    const isOpen = present()
    const content = itemContext.contentRef.current
    if (content && (isOpen || isPreviousViewportContent())) {
      rootContext.setActiveContent(content)
    }
    if (isOpen && content) {
      itemContext.restoreContentTabOrder()
    } else if (content) {
      itemContext.onContentExit()
    }
  })

  const renderContent = () => {
    const content = createComponentNode(
      Primitive.div,
      mergeProps(contentProps, { ref: setContentRef }),
    )
    if (!present()) return content

    return (
      <DismissableLayer
        asChild
        disableOutsidePointerEvents={false}
        onEscapeKeyDown={(event) => {
          props.onEscapeKeyDown?.(event)
          if (!event.defaultPrevented) itemContext.wasEscapeCloseRef.current = true
        }}
        onPointerDownOutside={(event) => {
          props.onPointerDownOutside?.(event)
          if (event.defaultPrevented) return
          const target = event.detail.originalEvent.target as Node | null
          const isTrigger =
            Boolean(target) &&
            Array.from(rootContext.triggers.values()).some((trigger) => trigger.contains(target))
          const isRootViewport =
            rootContext.isRootMenu &&
            Boolean(target) &&
            Boolean(rootContext.viewport()?.contains(target))
          if (isTrigger || isRootViewport || !rootContext.isRootMenu) event.preventDefault()
        }}
        onFocusOutside={(event) => {
          props.onFocusOutside?.(event)
          if (event.defaultPrevented) return
          itemContext.onContentExit()
          const target = event.detail.originalEvent.target as Node | null
          if (target && rootContext.rootNavigationMenuRef.current?.contains(target)) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => props.onInteractOutside?.(event)}
        onDismiss={() => {
          const contentNode = itemContext.contentRef.current
          if (!contentNode) {
            rootContext.onRootDismiss()
            return
          }

          const EventCtor = contentNode.ownerDocument.defaultView?.Event ?? Event
          contentNode.dispatchEvent(
            new EventCtor(ROOT_CONTENT_DISMISS, { bubbles: true, cancelable: true }),
          )
          if (!rootContext.rootNavigationMenuRef.current?.contains(contentNode)) {
            rootContext.onRootDismiss()
          }
        }}
      >
        {content}
      </DismissableLayer>
    )
  }

  return (
    <Presence present={shouldPresent}>
      {({ present: isPresencePresent }) => {
        if (!isPresencePresent) return null
        const viewport = rootContext.viewport()
        if (present()) hasBeenActive = true
        const shouldPortal = hasBeenActive || isPreviousViewportContent()
        return viewport && shouldPortal
          ? (createFictPortal(viewport, renderContent, createElement) as unknown as FictNode)
          : renderContent()
      }}
    </Presence>
  )
}

NavigationMenuContent.displayName = CONTENT_NAME

function NavigationMenuViewport(props: ScopedProps<NavigationMenuViewportProps>): FictNode {
  const context = useNavigationMenuContext(
    VIEWPORT_NAME,
    props.__scopeNavigationMenu as Scope<NavigationMenuContextValue | undefined>,
  )
  const size = createSignal<{ width: number; height: number } | null>(null)
  const forceMount = () =>
    props.forceMount === undefined
      ? false
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const update = () => {
    const content = context.activeContent()
    if (!content) {
      size(null)
      return
    }
    size({ width: content.offsetWidth, height: content.offsetHeight })
  }
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    context.setViewport,
  )

  useLayoutEffect(() => {
    context.value()
    const content = context.activeContent()
    update()
    const ownerWindow = content?.ownerDocument.defaultView ?? window
    const ResizeObserverCtor = ownerWindow.ResizeObserver ?? globalThis.ResizeObserver
    const observer = content && ResizeObserverCtor ? new ResizeObserverCtor(update) : null
    if (content) observer?.observe(content)
    ownerWindow.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      ownerWindow.removeEventListener('resize', update)
    }
  })
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeNavigationMenu: undefined,
      forceMount: undefined,
      ref: undefined,
      'data-state': prop(() => (context.value() ? 'open' : 'closed')),
      'data-orientation': prop(context.orientation),
      style: prop(() => ({
        pointerEvents: !context.value() && context.isRootMenu ? 'none' : undefined,
        '--radix-navigation-menu-viewport-width': size() ? `${size()!.width}px` : undefined,
        '--radix-navigation-menu-viewport-height': size() ? `${size()!.height}px` : undefined,
        ...readStyle(props.style),
      })),
      onPointerEnter: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerEnter?.(event),
        () => {
          context.onContentEnter()
        },
      ),
      onPointerLeave: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerLeave?.(event),
        (event) => {
          if (event.pointerType && event.pointerType !== 'mouse') return
          context.onContentLeave()
        },
      ),
    },
  )
  const viewportNode = createComponentNode(
    Primitive.div,
    mergeProps(primitiveProps, { ref: composedRefs }),
  )

  return (
    <Presence present={() => forceMount() || Boolean(context.value())}>
      {({ present: isPresencePresent }) => (isPresencePresent ? viewportNode : null)}
    </Presence>
  )
}

NavigationMenuViewport.displayName = VIEWPORT_NAME

const Root = NavigationMenu
const Sub = NavigationMenuSub
const List = NavigationMenuList
const Item = NavigationMenuItem
const Trigger = NavigationMenuTrigger
const Link = NavigationMenuLink
const Indicator = NavigationMenuIndicator
const Content = NavigationMenuContent
const Viewport = NavigationMenuViewport

export {
  createNavigationMenuScope,
  NavigationMenu,
  NavigationMenuSub,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuContent,
  NavigationMenuViewport,
  Root,
  Sub,
  List,
  Item,
  Trigger,
  Link,
  Indicator,
  Content,
  Viewport,
}

export type {
  Orientation,
  NavigationMenuProps,
  NavigationMenuSubProps,
  NavigationMenuListProps,
  NavigationMenuItemProps,
  NavigationMenuTriggerProps,
  NavigationMenuLinkProps,
  NavigationMenuIndicatorProps,
  NavigationMenuContentProps,
  NavigationMenuViewportProps,
}
