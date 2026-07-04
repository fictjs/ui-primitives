import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'

import { createCollection } from '@fictjs/collection'
import { type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import {
  Collapsible as CollapsibleRoot,
  CollapsibleContent as CollapsibleContentPrimitive,
  CollapsibleTrigger as CollapsibleTriggerPrimitive,
  createCollapsibleScope,
  type CollapsibleContentProps as CollapsibleContentPrimitiveProps,
  type CollapsibleProps as CollapsibleRootProps,
  type CollapsibleTriggerProps as CollapsibleTriggerPrimitiveProps,
} from '@fictjs/collapsible'
import { useId } from '@fictjs/id'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'

type MaybeAccessor<T> = T | (() => T)
type Orientation = 'horizontal' | 'vertical'
type ScopedProps<P> = P & { __scopeAccordion?: Scope }
type AccordionTriggerElement = HTMLButtonElement
type StyleRecord = Record<string, string | number>

const ACCORDION_NAME = 'Accordion'
const ACCORDION_KEYS = ['Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'] as const
const ITEM_NAME = 'AccordionItem'
const HEADER_NAME = 'AccordionHeader'
const TRIGGER_NAME = 'AccordionTrigger'
const CONTENT_NAME = 'AccordionContent'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [Collection, useCollection, createCollectionScope] =
  createCollection<AccordionTriggerElement>(ACCORDION_NAME)
const [createAccordionContext, createAccordionScope] = createContextScope(ACCORDION_NAME, [
  createCollectionScope,
  createCollapsibleScope,
])
const useCollapsibleScope = createCollapsibleScope()

type AccordionValueContextValue = {
  value: () => string[]
  onItemOpen(value: string): void
  onItemClose(value: string): void
}

type AccordionCollapsibleContextValue = {
  collapsible: () => boolean
}

type AccordionImplContextValue = {
  disabled: () => boolean
  dir: () => Direction
  orientation: () => Orientation
}

type AccordionItemContextValue = {
  open: () => boolean
  disabled: () => boolean
  triggerId: () => string
}

const [AccordionValueProvider, useAccordionValueContext] =
  createAccordionContext<AccordionValueContextValue>(ACCORDION_NAME)
const [AccordionCollapsibleProvider, useAccordionCollapsibleContext] =
  createAccordionContext<AccordionCollapsibleContextValue>(ACCORDION_NAME, {
    collapsible: () => false,
  })
const [AccordionImplProvider, useAccordionContext] =
  createAccordionContext<AccordionImplContextValue>(ACCORDION_NAME)
const [AccordionItemProvider, useAccordionItemContext] =
  createAccordionContext<AccordionItemContextValue>(ITEM_NAME)

type AccordionImplProps = JSX.IntrinsicElements['div'] & {
  disabled?: MaybeAccessor<boolean | undefined>
  orientation?: MaybeAccessor<Orientation | undefined>
  dir?: MaybeAccessor<Direction | undefined>
}

type AccordionImplSingleProps = AccordionImplProps & {
  value?: MaybeAccessor<string | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
  collapsible?: MaybeAccessor<boolean | undefined>
}

type AccordionImplMultipleProps = AccordionImplProps & {
  value?: MaybeAccessor<string[] | undefined>
  defaultValue?: MaybeAccessor<string[] | undefined>
  onValueChange?: (value: string[]) => void
}

type AccordionSingleProps = AccordionImplSingleProps & {
  type: 'single'
}

type AccordionMultipleProps = AccordionImplMultipleProps & {
  type: 'multiple'
}

type AccordionItemProps = Omit<CollapsibleRootProps, 'defaultOpen' | 'onOpenChange' | 'open'> & {
  disabled?: MaybeAccessor<boolean | undefined>
  value: string
}

type AccordionHeaderProps = JSX.IntrinsicElements['h3'] & {
  asChild?: boolean
}

type AccordionTriggerProps = CollapsibleTriggerPrimitiveProps
type AccordionContentProps = CollapsibleContentPrimitiveProps

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

function readStyle(value: MaybeAccessor<unknown> | undefined): StyleRecord {
  const resolved = value === undefined ? undefined : readValue(value)

  if (!resolved || typeof resolved !== 'object' || Array.isArray(resolved)) {
    return {}
  }

  return resolved as StyleRecord
}

function getState(open?: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed'
}

function Accordion(props: ScopedProps<AccordionSingleProps | AccordionMultipleProps>): FictNode {
  const { type, ...accordionProps } = props

  return (
    <Collection.Provider scope={props.__scopeAccordion}>
      {type === 'multiple' ? (
        <AccordionImplMultiple {...(accordionProps as ScopedProps<AccordionImplMultipleProps>)} />
      ) : (
        <AccordionImplSingle {...(accordionProps as ScopedProps<AccordionImplSingleProps>)} />
      )}
    </Collection.Provider>
  )
}

Accordion.displayName = ACCORDION_NAME

function AccordionImplSingle(props: ScopedProps<AccordionImplSingleProps>): FictNode {
  const collapsible = () =>
    Boolean(readValue(props.collapsible as MaybeAccessor<boolean | undefined>) ?? false)
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
    caller: ACCORDION_NAME,
    ...(props.onValueChange ? { onChange: props.onValueChange } : {}),
  })
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      collapsible: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      type: undefined,
      value: undefined,
    },
  )

  return (
    <AccordionValueProvider
      scope={props.__scopeAccordion as Scope<AccordionValueContextValue | undefined>}
      value={() => {
        const currentValue = value()
        return currentValue ? [currentValue] : []
      }}
      onItemClose={() => {
        if (collapsible()) {
          setValue('')
        }
      }}
      onItemOpen={setValue}
    >
      <AccordionCollapsibleProvider
        scope={props.__scopeAccordion as Scope<AccordionCollapsibleContextValue | undefined>}
        collapsible={collapsible}
      >
        <AccordionImpl {...(primitiveProps as ScopedProps<AccordionImplProps>)} />
      </AccordionCollapsibleProvider>
    </AccordionValueProvider>
  )
}

function AccordionImplMultiple(props: ScopedProps<AccordionImplMultipleProps>): FictNode {
  const valueProp = () =>
    props.value === undefined
      ? undefined
      : readValue(props.value as MaybeAccessor<string[] | undefined>)
  const defaultValue = () =>
    props.defaultValue === undefined
      ? []
      : (readValue(props.defaultValue as MaybeAccessor<string[] | undefined>) ?? [])
  const [value, setValue] = useControllableState<string[]>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: ACCORDION_NAME,
    ...(props.onValueChange ? { onChange: props.onValueChange } : {}),
  })
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      defaultValue: undefined,
      onValueChange: undefined,
      type: undefined,
      value: undefined,
    },
  )

  return (
    <AccordionValueProvider
      scope={props.__scopeAccordion as Scope<AccordionValueContextValue | undefined>}
      value={value}
      onItemClose={(itemValue) => {
        setValue((previousValue) => previousValue.filter((value) => value !== itemValue))
      }}
      onItemOpen={(itemValue) => {
        setValue((previousValue) =>
          previousValue.includes(itemValue) ? previousValue : [...previousValue, itemValue],
        )
      }}
    >
      <AccordionCollapsibleProvider
        scope={props.__scopeAccordion as Scope<AccordionCollapsibleContextValue | undefined>}
        collapsible={() => true}
      >
        <AccordionImpl {...(primitiveProps as ScopedProps<AccordionImplProps>)} />
      </AccordionCollapsibleProvider>
    </AccordionValueProvider>
  )
}

function AccordionImpl(props: ScopedProps<AccordionImplProps>): FictNode {
  const inheritedDirection = useDirection()
  const getItems = useCollection(props.__scopeAccordion)
  const disabled = () =>
    Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const orientation = () =>
    props.orientation === undefined
      ? 'vertical'
      : ((readValue(props.orientation as MaybeAccessor<Orientation | undefined>) ??
          'vertical') as Orientation)
  const dir = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const handleKeyDown = composeEventHandlers<KeyboardEvent>(
    props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
    (event) => {
      if (!ACCORDION_KEYS.includes(event.key as (typeof ACCORDION_KEYS)[number])) {
        return
      }

      const target = event.target as HTMLElement | null
      const triggerCollection = getItems().filter((item) => !item.ref.current?.disabled)
      const triggerIndex = triggerCollection.findIndex((item) => item.ref.current === target)
      const triggerCount = triggerCollection.length

      if (triggerIndex === -1 || triggerCount === 0) {
        return
      }

      event.preventDefault()

      let nextIndex = triggerIndex
      const homeIndex = 0
      const endIndex = triggerCount - 1
      const moveNext = () => {
        nextIndex = triggerIndex + 1
        if (nextIndex > endIndex) {
          nextIndex = homeIndex
        }
      }
      const movePrev = () => {
        nextIndex = triggerIndex - 1
        if (nextIndex < homeIndex) {
          nextIndex = endIndex
        }
      }

      switch (event.key) {
        case 'Home':
          nextIndex = homeIndex
          break
        case 'End':
          nextIndex = endIndex
          break
        case 'ArrowRight':
          if (orientation() === 'horizontal') {
            if (dir() === 'ltr') {
              moveNext()
            } else {
              movePrev()
            }
          }
          break
        case 'ArrowDown':
          if (orientation() === 'vertical') {
            moveNext()
          }
          break
        case 'ArrowLeft':
          if (orientation() === 'horizontal') {
            if (dir() === 'ltr') {
              movePrev()
            } else {
              moveNext()
            }
          }
          break
        case 'ArrowUp':
          if (orientation() === 'vertical') {
            movePrev()
          }
          break
      }

      triggerCollection[nextIndex]?.ref.current?.focus()
    },
  )
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeAccordion: undefined,
      dir: undefined,
      disabled: undefined,
      orientation: undefined,
      'data-orientation': prop(orientation),
      onKeyDown: disabled() ? undefined : handleKeyDown,
    },
  )

  return (
    <AccordionImplProvider
      scope={props.__scopeAccordion as Scope<AccordionImplContextValue | undefined>}
      disabled={disabled}
      dir={dir}
      orientation={orientation}
    >
      <Collection.Slot scope={props.__scopeAccordion}>
        <Primitive.div {...primitiveProps} />
      </Collection.Slot>
    </AccordionImplProvider>
  )
}

function AccordionItem(props: ScopedProps<AccordionItemProps>): FictNode {
  const { __scopeAccordion, value, ...accordionItemProps } = props
  const accordionContext = useAccordionContext(
    ITEM_NAME,
    __scopeAccordion as Scope<AccordionImplContextValue | undefined>,
  )
  const valueContext = useAccordionValueContext(
    ITEM_NAME,
    __scopeAccordion as Scope<AccordionValueContextValue | undefined>,
  )
  const collapsibleScope = useCollapsibleScope(__scopeAccordion)
  const triggerId = useId()
  const open = () => valueContext.value().includes(value)
  const disabled = () =>
    accordionContext.disabled() ||
    Boolean(readValue(props.disabled as MaybeAccessor<boolean | undefined>) ?? false)
  const rootProps = mergeProps<Record<string, unknown>>(
    {
      'data-orientation': prop(accordionContext.orientation),
      'data-state': prop(() => getState(open())),
    },
    collapsibleScope,
    prop(() => accordionItemProps as Record<string, unknown>),
    {
      disabled: prop(disabled),
      open,
      onOpenChange: (nextOpen: boolean) => {
        if (nextOpen) {
          valueContext.onItemOpen(value)
        } else {
          valueContext.onItemClose(value)
        }
      },
    },
  )

  return (
    <AccordionItemProvider
      scope={__scopeAccordion as Scope<AccordionItemContextValue | undefined>}
      disabled={disabled}
      open={open}
      triggerId={triggerId}
    >
      <CollapsibleRoot {...(rootProps as Record<string, unknown>)} />
    </AccordionItemProvider>
  )
}

AccordionItem.displayName = ITEM_NAME

function AccordionHeader(props: ScopedProps<AccordionHeaderProps>): FictNode {
  const { __scopeAccordion, ...headerProps } = props
  const accordionContext = useAccordionContext(
    HEADER_NAME,
    __scopeAccordion as Scope<AccordionImplContextValue | undefined>,
  )
  const itemContext = useAccordionItemContext(
    HEADER_NAME,
    __scopeAccordion as Scope<AccordionItemContextValue | undefined>,
  )
  const primitiveProps = mergeProps<Record<string, unknown>>(
    {
      'data-orientation': prop(accordionContext.orientation),
      'data-state': prop(() => getState(itemContext.open())),
      'data-disabled': prop(() => (itemContext.disabled() ? '' : undefined)),
    },
    prop(() => headerProps as Record<string, unknown>),
  )

  return <Primitive.h3 {...primitiveProps} />
}

AccordionHeader.displayName = HEADER_NAME

function AccordionTrigger(props: ScopedProps<AccordionTriggerProps>): FictNode {
  const { __scopeAccordion, ...triggerProps } = props
  const accordionContext = useAccordionContext(
    TRIGGER_NAME,
    __scopeAccordion as Scope<AccordionImplContextValue | undefined>,
  )
  const itemContext = useAccordionItemContext(
    TRIGGER_NAME,
    __scopeAccordion as Scope<AccordionItemContextValue | undefined>,
  )
  const collapsibleContext = useAccordionCollapsibleContext(
    TRIGGER_NAME,
    __scopeAccordion as Scope<AccordionCollapsibleContextValue | undefined>,
  )
  const collapsibleScope = useCollapsibleScope(__scopeAccordion)
  const primitiveProps = mergeProps<Record<string, unknown>>(
    {
      'aria-disabled': prop(() =>
        itemContext.open() && !collapsibleContext.collapsible() ? 'true' : undefined,
      ),
      'data-orientation': prop(accordionContext.orientation),
      id: prop(itemContext.triggerId),
    },
    collapsibleScope,
    prop(() => triggerProps as Record<string, unknown>),
  )

  return (
    <Collection.ItemSlot
      scope={__scopeAccordion}
      ref={props.ref as PossibleRef<AccordionTriggerElement>}
    >
      <CollapsibleTriggerPrimitive {...(primitiveProps as Record<string, unknown>)} />
    </Collection.ItemSlot>
  )
}

AccordionTrigger.displayName = TRIGGER_NAME

function AccordionContent(props: ScopedProps<AccordionContentProps>): FictNode {
  const { __scopeAccordion, ...contentProps } = props
  const accordionContext = useAccordionContext(
    CONTENT_NAME,
    __scopeAccordion as Scope<AccordionImplContextValue | undefined>,
  )
  const itemContext = useAccordionItemContext(
    CONTENT_NAME,
    __scopeAccordion as Scope<AccordionItemContextValue | undefined>,
  )
  const collapsibleScope = useCollapsibleScope(__scopeAccordion)
  const primitiveProps = mergeProps<Record<string, unknown>>(
    {
      role: 'region',
      'aria-labelledby': prop(itemContext.triggerId),
      'data-orientation': prop(accordionContext.orientation),
    },
    collapsibleScope,
    prop(() => contentProps as Record<string, unknown>),
    {
      style: prop(() => ({
        '--radix-accordion-content-height': 'var(--radix-collapsible-content-height)',
        '--radix-accordion-content-width': 'var(--radix-collapsible-content-width)',
        ...readStyle(contentProps.style as MaybeAccessor<unknown> | undefined),
      })),
    },
  )

  return <CollapsibleContentPrimitive {...(primitiveProps as Record<string, unknown>)} />
}

AccordionContent.displayName = CONTENT_NAME

const Root = Accordion
const Item = AccordionItem
const Header = AccordionHeader
const Trigger = AccordionTrigger
const Content = AccordionContent

export {
  createAccordionScope,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
  Root,
  Item,
  Header,
  Trigger,
  Content,
}

export type {
  AccordionSingleProps,
  AccordionMultipleProps,
  AccordionItemProps,
  AccordionHeaderProps,
  AccordionTriggerProps,
  AccordionContentProps,
}
