import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { Primitive } from '@fictjs/primitive'
import { createRovingFocusGroupScope } from '@fictjs/roving-focus'
import { Separator } from '@fictjs/separator'
import {
  createToggleGroupScope,
  ToggleGroup as ToggleGroupPrimitive,
  ToggleGroupItem as ToggleGroupItemPrimitive,
  type ToggleGroupItemProps as ToggleGroupItemPrimitiveProps,
  type ToggleGroupMultipleProps as ToggleGroupPrimitiveMultipleProps,
  type ToggleGroupSingleProps as ToggleGroupPrimitiveSingleProps,
} from '@fictjs/toggle-group'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type Orientation = 'horizontal' | 'vertical'
type ScopedProps<P> = P & { __scopeToolbar?: Scope }
type PossibleRef<T> = ((node: T | null) => void) | { current: T | null } | null | undefined
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type PrimitiveLinkProps = JSX.IntrinsicElements['a'] & {
  asChild?: boolean
}
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type ToolbarItemElement = HTMLElement

const TOOLBAR_NAME = 'Toolbar'
const SEPARATOR_NAME = 'ToolbarSeparator'
const BUTTON_NAME = 'ToolbarButton'
const LINK_NAME = 'ToolbarLink'
const TOGGLE_GROUP_NAME = 'ToolbarToggleGroup'
const TOGGLE_ITEM_NAME = 'ToolbarToggleItem'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createToolbarContext, createToolbarScope] = createContextScope(TOOLBAR_NAME, [
  createRovingFocusGroupScope,
  createToggleGroupScope,
])

type ToolbarContextValue = {
  orientation: () => Orientation
  dir: () => Direction
  loop: () => boolean
  rootRef: { current: HTMLDivElement | null }
  currentTabStop: () => ToolbarItemElement | null
  setCurrentTabStop(value: ToolbarItemElement | null): void
  getItems(): ToolbarItemElement[]
}

const [ToolbarProvider, useToolbarContext] = createToolbarContext<ToolbarContextValue>(TOOLBAR_NAME)

type ToolbarProps = Omit<PrimitiveDivProps, 'dir'> & {
  orientation?: MaybeAccessor<Orientation | undefined>
  loop?: MaybeAccessor<boolean | undefined>
  dir?: MaybeAccessor<Direction | undefined>
}

type ToolbarSeparatorProps = JSX.IntrinsicElements['div'] & {
  orientation?: MaybeAccessor<'horizontal' | 'vertical'>
  decorative?: MaybeAccessor<boolean>
}

type ToolbarButtonProps = PrimitiveButtonProps
type ToolbarLinkProps = PrimitiveLinkProps
type ToolbarToggleGroupSingleProps = ToggleGroupPrimitiveSingleProps
type ToolbarToggleGroupMultipleProps = ToggleGroupPrimitiveMultipleProps
type ToolbarToggleItemProps = ToggleGroupItemPrimitiveProps

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

function setRef<T>(ref: PossibleRef<T>, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value)
    return
  }

  if (ref) {
    ref.current = value
  }
}

function getDirectionAwareKey(key: string, dir: Direction) {
  if (dir !== 'rtl') return key
  return key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key
}

function getFocusIntent(key: string, orientation: Orientation, dir: Direction) {
  const nextKey = getDirectionAwareKey(key, dir)
  if (orientation === 'vertical' && ['ArrowLeft', 'ArrowRight'].includes(nextKey)) return undefined
  if (orientation === 'horizontal' && ['ArrowUp', 'ArrowDown'].includes(nextKey)) return undefined

  if (nextKey === 'ArrowLeft' || nextKey === 'ArrowUp') return 'prev'
  if (nextKey === 'ArrowRight' || nextKey === 'ArrowDown') return 'next'
  if (nextKey === 'Home' || nextKey === 'PageUp') return 'first'
  if (nextKey === 'End' || nextKey === 'PageDown') return 'last'

  return undefined
}

function isToolbarItemDisabled(item: ToolbarItemElement): boolean {
  return (
    item.hasAttribute('disabled') ||
    item.getAttribute('aria-disabled') === 'true' ||
    item.hasAttribute('data-disabled')
  )
}

function focusItem(item: ToolbarItemElement | undefined): void {
  item?.focus()
}

function getNextItem(
  items: ToolbarItemElement[],
  currentElement: ToolbarItemElement | null,
  intent: 'prev' | 'next' | 'first' | 'last',
  loop: boolean,
): ToolbarItemElement | undefined {
  if (items.length === 0) return undefined

  if (intent === 'first') return items[0]
  if (intent === 'last') return items[items.length - 1]

  const currentIndex = items.indexOf(currentElement as ToolbarItemElement)
  if (currentIndex === -1) {
    return intent === 'prev' ? items[items.length - 1] : items[0]
  }

  const step = intent === 'prev' ? -1 : 1
  const nextIndex = currentIndex + step

  if (loop) {
    return items[(nextIndex + items.length) % items.length]
  }

  return items[nextIndex]
}

function Toolbar(props: ScopedProps<ToolbarProps>): FictNode {
  const inheritedDirection = useDirection()
  const orientation = () =>
    props.orientation === undefined
      ? 'horizontal'
      : ((readValue(props.orientation as MaybeAccessor<Orientation | undefined>) ??
          'horizontal') as Orientation)
  const dir = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const loop = () =>
    props.loop === undefined
      ? true
      : Boolean(readValue(props.loop as MaybeAccessor<boolean | undefined>) ?? true)
  const rootRef = { current: null as HTMLDivElement | null }
  const currentTabStopRef = { current: null as ToolbarItemElement | null }
  const getItems = () =>
    Array.from(rootRef.current?.querySelectorAll<ToolbarItemElement>('[data-toolbar-item]') ?? [])
  const getEntryItem = () => {
    const enabledItems = getItems().filter((item) => !isToolbarItemDisabled(item))
    const currentElement = currentTabStopRef.current

    if (currentElement && enabledItems.includes(currentElement)) {
      return currentElement
    }

    return enabledItems[0]
  }
  let syncQueued = false
  const syncTabStops = () => {
    const entryItem = getEntryItem()

    for (const item of getItems()) {
      item.tabIndex = !isToolbarItemDisabled(item) && entryItem === item ? 0 : -1
    }
  }
  const scheduleSyncTabStops = () => {
    if (syncQueued) return
    syncQueued = true

    setTimeout(() => {
      syncQueued = false
      syncTabStops()
    }, 0)
  }
  const setCurrentTabStop = (value: ToolbarItemElement | null) => {
    currentTabStopRef.current = value
    scheduleSyncTabStops()
  }
  const primitiveProps = mergeProps(
    {
      role: 'toolbar',
      dir: prop(dir),
      'aria-orientation': prop(orientation),
      'data-orientation': prop(orientation),
      ref: (node: HTMLDivElement | null) => {
        rootRef.current = node
        setRef(props.ref as PossibleRef<HTMLDivElement>, node)
      },
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeToolbar: undefined,
      dir: undefined,
      loop: undefined,
      orientation: undefined,
      ref: undefined,
    },
  )

  useLayoutEffect(() => {
    scheduleSyncTabStops()
  })

  return (
    <ToolbarProvider
      scope={props.__scopeToolbar as Scope<ToolbarContextValue | undefined>}
      orientation={orientation}
      dir={dir}
      loop={loop}
      rootRef={rootRef}
      currentTabStop={() => currentTabStopRef.current}
      setCurrentTabStop={setCurrentTabStop}
      getItems={getItems}
    >
      <Primitive.div {...(primitiveProps as Record<string, unknown>)} />
    </ToolbarProvider>
  )
}

Toolbar.displayName = TOOLBAR_NAME

function ToolbarSeparator(props: ScopedProps<ToolbarSeparatorProps>): FictNode {
  const { __scopeToolbar, ...separatorProps } = props
  const context = useToolbarContext(
    SEPARATOR_NAME,
    __scopeToolbar as Scope<ToolbarContextValue | undefined>,
  )

  return (
    <Separator
      orientation={context.orientation() === 'horizontal' ? 'vertical' : 'horizontal'}
      {...separatorProps}
    />
  )
}

ToolbarSeparator.displayName = SEPARATOR_NAME

function useToolbarItemProps(
  scope: Scope | undefined,
  name: string,
  disabled: () => boolean,
  ref: PossibleRef<ToolbarItemElement>,
  props: Record<string, unknown>,
) {
  const context = useToolbarContext(name, scope as Scope<ToolbarContextValue | undefined>)

  return mergeProps(
    {
      'data-orientation': prop(context.orientation),
      'data-toolbar-item': '',
      ref,
      onFocus: composeEventHandlers<FocusEvent>(
        props.onFocus as ((event: FocusEvent) => void) | undefined,
        (event) => {
          if (!disabled()) {
            context.setCurrentTabStop(event.currentTarget as ToolbarItemElement)
          }
        },
      ),
      onMouseDown: composeEventHandlers<MouseEvent>(
        props.onMouseDown as ((event: MouseEvent) => void) | undefined,
        (event) => {
          if (disabled()) {
            event.preventDefault()
            return
          }

          if (event.button === 0 && event.ctrlKey === false) {
            context.setCurrentTabStop(event.currentTarget as ToolbarItemElement)
          }
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (event.target !== event.currentTarget) return
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

          const intent = getFocusIntent(event.key, context.orientation(), context.dir())
          if (!intent) return

          const currentTarget =
            (document.activeElement as ToolbarItemElement | null) ??
            (event.currentTarget as ToolbarItemElement)
          const enabledItems = context.getItems().filter((item) => !isToolbarItemDisabled(item))
          const nextItem = getNextItem(enabledItems, currentTarget, intent, context.loop())
          if (!nextItem) return

          event.preventDefault()
          context.setCurrentTabStop(nextItem)
          focusItem(nextItem)
        },
      ),
    },
    props,
  )
}

function ToolbarButton(props: ScopedProps<ToolbarButtonProps>): FictNode {
  const { __scopeToolbar: _scopeToolbar, disabled = false, ...buttonProps } = props
  const isDisabled = () =>
    Boolean(readValue(disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const primitiveProps = mergeProps(
    {
      type: 'button',
    },
    useToolbarItemProps(
      props.__scopeToolbar,
      BUTTON_NAME,
      isDisabled,
      props.ref as PossibleRef<ToolbarItemElement>,
      buttonProps as Record<string, unknown>,
    ),
    {
      disabled: prop(isDisabled),
      'data-disabled': prop(() => (isDisabled() ? '' : undefined)),
    },
  )

  return <Primitive.button {...(primitiveProps as Record<string, unknown>)} />
}

ToolbarButton.displayName = BUTTON_NAME

function ToolbarLink(props: ScopedProps<ToolbarLinkProps>): FictNode {
  const { __scopeToolbar: _scopeToolbar, ...linkProps } = props
  const isDisabled = () => false
  const toolbarLinkProps = mergeProps(
    prop(() => linkProps as Record<string, unknown>),
    {
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        linkProps.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (event.key === ' ') {
            event.preventDefault()
            if (!isDisabled()) {
              ;(event.currentTarget as HTMLAnchorElement).click()
            }
          }
        },
      ),
    },
  )
  const primitiveProps = mergeProps(
    useToolbarItemProps(
      props.__scopeToolbar,
      LINK_NAME,
      isDisabled,
      props.ref as PossibleRef<ToolbarItemElement>,
      toolbarLinkProps as Record<string, unknown>,
    ),
    {
      'aria-disabled': prop(() => (isDisabled() ? 'true' : undefined)),
      'data-disabled': prop(() => (isDisabled() ? '' : undefined)),
    },
  )

  return <Primitive.a {...(primitiveProps as Record<string, unknown>)} />
}

ToolbarLink.displayName = LINK_NAME

function ToolbarToggleGroup(
  props: ScopedProps<ToolbarToggleGroupSingleProps | ToolbarToggleGroupMultipleProps>,
): FictNode {
  const { __scopeToolbar, ...toggleGroupProps } = props
  const context = useToolbarContext(
    TOGGLE_GROUP_NAME,
    __scopeToolbar as Scope<ToolbarContextValue | undefined>,
  )

  return (
    <ToggleGroupPrimitive
      {...toggleGroupProps}
      __scopeToggleGroup={__scopeToolbar}
      data-orientation={context.orientation()}
      dir={context.dir()}
      orientation={context.orientation()}
      rovingFocus={false}
    />
  )
}

ToolbarToggleGroup.displayName = TOGGLE_GROUP_NAME

function ToolbarToggleItem(props: ScopedProps<ToolbarToggleItemProps>): FictNode {
  const { __scopeToolbar: _scopeToolbar, disabled = false, ...toggleItemProps } = props
  const isDisabled = () =>
    Boolean(readValue(disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const primitiveProps = mergeProps(
    useToolbarItemProps(
      props.__scopeToolbar,
      TOGGLE_ITEM_NAME,
      isDisabled,
      props.ref as PossibleRef<ToolbarItemElement>,
      toggleItemProps as Record<string, unknown>,
    ),
    {
      value: props.value,
      disabled: prop(isDisabled),
      'data-disabled': prop(() => (isDisabled() ? '' : undefined)),
      __scopeToggleGroup: props.__scopeToolbar,
    },
  )

  return <ToggleGroupItemPrimitive {...(primitiveProps as ScopedProps<ToolbarToggleItemProps>)} />
}

ToolbarToggleItem.displayName = TOGGLE_ITEM_NAME

const Root = Toolbar
const SeparatorPrimitive = ToolbarSeparator
const Button = ToolbarButton
const Link = ToolbarLink
const ToggleGroup = ToolbarToggleGroup
const ToggleItem = ToolbarToggleItem

export {
  createToolbarScope,
  Toolbar,
  ToolbarSeparator,
  ToolbarButton,
  ToolbarLink,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  Root,
  SeparatorPrimitive as Separator,
  Button,
  Link,
  ToggleGroup,
  ToggleItem,
}
export type {
  ToolbarProps,
  ToolbarSeparatorProps,
  ToolbarButtonProps,
  ToolbarLinkProps,
  ToolbarToggleGroupSingleProps,
  ToolbarToggleGroupMultipleProps,
  ToolbarToggleItemProps,
}
