import {
  createContext as createRuntimeContext,
  createElement,
  createEffect,
  createMemo,
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
  MenuAnchor,
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
  forceMount: () => boolean | undefined
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

const [createSelectContext, createSelectScope] = createContextScope(SELECT_NAME, [createMenuScope])
const [SelectProvider, useSelectContext] = createSelectContext<SelectContextValue>(SELECT_NAME)
const [SelectItemProvider, useSelectItemContext] =
  createSelectContext<SelectItemContextValue>(ITEM_NAME)
const SelectPortalContext = createRuntimeContext<SelectPortalContextValue>({
  forceMount: () => undefined,
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
    onChange: (nextValue) => props.onValueChange?.(nextValue),
  })
  const initialValue = untrack(() => value())
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    caller: SELECT_NAME,
    onChange: (nextOpen) => props.onOpenChange?.(nextOpen),
  })
  const registerItemText = (itemValue: string, text: string) => {
    textByValue.set(itemValue, text)
    if (itemValue === value()) {
      selectedText(text)
    }
  }

  const onValueChange = (nextValue: string) => {
    setValue(nextValue)
  }

  useLayoutEffect(() => {
    const currentValue = value()
    selectedText(textByValue.get(currentValue) ?? '')
  })

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
  const menuScope = useMenuScope(props.__scopeSelect)
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
        (event) => (props.onClick as ((event: MouseEvent) => void) | undefined)?.(event),
        () => {
          if (context.disabled()) return
          context.onOpenChange(!context.open())
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => (props.onKeyDown as ((event: KeyboardEvent) => void) | undefined)?.(event),
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
    <MenuAnchor {...menuScope} asChild>
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
    </MenuAnchor>
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
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
      placeholder: undefined,
      ref: undefined,
    },
  )

  return (
    <Primitive.span
      {...primitiveProps}
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
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
    },
  )
  return <Primitive.span {...primitiveProps} />
}

SelectIcon.displayName = ICON_NAME

function SelectPortal(props: ScopedProps<SelectPortalProps>): FictNode {
  const forceMount = () =>
    props.forceMount === undefined
      ? undefined
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)

  const initialContainer = props.container ?? globalThis.document?.body ?? null
  if (!initialContainer) return null

  const portal = createFictPortal(
    initialContainer,
    () => (
      <div style={{ display: 'contents' }}>
        <SelectPortalContext.Provider value={{ forceMount }}>
          {props.children}
        </SelectPortalContext.Provider>
      </div>
    ),
    createElement,
  )

  createEffect(() => {
    const container = props.container ?? globalThis.document?.body ?? null
    if (!container || portal.marker.parentNode === container) return

    // Keep a single wrapper immediately before the runtime marker so retargeting can
    // move the existing portal lifecycle instead of registering another parent cleanup.
    const portalNode = portal.marker.previousSibling
    if (portalNode) {
      container.appendChild(portalNode)
    }
    container.appendChild(portal.marker)
  })

  return null
}

SelectPortal.displayName = PORTAL_NAME

function SelectContent(props: ScopedProps<SelectContentProps>): FictNode {
  const contentProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
      position: undefined,
    },
  )
  const menuScope = useMenuScope(props.__scopeSelect)
  const portalContext = useRuntimeContext(SelectPortalContext)
  const context = useSelectContext(
    CONTENT_NAME,
    props.__scopeSelect as Scope<SelectContextValue | undefined>,
  )
  const forceMount = () =>
    props.forceMount === undefined
      ? portalContext.forceMount()
      : Boolean(readValue(props.forceMount as MaybeAccessor<boolean | undefined>) ?? false)
  const present = createMemo(() => Boolean(forceMount() || context.open()))
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
  const setContentRef = (node: HTMLDivElement | null) => {
    const forwardedRef = props.ref as PossibleRef<HTMLDivElement>
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
      side={prop(side)}
      align={prop(align)}
      sideOffset={prop(sideOffset)}
      alignOffset={prop(alignOffset)}
      ref={setContentRef}
      style={
        prop(() => ({
          outline: 'none',
          ...(position() === 'popper' ? { width: '100%' } : {}),
          '--radix-select-content-transform-origin': 'var(--radix-popper-transform-origin)',
          '--radix-select-content-available-width': 'var(--radix-popper-available-width)',
          '--radix-select-content-available-height': 'var(--radix-popper-available-height)',
          '--radix-select-trigger-width': 'var(--radix-popper-anchor-width)',
          '--radix-select-trigger-height': 'var(--radix-popper-anchor-height)',
          ...readStyle(props.style),
        })) as unknown as Record<string, string | number>
      }
      onCloseAutoFocus={(event) => {
        props.onCloseAutoFocus?.(event)
        if (event.defaultPrevented) return

        context.triggerRef.current?.focus({ preventScroll: true })
        event.preventDefault()
      }}
    />
  )

  return <>{reactive(() => (present() ? contentNode : null))}</>
}

SelectContent.displayName = CONTENT_NAME

function SelectViewport(props: ScopedProps<SelectViewportProps>): FictNode {
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
    },
  )
  return <Primitive.div {...primitiveProps} />
}

SelectViewport.displayName = VIEWPORT_NAME

function SelectGroup(props: ScopedProps<SelectGroupProps>): FictNode {
  const primitiveProps = mergeProps(
    { role: 'group' },
    prop(() => props as Record<string, unknown>),
    { __scopeSelect: undefined },
  )
  return <Primitive.div {...primitiveProps} />
}

SelectGroup.displayName = GROUP_NAME

function SelectLabel(props: ScopedProps<SelectLabelProps>): FictNode {
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
    },
  )
  return <Primitive.div {...primitiveProps} />
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
  const itemProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      __scopeSelect: undefined,
      value: undefined,
    },
  )
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
        data-value={prop(() => props.value)}
        disabled={() =>
          props.disabled === undefined
            ? undefined
            : Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>))
        }
        onSelect={(event) => {
          if (disabled()) {
            event.preventDefault()
            return
          }

          context.onValueChange(props.value)
          context.onOpenChange(false)
        }}
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
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
      ref: undefined,
    },
  )

  useLayoutEffect(() => {
    const itemText = ref.current
    if (!itemText) return

    const syncText = () => {
      const text = itemText.textContent ?? ''
      rootContext.registerItemText(itemContext.value(), text)
      if (itemContext.selected()) {
        rootContext.setSelectedText(text)
      }
    }

    syncText()

    const observer = new MutationObserver(syncText)
    observer.observe(itemText, { characterData: true, childList: true, subtree: true })

    return () => observer.disconnect()
  })

  return (
    <Primitive.span
      {...primitiveProps}
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
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
    },
  )

  return (
    <Presence present={itemContext.selected}>
      <Primitive.span {...primitiveProps} />
    </Presence>
  )
}

SelectItemIndicator.displayName = ITEM_INDICATOR_NAME

function SelectScrollUpButton(props: ScopedProps<SelectScrollUpButtonProps>): FictNode {
  const primitiveProps = mergeProps(
    { type: 'button' },
    prop(() => props as Record<string, unknown>),
    { __scopeSelect: undefined },
  )
  return <Primitive.button {...primitiveProps} />
}

SelectScrollUpButton.displayName = SCROLL_UP_BUTTON_NAME

function SelectScrollDownButton(props: ScopedProps<SelectScrollDownButtonProps>): FictNode {
  const primitiveProps = mergeProps(
    { type: 'button' },
    prop(() => props as Record<string, unknown>),
    { __scopeSelect: undefined },
  )
  return <Primitive.button {...primitiveProps} />
}

SelectScrollDownButton.displayName = SCROLL_DOWN_BUTTON_NAME

function SelectSeparator(props: ScopedProps<SelectSeparatorProps>): FictNode {
  if (isStaticTextScan()) {
    return null
  }

  const menuScope = useMenuScope(props.__scopeSelect)
  const separatorProps = mergeProps(
    menuScope,
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
    },
  )
  return <MenuSeparator {...separatorProps} />
}

SelectSeparator.displayName = SEPARATOR_NAME

function SelectArrow(props: ScopedProps<SelectArrowProps>): FictNode {
  const menuScope = useMenuScope(props.__scopeSelect)
  const arrowProps = mergeProps(
    menuScope,
    prop(() => props as Record<string, unknown>),
    {
      __scopeSelect: undefined,
    },
  )
  return <MenuArrow {...arrowProps} />
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
