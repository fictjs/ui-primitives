import { mergeProps, prop, type FictNode, type JSX } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { useId } from '@fictjs/id'
import { Presence } from '@fictjs/presence'
import { Primitive } from '@fictjs/primitive'
import { createRovingFocusGroupScope } from '@fictjs/roving-focus'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type Orientation = 'horizontal' | 'vertical'
type ActivationMode = 'automatic' | 'manual'
type ScopedProps<P> = P & { __scopeTabs?: Scope }
type StyleRecord = Record<string, string | number>

const TABS_NAME = 'Tabs'
const LIST_NAME = 'TabsList'
const TRIGGER_NAME = 'TabsTrigger'
const CONTENT_NAME = 'TabsContent'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [createTabsContext, createTabsScope] = createContextScope(TABS_NAME, [
  createRovingFocusGroupScope,
])

type TabsContextValue = {
  baseId: () => string
  value: () => string
  onValueChange(value: string): void
  orientation: () => Orientation
  dir: () => Direction
  activationMode: () => ActivationMode
}

const [TabsProvider, useTabsContext] = createTabsContext<TabsContextValue>(TABS_NAME)

type TabsProps = JSX.IntrinsicElements['div'] & {
  value?: MaybeAccessor<string | undefined>
  defaultValue?: MaybeAccessor<string | undefined>
  onValueChange?: (value: string) => void
  orientation?: MaybeAccessor<Orientation | undefined>
  dir?: MaybeAccessor<Direction | undefined>
  activationMode?: MaybeAccessor<ActivationMode | undefined>
}

type TabsListProps = JSX.IntrinsicElements['div'] & {
  loop?: MaybeAccessor<boolean | undefined>
}

type TabsTriggerProps = JSX.IntrinsicElements['button'] & {
  value: string
}

type TabsContentProps = JSX.IntrinsicElements['div'] & {
  value: string
  forceMount?: MaybeAccessor<boolean | undefined>
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

function readStyle(value: MaybeAccessor<unknown> | undefined): StyleRecord {
  const resolved = value === undefined ? undefined : readValue(value)

  if (!resolved || typeof resolved !== 'object' || Array.isArray(resolved)) {
    return {}
  }

  return resolved as StyleRecord
}

function getDirectionAwareKey(key: string, dir: Direction) {
  if (dir !== 'rtl') return key
  return key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key
}

function getState(isSelected: boolean): 'active' | 'inactive' {
  return isSelected ? 'active' : 'inactive'
}

function makeTriggerId(baseId: string, value: string) {
  return `${baseId}-trigger-${value}`
}

function makeContentId(baseId: string, value: string) {
  return `${baseId}-content-${value}`
}

function Tabs(props: ScopedProps<TabsProps>): FictNode {
  const inheritedDirection = useDirection()
  const baseId = useId()
  const valueProp = () =>
    props.value === undefined ? undefined : readValue(props.value as MaybeAccessor<string | undefined>)
  const defaultValue = () =>
    props.defaultValue === undefined
      ? ''
      : (readValue(props.defaultValue as MaybeAccessor<string | undefined>) ?? '')
  const orientation = () =>
    props.orientation === undefined
      ? 'horizontal'
      : ((readValue(props.orientation as MaybeAccessor<Orientation | undefined>) ??
          'horizontal') as Orientation)
  const dir = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const activationMode = () =>
    props.activationMode === undefined
      ? 'automatic'
      : ((readValue(props.activationMode as MaybeAccessor<ActivationMode | undefined>) ??
          'automatic') as ActivationMode)
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: TABS_NAME,
    ...(props.onValueChange ? { onChange: props.onValueChange } : {}),
  })
  const primitiveProps = mergeProps(
    {
      dir: prop(dir),
      'data-orientation': prop(orientation),
    },
    () => props as Record<string, unknown>,
    {
      __scopeTabs: undefined,
      activationMode: undefined,
      defaultValue: undefined,
      dir: undefined,
      onValueChange: undefined,
      orientation: undefined,
      value: undefined,
    },
  )

  return (
    <TabsProvider
      scope={props.__scopeTabs as Scope<TabsContextValue | undefined>}
      activationMode={activationMode}
      baseId={baseId}
      dir={dir}
      onValueChange={setValue}
      orientation={orientation}
      value={value}
    >
      <Primitive.div {...primitiveProps} />
    </TabsProvider>
  )
}

Tabs.displayName = TABS_NAME

function TabsList(props: ScopedProps<TabsListProps>): FictNode {
  const { __scopeTabs, loop, ...listProps } = props
  const context = useTabsContext(LIST_NAME, __scopeTabs as Scope<TabsContextValue | undefined>)
  const shouldLoop = () =>
    loop === undefined ? true : Boolean(readValue(loop as MaybeAccessor<boolean | undefined>) ?? true)
  const handleKeyDown = composeEventHandlers<KeyboardEvent>(
    props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
    (event) => {
      const target = event.target as HTMLElement | null
      if (!target || target.getAttribute('role') !== 'tab') {
        return
      }

      const key = getDirectionAwareKey(event.key, context.dir())
      const triggers = Array.from(
        (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'),
      )
      const currentIndex = triggers.indexOf(target)
      if (currentIndex === -1) {
        return
      }

      let nextIndex = currentIndex
      if (key === 'Home') {
        nextIndex = 0
      } else if (key === 'End') {
        nextIndex = triggers.length - 1
      } else if (context.orientation() === 'horizontal' && key === 'ArrowRight') {
        nextIndex = currentIndex + 1
      } else if (context.orientation() === 'horizontal' && key === 'ArrowLeft') {
        nextIndex = currentIndex - 1
      } else if (context.orientation() === 'vertical' && key === 'ArrowDown') {
        nextIndex = currentIndex + 1
      } else if (context.orientation() === 'vertical' && key === 'ArrowUp') {
        nextIndex = currentIndex - 1
      } else {
        return
      }

      event.preventDefault()
      if (shouldLoop()) {
        nextIndex = (nextIndex + triggers.length) % triggers.length
      } else {
        nextIndex = Math.max(0, Math.min(nextIndex, triggers.length - 1))
      }

      triggers[nextIndex]?.focus()
    },
  )
  const primitiveProps = mergeProps(
    {
      role: 'tablist',
      'aria-orientation': prop(context.orientation),
    },
    () => listProps as Record<string, unknown>,
    {
      onKeyDown: handleKeyDown,
    },
  )

  return <Primitive.div {...primitiveProps} />
}

TabsList.displayName = LIST_NAME

function TabsTrigger(props: ScopedProps<TabsTriggerProps>): FictNode {
  const { __scopeTabs, value, disabled = false, ...triggerProps } = props
  const context = useTabsContext(TRIGGER_NAME, __scopeTabs as Scope<TabsContextValue | undefined>)
  const triggerId = () => makeTriggerId(context.baseId(), value)
  const contentId = () => makeContentId(context.baseId(), value)
  const isDisabled = () => Boolean(readValue(disabled as MaybeAccessor<boolean | undefined>))
  const isSelected = () => value === context.value()
  const primitiveProps = mergeProps(
    {
      type: 'button',
      role: 'tab',
      'aria-selected': prop(() => (isSelected() ? 'true' : 'false')),
      'aria-controls': prop(contentId),
      'data-state': prop(() => getState(isSelected())),
      'data-disabled': prop(() => (isDisabled() ? '' : undefined)),
      disabled: prop(isDisabled),
      id: prop(triggerId),
      tabIndex: prop(() => (isSelected() ? 0 : -1)),
    },
    () => triggerProps as Record<string, unknown>,
    {
      onMouseDown: composeEventHandlers<MouseEvent>(
        props.onMouseDown as ((event: MouseEvent) => void) | undefined,
        (event) => {
          if (!isDisabled() && event.button === 0 && event.ctrlKey === false) {
            context.onValueChange(value)
          } else {
            event.preventDefault()
          }
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        props.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            context.onValueChange(value)
          }
        },
      ),
      onFocus: composeEventHandlers<FocusEvent>(
        props.onFocus as ((event: FocusEvent) => void) | undefined,
        () => {
          if (
            !isSelected() &&
            !isDisabled() &&
            context.activationMode() === 'automatic'
          ) {
            context.onValueChange(value)
          }
        },
      ),
    },
  )

  return <Primitive.button {...primitiveProps} />
}

TabsTrigger.displayName = TRIGGER_NAME

function TabsContent(props: ScopedProps<TabsContentProps>): FictNode {
  const { __scopeTabs, value, forceMount, children, ...contentProps } = props
  const context = useTabsContext(CONTENT_NAME, __scopeTabs as Scope<TabsContextValue | undefined>)
  const triggerId = () => makeTriggerId(context.baseId(), value)
  const contentId = () => makeContentId(context.baseId(), value)
  const isSelected = () => value === context.value()
  const isMountAnimationPrevented = createSignal(isSelected())

  useLayoutEffect(() => {
    const rafId = requestAnimationFrame(() => {
      isMountAnimationPrevented(false)
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  })

  return (
    <Presence
      present={() =>
        Boolean(
          (forceMount === undefined
            ? false
            : readValue(forceMount as MaybeAccessor<boolean | undefined>)) || isSelected(),
        )
      }
    >
      {({ present }) => {
        const primitiveProps = mergeProps(
          {
            'data-state': prop(() => getState(isSelected())),
            'data-orientation': prop(context.orientation),
            role: 'tabpanel',
            'aria-labelledby': prop(triggerId),
            hidden: prop(() => !present),
            id: prop(contentId),
            tabIndex: 0,
            style: prop(() => ({
              animationDuration: isMountAnimationPrevented() ? '0s' : undefined,
              ...readStyle(contentProps.style as MaybeAccessor<unknown> | undefined),
            })),
            children: prop(() => (present ? children : null)),
          },
          () => contentProps as Record<string, unknown>,
        )

        return <Primitive.div {...primitiveProps} />
      }}
    </Presence>
  )
}

TabsContent.displayName = CONTENT_NAME

const Root = Tabs
const List = TabsList
const Trigger = TabsTrigger
const Content = TabsContent

export {
  createTabsScope,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Root,
  List,
  Trigger,
  Content,
}

export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps }
