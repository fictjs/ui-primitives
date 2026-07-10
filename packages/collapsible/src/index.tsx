import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useId } from '@fictjs/id'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type CollapsibleStyle = Record<string, string | number> | undefined
type ScopedProps<P> = P & { __scopeCollapsible?: Scope<CollapsibleContextValue | undefined> }
type StyleRecord = Record<string, string | number>

const COLLAPSIBLE_NAME = 'Collapsible'
const TRIGGER_NAME = 'CollapsibleTrigger'
const CONTENT_NAME = 'CollapsibleContent'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createCollapsibleContext, createCollapsibleScope] = createContextScope(COLLAPSIBLE_NAME)

type CollapsibleContextValue = {
  contentId: () => string
  disabled: () => boolean
  open: () => boolean
  onOpenToggle: () => void
}

const [CollapsibleProvider, useCollapsibleContext] =
  createCollapsibleContext<CollapsibleContextValue>(COLLAPSIBLE_NAME)

type CollapsibleProps = JSX.IntrinsicElements['div'] & {
  defaultOpen?: MaybeAccessor<boolean | undefined> | undefined
  open?: MaybeAccessor<boolean | undefined> | undefined
  disabled?: MaybeAccessor<boolean | undefined> | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
}

type CollapsibleTriggerProps = JSX.IntrinsicElements['button'] & {
  children?: FictNode | FictNode[]
}

type CollapsibleContentImplProps = JSX.IntrinsicElements['div'] & {
  present: MaybeAccessor<boolean>
}

type CollapsibleContentProps = Omit<CollapsibleContentImplProps, 'present'> & {
  forceMount?: MaybeAccessor<boolean | undefined> | undefined
}

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

function readStyle(value: MaybeAccessor<CollapsibleStyle> | undefined): StyleRecord {
  const resolved = value === undefined ? undefined : readValue(value)
  return typeof resolved === 'object' && resolved !== null ? (resolved as StyleRecord) : {}
}

function getState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed'
}

function Collapsible(props: ScopedProps<CollapsibleProps>): FictNode {
  const openProp = () =>
    props.open === undefined
      ? undefined
      : readValue(props.open as MaybeAccessor<boolean | undefined>)
  const defaultOpen = () =>
    props.defaultOpen === undefined
      ? false
      : (readValue(props.defaultOpen as MaybeAccessor<boolean | undefined>) ?? false)
  const disabled = () => Boolean(readValue(props.disabled as MaybeAccessor<unknown>))
  const contentId = useId()
  const controllableStateProps = {
    prop: openProp,
    defaultProp: defaultOpen,
    caller: COLLAPSIBLE_NAME,
    onChange: (nextOpen: boolean) => props.onOpenChange?.(nextOpen),
  }
  const [open, setOpen] = useControllableState<boolean>(controllableStateProps)
  const onOpenToggle = () => {
    if (disabled()) {
      return
    }

    setOpen((previousOpen) => !previousOpen)
  }
  const primitiveProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      __scopeCollapsible: undefined,
      defaultOpen: undefined,
      disabled: undefined,
      onOpenChange: undefined,
      open: undefined,
      'data-state': prop(() => getState(open())),
      'data-disabled': prop(() => (disabled() ? '' : undefined)),
    },
  )

  return (
    <CollapsibleProvider
      scope={props.__scopeCollapsible}
      contentId={contentId}
      disabled={disabled}
      onOpenToggle={onOpenToggle}
      open={open}
    >
      <Primitive.div {...primitiveProps} />
    </CollapsibleProvider>
  )
}

Collapsible.displayName = COLLAPSIBLE_NAME

function CollapsibleTrigger(props: ScopedProps<CollapsibleTriggerProps>): FictNode {
  const { __scopeCollapsible } = props
  const context = useCollapsibleContext(TRIGGER_NAME, __scopeCollapsible)
  const primitiveProps = mergeProps(
    {
      type: 'button',
      'aria-controls': prop(context.contentId),
      'aria-expanded': prop(() => String(context.open())),
      'data-state': prop(() => getState(context.open())),
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
      disabled: prop(context.disabled),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeCollapsible: undefined,
      onClick: composeEventHandlers<MouseEvent>(
        (event) => (props.onClick as ((event: MouseEvent) => void) | undefined)?.(event),
        () => {
          context.onOpenToggle()
        },
      ),
    },
  )

  return <Primitive.button {...primitiveProps} />
}

CollapsibleTrigger.displayName = TRIGGER_NAME

function CollapsibleContent(props: ScopedProps<CollapsibleContentProps>): FictNode {
  const context = useCollapsibleContext(CONTENT_NAME, props.__scopeCollapsible)
  const present = () =>
    Boolean(
      (props.forceMount === undefined ? false : readValue(props.forceMount)) || context.open(),
    )
  const contentProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      forceMount: undefined,
    },
  )

  return (
    <Presence present={present}>
      {({ present: isPresent }) => (
        <CollapsibleContentImpl
          {...(contentProps as unknown as ScopedProps<CollapsibleContentImplProps>)}
          present={isPresent}
        />
      )}
    </Presence>
  )
}

CollapsibleContent.displayName = CONTENT_NAME

function CollapsibleContentImpl(props: ScopedProps<CollapsibleContentImplProps>): FictNode {
  const { __scopeCollapsible } = props
  const context = useCollapsibleContext(CONTENT_NAME, __scopeCollapsible)
  const node = createSignal<HTMLDivElement | null>(null)
  const isPresent = createSignal(readValue(props.present))
  const height = createSignal<number | undefined>(undefined)
  const width = createSignal<number | undefined>(undefined)
  const composedRefs = useComposedRefs(props.ref as PossibleRef<HTMLDivElement>, (nextNode) =>
    node(nextNode),
  )
  const isOpen = () => context.open() || isPresent()
  let isMountAnimationPrevented = isOpen()
  let originalStyles: { transitionDuration: string; animationName: string } | undefined

  useLayoutEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      isMountAnimationPrevented = false
    })

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  })

  useLayoutEffect(() => {
    const currentNode = node()
    const nextPresent = readValue(props.present)
    const currentOpen = context.open()

    if (currentNode) {
      originalStyles = originalStyles ?? {
        transitionDuration: currentNode.style.transitionDuration,
        animationName: currentNode.style.animationName,
      }

      currentNode.style.transitionDuration = '0s'
      currentNode.style.animationName = 'none'

      const rect = currentNode.getBoundingClientRect()
      height(rect.height)
      width(rect.width)

      if (!isMountAnimationPrevented && originalStyles) {
        currentNode.style.transitionDuration = originalStyles.transitionDuration
        currentNode.style.animationName = originalStyles.animationName
      }

      isPresent(nextPresent)
    } else {
      isPresent(nextPresent)
    }

    void currentOpen
  })

  const primitiveProps = mergeProps(
    prop(() => props as unknown as Record<string, unknown>),
    {
      __scopeCollapsible: undefined,
      present: undefined,
      'data-state': prop(() => getState(context.open())),
      'data-disabled': prop(() => (context.disabled() ? '' : undefined)),
      hidden: prop(() => !isOpen()),
      id: prop(context.contentId),
      ref: undefined,
      style: prop(() => ({
        '--radix-collapsible-content-height': height() ? `${height()}px` : undefined,
        '--radix-collapsible-content-width': width() ? `${width()}px` : undefined,
        ...readStyle(props.style as MaybeAccessor<CollapsibleStyle> | undefined),
      })),
      children: prop(() => (isOpen() ? props.children : null)),
    },
  )

  return <Primitive.div {...primitiveProps} ref={composedRefs} />
}

const Root = Collapsible
const Trigger = CollapsibleTrigger
const Content = CollapsibleContent

export {
  createCollapsibleScope,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Root,
  Trigger,
  Content,
}
export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps }
