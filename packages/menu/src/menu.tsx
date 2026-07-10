import {
  createContext as createRuntimeContext,
  mergeProps,
  prop,
  useContext as useRuntimeContext,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'
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
import { Portal as PortalPrimitive, type PortalProps as PortalPrimitiveProps } from '@fictjs/portal'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeMenu?: Scope }
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type PrimitiveSeparatorProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type PrimitiveSvgProps = JSX.IntrinsicElements['svg'] & {
  asChild?: boolean
}
type CheckedState = boolean | 'indeterminate'
type MenuItemElement = HTMLElement
type FocusIntent = 'first' | 'last' | 'prev' | 'next'
type MenuSubOpenInputType = 'pointer' | 'keyboard'
type MenuSubSide = 'right' | 'left'
type MenuAlign = 'start' | 'center' | 'end'
type ContentSize = { width: number; height: number }
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
const MENU_FALLBACK_COLLISION_SIZE = 160

const [createMenuContext, createMenuScope] = createContextScope(MENU_NAME)
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

type MenuAnchorProps = PrimitiveDivProps
type MenuPortalProps = {
  children?: FictNode | FictNode[]
  container?: PortalPrimitiveProps['container']
  forceMount?: MaybeAccessor<boolean | undefined>
}
type MenuContentProps = PrimitiveDivProps &
  Omit<DismissableLayerProps, 'onDismiss'> & {
    align?: MaybeAccessor<'start' | 'center' | 'end' | undefined>
    alignOffset?: MaybeAccessor<number | undefined>
    side?: MaybeAccessor<'top' | 'right' | 'bottom' | 'left' | undefined>
    sideOffset?: MaybeAccessor<number | undefined>
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
type MenuArrowProps = PrimitiveSvgProps
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function getViewportWidth(): number {
  return globalThis.innerWidth || document.documentElement.clientWidth || 0
}

function getViewportHeight(): number {
  return globalThis.innerHeight || document.documentElement.clientHeight || 0
}

function measureMenuContentSize(content: HTMLElement | null): ContentSize {
  if (!content) {
    return { width: 0, height: 0 }
  }

  const rect = content.getBoundingClientRect()

  return {
    width: Math.max(rect.width, content.scrollWidth),
    height: Math.max(rect.height, content.scrollHeight),
  }
}

function getSubAvailableWidth(
  rect: DOMRect,
  side: MenuSubSide,
  sideOffset: number,
  viewportWidth: number,
): number {
  return side === 'left'
    ? Math.max(rect.left - sideOffset, 0)
    : Math.max(viewportWidth - rect.right - sideOffset, 0)
}

function getSubContentPlacedSide(
  trigger: HTMLElement | null,
  contentSize: ContentSize,
  side: MenuSubSide,
  sideOffset: number,
): MenuSubSide {
  if (!trigger) {
    return side
  }

  const rect = trigger.getBoundingClientRect()
  const viewportWidth = getViewportWidth()
  const oppositeSide = side === 'left' ? 'right' : 'left'
  const desiredAvailable = getSubAvailableWidth(rect, side, sideOffset, viewportWidth)
  const oppositeAvailable = getSubAvailableWidth(rect, oppositeSide, sideOffset, viewportWidth)
  const requiredWidth = contentSize.width || MENU_FALLBACK_COLLISION_SIZE

  if (desiredAvailable < requiredWidth && oppositeAvailable > desiredAvailable) {
    return oppositeSide
  }

  return side
}

function getSubContentWrapperStyle(
  trigger: HTMLElement | null,
  contentSize: ContentSize,
  side: MenuSubSide,
  align: MenuAlign,
  sideOffset: number,
  alignOffset: number,
): StyleRecord {
  if (!trigger) {
    return { pointerEvents: 'auto' }
  }

  const rect = trigger.getBoundingClientRect()
  const viewportWidth = getViewportWidth()
  const viewportHeight = getViewportHeight()
  const availableWidth = getSubAvailableWidth(rect, side, sideOffset, viewportWidth)
  const availableHeight = Math.max(viewportHeight, 0)
  const collisionHeight = contentSize.height || MENU_FALLBACK_COLLISION_SIZE
  let contentTop = rect.top
  const left = side === 'left' ? rect.left - sideOffset : rect.right + sideOffset
  let translateSuffix = side === 'left' ? ' translate(-100%, 0)' : ''

  if (align === 'center') {
    contentTop = rect.top + rect.height / 2 - collisionHeight / 2
    translateSuffix = side === 'left' ? ' translate(-100%, -50%)' : ' translate(0, -50%)'
  } else if (align === 'end') {
    contentTop = rect.bottom - collisionHeight
    translateSuffix = side === 'left' ? ' translate(-100%, -100%)' : ' translate(0, -100%)'
  }

  contentTop = clamp(contentTop + alignOffset, 0, viewportHeight - collisionHeight)

  const top =
    align === 'center'
      ? contentTop + collisionHeight / 2
      : align === 'end'
        ? contentTop + collisionHeight
        : contentTop

  const originX = side === 'left' ? '100%' : '0px'
  const originY = align === 'center' ? '50%' : align === 'end' ? '100%' : '0%'

  return {
    position: 'fixed',
    left: '0px',
    top: '0px',
    transform: `translate(${Math.round(left)}px, ${Math.round(top)}px)${translateSuffix}`,
    pointerEvents: 'auto',
    minWidth: 'max-content',
    zIndex: 'auto',
    '--radix-popper-transform-origin': `${originX} ${originY}`,
    '--radix-popper-available-width': `${Math.max(availableWidth, 0)}px`,
    '--radix-popper-available-height': `${Math.max(availableHeight, 0)}px`,
    '--radix-popper-anchor-width': `${Math.max(rect.width, 0)}px`,
    '--radix-popper-anchor-height': `${Math.max(rect.height, 0)}px`,
  }
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
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
  })

  return (
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
  )
}

Menu.displayName = MENU_NAME

function MenuAnchor(props: ScopedProps<MenuAnchorProps>): FictNode {
  return <Primitive.div {...(props as Record<string, unknown>)} />
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

  return (
    <>
      {reactive(() =>
        Boolean(forceMount || menuContext.open()) ? (
          <MenuContentProvider
            scope={props.__scopeMenu as Scope<MenuContentContextValue | undefined>}
            contentId={menuContext.contentId}
            contentRef={contentRef}
            focusItem={focusItem}
          >
            <MenuContentImpl {...props} />
          </MenuContentProvider>
        ) : null,
      )}
    </>
  )
}

MenuContent.displayName = CONTENT_NAME

function MenuContentImpl(props: ScopedProps<MenuContentProps>): FictNode {
  const { __scopeMenu, forceMount: _forceMount, ...contentProps } = props
  const menuContext = useMenuContext(
    CONTENT_NAME,
    __scopeMenu as Scope<MenuContextValue | undefined>,
  )
  const contentContext = useMenuContentContext(
    CONTENT_NAME,
    __scopeMenu as Scope<MenuContentContextValue | undefined>,
  )
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

  const layerProps = mergeProps(
    {
      id: prop(menuContext.contentId),
      role: 'menu',
      tabIndex: -1,
      'data-state': prop(() => getState(menuContext.open())),
      'data-orientation': 'vertical',
    },
    prop(() => contentProps as Record<string, unknown>),
    {
      __scopeMenu: undefined,
      forceMount: undefined,
      onCloseAutoFocus: undefined,
      onOpenAutoFocus: undefined,
      ref: undefined,
      onDismiss: undefined,
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
      onPointerDownOutside: props.onPointerDownOutside,
      onEscapeKeyDown: props.onEscapeKeyDown,
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
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
    ...(props.onCloseAutoFocus ? { onUnmountAutoFocus: props.onCloseAutoFocus } : {}),
  }

  const contentNode = (
    <FocusScope {...focusScopeProps} asChild>
      <DismissableLayer
        {...(layerProps as Record<string, unknown>)}
        ref={composedRefs}
        disableOutsidePointerEvents={menuContext.modal}
        onDismiss={() => {
          menuContext.onOpenChange(false)
        }}
      />
    </FocusScope>
  )

  if (!menuContext.modal()) {
    return contentNode
  }

  return <RemoveScroll>{contentNode}</RemoveScroll>
}

function MenuGroup(props: ScopedProps<MenuGroupProps>): FictNode {
  return <Primitive.div role="group" {...(props as Record<string, unknown>)} />
}

MenuGroup.displayName = GROUP_NAME

function MenuLabel(props: ScopedProps<MenuLabelProps>): FictNode {
  return <Primitive.div {...(props as Record<string, unknown>)} />
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
        props.onFocus as ((event: FocusEvent) => void) | undefined,
        () => {
          if (!disabled()) {
            highlighted(true)
          }
        },
      ),
      onBlur: composeEventHandlers<FocusEvent>(
        props.onBlur as ((event: FocusEvent) => void) | undefined,
        () => {
          highlighted(false)
        },
      ),
      onPointerMove: composeEventHandlers<PointerEvent>(
        props.onPointerMove as ((event: PointerEvent) => void) | undefined,
        () => {
          if (disabled()) return
          highlighted(true)
          ;(document.activeElement as HTMLElement | null)?.blur?.()
          ;(primitivePropsRef.current as HTMLElement | null)?.focus()
        },
      ),
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
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
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
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

  return (
    <MenuItemIndicatorProvider
      scope={__scopeMenu as Scope<MenuItemIndicatorContextValue | undefined>}
      checked={checked ?? (() => false)}
    >
      <Primitive.div {...primitiveProps} ref={composedRefs} />
    </MenuItemIndicatorProvider>
  )
}

function MenuItem(props: ScopedProps<MenuItemProps>): FictNode {
  return <MenuItemImpl {...props} />
}

MenuItem.displayName = ITEM_NAME

function MenuCheckboxItem(props: ScopedProps<MenuCheckboxItemProps>): FictNode {
  const checked = () =>
    props.checked === undefined
      ? false
      : (readValue(props.checked as MaybeAccessor<CheckedState | undefined>) ?? false)

  return (
    <MenuItemImpl
      {...props}
      role="menuitemcheckbox"
      checked={checked}
      onSelect={(event) => {
        props.onSelect?.(event)
        if (event.defaultPrevented) return

        const current = checked()
        const next = current === 'indeterminate' ? true : !current
        props.onCheckedChange?.(next)
      }}
    />
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
      <Primitive.div {...primitiveProps}>{props.children}</Primitive.div>
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

  return (
    <MenuItemImpl
      {...props}
      role="menuitemradio"
      checked={() => checked()}
      onSelect={(event) => {
        props.onSelect?.(event)
        if (event.defaultPrevented) return

        radioGroupContext.onValueChange(props.value)
      }}
    />
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

  return (
    <>
      {reactive(() =>
        present() ? <Primitive.div {...(props as Record<string, unknown>)} /> : null,
      )}
    </>
  )
}

MenuItemIndicator.displayName = ITEM_INDICATOR_NAME

function MenuSeparator(props: ScopedProps<MenuSeparatorProps>): FictNode {
  return <Primitive.div role="separator" {...(props as Record<string, unknown>)} />
}

MenuSeparator.displayName = SEPARATOR_NAME

function MenuArrow(props: ScopedProps<MenuArrowProps>): FictNode {
  return <Primitive.svg {...(props as Record<string, unknown>)} />
}

MenuArrow.displayName = ARROW_NAME

function MenuSub(props: ScopedProps<MenuSubProps>): FictNode {
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
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
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
    <Menu open={open} onOpenChange={handleOpenChange} modal={false} __scopeMenu={props.__scopeMenu}>
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

  return (
    <DismissableLayerBranch asChild>
      <MenuItemImpl
        {...props}
        ref={composedRefs}
        role="menuitem"
        closeOnSelect={false}
        aria-haspopup="menu"
        aria-expanded={
          prop(() => (subContext.open() ? 'true' : 'false')) as unknown as 'true' | 'false'
        }
        data-state={prop(() => getState(subContext.open()))}
        onSelect={(event) => {
          props.onSelect?.(event)
          if (!event.defaultPrevented) {
            const nextOpen = !subContext.open()
            if (nextOpen) {
              subContext.openInputTypeRef.current = 'pointer'
            }

            subContext.onOpenChange(nextOpen)
          }
        }}
        onPointerMove={composeEventHandlers<PointerEvent>(
          props.onPointerMove as ((event: PointerEvent) => void) | undefined,
          () => {
            if (!disabled()) {
              subContext.openInputTypeRef.current = 'pointer'
              subContext.onOpenChange(true)
            }
          },
        )}
        onKeyDown={composeEventHandlers<KeyboardEvent>(
          props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
          (event) => {
            if (disabled()) return
            if (!openKeys().includes(event.key)) return

            event.preventDefault()
            subContext.openInputTypeRef.current = 'keyboard'
            subContext.onOpenChange(true)
          },
        )}
      />
    </DismissableLayerBranch>
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
  const align = () =>
    props.align === undefined
      ? 'start'
      : (readValue(props.align as MaybeAccessor<'start' | 'center' | 'end' | undefined>) ?? 'start')
  const sideOffset = () =>
    props.sideOffset === undefined
      ? 4
      : (readValue(props.sideOffset as MaybeAccessor<number | undefined>) ?? 4)
  const alignOffset = () =>
    props.alignOffset === undefined
      ? 0
      : (readValue(props.alignOffset as MaybeAccessor<number | undefined>) ?? 0)
  const forceMount = () =>
    props.forceMount === undefined
      ? false
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const measuredContentSizeRef = { current: { width: 0, height: 0 } }
  const contentElementRef = { current: null as HTMLDivElement | null }
  const contentSize = createSignal<ContentSize>(measuredContentSizeRef.current)
  const placedSide = () =>
    getSubContentPlacedSide(subContext.triggerRef.current, contentSize(), side(), sideOffset())
  const wrapperStyle = () =>
    getSubContentWrapperStyle(
      subContext.triggerRef.current,
      contentSize(),
      placedSide(),
      align(),
      sideOffset(),
      alignOffset(),
    )
  const updateContentSize = (nextContent: HTMLDivElement | null) => {
    const nextSize = measureMenuContentSize(nextContent)
    const previousSize = measuredContentSizeRef.current

    if (nextSize.width === previousSize.width && nextSize.height === previousSize.height) {
      return
    }

    measuredContentSizeRef.current = nextSize
    contentSize(nextSize)
  }
  const contentRef = useComposedRefs(props.ref as PossibleRef<HTMLDivElement>, contentElementRef)

  useLayoutEffect(() => {
    if (!subContext.open() && !forceMount()) {
      updateContentSize(null)
      return
    }

    updateContentSize(contentElementRef.current)
  })

  return (
    <>
      {reactive(() =>
        subContext.open() || forceMount() ? (
          <div data-radix-popper-content-wrapper="" style={wrapperStyle()}>
            <MenuContent
              {...props}
              forceMount={forceMount}
              data-side={prop(placedSide)}
              data-align={prop(align)}
              ref={contentRef}
              onOpenAutoFocus={(event) => {
                props.onOpenAutoFocus?.(event)
                if (event.defaultPrevented) return
                if (subContext.openInputTypeRef.current === 'keyboard') return

                event.preventDefault()
              }}
              onCloseAutoFocus={(event) => {
                props.onCloseAutoFocus?.(event)
                if (event.defaultPrevented) return

                event.preventDefault()
                subContext.triggerRef.current?.focus()
              }}
              onKeyDown={composeEventHandlers<KeyboardEvent>(
                props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
                (event) => {
                  const closeKey = menuContext.dir() === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
                  if (event.key !== closeKey) return

                  event.preventDefault()
                  subContext.onOpenChange(false)
                  subContext.triggerRef.current?.focus()
                },
              )}
              style={{
                outline: 'none',
                width: '100%',
                pointerEvents: 'auto',
                '--radix-dropdown-menu-content-transform-origin':
                  'var(--radix-popper-transform-origin)',
                '--radix-dropdown-menu-content-available-width':
                  'var(--radix-popper-available-width)',
                '--radix-dropdown-menu-content-available-height':
                  'var(--radix-popper-available-height)',
                '--radix-dropdown-menu-trigger-width': 'var(--radix-popper-anchor-width)',
                '--radix-dropdown-menu-trigger-height': 'var(--radix-popper-anchor-height)',
                '--radix-context-menu-content-transform-origin':
                  'var(--radix-popper-transform-origin)',
                '--radix-context-menu-content-available-width':
                  'var(--radix-popper-available-width)',
                '--radix-context-menu-content-available-height':
                  'var(--radix-popper-available-height)',
                '--radix-context-menu-trigger-width': 'var(--radix-popper-anchor-width)',
                '--radix-context-menu-trigger-height': 'var(--radix-popper-anchor-height)',
                '--radix-menubar-content-transform-origin': 'var(--radix-popper-transform-origin)',
                '--radix-menubar-content-available-width': 'var(--radix-popper-available-width)',
                '--radix-menubar-content-available-height': 'var(--radix-popper-available-height)',
                '--radix-menubar-trigger-width': 'var(--radix-popper-anchor-width)',
                '--radix-menubar-trigger-height': 'var(--radix-popper-anchor-height)',
                ...readStyle(props.style),
              }}
            />
          </div>
        ) : null,
      )}
    </>
  )
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
