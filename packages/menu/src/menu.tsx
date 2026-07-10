import {
  createContext as createRuntimeContext,
  mergeProps,
  prop,
  useContext as useRuntimeContext,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'
import { jsx as createVNode } from '@fictjs/runtime/jsx-runtime'
import { hideOthers } from 'aria-hidden'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import {
  DismissableLayer,
  DismissableLayerBranch,
  type DismissableLayerProps,
} from '@fictjs/dismissable-layer'
import { RemoveScroll } from '@fictjs/fict-remove-scroll'
import { FocusScope, type FocusScopeProps } from '@fictjs/focus-scope'
import { useId } from '@fictjs/id'
import {
  createPopperScope,
  Popper as PopperRoot,
  PopperAnchor as PopperAnchorPrimitive,
  PopperArrow as PopperArrowPrimitive,
  PopperContent as PopperContentPrimitive,
  type PopperAnchorProps as PopperAnchorPrimitiveProps,
  type PopperArrowProps as PopperArrowPrimitiveProps,
  type PopperContentProps as PopperContentPrimitiveProps,
} from '@fictjs/popper'
import { Portal as PortalPrimitive, type PortalProps as PortalPrimitiveProps } from '@fictjs/portal'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeMenu?: Scope }
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type PrimitiveSeparatorProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type CheckedState = boolean | 'indeterminate'
type MenuItemElement = HTMLElement
type FocusIntent = 'first' | 'last' | 'prev' | 'next'
type MenuSubOpenInputType = 'pointer' | 'keyboard'
type PortalContextValue = {
  forceMount: boolean | undefined
}
type MenuContextValue = {
  open: () => boolean
  onOpenChange(open: boolean): void
  dir: () => Direction
  modal: () => boolean
  contentId: () => string
}
type MenuContentContextValue = {
  contentId: () => string
  contentRef: { current: HTMLDivElement | null }
  focusItem(intent: FocusIntent, currentElement?: HTMLElement | null): void
}
type MenuRadioGroupContextValue = {
  value: () => string
  onValueChange(value: string): void
}
type MenuItemIndicatorContextValue = {
  checked: () => CheckedState
}
type MenuSubContextValue = {
  open: () => boolean
  onOpenChange(open: boolean): void
  triggerRef: { current: HTMLElement | null }
  openInputTypeRef: { current: MenuSubOpenInputType | null }
}
type StyleRecord = Record<string, string | number>

const MENU_NAME = 'Menu'
const ANCHOR_NAME = 'MenuAnchor'
const PORTAL_NAME = 'MenuPortal'
const CONTENT_NAME = 'MenuContent'
const GROUP_NAME = 'MenuGroup'
const LABEL_NAME = 'MenuLabel'
const ITEM_NAME = 'MenuItem'
const CHECKBOX_ITEM_NAME = 'MenuCheckboxItem'
const RADIO_GROUP_NAME = 'MenuRadioGroup'
const RADIO_ITEM_NAME = 'MenuRadioItem'
const ITEM_INDICATOR_NAME = 'MenuItemIndicator'
const SEPARATOR_NAME = 'MenuSeparator'
const ARROW_NAME = 'MenuArrow'
const SUB_NAME = 'MenuSub'
const SUB_TRIGGER_NAME = 'MenuSubTrigger'
const SUB_CONTENT_NAME = 'MenuSubContent'
const SELECTION_KEYS = ['Enter', ' ']
const FIRST_KEYS = ['ArrowDown', 'PageUp', 'Home']
const LAST_KEYS = ['ArrowUp', 'PageDown', 'End']
const GLOBAL_MODAL_LOCK_SELECTOR =
  '[role="menu"], [role="dialog"], [role="alertdialog"], [role="listbox"]'
const SUB_OPEN_KEYS: Record<Direction, string[]> = {
  ltr: [...SELECTION_KEYS, 'ArrowRight'],
  rtl: [...SELECTION_KEYS, 'ArrowLeft'],
}
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')
const [createMenuContext, createMenuScope] = createContextScope(MENU_NAME, [createPopperScope])
const usePopperScope = createPopperScope()
const [MenuProvider, useMenuContext] = createMenuContext<MenuContextValue>(MENU_NAME)
const [MenuContentProvider, useMenuContentContext] =
  createMenuContext<MenuContentContextValue>(CONTENT_NAME)
const [MenuRadioGroupProvider, useMenuRadioGroupContext] =
  createMenuContext<MenuRadioGroupContextValue>(RADIO_GROUP_NAME)
const [MenuItemIndicatorProvider, useMenuItemIndicatorContext] =
  createMenuContext<MenuItemIndicatorContextValue>(ITEM_INDICATOR_NAME, {
    checked: () => false,
  })
const [MenuSubProvider, useMenuSubContext] = createMenuContext<MenuSubContextValue>(SUB_NAME)
const MenuPortalContext = createRuntimeContext<PortalContextValue>({
  forceMount: undefined,
})

type MenuProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  dir?: MaybeAccessor<Direction | undefined>
  modal?: MaybeAccessor<boolean | undefined>
}

type MenuAnchorProps = PopperAnchorPrimitiveProps
type MenuPortalProps = {
  children?: FictNode | FictNode[]
  container?: PortalPrimitiveProps['container']
  forceMount?: MaybeAccessor<boolean | undefined>
}
type MenuContentProps = Omit<PopperContentPrimitiveProps, 'dir' | 'onPlaced'> &
  Omit<DismissableLayerProps, 'onDismiss'> & {
    forceMount?: MaybeAccessor<boolean | undefined>
    onOpenAutoFocus?: FocusScopeProps['onMountAutoFocus']
    onCloseAutoFocus?: FocusScopeProps['onUnmountAutoFocus']
  }
type MenuGroupProps = PrimitiveDivProps
type MenuLabelProps = PrimitiveDivProps
type MenuItemProps = PrimitiveDivProps & {
  disabled?: MaybeAccessor<boolean | undefined>
  textValue?: MaybeAccessor<string | undefined>
  onSelect?: (event: Event) => void
}
type MenuCheckboxItemProps = Omit<MenuItemProps, 'onSelect'> & {
  checked?: MaybeAccessor<CheckedState | undefined>
  onCheckedChange?: (checked: CheckedState) => void
  onSelect?: (event: Event) => void
}
type MenuRadioGroupProps = PrimitiveDivProps & {
  value?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
}
type MenuRadioItemProps = Omit<MenuItemProps, 'onSelect'> & {
  value: string
  onSelect?: (event: Event) => void
}
type MenuItemIndicatorProps = PrimitiveDivProps & {
  forceMount?: MaybeAccessor<boolean | undefined>
}
type MenuSeparatorProps = PrimitiveSeparatorProps
type MenuArrowProps = PopperArrowPrimitiveProps
type MenuSubProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
}
type MenuSubTriggerProps = MenuItemProps
type MenuSubContentProps = MenuContentProps
type PointerDownOutsideEvent = Parameters<
  NonNullable<DismissableLayerProps['onPointerDownOutside']>
>[0]
type FocusOutsideEvent = Parameters<NonNullable<DismissableLayerProps['onFocusOutside']>>[0]

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

function createComponentNode(component: unknown, props: Record<string, unknown>): FictNode {
  return createVNode(component as (props: Record<string, unknown>) => FictNode, props)
}

function getState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed'
}

function reconcileGlobalModalLocks(ownerDocument: Document): void {
  const body = ownerDocument.body
  if (!body) {
    return
  }

  const hasBlockingLayer = Array.from(
    ownerDocument.querySelectorAll<HTMLElement>(GLOBAL_MODAL_LOCK_SELECTOR),
  ).some((node) => node.isConnected)

  if (hasBlockingLayer) {
    return
  }

  if (body.style.pointerEvents === 'none') {
    body.style.pointerEvents = ''
  }

  if (body.hasAttribute('data-scroll-locked')) {
    body.removeAttribute('data-scroll-locked')
  }
}

function isMenuItemDisabled(element: MenuItemElement): boolean {
  return (
    element.hasAttribute('disabled') ||
    element.getAttribute('aria-disabled') === 'true' ||
    element.hasAttribute('data-disabled')
  )
}

function focusFirst(items: MenuItemElement[]): void {
  items[0]?.focus()
}

function focusLast(items: MenuItemElement[]): void {
  items[items.length - 1]?.focus()
}

function wrapArray<T>(array: T[], startIndex: number): T[] {
  return array.map((_, index) => array[(startIndex + index) % array.length]!)
}

function Menu(props: ScopedProps<MenuProps>): FictNode {
  const inheritedDirection = useDirection()
  const popperScope = usePopperScope(props.__scopeMenu)
  const contentId = useId()
  const modal = () =>
    props.modal === undefined
      ? true
      : Boolean(readValue(props.modal as MaybeAccessor<boolean | undefined>) ?? true)
  const dir = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: () => false,
    caller: MENU_NAME,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })

  return (
    <PopperRoot {...popperScope}>
      <MenuProvider
        scope={props.__scopeMenu as Scope<MenuContextValue | undefined>}
        open={open}
        onOpenChange={setOpen}
        dir={dir}
        modal={modal}
        contentId={contentId}
      >
        {props.children}
      </MenuProvider>
    </PopperRoot>
  )
}

Menu.displayName = MENU_NAME

function MenuAnchor(props: ScopedProps<MenuAnchorProps>): FictNode {
  const popperScope = usePopperScope(props.__scopeMenu)
  const anchorProps = mergeProps(
    popperScope as Record<string, unknown>,
    prop(() => props as Record<string, unknown>),
    { __scopeMenu: undefined },
  )

  return createComponentNode(PopperAnchorPrimitive, anchorProps)
}

MenuAnchor.displayName = ANCHOR_NAME

function MenuPortal(props: ScopedProps<MenuPortalProps>): FictNode {
  const context = useMenuContext(
    PORTAL_NAME,
    props.__scopeMenu as Scope<MenuContextValue | undefined>,
  )
  const forceMount =
    props.forceMount === undefined
      ? undefined
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const portalProps =
    props.container === undefined
      ? {
          style: {
            display: 'contents',
          },
        }
      : {
          container: props.container,
          style: {
            display: 'contents',
          },
        }

  return (
    <MenuPortalContext.Provider value={{ forceMount }}>
      <Presence present={() => Boolean(forceMount || context.open())}>
        <PortalPrimitive {...portalProps}>{props.children}</PortalPrimitive>
      </Presence>
    </MenuPortalContext.Provider>
  )
}

MenuPortal.displayName = PORTAL_NAME

function MenuContent(props: ScopedProps<MenuContentProps>): FictNode {
  const portalContext = useRuntimeContext(MenuPortalContext)
  const menuContext = useMenuContext(
    CONTENT_NAME,
    props.__scopeMenu as Scope<MenuContextValue | undefined>,
  )
  const forceMount =
    props.forceMount === undefined
      ? portalContext.forceMount
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const contentRef = { current: null as HTMLDivElement | null }

  const getItems = () =>
    Array.from(
      contentRef.current?.querySelectorAll<MenuItemElement>(
        `[data-menu-item][data-menu-content-id="${menuContext.contentId()}"]`,
      ) ?? [],
    ).filter((item) => item.isConnected && !isMenuItemDisabled(item))

  const focusItem = (intent: FocusIntent, currentElement?: HTMLElement | null) => {
    const items = getItems()
    if (items.length === 0) return

    if (intent === 'first') {
      focusFirst(items)
      return
    }

    if (intent === 'last') {
      focusLast(items)
      return
    }

    const currentIndex = items.indexOf(currentElement as MenuItemElement)
    const candidates =
      currentIndex === -1
        ? items
        : wrapArray(items, currentIndex + (intent === 'next' ? 1 : items.length - 1))

    focusFirst(candidates)
  }
  const contentImplNode = createComponentNode(
    MenuContentImpl,
    mergeProps(prop(() => props as Record<string, unknown>)),
  )

  return (
    <>
      {reactive(() =>
        forceMount || menuContext.open() ? (
          <MenuContentProvider
            scope={props.__scopeMenu as Scope<MenuContentContextValue | undefined>}
            contentId={menuContext.contentId}
            contentRef={contentRef}
            focusItem={focusItem}
          >
            {contentImplNode}
          </MenuContentProvider>
        ) : null,
      )}
    </>
  )
}

MenuContent.displayName = CONTENT_NAME

function MenuContentImpl(props: ScopedProps<MenuContentProps>): FictNode {
  const __scopeMenu = props.__scopeMenu
  const menuContext = useMenuContext(
    CONTENT_NAME,
    __scopeMenu as Scope<MenuContextValue | undefined>,
  )
  const contentContext = useMenuContentContext(
    CONTENT_NAME,
    __scopeMenu as Scope<MenuContentContextValue | undefined>,
  )
  const popperScope = usePopperScope(__scopeMenu)
  const ref = { current: null as HTMLDivElement | null }
  const hasOpened = { current: false }
  const openAutoFocusPreventedRef = { current: false }
  const typeaheadRef = { current: '' }
  const typeaheadTimerRef = {
    current: undefined as ReturnType<typeof globalThis.setTimeout> | undefined,
  }
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    ref,
    contentContext.contentRef,
  )

  useLayoutEffect(() => {
    if (!menuContext.open()) {
      openAutoFocusPreventedRef.current = false
      return
    }

    const currentContent = ref.current
    if (!currentContent) return

    setTimeout(() => {
      if (!menuContext.open()) return
      if (openAutoFocusPreventedRef.current) return

      contentContext.focusItem('first')
    }, 0)
  })

  useLayoutEffect(() => () => {
    if (typeaheadTimerRef.current !== undefined) {
      globalThis.clearTimeout(typeaheadTimerRef.current)
    }
  })

  useLayoutEffect(() => {
    const isOpen = menuContext.open()

    if (isOpen) {
      hasOpened.current = true
      return
    }

    if (!menuContext.modal() || !hasOpened.current) {
      return
    }

    const currentDocument = ref.current?.ownerDocument ?? globalThis.document
    const timeoutId = globalThis.setTimeout(() => {
      reconcileGlobalModalLocks(currentDocument)
    }, 0)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  })

  useLayoutEffect(() => {
    if (!menuContext.modal()) return

    const content = ref.current
    if (!content) return

    const body = content.ownerDocument.body
    if (!body.contains(content) && process.env.NODE_ENV !== 'test') {
      return
    }

    try {
      return hideOthers(content)
    } catch {
      return
    }
  })

  const popperContentProps = mergeProps<Record<string, unknown>>(
    {
      id: prop(menuContext.contentId),
      role: 'menu',
      tabIndex: -1,
      'data-state': prop(() => getState(menuContext.open())),
      'data-orientation': 'vertical',
    } as Record<string, unknown>,
    popperScope as Record<string, unknown>,
    prop(() => props as Record<string, unknown>),
    {
      __scopeMenu: undefined,
      disableOutsidePointerEvents: undefined,
      dir: prop(menuContext.dir),
      forceMount: undefined,
      onCloseAutoFocus: undefined,
      onEscapeKeyDown: undefined,
      onFocusOutside: undefined,
      onInteractOutside: undefined,
      onOpenAutoFocus: undefined,
      onPointerDownOutside: undefined,
      'oncapture:blur': undefined,
      'oncapture:focus': undefined,
      'oncapture:pointerdown': undefined,
      ref: undefined,
      onDismiss: undefined,
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => props.onKeyDown?.(event),
        (event) => {
          if (event.key === 'Tab') {
            event.preventDefault()
            return
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            contentContext.focusItem(
              'next',
              (event.currentTarget as HTMLElement).ownerDocument
                .activeElement as HTMLElement | null,
            )
            return
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            contentContext.focusItem(
              'prev',
              (event.currentTarget as HTMLElement).ownerDocument
                .activeElement as HTMLElement | null,
            )
            return
          }

          if (FIRST_KEYS.includes(event.key)) {
            event.preventDefault()
            contentContext.focusItem('first')
            return
          }

          if (LAST_KEYS.includes(event.key)) {
            event.preventDefault()
            contentContext.focusItem('last')
            return
          }

          if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
            const content = contentContext.contentRef.current
            if (!content) return

            const nextSearch = typeaheadRef.current + event.key.toLowerCase()
            const search = nextSearch.split('').every((character) => character === nextSearch[0])
              ? nextSearch[0]!
              : nextSearch
            const items = Array.from(
              content.querySelectorAll<MenuItemElement>(
                `[data-menu-item][data-menu-content-id="${contentContext.contentId()}"]`,
              ),
            ).filter((item) => item.isConnected && !isMenuItemDisabled(item))
            const activeElement = content.ownerDocument.activeElement as MenuItemElement | null
            const activeIndex = items.indexOf(activeElement as MenuItemElement)
            const candidates =
              activeIndex === -1 ? items : wrapArray(items, Math.max(0, activeIndex + 1))
            const match = candidates.find((item) => {
              const textValue = item.getAttribute('data-text-value') ?? item.textContent ?? ''
              return textValue.trim().toLowerCase().startsWith(search)
            })

            typeaheadRef.current = nextSearch
            if (typeaheadTimerRef.current !== undefined) {
              globalThis.clearTimeout(typeaheadTimerRef.current)
            }
            typeaheadTimerRef.current = globalThis.setTimeout(() => {
              typeaheadRef.current = ''
            }, 1000)

            if (match) {
              event.preventDefault()
              match.focus()
            }
          }
        },
      ),
    },
  )

  const focusScopeProps = {
    loop: true,
    trapped: menuContext.modal,
    onMountAutoFocus: (event: Event) => {
      props.onOpenAutoFocus?.(event)
      openAutoFocusPreventedRef.current = event.defaultPrevented
      if (event.defaultPrevented) return

      event.preventDefault()
      contentContext.focusItem('first')
    },
    onUnmountAutoFocus: (event: Event) => props.onCloseAutoFocus?.(event),
  }
  const dismissableLayerProps = mergeProps<Record<string, unknown>>({
    asChild: true,
    disableOutsidePointerEvents: menuContext.modal,
    onDismiss: () => menuContext.onOpenChange(false),
    onInteractOutside: (event: PointerDownOutsideEvent | FocusOutsideEvent) => {
      const target = event.detail.originalEvent.target as HTMLElement | null
      const isFocusInsideContent =
        event.detail.originalEvent.type === 'focusin' &&
        !!target &&
        !!ref.current &&
        ref.current.contains(target)

      if (isFocusInsideContent) {
        event.preventDefault()
        return
      }

      props.onInteractOutside?.(event)
    },
    onFocusOutside: (event: FocusOutsideEvent) => {
      const target = event.detail.originalEvent.target as HTMLElement | null
      const isFocusInsideContent = !!target && !!ref.current && ref.current.contains(target)

      if (isFocusInsideContent) {
        event.preventDefault()
        return
      }

      props.onFocusOutside?.(event)
    },
    onPointerDownOutside: (event: PointerDownOutsideEvent) => props.onPointerDownOutside?.(event),
    onEscapeKeyDown: (event: KeyboardEvent) => props.onEscapeKeyDown?.(event),
    'oncapture:blur': (event: FocusEvent) => props['oncapture:blur']?.(event),
    'oncapture:focus': (event: FocusEvent) => props['oncapture:focus']?.(event),
    'oncapture:pointerdown': (event: PointerEvent) => props['oncapture:pointerdown']?.(event),
  })
  const popperContentNode = createComponentNode(
    PopperContentPrimitive,
    mergeProps(popperContentProps, { ref: composedRefs }),
  )

  const contentNode = (
    <FocusScope {...focusScopeProps} asChild>
      <DismissableLayer {...dismissableLayerProps}>{popperContentNode}</DismissableLayer>
    </FocusScope>
  )

  if (!menuContext.modal()) {
    return contentNode
  }

  return <RemoveScroll>{contentNode}</RemoveScroll>
}

function MenuGroup(props: ScopedProps<MenuGroupProps>): FictNode {
  return createComponentNode(
    Primitive.div,
    mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        __scopeMenu: undefined,
        role: 'group',
      },
    ),
  )
}

MenuGroup.displayName = GROUP_NAME

function MenuLabel(props: ScopedProps<MenuLabelProps>): FictNode {
  return createComponentNode(
    Primitive.div,
    mergeProps(
      prop(() => props as Record<string, unknown>),
      { __scopeMenu: undefined },
    ),
  )
}

MenuLabel.displayName = LABEL_NAME

type MenuItemImplProps = MenuItemProps & {
  checked?: () => CheckedState
  role?: string
  closeOnSelect?: boolean
}

function MenuItemImpl(props: ScopedProps<MenuItemImplProps>): FictNode {
  const __scopeMenu = props.__scopeMenu
  const checked = props.checked
  const menuContext = useMenuContext(ITEM_NAME, __scopeMenu as Scope<MenuContextValue | undefined>)
  const contentContext = useMenuContentContext(
    ITEM_NAME,
    __scopeMenu as Scope<MenuContentContextValue | undefined>,
  )
  const highlighted = createSignal(false)
  const role = () => (props.role === undefined ? 'menuitem' : props.role)
  const closeOnSelect = () => props.closeOnSelect !== false
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const dataState = () => {
    const value = checked?.()
    if (value === 'indeterminate') return 'indeterminate'
    if (value === true) return 'checked'
    return 'unchecked'
  }

  const primitiveProps = mergeProps(
    {
      role: prop(role),
      tabIndex: -1,
      'data-menu-item': '',
      'data-menu-content-id': prop(contentContext.contentId),
      'data-highlighted': prop(() => (highlighted() ? '' : undefined)),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
      'data-state': checked ? prop(dataState) : undefined,
      'data-text-value': prop(() =>
        props.textValue === undefined
          ? undefined
          : readValue(props.textValue as MaybeAccessor<string | undefined>),
      ),
      'aria-disabled': prop(() => (disabled() ? 'true' : undefined)),
      'aria-checked': checked
        ? prop(() => String(checked() === 'indeterminate' ? 'mixed' : checked() === true))
        : undefined,
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeMenu: undefined,
      checked: undefined,
      closeOnSelect: undefined,
      disabled: undefined,
      onSelect: undefined,
      ref: undefined,
      textValue: undefined,
      onFocus: composeEventHandlers<FocusEvent>(
        (event) => props.onFocus?.(event),
        () => {
          if (!disabled()) {
            highlighted(true)
          }
        },
      ),
      onBlur: composeEventHandlers<FocusEvent>(
        (event) => props.onBlur?.(event),
        () => {
          highlighted(false)
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        (event) => props.onPointerMove?.(event),
        () => {
          if (disabled()) return
          highlighted(true)
          ;(document.activeElement as HTMLElement | null)?.blur?.()
          ;(primitivePropsRef.current as HTMLElement | null)?.focus()
        },
      ),
      onClick: composeEventHandlers<MouseEvent>(
        (event) => props.onClick?.(event),
        (event) => {
          if (disabled()) {
            event.preventDefault()
            return
          }

          props.onSelect?.(event)
          if (!event.defaultPrevented && closeOnSelect()) {
            menuContext.onOpenChange(false)
          }
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => props.onKeyDown?.(event),
        (event) => {
          if (disabled()) return

          if (SELECTION_KEYS.includes(event.key)) {
            event.preventDefault()
            ;(event.currentTarget as HTMLElement).click()
          }
        },
      ),
    },
  )
  const primitivePropsRef = { current: null as HTMLElement | null }
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLElement>,
    primitivePropsRef as PossibleRef<HTMLElement>,
  )

  const itemNode = createComponentNode(
    Primitive.div,
    mergeProps(primitiveProps, { ref: composedRefs }),
  )

  return (
    <MenuItemIndicatorProvider
      scope={__scopeMenu as Scope<MenuItemIndicatorContextValue | undefined>}
      checked={checked ?? (() => false)}
    >
      {itemNode}
    </MenuItemIndicatorProvider>
  )
}

function MenuItem(props: ScopedProps<MenuItemProps>): FictNode {
  return createComponentNode(MenuItemImpl, mergeProps(prop(() => props as Record<string, unknown>)))
}

MenuItem.displayName = ITEM_NAME

function MenuCheckboxItem(props: ScopedProps<MenuCheckboxItemProps>): FictNode {
  const checked = () =>
    props.checked === undefined
      ? false
      : (readValue(props.checked as MaybeAccessor<CheckedState | undefined>) ?? false)

  return createComponentNode(
    MenuItemImpl,
    mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        role: 'menuitemcheckbox',
        checked,
        onSelect: (event: Event) => {
          props.onSelect?.(event)
          if (event.defaultPrevented) return

          const current = checked()
          const next = current === 'indeterminate' ? true : !current
          props.onCheckedChange?.(next)
        },
      },
    ),
  )
}

MenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME

function MenuRadioGroup(props: ScopedProps<MenuRadioGroupProps>): FictNode {
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeMenu: undefined,
      onValueChange: undefined,
      value: undefined,
    },
  )
  const value = () =>
    props.value === undefined
      ? ''
      : (readValue(props.value as MaybeAccessor<string | undefined>) ?? '')

  return (
    <MenuRadioGroupProvider
      scope={props.__scopeMenu as Scope<MenuRadioGroupContextValue | undefined>}
      value={value}
      onValueChange={(nextValue) => {
        props.onValueChange?.(nextValue)
      }}
    >
      {createComponentNode(
        Primitive.div,
        mergeProps(primitiveProps, { children: prop(() => props.children) }),
      )}
    </MenuRadioGroupProvider>
  )
}

MenuRadioGroup.displayName = RADIO_GROUP_NAME

function MenuRadioItem(props: ScopedProps<MenuRadioItemProps>): FictNode {
  const radioGroupContext = useMenuRadioGroupContext(
    RADIO_ITEM_NAME,
    props.__scopeMenu as Scope<MenuRadioGroupContextValue | undefined>,
  )
  const checked = () => radioGroupContext.value() === props.value

  return createComponentNode(
    MenuItemImpl,
    mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        role: 'menuitemradio',
        checked: () => checked(),
        onSelect: (event: Event) => {
          props.onSelect?.(event)
          if (event.defaultPrevented) return

          radioGroupContext.onValueChange(props.value)
        },
      },
    ),
  )
}

MenuRadioItem.displayName = RADIO_ITEM_NAME

function MenuItemIndicator(props: ScopedProps<MenuItemIndicatorProps>): FictNode {
  const indicatorContext = useMenuItemIndicatorContext(
    ITEM_INDICATOR_NAME,
    props.__scopeMenu as Scope<MenuItemIndicatorContextValue | undefined>,
  )
  const forceMount =
    props.forceMount === undefined
      ? false
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const present = () =>
    forceMount ||
    indicatorContext.checked() === true ||
    indicatorContext.checked() === 'indeterminate'
  const indicatorNode = createComponentNode(
    Primitive.div,
    mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        __scopeMenu: undefined,
        forceMount: undefined,
      },
    ),
  )

  return <>{reactive(() => (present() ? indicatorNode : null))}</>
}

MenuItemIndicator.displayName = ITEM_INDICATOR_NAME

function MenuSeparator(props: ScopedProps<MenuSeparatorProps>): FictNode {
  return createComponentNode(
    Primitive.div,
    mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        __scopeMenu: undefined,
        role: 'separator',
      },
    ),
  )
}

MenuSeparator.displayName = SEPARATOR_NAME

function MenuArrow(props: ScopedProps<MenuArrowProps>): FictNode {
  const popperScope = usePopperScope(props.__scopeMenu)
  const arrowProps = mergeProps(
    popperScope as Record<string, unknown>,
    prop(() => props as Record<string, unknown>),
    { __scopeMenu: undefined },
  )

  return createComponentNode(PopperArrowPrimitive, arrowProps)
}

MenuArrow.displayName = ARROW_NAME

function MenuSub(props: ScopedProps<MenuSubProps>): FictNode {
  const parentMenuContext = useMenuContext(
    SUB_NAME,
    props.__scopeMenu as Scope<MenuContextValue | undefined>,
  )
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: SUB_NAME,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })
  const triggerRef = { current: null as HTMLElement | null }
  const openInputTypeRef = { current: null as MenuSubOpenInputType | null }
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      openInputTypeRef.current = null
    }

    setOpen(nextOpen)
  }

  return (
    <Menu
      open={open}
      onOpenChange={handleOpenChange}
      dir={parentMenuContext.dir}
      modal={false}
      __scopeMenu={props.__scopeMenu}
    >
      <MenuSubProvider
        scope={props.__scopeMenu as Scope<MenuSubContextValue | undefined>}
        open={open}
        onOpenChange={handleOpenChange}
        triggerRef={triggerRef}
        openInputTypeRef={openInputTypeRef}
      >
        {props.children}
      </MenuSubProvider>
    </Menu>
  )
}

MenuSub.displayName = SUB_NAME

function MenuSubTrigger(props: ScopedProps<MenuSubTriggerProps>): FictNode {
  const menuContext = useMenuContext(
    SUB_TRIGGER_NAME,
    props.__scopeMenu as Scope<MenuContextValue | undefined>,
  )
  const subContext = useMenuSubContext(
    SUB_TRIGGER_NAME,
    props.__scopeMenu as Scope<MenuSubContextValue | undefined>,
  )
  const ref = { current: null as HTMLElement | null }
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLElement>,
    ref,
    subContext.triggerRef,
  )
  const openKeys = () => SUB_OPEN_KEYS[menuContext.dir()]
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const subTriggerNode = createComponentNode(
    MenuItemImpl,
    mergeProps(
      prop(() => props as Record<string, unknown>),
      {
        ref: composedRefs,
        role: 'menuitem',
        closeOnSelect: false,
        'aria-haspopup': 'menu',
        'aria-expanded': prop(() => (subContext.open() ? 'true' : 'false')),
        'data-state': prop(() => getState(subContext.open())),
        onSelect: (event: Event) => {
          props.onSelect?.(event)
          if (!event.defaultPrevented) {
            const nextOpen = !subContext.open()
            if (nextOpen) {
              subContext.openInputTypeRef.current = 'pointer'
            }

            subContext.onOpenChange(nextOpen)
          }
        },
        onPointerMove: composeEventHandlers<PointerEvent>(
          (event) => props.onPointerMove?.(event),
          () => {
            if (!disabled()) {
              subContext.openInputTypeRef.current = 'pointer'
              subContext.onOpenChange(true)
            }
          },
        ),
        onKeyDown: composeEventHandlers<KeyboardEvent>(
          (event) => props.onKeyDown?.(event),
          (event) => {
            if (disabled()) return
            if (!openKeys().includes(event.key)) return

            event.preventDefault()
            subContext.openInputTypeRef.current = 'keyboard'
            subContext.onOpenChange(true)
          },
        ),
      },
    ),
  )

  return (
    <MenuAnchor asChild __scopeMenu={props.__scopeMenu}>
      <DismissableLayerBranch asChild>{subTriggerNode}</DismissableLayerBranch>
    </MenuAnchor>
  )
}

MenuSubTrigger.displayName = SUB_TRIGGER_NAME

function MenuSubContent(props: ScopedProps<MenuSubContentProps>): FictNode {
  const menuContext = useMenuContext(
    SUB_CONTENT_NAME,
    props.__scopeMenu as Scope<MenuContextValue | undefined>,
  )
  const subContext = useMenuSubContext(
    SUB_CONTENT_NAME,
    props.__scopeMenu as Scope<MenuSubContextValue | undefined>,
  )
  const side = () => {
    const defaultSide = menuContext.dir() === 'rtl' ? 'left' : 'right'
    const value =
      props.side === undefined
        ? defaultSide
        : (readValue(
            props.side as MaybeAccessor<'top' | 'right' | 'bottom' | 'left' | undefined>,
          ) ?? defaultSide)

    return value === 'left' ? 'left' : 'right'
  }
  const subContentProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      side: prop(side),
      align: prop(() => props.align ?? 'start'),
      sideOffset: prop(() => props.sideOffset ?? 4),
      alignOffset: prop(() => props.alignOffset ?? 0),
      onOpenAutoFocus: (event: Event) => {
        props.onOpenAutoFocus?.(event)
        if (event.defaultPrevented) return
        if (subContext.openInputTypeRef.current === 'keyboard') return

        event.preventDefault()
      },
      onCloseAutoFocus: (event: Event) => {
        props.onCloseAutoFocus?.(event)
        if (event.defaultPrevented) return

        event.preventDefault()
        subContext.triggerRef.current?.focus()
      },
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => props.onKeyDown?.(event),
        (event) => {
          const closeKey = menuContext.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
          if (event.key !== closeKey) return

          event.preventDefault()
          subContext.onOpenChange(false)
          subContext.triggerRef.current?.focus()
        },
      ),
      style: prop(() => ({
        outline: 'none',
        width: '100%',
        pointerEvents: 'auto',
        '--radix-dropdown-menu-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-dropdown-menu-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-dropdown-menu-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-dropdown-menu-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-dropdown-menu-trigger-height': 'var(--radix-popper-anchor-height)',
        '--radix-context-menu-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-context-menu-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-context-menu-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-context-menu-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-context-menu-trigger-height': 'var(--radix-popper-anchor-height)',
        '--radix-menubar-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-menubar-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-menubar-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-menubar-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-menubar-trigger-height': 'var(--radix-popper-anchor-height)',
        ...readStyle(props.style),
      })),
    },
  )

  return createComponentNode(MenuContent, subContentProps)
}

MenuSubContent.displayName = SUB_CONTENT_NAME

const Root = Menu
const Anchor = MenuAnchor
const Portal = MenuPortal
const Content = MenuContent
const Group = MenuGroup
const Label = MenuLabel
const Item = MenuItem
const CheckboxItem = MenuCheckboxItem
const RadioGroup = MenuRadioGroup
const RadioItem = MenuRadioItem
const ItemIndicator = MenuItemIndicator
const Separator = MenuSeparator
const Arrow = MenuArrow
const Sub = MenuSub
const SubTrigger = MenuSubTrigger
const SubContent = MenuSubContent

export {
  createMenuScope,
  Menu,
  MenuAnchor,
  MenuPortal,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuItemIndicator,
  MenuSeparator,
  MenuArrow,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  Root,
  Anchor,
  Portal,
  Content,
  Group,
  Label,
  Item,
  CheckboxItem,
  RadioGroup,
  RadioItem,
  ItemIndicator,
  Separator,
  Arrow,
  Sub,
  SubTrigger,
  SubContent,
}

export type {
  MenuProps,
  MenuAnchorProps,
  MenuPortalProps,
  MenuContentProps,
  MenuGroupProps,
  MenuLabelProps,
  MenuItemProps,
  MenuCheckboxItemProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuItemIndicatorProps,
  MenuSeparatorProps,
  MenuArrowProps,
  MenuSubProps,
  MenuSubTriggerProps,
  MenuSubContentProps,
}
