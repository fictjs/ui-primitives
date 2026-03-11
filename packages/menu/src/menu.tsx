import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { DismissableLayer, type DismissableLayerProps } from '@fictjs/dismissable-layer'
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
const SUB_OPEN_KEYS: Record<Direction, string[]> = {
  ltr: [...SELECTION_KEYS, 'ArrowRight'],
  rtl: [...SELECTION_KEYS, 'ArrowLeft'],
}
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createMenuContext, createMenuScope] = createContextScope(MENU_NAME)
const [MenuProvider, useMenuContext] = createMenuContext<MenuContextValue>(MENU_NAME)
const [PortalProvider, usePortalContext] = createMenuContext<PortalContextValue>(PORTAL_NAME, {
  forceMount: undefined,
})
const [MenuContentProvider, useMenuContentContext] =
  createMenuContext<MenuContentContextValue>(CONTENT_NAME)
const [MenuRadioGroupProvider, useMenuRadioGroupContext] =
  createMenuContext<MenuRadioGroupContextValue>(RADIO_GROUP_NAME)
const [MenuItemIndicatorProvider, useMenuItemIndicatorContext] =
  createMenuContext<MenuItemIndicatorContextValue>(ITEM_INDICATOR_NAME, {
    checked: () => false,
  })
const [MenuSubProvider, useMenuSubContext] = createMenuContext<MenuSubContextValue>(SUB_NAME)

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

function readStyle(value: unknown): StyleRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as StyleRecord
}

function getState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed'
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
    <PortalProvider
      scope={props.__scopeMenu as Scope<PortalContextValue | undefined>}
      forceMount={forceMount}
    >
      <Presence present={() => Boolean(forceMount || context.open())}>
        <PortalPrimitive {...portalProps}>{props.children}</PortalPrimitive>
      </Presence>
    </PortalProvider>
  )
}

MenuPortal.displayName = PORTAL_NAME

function MenuContent(props: ScopedProps<MenuContentProps>): FictNode {
  const portalContext = usePortalContext(
    PORTAL_NAME,
    props.__scopeMenu as Scope<PortalContextValue | undefined>,
  )
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
    <Presence present={() => Boolean(forceMount || menuContext.open())}>
      <MenuContentProvider
        scope={props.__scopeMenu as Scope<MenuContentContextValue | undefined>}
        contentId={menuContext.contentId}
        contentRef={contentRef}
        focusItem={focusItem}
      >
        <MenuContentImpl {...props} />
      </MenuContentProvider>
    </Presence>
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
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    ref,
    contentContext.contentRef,
  )

  useLayoutEffect(() => {
    if (!menuContext.open()) return
    const currentContent = ref.current
    if (!currentContent) return

    setTimeout(() => {
      if (!menuContext.open()) return
      contentContext.focusItem('first')
    }, 0)
  })

  useLayoutEffect(() => {
    const forwardedRef = props.ref as PossibleRef<HTMLDivElement>
    if (!forwardedRef) return

    return () => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(null)
        return
      }

      forwardedRef.current = null
    }
  })

  const layerProps = mergeProps(
    {
      id: prop(menuContext.contentId),
      role: 'menu',
      tabIndex: -1,
      'data-state': prop(() => getState(menuContext.open())),
      'data-orientation': 'vertical',
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (event.key === 'Tab') {
            event.preventDefault()
            return
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            contentContext.focusItem('next', document.activeElement as HTMLElement | null)
            return
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            contentContext.focusItem('prev', document.activeElement as HTMLElement | null)
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
          }
        },
      ),
    },
    () => contentProps as Record<string, unknown>,
    {
      __scopeMenu: undefined,
      forceMount: undefined,
      onCloseAutoFocus: undefined,
      onOpenAutoFocus: undefined,
      ref: undefined,
      onDismiss: undefined,
      onInteractOutside: props.onInteractOutside,
      onFocusOutside: props.onFocusOutside,
      onPointerDownOutside: props.onPointerDownOutside,
      onEscapeKeyDown: props.onEscapeKeyDown,
    },
  )

  const focusScopeProps = {
    loop: true,
    trapped: menuContext.modal,
    onMountAutoFocus: (event: Event) => {
      props.onOpenAutoFocus?.(event)
      if (event.defaultPrevented) return

      event.preventDefault()
      contentContext.focusItem('first')
    },
    ...(props.onCloseAutoFocus ? { onUnmountAutoFocus: props.onCloseAutoFocus } : {}),
  }

  const contentNode = (
    <FocusScope {...focusScopeProps}>
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
  const { __scopeMenu, checked, role = 'menuitem', closeOnSelect = true, ...itemProps } = props
  const menuContext = useMenuContext(ITEM_NAME, __scopeMenu as Scope<MenuContextValue | undefined>)
  const contentContext = useMenuContentContext(
    ITEM_NAME,
    __scopeMenu as Scope<MenuContentContextValue | undefined>,
  )
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
      role,
      tabIndex: -1,
      'data-menu-item': '',
      'data-menu-content-id': prop(contentContext.contentId),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
      'data-state': checked ? prop(dataState) : undefined,
      'aria-disabled': prop(() => (disabled() ? 'true' : undefined)),
      'aria-checked': checked
        ? prop(() => String(checked() === 'indeterminate' ? 'mixed' : checked() === true))
        : undefined,
      onPointerMove: composeEventHandlers<PointerEvent>(
        props.onPointerMove as ((event: PointerEvent) => void) | undefined,
        () => {
          if (disabled()) return
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
          if (!event.defaultPrevented && closeOnSelect) {
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
    () => itemProps as Record<string, unknown>,
    {
      __scopeMenu: undefined,
      checked: undefined,
      closeOnSelect: undefined,
      disabled: undefined,
      onSelect: undefined,
      role: undefined,
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
      closeOnSelect={false}
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
  const primitiveProps = mergeProps(() => props as Record<string, unknown>, {
    __scopeMenu: undefined,
    onValueChange: undefined,
    value: undefined,
  })
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
      closeOnSelect={false}
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
    <Presence present={present}>
      <Primitive.div {...(props as Record<string, unknown>)} />
    </Presence>
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

  return (
    <Menu open={open} onOpenChange={setOpen} modal={false} __scopeMenu={props.__scopeMenu}>
      <MenuSubProvider
        scope={props.__scopeMenu as Scope<MenuSubContextValue | undefined>}
        open={open}
        onOpenChange={setOpen}
        triggerRef={triggerRef}
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
    <MenuItemImpl
      {...props}
      ref={composedRefs}
      role="menuitem"
      closeOnSelect={false}
      aria-haspopup="menu"
      onSelect={(event) => {
        props.onSelect?.(event)
        if (!event.defaultPrevented) {
          subContext.onOpenChange(!subContext.open())
        }
      }}
      onPointerMove={composeEventHandlers<PointerEvent>(
        props.onPointerMove as ((event: PointerEvent) => void) | undefined,
        () => {
          if (!disabled()) {
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
          subContext.onOpenChange(true)
        },
      )}
    />
  )
}

MenuSubTrigger.displayName = SUB_TRIGGER_NAME

function MenuSubContent(props: ScopedProps<MenuSubContentProps>): FictNode {
  const subContext = useMenuSubContext(
    SUB_CONTENT_NAME,
    props.__scopeMenu as Scope<MenuSubContextValue | undefined>,
  )

  return (
    <MenuContent
      {...props}
      forceMount={() =>
        props.forceMount === undefined
          ? subContext.open()
          : Boolean(
              readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ??
              subContext.open(),
            )
      }
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event)
        if (event.defaultPrevented) return

        event.preventDefault()
        subContext.triggerRef.current?.focus()
      }}
      style={{
        marginInlineStart: 4,
        ...readStyle(props.style),
      }}
    />
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
