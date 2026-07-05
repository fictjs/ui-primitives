import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import {
  createMenuScope,
  Menu,
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

function getContextMenuWrapperStyle(
  anchorPoint: { x: number; y: number } | null,
  side: 'top' | 'right' | 'bottom' | 'left',
  align: 'start' | 'center' | 'end',
  sideOffset: number,
  alignOffset: number,
): StyleRecord {
  if (!anchorPoint) {
    return { pointerEvents: 'auto' }
  }

  const availableWidth = globalThis.innerWidth || document.documentElement.clientWidth || 0
  const availableHeight = globalThis.innerHeight || document.documentElement.clientHeight || 0
  let left = anchorPoint.x
  let top = anchorPoint.y
  let translateSuffix = ''

  if (side === 'top') {
    top -= sideOffset
    if (align === 'center') {
      translateSuffix = ' translate(-50%, -100%)'
    } else if (align === 'end') {
      translateSuffix = ' translate(-100%, -100%)'
    } else {
      translateSuffix = ' translate(0, -100%)'
    }
    left += alignOffset
  } else if (side === 'bottom') {
    top += sideOffset
    if (align === 'center') {
      translateSuffix = ' translate(-50%, 0)'
    } else if (align === 'end') {
      translateSuffix = ' translate(-100%, 0)'
    }
    left += alignOffset
  } else if (side === 'left') {
    left -= sideOffset
    if (align === 'center') {
      translateSuffix = ' translate(-100%, -50%)'
    } else if (align === 'end') {
      translateSuffix = ' translate(-100%, -100%)'
    } else {
      translateSuffix = ' translate(-100%, 0)'
    }
    top += alignOffset
  } else {
    left += sideOffset
    if (align === 'center') {
      translateSuffix = ' translate(0, -50%)'
    } else if (align === 'end') {
      translateSuffix = ' translate(0, -100%)'
    }
    top += alignOffset
  }

  const originX =
    side === 'top' || side === 'bottom'
      ? align === 'center'
        ? '50%'
        : align === 'end'
          ? '100%'
          : '0%'
      : side === 'left'
        ? '100%'
        : '0px'
  const originY =
    side === 'left' || side === 'right'
      ? align === 'center'
        ? '50%'
        : align === 'end'
          ? '100%'
          : '0%'
      : side === 'top'
        ? '100%'
        : '0px'

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
    '--radix-popper-anchor-width': '0px',
    '--radix-popper-anchor-height': '0px',
  }
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
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: CONTEXT_MENU_NAME,
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
  })
  const anchorPoint = createSignal<{ x: number; y: number } | null>(null)
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
      <Menu {...menuScope} open={open} onOpenChange={handleOpenChange} modal={modal}>
        {props.children}
      </Menu>
    </ContextMenuProvider>
  )
}

ContextMenu.displayName = CONTEXT_MENU_NAME

function ContextMenuTrigger(props: ScopedProps<ContextMenuTriggerProps>): FictNode {
  const { __scopeContextMenu, ...triggerProps } = props
  const context = useContextMenuContext(
    TRIGGER_NAME,
    __scopeContextMenu as Scope<ContextMenuContextValue | undefined>,
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
    prop(() => triggerProps as Record<string, unknown>),
    {
      __scopeContextMenu: undefined,
      disabled: undefined,
      onContextMenu: composeEventHandlers<MouseEvent>(
        props.onContextMenu as ((event: MouseEvent) => void) | undefined,
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

  return <Primitive.div {...primitiveProps} />
}

ContextMenuTrigger.displayName = TRIGGER_NAME

function ContextMenuPortal(props: ScopedProps<ContextMenuPortalProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuPortal {...menuScope} {...props} />
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
  const forceMount = () =>
    props.forceMount === undefined
      ? false
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const wrapperStyle = () =>
    getContextMenuWrapperStyle(context.anchorPoint(), side(), align(), sideOffset(), alignOffset())

  return (
    <>
      {reactive(() =>
        context.open() || forceMount() ? (
          <div data-radix-popper-content-wrapper="" style={wrapperStyle()}>
            <MenuContent
              {...menuScope}
              {...props}
              data-side={prop(side)}
              data-align={prop(align)}
              style={{
                outline: 'none',
                width: '100%',
                pointerEvents: 'auto',
                '--radix-context-menu-content-transform-origin':
                  'var(--radix-popper-transform-origin)',
                '--radix-context-menu-content-available-width':
                  'var(--radix-popper-available-width)',
                '--radix-context-menu-content-available-height':
                  'var(--radix-popper-available-height)',
                '--radix-context-menu-trigger-width': 'var(--radix-popper-anchor-width)',
                '--radix-context-menu-trigger-height': 'var(--radix-popper-anchor-height)',
                ...readStyle(props.style),
              }}
              onCloseAutoFocus={(event) => {
                props.onCloseAutoFocus?.(event)

                if (!event.defaultPrevented && hasInteractedOutside) {
                  event.preventDefault()
                }

                hasInteractedOutside = false
              }}
              onFocusOutside={(event) => {
                props.onFocusOutside?.(event)
                if (!event.defaultPrevented && context.modal()) {
                  event.preventDefault()
                }
              }}
              onInteractOutside={(event) => {
                props.onInteractOutside?.(event)

                if (event.defaultPrevented) {
                  return
                }

                const originalEvent = event.detail.originalEvent as PointerEvent | FocusEvent
                const target = originalEvent.target as HTMLElement | null
                const isMenuFocus =
                  originalEvent.type === 'focusin' && !!target?.closest('[role="menu"]')

                if (isMenuFocus) {
                  event.preventDefault()
                  return
                }

                if (!context.modal()) {
                  hasInteractedOutside = true
                }
              }}
            />
          </div>
        ) : null,
      )}
    </>
  )
}

ContextMenuContent.displayName = CONTENT_NAME

function ContextMenuGroup(props: ScopedProps<ContextMenuGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuGroup {...menuScope} {...props} />
}

ContextMenuGroup.displayName = GROUP_NAME

function ContextMenuLabel(props: ScopedProps<ContextMenuLabelProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuLabel {...menuScope} {...props} />
}

ContextMenuLabel.displayName = LABEL_NAME

function ContextMenuItem(props: ScopedProps<ContextMenuItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuItem {...menuScope} {...props} />
}

ContextMenuItem.displayName = ITEM_NAME

function ContextMenuCheckboxItem(props: ScopedProps<ContextMenuCheckboxItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuCheckboxItem {...menuScope} {...props} />
}

ContextMenuCheckboxItem.displayName = CHECKBOX_ITEM_NAME

function ContextMenuRadioGroup(props: ScopedProps<ContextMenuRadioGroupProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuRadioGroup {...menuScope} {...props} />
}

ContextMenuRadioGroup.displayName = RADIO_GROUP_NAME

function ContextMenuRadioItem(props: ScopedProps<ContextMenuRadioItemProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuRadioItem {...menuScope} {...props} />
}

ContextMenuRadioItem.displayName = RADIO_ITEM_NAME

function ContextMenuItemIndicator(props: ScopedProps<ContextMenuItemIndicatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuItemIndicator {...menuScope} {...props} />
}

ContextMenuItemIndicator.displayName = ITEM_INDICATOR_NAME

function ContextMenuSeparator(props: ScopedProps<ContextMenuSeparatorProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuSeparator {...menuScope} {...props} />
}

ContextMenuSeparator.displayName = SEPARATOR_NAME

function ContextMenuArrow(props: ScopedProps<ContextMenuArrowProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuArrow {...menuScope} {...props} />
}

ContextMenuArrow.displayName = ARROW_NAME

function ContextMenuSub(props: ScopedProps<ContextMenuSubProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuSub {...menuScope} {...props} />
}

ContextMenuSub.displayName = SUB_NAME

function ContextMenuSubTrigger(props: ScopedProps<ContextMenuSubTriggerProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuSubTrigger {...menuScope} {...props} />
}

ContextMenuSubTrigger.displayName = SUB_TRIGGER_NAME

function ContextMenuSubContent(props: ScopedProps<ContextMenuSubContentProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeContextMenu)
  return <MenuSubContent {...menuScope} {...props} />
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
