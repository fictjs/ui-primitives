import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { jsx as createVNode } from '@fictjs/runtime/jsx-runtime'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import {
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
  type MenuPortalProps,
  type MenuContentProps,
  type MenuGroupProps,
  type MenuLabelProps,
  type MenuItemProps,
  type MenuCheckboxItemProps,
  type MenuRadioGroupProps,
  type MenuRadioItemProps,
  type MenuItemIndicatorProps,
  type MenuSeparatorProps,
  type MenuArrowProps,
  type MenuSubProps,
  type MenuSubTriggerProps,
  type MenuSubContentProps,
} from '@fictjs/menu'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'

type MaybeAccessor<T> = T | (() => T)
type Direction = 'ltr' | 'rtl'
type ScopedProps<P> = P & { __scopeContextMenu?: Scope }
type StyleRecord = Record<string, string | number>
type TriggerProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
  disabled?: MaybeAccessor<boolean | undefined>
}
type ContextMenuContextValue = {
  open: () => boolean
  onOpenChange(open: boolean): void
  modal: () => boolean
  anchorPoint: () => { x: number; y: number } | null
  onAnchorPointChange(value: { x: number; y: number } | null): void
}

const CONTEXT_MENU_NAME = 'ContextMenu'
const TRIGGER_NAME = 'ContextMenuTrigger'
const PORTAL_NAME = 'ContextMenuPortal'
const CONTENT_NAME = 'ContextMenuContent'
const GROUP_NAME = 'ContextMenuGroup'
const LABEL_NAME = 'ContextMenuLabel'
const ITEM_NAME = 'ContextMenuItem'
const CHECKBOX_ITEM_NAME = 'ContextMenuCheckboxItem'
const RADIO_GROUP_NAME = 'ContextMenuRadioGroup'
const RADIO_ITEM_NAME = 'ContextMenuRadioItem'
const ITEM_INDICATOR_NAME = 'ContextMenuItemIndicator'
const SEPARATOR_NAME = 'ContextMenuSeparator'
const ARROW_NAME = 'ContextMenuArrow'
const SUB_NAME = 'ContextMenuSub'
const SUB_TRIGGER_NAME = 'ContextMenuSubTrigger'
const SUB_CONTENT_NAME = 'ContextMenuSubContent'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')
const READ_VALUE_DEPTH_LIMIT = 10
const [createContextMenuContext, createContextMenuScope] = createContextScope(CONTEXT_MENU_NAME, [
  createMenuScope,
])
const [ContextMenuProvider, useContextMenuContext] =
  createContextMenuContext<ContextMenuContextValue>(CONTEXT_MENU_NAME)
const useMenuScope = createMenuScope()

type ContextMenuProps = {
  children?: FictNode | FictNode[]
  dir?: MaybeAccessor<Direction | undefined>
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  modal?: MaybeAccessor<boolean | undefined>
}

type ContextMenuTriggerProps = TriggerProps
type ContextMenuPortalProps = MenuPortalProps
type ContextMenuContentProps = MenuContentProps
type ContextMenuGroupProps = MenuGroupProps
type ContextMenuLabelProps = MenuLabelProps
type ContextMenuItemProps = MenuItemProps
type ContextMenuCheckboxItemProps = MenuCheckboxItemProps
type ContextMenuRadioGroupProps = MenuRadioGroupProps
type ContextMenuRadioItemProps = MenuRadioItemProps
type ContextMenuItemIndicatorProps = MenuItemIndicatorProps
type ContextMenuSeparatorProps = MenuSeparatorProps
type ContextMenuArrowProps = MenuArrowProps
type ContextMenuSubProps = MenuSubProps
type ContextMenuSubTriggerProps = MenuSubTriggerProps
type ContextMenuSubContentProps = MenuSubContentProps

function isReadableAccessor(value: unknown): value is () => unknown {
  const taggedValue = value as unknown as Record<symbol, unknown>

  return (
    typeof value === 'function' &&
    (value.length === 0 ||
      taggedValue[SIGNAL_MARKER] === true ||
      taggedValue[COMPUTED_MARKER] === true ||
      taggedValue[PROP_GETTER_MARKER] === true)
  )
}

function readValue<T>(value: MaybeAccessor<T>, depth = 0): T {
  if (!isReadableAccessor(value) || depth >= READ_VALUE_DEPTH_LIMIT) {
    return value as T
  }

  return readValue(value(), depth + 1)
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

function createMenuComponentNode(
  component: unknown,
  menuScope: Record<string, unknown>,
  props: object,
  overrides: Record<string, unknown> = {},
): FictNode {
  return createComponentNode(
    component,
    mergeProps(
      menuScope,
      prop(() => props as Record<string, unknown>),
      { __scopeContextMenu: undefined },
      overrides,
    ),
  )
}

function ContextMenu(props: ScopedProps<ContextMenuProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const modal = () =>
    props.modal === undefined
      ? true
      : Boolean(readValue(props.modal as MaybeAccessor<boolean | undefined>) ?? true)
  const dir = () =>
    props.dir === undefined
      ? undefined
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? undefined)
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: CONTEXT_MENU_NAME,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })
  const anchorPoint = createSignal<{ x: number; y: number } | null>(null)
  const virtualRef = () => {
    const point = anchorPoint()
    return {
      current: point
        ? {
            getBoundingClientRect: () =>
              ({
                x: point.x,
                y: point.y,
                width: 0,
                height: 0,
                top: point.y,
                right: point.x,
                bottom: point.y,
                left: point.x,
                toJSON: () => ({}),
              }) as DOMRect,
          }
        : null,
    }
  }
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      anchorPoint(null)
    }

    setOpen(nextOpen)
  }

  return (
    <ContextMenuProvider
      scope={props.__scopeContextMenu as Scope<ContextMenuContextValue | undefined>}
      open={open}
      onOpenChange={handleOpenChange}
      modal={modal}
      anchorPoint={anchorPoint}
      onAnchorPointChange={anchorPoint}
    >
      <Menu {...menuScope} open={open} onOpenChange={handleOpenChange} dir={dir} modal={modal}>
        <MenuAnchor {...menuScope} virtualRef={virtualRef} />
        {props.children}
      </Menu>
    </ContextMenuProvider>
  )
}

ContextMenu.displayName = CONTEXT_MENU_NAME

function ContextMenuTrigger(props: ScopedProps<ContextMenuTriggerProps>): FictNode {
  const context = useContextMenuContext(
    TRIGGER_NAME,
    props.__scopeContextMenu as Scope<ContextMenuContextValue | undefined>,
  )
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const primitiveProps = mergeProps(
    {
      'data-state': prop(() => (context.open() ? 'open' : 'closed')),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeContextMenu: undefined,
      disabled: undefined,
      onContextMenu: composeEventHandlers<MouseEvent>(
        (event) => props.onContextMenu?.(event),
        (event) => {
          if (disabled()) {
            event.preventDefault()
            return
          }

          event.preventDefault()
          context.onAnchorPointChange({
            x: event.clientX,
            y: event.clientY,
          })
          context.onOpenChange(true)
        },
      ),
    },
  )

  return createComponentNode(Primitive.div, primitiveProps)
}

ContextMenuTrigger.displayName = TRIGGER_NAME

function ContextMenuPortal(props: ScopedProps<ContextMenuPortalProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(
    MenuPortal,
    menuScope as Record<string, unknown>,
    props as Record<string, unknown>,
  )
}

ContextMenuPortal.displayName = PORTAL_NAME

function ContextMenuContent(props: ScopedProps<ContextMenuContentProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  const context = useContextMenuContext(
    CONTENT_NAME,
    props.__scopeContextMenu as Scope<ContextMenuContextValue | undefined>,
  )
  let hasInteractedOutside = false
  const side = () =>
    props.side === undefined
      ? 'right'
      : (readValue(props.side as MaybeAccessor<'top' | 'right' | 'bottom' | 'left' | undefined>) ??
        'right')
  const align = () =>
    props.align === undefined
      ? 'start'
      : (readValue(props.align as MaybeAccessor<'start' | 'center' | 'end' | undefined>) ?? 'start')
  const sideOffset = () =>
    props.sideOffset === undefined
      ? 2
      : (readValue(props.sideOffset as MaybeAccessor<number | undefined>) ?? 2)
  const alignOffset = () =>
    props.alignOffset === undefined
      ? 0
      : (readValue(props.alignOffset as MaybeAccessor<number | undefined>) ?? 0)
  return createMenuComponentNode(
    MenuContent,
    menuScope as Record<string, unknown>,
    props as Record<string, unknown>,
    {
      side: prop(side),
      align: prop(align),
      sideOffset: prop(sideOffset),
      alignOffset: prop(alignOffset),
      style: prop(() => ({
        outline: 'none',
        width: '100%',
        pointerEvents: 'auto',
        '--radix-context-menu-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-context-menu-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-context-menu-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-context-menu-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-context-menu-trigger-height': 'var(--radix-popper-anchor-height)',
        ...readStyle(props.style),
      })) as unknown as StyleRecord,
      onCloseAutoFocus: (event: Event) => {
        props.onCloseAutoFocus?.(event)

        if (!event.defaultPrevented && hasInteractedOutside) {
          event.preventDefault()
        }

        hasInteractedOutside = false
      },
      onFocusOutside: (event: Parameters<NonNullable<MenuContentProps['onFocusOutside']>>[0]) => {
        props.onFocusOutside?.(event)
        if (!event.defaultPrevented && context.modal()) {
          event.preventDefault()
        }
      },
      onInteractOutside: (
        event: Parameters<NonNullable<MenuContentProps['onInteractOutside']>>[0],
      ) => {
        props.onInteractOutside?.(event)

        if (event.defaultPrevented) {
          return
        }

        const originalEvent = event.detail.originalEvent as PointerEvent | FocusEvent
        const target = originalEvent.target as HTMLElement | null
        const isMenuFocus = originalEvent.type === 'focusin' && !!target?.closest('[role="menu"]')

        if (isMenuFocus) {
          event.preventDefault()
          return
        }

        if (!context.modal()) {
          hasInteractedOutside = true
        }
      },
    },
  )
}

ContextMenuContent.displayName = CONTENT_NAME

function ContextMenuGroup(props: ScopedProps<ContextMenuGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuGroup, menuScope as Record<string, unknown>, props)
}

ContextMenuGroup.displayName = GROUP_NAME

function ContextMenuLabel(props: ScopedProps<ContextMenuLabelProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuLabel, menuScope as Record<string, unknown>, props)
}

ContextMenuLabel.displayName = LABEL_NAME

function ContextMenuItem(props: ScopedProps<ContextMenuItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuItem, menuScope as Record<string, unknown>, props)
}

ContextMenuItem.displayName = ITEM_NAME

function ContextMenuCheckboxItem(props: ScopedProps<ContextMenuCheckboxItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuCheckboxItem, menuScope as Record<string, unknown>, props)
}

ContextMenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME

function ContextMenuRadioGroup(props: ScopedProps<ContextMenuRadioGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuRadioGroup, menuScope as Record<string, unknown>, props)
}

ContextMenuRadioGroup.displayName = RADIO_GROUP_NAME

function ContextMenuRadioItem(props: ScopedProps<ContextMenuRadioItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuRadioItem, menuScope as Record<string, unknown>, props)
}

ContextMenuRadioItem.displayName = RADIO_ITEM_NAME

function ContextMenuItemIndicator(props: ScopedProps<ContextMenuItemIndicatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuItemIndicator, menuScope as Record<string, unknown>, props)
}

ContextMenuItemIndicator.displayName = ITEM_INDICATOR_NAME

function ContextMenuSeparator(props: ScopedProps<ContextMenuSeparatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuSeparator, menuScope as Record<string, unknown>, props)
}

ContextMenuSeparator.displayName = SEPARATOR_NAME

function ContextMenuArrow(props: ScopedProps<ContextMenuArrowProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuArrow, menuScope as Record<string, unknown>, props)
}

ContextMenuArrow.displayName = ARROW_NAME

function ContextMenuSub(props: ScopedProps<ContextMenuSubProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuSub, menuScope as Record<string, unknown>, props, {
    onOpenChange: prop(() => props.onOpenChange),
  })
}

ContextMenuSub.displayName = SUB_NAME

function ContextMenuSubTrigger(props: ScopedProps<ContextMenuSubTriggerProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuSubTrigger, menuScope as Record<string, unknown>, props)
}

ContextMenuSubTrigger.displayName = SUB_TRIGGER_NAME

function ContextMenuSubContent(props: ScopedProps<ContextMenuSubContentProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return createMenuComponentNode(MenuSubContent, menuScope as Record<string, unknown>, props)
}

ContextMenuSubContent.displayName = SUB_CONTENT_NAME

const Root = ContextMenu
const Trigger = ContextMenuTrigger
const Portal = ContextMenuPortal
const Content = ContextMenuContent
const Group = ContextMenuGroup
const Label = ContextMenuLabel
const Item = ContextMenuItem
const CheckboxItem = ContextMenuCheckboxItem
const RadioGroup = ContextMenuRadioGroup
const RadioItem = ContextMenuRadioItem
const ItemIndicator = ContextMenuItemIndicator
const Separator = ContextMenuSeparator
const Arrow = ContextMenuArrow
const Sub = ContextMenuSub
const SubTrigger = ContextMenuSubTrigger
const SubContent = ContextMenuSubContent

export {
  createContextMenuScope,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuItemIndicator,
  ContextMenuSeparator,
  ContextMenuArrow,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  Root,
  Trigger,
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
  ContextMenuProps,
  ContextMenuTriggerProps,
  ContextMenuPortalProps,
  ContextMenuContentProps,
  ContextMenuGroupProps,
  ContextMenuLabelProps,
  ContextMenuItemProps,
  ContextMenuCheckboxItemProps,
  ContextMenuRadioGroupProps,
  ContextMenuRadioItemProps,
  ContextMenuItemIndicatorProps,
  ContextMenuSeparatorProps,
  ContextMenuArrowProps,
  ContextMenuSubProps,
  ContextMenuSubTriggerProps,
  ContextMenuSubContentProps,
}
