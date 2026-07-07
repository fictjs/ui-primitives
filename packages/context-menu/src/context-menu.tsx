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
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeContextMenu?: Scope }
type StyleRecord = Record<string, string | number>
type ContextMenuSide = 'top' | 'right' | 'bottom' | 'left'
type ContextMenuAlign = 'start' | 'center' | 'end'
type AnchorRect = Pick<DOMRect, 'bottom' | 'height' | 'left' | 'right' | 'top' | 'width'>
type ContentSize = { width: number; height: number }
type PossibleRef<T> = ((node: T | null) => void) | { current: T | null } | undefined
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
const CONTEXT_MENU_FALLBACK_COLLISION_SIZE = 160

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function getViewportWidth(): number {
  return globalThis.innerWidth || document.documentElement.clientWidth || 0
}

function getViewportHeight(): number {
  return globalThis.innerHeight || document.documentElement.clientHeight || 0
}

function isVerticalSide(side: ContextMenuSide): boolean {
  return side === 'top' || side === 'bottom'
}

function getOppositeSide(side: ContextMenuSide): ContextMenuSide {
  if (side === 'top') return 'bottom'
  if (side === 'bottom') return 'top'
  if (side === 'left') return 'right'
  return 'left'
}

function getAnchorRect(anchorPoint: { x: number; y: number }): AnchorRect {
  return {
    bottom: anchorPoint.y,
    height: 0,
    left: anchorPoint.x,
    right: anchorPoint.x,
    top: anchorPoint.y,
    width: 0,
  }
}

function getAvailableWidth(
  rect: AnchorRect,
  side: ContextMenuSide,
  sideOffset: number,
  viewportWidth: number,
): number {
  if (side === 'left') return Math.max(rect.left - sideOffset, 0)
  if (side === 'right') return Math.max(viewportWidth - rect.right - sideOffset, 0)
  return Math.max(viewportWidth, 0)
}

function getAvailableHeight(
  rect: AnchorRect,
  side: ContextMenuSide,
  sideOffset: number,
  viewportHeight: number,
): number {
  if (side === 'top') return Math.max(rect.top - sideOffset, 0)
  if (side === 'bottom') return Math.max(viewportHeight - rect.bottom - sideOffset, 0)
  return Math.max(viewportHeight, 0)
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

function getContextMenuPlacedSide(
  anchorPoint: { x: number; y: number } | null,
  contentSize: ContentSize,
  side: ContextMenuSide,
  sideOffset: number,
): ContextMenuSide {
  if (!anchorPoint) {
    return side
  }

  const rect = getAnchorRect(anchorPoint)
  const viewportWidth = getViewportWidth()
  const viewportHeight = getViewportHeight()
  const oppositeSide = getOppositeSide(side)
  const desiredAvailable = isVerticalSide(side)
    ? getAvailableHeight(rect, side, sideOffset, viewportHeight)
    : getAvailableWidth(rect, side, sideOffset, viewportWidth)
  const oppositeAvailable = isVerticalSide(side)
    ? getAvailableHeight(rect, oppositeSide, sideOffset, viewportHeight)
    : getAvailableWidth(rect, oppositeSide, sideOffset, viewportWidth)
  const requiredSize =
    (isVerticalSide(side) ? contentSize.height : contentSize.width) ||
    CONTEXT_MENU_FALLBACK_COLLISION_SIZE

  if (desiredAvailable < requiredSize && oppositeAvailable > desiredAvailable) {
    return oppositeSide
  }

  return side
}

function getContextMenuWrapperStyle(
  anchorPoint: { x: number; y: number } | null,
  contentSize: ContentSize,
  side: ContextMenuSide,
  align: ContextMenuAlign,
  sideOffset: number,
  alignOffset: number,
): StyleRecord {
  if (!anchorPoint) {
    return { pointerEvents: 'auto' }
  }

  const rect = getAnchorRect(anchorPoint)
  const viewportWidth = getViewportWidth()
  const viewportHeight = getViewportHeight()
  const availableWidth = getAvailableWidth(rect, side, sideOffset, viewportWidth)
  const availableHeight = getAvailableHeight(rect, side, sideOffset, viewportHeight)
  const collisionWidth = contentSize.width || CONTEXT_MENU_FALLBACK_COLLISION_SIZE
  const collisionHeight = contentSize.height || CONTEXT_MENU_FALLBACK_COLLISION_SIZE
  let left = rect.left
  let top = rect.top
  let translateSuffix = ''

  if (side === 'top') {
    top = rect.top - sideOffset
    let contentLeft = rect.left

    if (align === 'center') {
      contentLeft = rect.left + rect.width / 2 - collisionWidth / 2
    } else if (align === 'end') {
      contentLeft = rect.right - collisionWidth
    }

    contentLeft = clamp(contentLeft + alignOffset, 0, viewportWidth - collisionWidth)

    if (align === 'center') {
      left = contentLeft + collisionWidth / 2
      translateSuffix = ' translate(-50%, -100%)'
    } else if (align === 'end') {
      left = contentLeft + collisionWidth
      translateSuffix = ' translate(-100%, -100%)'
    } else {
      left = contentLeft
      translateSuffix = ' translate(0, -100%)'
    }
  } else if (side === 'bottom') {
    top = rect.bottom + sideOffset
    let contentLeft = rect.left

    if (align === 'center') {
      contentLeft = rect.left + rect.width / 2 - collisionWidth / 2
    } else if (align === 'end') {
      contentLeft = rect.right - collisionWidth
    }

    contentLeft = clamp(contentLeft + alignOffset, 0, viewportWidth - collisionWidth)

    if (align === 'center') {
      left = contentLeft + collisionWidth / 2
      translateSuffix = ' translate(-50%, 0)'
    } else if (align === 'end') {
      left = contentLeft + collisionWidth
      translateSuffix = ' translate(-100%, 0)'
    } else {
      left = contentLeft
    }
  } else if (side === 'left') {
    left = rect.left - sideOffset
    let contentTop = rect.top

    if (align === 'center') {
      contentTop = rect.top + rect.height / 2 - collisionHeight / 2
    } else if (align === 'end') {
      contentTop = rect.bottom - collisionHeight
    }

    contentTop = clamp(contentTop + alignOffset, 0, viewportHeight - collisionHeight)

    if (align === 'center') {
      top = contentTop + collisionHeight / 2
      translateSuffix = ' translate(-100%, -50%)'
    } else if (align === 'end') {
      top = contentTop + collisionHeight
      translateSuffix = ' translate(-100%, -100%)'
    } else {
      top = contentTop
      translateSuffix = ' translate(-100%, 0)'
    }
  } else {
    left = rect.right + sideOffset
    let contentTop = rect.top

    if (align === 'center') {
      contentTop = rect.top + rect.height / 2 - collisionHeight / 2
    } else if (align === 'end') {
      contentTop = rect.bottom - collisionHeight
    }

    contentTop = clamp(contentTop + alignOffset, 0, viewportHeight - collisionHeight)

    if (align === 'center') {
      top = contentTop + collisionHeight / 2
      translateSuffix = ' translate(0, -50%)'
    } else if (align === 'end') {
      top = contentTop + collisionHeight
      translateSuffix = ' translate(0, -100%)'
    } else {
      top = contentTop
    }
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
  const measuredContentSizeRef = { current: { width: 0, height: 0 } }
  const contentElementRef = { current: null as HTMLDivElement | null }
  const contentSize = createSignal<ContentSize>(measuredContentSizeRef.current)
  const placedSide = () =>
    getContextMenuPlacedSide(context.anchorPoint(), contentSize(), side(), sideOffset())
  const wrapperStyle = () =>
    getContextMenuWrapperStyle(
      context.anchorPoint(),
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
  const setContentRef = (nextContent: HTMLDivElement | null) => {
    contentElementRef.current = nextContent

    const forwardedRef = props.ref as PossibleRef<HTMLDivElement>
    if (!forwardedRef) return
    if (typeof forwardedRef === 'function') {
      forwardedRef(nextContent)
      return
    }

    forwardedRef.current = nextContent
  }

  useLayoutEffect(() => {
    if (!context.open() && !forceMount()) {
      updateContentSize(null)
      return
    }

    updateContentSize(contentElementRef.current)
  })

  return (
    <>
      {reactive(() =>
        context.open() || forceMount() ? (
          <div data-radix-popper-content-wrapper="" style={wrapperStyle()}>
            <MenuContent
              {...menuScope}
              {...props}
              data-side={prop(placedSide)}
              data-align={prop(align)}
              ref={setContentRef}
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
