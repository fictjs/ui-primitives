import {
  createContext as createRuntimeContext,
  createElement,
  createPortal as createFictPortal,
  mergeProps,
  prop,
  untrack,
  useContext as useRuntimeContext,
  type FictNode,
  type FictVNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useId } from '@fictjs/id'
import {
  createMenuScope,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuArrow,
  type MenuContentProps,
  type MenuSeparatorProps,
  type MenuArrowProps,
} from '@fictjs/menu'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type ScopedProps<P> = P & { __scopeSelect?: Scope }
type PrimitiveButtonProps = JSX.IntrinsicElements['button'] & {
  asChild?: boolean
}
type PrimitiveDivProps = JSX.IntrinsicElements['div'] & {
  asChild?: boolean
}
type PrimitiveSpanProps = JSX.IntrinsicElements['span'] & {
  asChild?: boolean
}
type PossibleRef<T> = ((node: T | null) => void) | { current: T | null } | undefined
type SelectSide = 'top' | 'right' | 'bottom' | 'left'
type SelectAlign = 'start' | 'center' | 'end'
type SelectContextValue = {
  value: () => string
  onValueChange(value: string): void
  open: () => boolean
  onOpenChange(open: boolean): void
  disabled: () => boolean
  triggerRef: { current: HTMLButtonElement | null }
  triggerId: () => string
  contentId: () => string
  selectedText: () => string
  setSelectedText(value: string): void
  registerItemText(value: string, text: string): void
}
type SelectItemContextValue = {
  value: () => string
  selected: () => boolean
  onSelect(): void
}
type SelectPortalContextValue = {
  forceMount: boolean | undefined
}

const SELECT_NAME = 'Select'
const TRIGGER_NAME = 'SelectTrigger'
const VALUE_NAME = 'SelectValue'
const ICON_NAME = 'SelectIcon'
const PORTAL_NAME = 'SelectPortal'
const CONTENT_NAME = 'SelectContent'
const VIEWPORT_NAME = 'SelectViewport'
const GROUP_NAME = 'SelectGroup'
const LABEL_NAME = 'SelectLabel'
const ITEM_NAME = 'SelectItem'
const ITEM_TEXT_NAME = 'SelectItemText'
const ITEM_INDICATOR_NAME = 'SelectItemIndicator'
const SCROLL_UP_BUTTON_NAME = 'SelectScrollUpButton'
const SCROLL_DOWN_BUTTON_NAME = 'SelectScrollDownButton'
const SEPARATOR_NAME = 'SelectSeparator'
const ARROW_NAME = 'SelectArrow'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')
const READ_VALUE_DEPTH_LIMIT = 10
const STATIC_COMPONENT_DEPTH_LIMIT = 32
const SELECT_FALLBACK_COLLISION_SIZE = 160

const [createSelectContext, createSelectScope] = createContextScope(SELECT_NAME, [createMenuScope])
const [SelectProvider, useSelectContext] = createSelectContext<SelectContextValue>(SELECT_NAME)
const [SelectItemProvider, useSelectItemContext] =
  createSelectContext<SelectItemContextValue>(ITEM_NAME)
const SelectPortalContext = createRuntimeContext<SelectPortalContextValue>({
  forceMount: undefined,
})
const useMenuScope = createMenuScope()

type SelectProps = {
  children?: FictNode | FictNode[]
  open?: MaybeAccessor<boolean | undefined>
  defaultOpen?: MaybeAccessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  disabled?: MaybeAccessor<boolean | undefined>
  form?: MaybeAccessor<string | undefined>
  name?: MaybeAccessor<string | undefined>
  required?: MaybeAccessor<boolean | undefined>
  value?: MaybeAccessor<string | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
}
type SelectBubbleSelectProps = {
  controlled: () => boolean
  defaultValue: string
  disabled: () => boolean
  form: () => string | undefined
  name: () => string | undefined
  required: () => boolean
  value: () => string
  onReset(): void
}

type SelectTriggerProps = PrimitiveButtonProps
type SelectValueProps = PrimitiveSpanProps & {
  placeholder?: MaybeAccessor<string | undefined>
}
type SelectIconProps = PrimitiveSpanProps
type SelectPortalProps = {
  children?: FictNode | FictNode[]
  container?: Element | DocumentFragment | null
  forceMount?: MaybeAccessor<boolean | undefined>
}
type SelectPosition = 'item-aligned' | 'popper'
type SelectContentProps = MenuContentProps & {
  position?: MaybeAccessor<SelectPosition | undefined>
}
type SelectViewportProps = PrimitiveDivProps
type SelectGroupProps = PrimitiveDivProps
type SelectLabelProps = PrimitiveDivProps
type SelectItemProps = PrimitiveDivProps & {
  value: string
  disabled?: MaybeAccessor<boolean | undefined>
}
type SelectItemTextProps = PrimitiveSpanProps
type SelectItemIndicatorProps = PrimitiveSpanProps
type SelectScrollUpButtonProps = PrimitiveButtonProps
type SelectScrollDownButtonProps = PrimitiveButtonProps
type SelectSeparatorProps = MenuSeparatorProps
type SelectArrowProps = MenuArrowProps

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

function readStyle(value: unknown): Record<string, string | number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, string | number>
}

function isVNode(node: unknown): node is FictVNode {
  return !!node && typeof node === 'object' && 'type' in (node as FictVNode)
}

function isDomNode(node: unknown): node is Node {
  return typeof Node !== 'undefined' && node instanceof Node
}

function getVNodeProps(node: FictVNode): Record<string, unknown> {
  return (node.props as Record<string, unknown> | null | undefined) ?? {}
}

let staticTextScanDepth = 0

function isStaticTextScan(): boolean {
  return staticTextScanDepth > 0
}

function runStaticTextScan<T>(callback: () => T): T {
  staticTextScanDepth += 1

  try {
    return untrack(callback)
  } finally {
    staticTextScanDepth -= 1
  }
}

function getNodeText(node: FictNode | FictNode[] | undefined): string {
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('')
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (isDomNode(node)) {
    return node.textContent ?? ''
  }

  if (!isVNode(node)) {
    return ''
  }

  return getNodeText(getVNodeProps(node).children as FictNode | FictNode[] | undefined)
}

function findStaticItemText(
  node: FictNode | FictNode[] | undefined,
  depth = 0,
): { found: boolean; text: string } {
  if (depth >= STATIC_COMPONENT_DEPTH_LIMIT) {
    return { found: false, text: '' }
  }

  if (Array.isArray(node)) {
    let found = false
    let text = ''

    for (const child of node) {
      const result = findStaticItemText(child, depth + 1)
      if (result.found) {
        found = true
        text += result.text
      }
    }

    return { found, text }
  }

  if (!isVNode(node)) {
    return { found: false, text: '' }
  }

  const props = getVNodeProps(node)
  const children = props.children as FictNode | FictNode[] | undefined

  if (node.type === SelectItemText) {
    return { found: true, text: getNodeText(children) }
  }

  const childResult = findStaticItemText(children, depth + 1)
  if (childResult.found) {
    return childResult
  }

  const staticChildren = getStaticComponentChildren(node, depth)
  if (staticChildren !== undefined) {
    return findStaticItemText(staticChildren, depth + 1)
  }

  return { found: false, text: '' }
}

function getStaticComponentChildren(
  node: FictVNode,
  depth: number,
): FictNode | FictNode[] | undefined {
  if (depth >= STATIC_COMPONENT_DEPTH_LIMIT || typeof node.type !== 'function') {
    return undefined
  }

  const props = getVNodeProps(node)
  if (props.children !== undefined) {
    return undefined
  }

  try {
    return runStaticTextScan(() =>
      (node.type as (props: Record<string, unknown>) => FictNode | FictNode[] | undefined)(props),
    )
  } catch {
    return undefined
  }
}

function registerStaticDomItemTexts(
  node: Node,
  registerItemText: (value: string, text: string) => void,
): void {
  if (
    typeof Element !== 'undefined' &&
    node instanceof Element &&
    node.hasAttribute('data-select-static-value')
  ) {
    const value = node.getAttribute('data-value')
    const text = node.textContent ?? ''
    if (value && text) {
      registerItemText(value, text)
    }
    return
  }

  for (const child of Array.from(node.childNodes)) {
    registerStaticDomItemTexts(child, registerItemText)
  }
}

function registerStaticItemTexts(
  node: FictNode | FictNode[] | undefined,
  registerItemText: (value: string, text: string) => void,
  depth = 0,
): void {
  if (depth >= STATIC_COMPONENT_DEPTH_LIMIT) return

  if (Array.isArray(node)) {
    for (const child of node) {
      registerStaticItemTexts(child, registerItemText, depth + 1)
    }
    return
  }

  if (isDomNode(node)) {
    registerStaticDomItemTexts(node, registerItemText)
    return
  }

  if (!isVNode(node)) {
    return
  }

  const props = getVNodeProps(node)
  const value =
    typeof props.value === 'string'
      ? props.value
      : props['data-select-static-value'] === ''
        ? props['data-value']
        : undefined
  const children = props.children as FictNode | FictNode[] | undefined

  if (typeof value === 'string') {
    const itemText = findStaticItemText(children, depth + 1)
    const text = itemText.found ? itemText.text : getNodeText(children)
    if (text) {
      registerItemText(value, text)
    }
    return
  }

  registerStaticItemTexts(children, registerItemText, depth + 1)

  const staticChildren = getStaticComponentChildren(node, depth)
  if (staticChildren !== undefined) {
    registerStaticItemTexts(staticChildren, registerItemText, depth + 1)
  }
}

function getOppositeSide(side: SelectSide): SelectSide {
  if (side === 'top') return 'bottom'
  if (side === 'bottom') return 'top'
  if (side === 'left') return 'right'
  return 'left'
}

function getAvailableWidth(
  rect: DOMRect,
  side: SelectSide,
  sideOffset: number,
  viewportWidth: number,
): number {
  if (side === 'left') return Math.max(rect.left - sideOffset, 0)
  if (side === 'right') return Math.max(viewportWidth - rect.right - sideOffset, 0)
  return Math.max(viewportWidth, 0)
}

function getAvailableHeight(
  rect: DOMRect,
  side: SelectSide,
  sideOffset: number,
  viewportHeight: number,
): number {
  if (side === 'top') return Math.max(rect.top - sideOffset, 0)
  if (side === 'bottom') return Math.max(viewportHeight - rect.bottom - sideOffset, 0)
  return Math.max(viewportHeight, 0)
}

function getSelectContentSize(content: HTMLElement | null): { width: number; height: number } {
  if (!content) {
    return { width: 0, height: 0 }
  }

  const rect = content.getBoundingClientRect()

  return {
    width: Math.max(rect.width, content.scrollWidth),
    height: Math.max(rect.height, content.scrollHeight),
  }
}

function getSelectPlacedSide(
  trigger: HTMLElement | null,
  content: HTMLElement | null,
  side: SelectSide,
  sideOffset: number,
): SelectSide {
  if (!trigger) {
    return side
  }

  const rect = trigger.getBoundingClientRect()
  const oppositeSide = getOppositeSide(side)
  const contentSize = getSelectContentSize(content)
  const isVerticalSide = side === 'top' || side === 'bottom'
  const desiredAvailable = isVerticalSide
    ? getAvailableHeight(rect, side, sideOffset, window.innerHeight)
    : getAvailableWidth(rect, side, sideOffset, window.innerWidth)
  const oppositeAvailable = isVerticalSide
    ? getAvailableHeight(rect, oppositeSide, sideOffset, window.innerHeight)
    : getAvailableWidth(rect, oppositeSide, sideOffset, window.innerWidth)
  const requiredSize =
    (isVerticalSide ? contentSize.height : contentSize.width) || SELECT_FALLBACK_COLLISION_SIZE

  if (desiredAvailable < requiredSize && oppositeAvailable > desiredAvailable) {
    return oppositeSide
  }

  return side
}

function getSelectWrapperStyle(
  trigger: HTMLElement | null,
  side: SelectSide,
  align: SelectAlign,
  sideOffset: number,
  alignOffset: number,
): Record<string, string> {
  if (!trigger) {
    return {
      position: 'fixed',
      left: '0px',
      top: '0px',
      transform: 'translate(0px, 0px)',
      pointerEvents: 'auto',
      minWidth: 'max-content',
      zIndex: 'auto',
      '--radix-popper-transform-origin': '0% 0px',
      '--radix-popper-available-width': `${window.innerWidth}px`,
      '--radix-popper-available-height': `${window.innerHeight}px`,
      '--radix-popper-anchor-width': '0px',
      '--radix-popper-anchor-height': '0px',
    }
  }

  const rect = trigger.getBoundingClientRect()
  const availableWidth = getAvailableWidth(rect, side, sideOffset, window.innerWidth)
  const availableHeight = getAvailableHeight(rect, side, sideOffset, window.innerHeight)

  let left = rect.left
  let top = rect.top
  let translateSuffix = ''

  if (side === 'top') {
    top = rect.top - sideOffset
  } else if (side === 'bottom') {
    top = rect.bottom + sideOffset
  } else if (side === 'left') {
    left = rect.left - sideOffset
  } else {
    left = rect.right + sideOffset
  }

  if (side === 'top' || side === 'bottom') {
    if (align === 'center') {
      left = rect.left + rect.width / 2
    } else if (align === 'end') {
      left = rect.right
    }

    left += alignOffset

    if (align === 'center') {
      translateSuffix = side === 'top' ? ' translate(-50%, -100%)' : ' translate(-50%, 0)'
    } else if (align === 'end') {
      translateSuffix = side === 'top' ? ' translate(-100%, -100%)' : ' translate(-100%, 0)'
    } else if (side === 'top') {
      translateSuffix = ' translate(0, -100%)'
    }
  } else {
    if (align === 'center') {
      top = rect.top + rect.height / 2
    } else if (align === 'end') {
      top = rect.bottom
    }

    top += alignOffset

    if (align === 'center') {
      translateSuffix = side === 'left' ? ' translate(-100%, -50%)' : ' translate(0, -50%)'
    } else if (align === 'end') {
      translateSuffix = side === 'left' ? ' translate(-100%, -100%)' : ' translate(0, -100%)'
    } else if (side === 'left') {
      translateSuffix = ' translate(-100%, 0)'
    }
  }

  const roundedLeft = Math.round(left)
  const roundedTop = Math.round(top)
  const originX =
    side === 'top' || side === 'bottom'
      ? align === 'center'
        ? '50%'
        : align === 'end'
          ? '100%'
          : '0%'
      : side === 'left'
        ? '100%'
        : '0%'
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
    transform: `translate(${roundedLeft}px, ${roundedTop}px)${translateSuffix}`,
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

function setNativeSelectValue(select: HTMLSelectElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')
  descriptor?.set?.call(select, value)
}

function SelectBubbleSelect(props: SelectBubbleSelectProps): FictNode {
  const select = createSignal<HTMLSelectElement | null>(null)
  let previousValue = props.defaultValue
  let synchronizingReset = false

  useLayoutEffect(() => {
    const element = select()
    const nextValue = props.value()

    if (!element) {
      previousValue = nextValue
      return
    }

    if (!Object.is(previousValue, nextValue)) {
      setNativeSelectValue(element, nextValue)
      if (!synchronizingReset) {
        element.dispatchEvent(new Event('input', { bubbles: true }))
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }

    previousValue = nextValue
  })

  useLayoutEffect(() => {
    const element = select()
    if (!element) return
    const document = element.ownerDocument
    const form = element.form
    let disposed = false
    let pendingResetEvent: Event | null = null
    const handleReset = (event: Event) => {
      if (event.target !== element.form || event === pendingResetEvent) return

      pendingResetEvent = event

      // Wait until reset propagation and the browser's default action finish. This lets
      // consumers cancel the reset from any phase and gives the native select a chance to
      // restore its default option before synchronizing Fict state.
      queueMicrotask(() => {
        if (pendingResetEvent === event) {
          pendingResetEvent = null
        }
        if (disposed || event.defaultPrevented) return

        if (props.controlled()) {
          const currentValue = props.value()
          setNativeSelectValue(element, currentValue)
          previousValue = currentValue
          return
        }

        // The hidden select contains only the current value as an option. Update Fict state
        // first so that option can adopt the reset value, while suppressing the normal
        // input/change bridge. A second microtask then covers runtimes that defer DOM prop
        // bindings beyond the state write.
        synchronizingReset = true
        props.onReset()
        queueMicrotask(() => {
          if (disposed) return

          const resetValue = props.value()
          setNativeSelectValue(element, resetValue)
          previousValue = resetValue
          synchronizingReset = false
        })
      })
    }

    // Reset is not composed, so a shadow-root form needs a direct listener. The document
    // listener observes light-DOM and external form ownership; `pendingResetEvent`
    // deduplicates both listeners when they receive the same reset.
    document.addEventListener('reset', handleReset, true)
    form?.addEventListener('reset', handleReset, true)
    return () => {
      disposed = true
      document.removeEventListener('reset', handleReset, true)
      form?.removeEventListener('reset', handleReset, true)
    }
  })

  const selectProps = mergeProps({
    'aria-hidden': true,
    defaultValue: props.defaultValue,
    disabled: prop(() => (props.disabled() ? true : undefined)),
    'attr:form': prop(props.form),
    name: prop(props.name),
    required: prop(() => (props.required() ? true : undefined)),
    tabIndex: -1,
    value: prop(props.value),
    style: {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: '1px',
      margin: '-1px',
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      whiteSpace: 'nowrap',
      width: '1px',
    },
  })
  const option = reactive(() => (
    <option value={props.value()} selected>
      {props.value()}
    </option>
  )) as unknown as FictNode

  return (
    <Primitive.select {...selectProps} ref={(node: HTMLSelectElement | null) => select(node)}>
      {option}
    </Primitive.select>
  )
}

SelectBubbleSelect.displayName = 'SelectBubbleSelect'

function Select(props: ScopedProps<SelectProps>): FictNode {
  const triggerRef = { current: null as HTMLButtonElement | null }
  const menuScope = useMenuScope(props.__scopeSelect)
  const triggerId = useId()
  const contentId = useId()
  const selectedText = createSignal('')
  const textByValue = new Map<string, string>()
  const valueProp = () =>
    props.value === undefined
      ? undefined
      : readValue(props.value as MaybeAccessor<string | undefined>)
  const defaultValue = () =>
    props.defaultValue === undefined
      ? ''
      : (readValue(props.defaultValue as MaybeAccessor<string | undefined>) ?? '')
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const form = () =>
    props.form === undefined
      ? undefined
      : readValue(props.form as MaybeAccessor<string | undefined>)
  const name = () =>
    props.name === undefined
      ? undefined
      : readValue(props.name as MaybeAccessor<string | undefined>)
  const required = () =>
    props.required === undefined
      ? false
      : Boolean(readValue(props.required as MaybeAccessor<boolean | undefined>) ?? false)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: SELECT_NAME,
    ...(props.onValueChange ? { onChange: props.onValueChange } : {}),
  })
  const initialValue = untrack(() => value())
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: SELECT_NAME,
    ...(props.onOpenChange ? { onChange: props.onOpenChange } : {}),
  })
  const registerItemText = (itemValue: string, text: string) => {
    textByValue.set(itemValue, text)
    if (itemValue === value()) {
      selectedText(text)
    }
  }

  const onValueChange = (nextValue: string) => {
    setValue(nextValue)
    selectedText(textByValue.get(nextValue) ?? '')
  }

  return (
    <SelectProvider
      scope={props.__scopeSelect as Scope<SelectContextValue | undefined>}
      value={value}
      onValueChange={onValueChange}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      triggerRef={triggerRef}
      triggerId={triggerId}
      contentId={contentId}
      selectedText={selectedText}
      setSelectedText={selectedText}
      registerItemText={registerItemText}
    >
      <Menu {...menuScope} open={open} onOpenChange={setOpen}>
        <>
          {props.children}
          <SelectBubbleSelect
            controlled={() => valueProp() !== undefined}
            defaultValue={initialValue}
            disabled={disabled}
            form={form}
            name={name}
            required={required}
            value={value}
            onReset={() => setValue(initialValue)}
          />
        </>
      </Menu>
    </SelectProvider>
  )
}

Select.displayName = SELECT_NAME

function SelectTrigger(props: ScopedProps<SelectTriggerProps>): FictNode {
  const context = useSelectContext(
    TRIGGER_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const primitiveProps = mergeProps(
    {
      type: 'button',
      id: prop(context.triggerId),
      'aria-haspopup': 'listbox',
      'aria-expanded': prop(() => String(context.open())),
      'aria-controls': prop(() => (context.open() ? context.contentId() : undefined)),
      'aria-disabled': prop(() => (context.disabled() ? 'true' : undefined)),
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
      'data-state': prop(() => (context.open() ? 'open' : 'closed')),
      disabled: prop(() => (context.disabled() ? true : undefined)),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
      onClick: composeEventHandlers<MouseEvent>(
        props.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          if (context.disabled()) return
          context.onOpenChange(!context.open())
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (context.disabled()) return
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            context.onOpenChange(true)
          }
        },
      ),
    },
  )

  return (
    <Primitive.button
      {...primitiveProps}
      ref={(node: HTMLButtonElement | null) => {
        context.triggerRef.current = node
        if (!props.ref) return
        if (typeof props.ref === 'function') {
          props.ref(node)
          return
        }
        props.ref.current = node
      }}
    />
  )
}

SelectTrigger.displayName = TRIGGER_NAME

function SelectValue(props: ScopedProps<SelectValueProps>): FictNode {
  const context = useSelectContext(
    VALUE_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const placeholder = () =>
    props.placeholder === undefined
      ? ''
      : (readValue(props.placeholder as MaybeAccessor<string | undefined>) ?? '')

  return (
    <Primitive.span
      {...(props as Record<string, unknown>)}
      ref={(node: HTMLSpanElement | null) => {
        if (!props.ref) return
        if (typeof props.ref === 'function') {
          props.ref(node)
          return
        }
        props.ref.current = node
      }}
    >
      {
        reactive(() =>
          context.value() ? context.selectedText() : placeholder(),
        ) as unknown as FictNode
      }
    </Primitive.span>
  )
}

SelectValue.displayName = VALUE_NAME

function SelectIcon(props: ScopedProps<SelectIconProps>): FictNode {
  return <Primitive.span {...(props as Record<string, unknown>)} />
}

SelectIcon.displayName = ICON_NAME

function SelectPortal(props: ScopedProps<SelectPortalProps>): FictNode {
  const forceMount =
    props.forceMount === undefined
      ? undefined
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const container = props.container ?? globalThis.document?.body ?? null

  if (!container) return null

  createFictPortal(
    container,
    () => (
      <SelectPortalContext.Provider value={{ forceMount }}>
        <div style={{ display: 'contents' }}>{props.children}</div>
      </SelectPortalContext.Provider>
    ),
    createElement,
  )

  return null
}

SelectPortal.displayName = PORTAL_NAME

function SelectContent(props: ScopedProps<SelectContentProps>): FictNode {
  const { position: _position, ...contentProps } = props
  const menuScope = useMenuScope(props.__scopeSelect)
  const portalContext = useRuntimeContext(SelectPortalContext)
  const context = useSelectContext(
    CONTENT_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const content = createSignal<HTMLDivElement | null>(null)
  const forceMount =
    props.forceMount === undefined
      ? portalContext.forceMount
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const position = () =>
    props.position === undefined
      ? 'item-aligned'
      : (readValue(props.position as MaybeAccessor<SelectPosition | undefined>) ?? 'item-aligned')
  const side = () =>
    props.side === undefined
      ? 'bottom'
      : (readValue(props.side as MaybeAccessor<'top' | 'right' | 'bottom' | 'left' | undefined>) ??
        'bottom')
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
  const placedSide = () =>
    getSelectPlacedSide(context.triggerRef.current, content(), side(), sideOffset())
  const wrapperStyle = () =>
    getSelectWrapperStyle(
      context.triggerRef.current,
      placedSide(),
      align(),
      sideOffset(),
      alignOffset(),
    )
  const wrapperProps = mergeProps({
    style: prop(wrapperStyle),
  })
  const setContentRef = (node: HTMLDivElement | null) => {
    content(node)

    const forwardedRef = (contentProps as { ref?: PossibleRef<HTMLDivElement> }).ref
    if (!forwardedRef) return
    if (typeof forwardedRef === 'function') {
      forwardedRef(node)
      return
    }

    forwardedRef.current = node
  }

  useLayoutEffect(() => {
    registerStaticItemTexts(props.children, context.registerItemText)
  })

  const contentNode = (
    <MenuContent
      {...menuScope}
      {...contentProps}
      id={context.contentId()}
      role="listbox"
      forceMount={forceMount}
      aria-labelledby={context.triggerId()}
      data-side={prop(placedSide)}
      data-align={prop(align)}
      ref={setContentRef}
      style={{
        outline: 'none',
        ...(position() === 'popper' ? { width: '100%' } : {}),
        '--radix-select-content-transform-origin': 'var(--radix-popper-transform-origin)',
        '--radix-select-content-available-width': 'var(--radix-popper-available-width)',
        '--radix-select-content-available-height': 'var(--radix-popper-available-height)',
        '--radix-select-trigger-width': 'var(--radix-popper-anchor-width)',
        '--radix-select-trigger-height': 'var(--radix-popper-anchor-height)',
        ...readStyle(contentProps.style),
      }}
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event)
        event.preventDefault()
      }}
    />
  )

  return (
    <>
      {reactive(() =>
        forceMount || context.open() ? (
          <div data-radix-popper-content-wrapper="" {...(wrapperProps as Record<string, unknown>)}>
            {contentNode}
          </div>
        ) : null,
      )}
    </>
  )
}

SelectContent.displayName = CONTENT_NAME

function SelectViewport(props: ScopedProps<SelectViewportProps>): FictNode {
  return <Primitive.div {...(props as Record<string, unknown>)} />
}

SelectViewport.displayName = VIEWPORT_NAME

function SelectGroup(props: ScopedProps<SelectGroupProps>): FictNode {
  return <Primitive.div role="group" {...(props as Record<string, unknown>)} />
}

SelectGroup.displayName = GROUP_NAME

function SelectLabel(props: ScopedProps<SelectLabelProps>): FictNode {
  return <Primitive.div {...(props as Record<string, unknown>)} />
}

SelectLabel.displayName = LABEL_NAME

function SelectItem(props: ScopedProps<SelectItemProps>): FictNode {
  if (isStaticTextScan()) {
    return (
      <div data-select-static-value="" data-value={props.value}>
        {props.children}
      </div>
    )
  }

  const context = useSelectContext(
    ITEM_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const menuScope = useMenuScope(props.__scopeSelect)
  const { __scopeSelect: _scopeSelect, value: _value, ...itemProps } = props
  const selected = () => context.value() === props.value
  const disabled = () =>
    props.disabled === undefined
      ? false
      : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)

  return (
    <SelectItemProvider
      scope={props.__scopeSelect as Scope<SelectItemContextValue | undefined>}
      value={() => props.value}
      selected={selected}
      onSelect={() => {
        if (disabled()) return
        context.onValueChange(props.value)
        context.onOpenChange(false)
      }}
    >
      <MenuItem
        {...menuScope}
        {...itemProps}
        role="option"
        aria-selected={prop(() => (selected() ? 'true' : 'false')) as unknown as 'true' | 'false'}
        data-state={prop(() => (selected() ? 'checked' : 'unchecked'))}
        data-select-item=""
        data-value={props.value}
        disabled={props.disabled}
        onSelect={(event) => {
          if (disabled()) {
            event.preventDefault()
            return
          }

          context.onValueChange(props.value)
          context.onOpenChange(false)
        }}
        onKeyDown={composeEventHandlers<KeyboardEvent>(
          itemProps.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
          (event) => {
            if (disabled()) return
          },
        )}
      />
    </SelectItemProvider>
  )
}

SelectItem.displayName = ITEM_NAME

function SelectItemText(props: ScopedProps<SelectItemTextProps>): FictNode {
  if (isStaticTextScan()) {
    return <span>{props.children}</span>
  }

  const rootContext = useSelectContext(
    ITEM_TEXT_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const itemContext = useSelectItemContext(
    ITEM_TEXT_NAME,
    props.__scopeSelect as Scope<SelectItemContextValue | undefined>,
  )
  const ref = { current: null as HTMLSpanElement | null }

  useLayoutEffect(() => {
    const text = ref.current?.textContent ?? ''
    rootContext.registerItemText(itemContext.value(), text)
    if (itemContext.selected()) {
      rootContext.setSelectedText(text)
    }
  })

  return (
    <Primitive.span
      {...(props as Record<string, unknown>)}
      ref={(node: HTMLSpanElement | null) => {
        ref.current = node
        if (!props.ref) return
        if (typeof props.ref === 'function') {
          props.ref(node)
          return
        }
        props.ref.current = node
      }}
    />
  )
}

SelectItemText.displayName = ITEM_TEXT_NAME

function SelectItemIndicator(props: ScopedProps<SelectItemIndicatorProps>): FictNode {
  if (isStaticTextScan()) {
    return null
  }

  const itemContext = useSelectItemContext(
    ITEM_INDICATOR_NAME,
    props.__scopeSelect as Scope<SelectItemContextValue | undefined>,
  )

  return (
    <Presence present={itemContext.selected}>
      <Primitive.span {...(props as Record<string, unknown>)} />
    </Presence>
  )
}

SelectItemIndicator.displayName = ITEM_INDICATOR_NAME

function SelectScrollUpButton(props: ScopedProps<SelectScrollUpButtonProps>): FictNode {
  return <Primitive.button type="button" {...(props as Record<string, unknown>)} />
}

SelectScrollUpButton.displayName = SCROLL_UP_BUTTON_NAME

function SelectScrollDownButton(props: ScopedProps<SelectScrollDownButtonProps>): FictNode {
  return <Primitive.button type="button" {...(props as Record<string, unknown>)} />
}

SelectScrollDownButton.displayName = SCROLL_DOWN_BUTTON_NAME

function SelectSeparator(props: ScopedProps<SelectSeparatorProps>): FictNode {
  if (isStaticTextScan()) {
    return null
  }

  const menuScope = useMenuScope(props.__scopeSelect)
  return <MenuSeparator {...menuScope} {...props} />
}

SelectSeparator.displayName = SEPARATOR_NAME

function SelectArrow(props: ScopedProps<SelectArrowProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeSelect)
  return <MenuArrow {...menuScope} {...props} />
}

SelectArrow.displayName = ARROW_NAME

const Root = Select
const Trigger = SelectTrigger
const Value = SelectValue
const Icon = SelectIcon
const Portal = SelectPortal
const Content = SelectContent
const Viewport = SelectViewport
const Group = SelectGroup
const Label = SelectLabel
const Item = SelectItem
const ItemText = SelectItemText
const ItemIndicator = SelectItemIndicator
const ScrollUpButton = SelectScrollUpButton
const ScrollDownButton = SelectScrollDownButton
const Separator = SelectSeparator
const Arrow = SelectArrow

export {
  createSelectScope,
  Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectSeparator,
  SelectArrow,
  Root,
  Trigger,
  Value,
  Icon,
  Portal,
  Content,
  Viewport,
  Group,
  Label,
  Item,
  ItemText,
  ItemIndicator,
  ScrollUpButton,
  ScrollDownButton,
  Separator,
  Arrow,
}

export type {
  SelectProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectIconProps,
  SelectPortalProps,
  SelectContentProps,
  SelectViewportProps,
  SelectGroupProps,
  SelectLabelProps,
  SelectItemProps,
  SelectItemTextProps,
  SelectItemIndicatorProps,
  SelectScrollUpButtonProps,
  SelectScrollDownButtonProps,
  SelectSeparatorProps,
  SelectArrowProps,
}
