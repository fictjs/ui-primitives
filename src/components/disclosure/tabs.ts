import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { useId } from '../../internal/ids'
import { Primitive } from '../core/primitive'
import { RovingFocusGroup } from '../interaction/roving-focus'

export interface TabsRootProps {
  id?: string
  value?: string | (() => string)
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  children?: FictNode
}

export interface TabsListProps {
  children?: FictNode
  [key: string]: unknown
}

export interface TabsTriggerProps {
  value: string
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface TabsContentProps {
  value: string
  forceMount?: boolean
  children?: FictNode
  [key: string]: unknown
}

interface TabsContextValue {
  value: () => string
  setValue: (value: string) => void
  orientation: () => 'horizontal' | 'vertical'
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error(`${component} must be used inside TabsRoot`)
  }
  return context
}

export function TabsRoot(props: TabsRootProps): FictNode {
  const valueState = createControllableState<string>({
    value: props.value,
    defaultValue: props.defaultValue ?? '',
    onChange: props.onValueChange,
  })
  const baseId = useId(props.id, 'tabs')

  const context: TabsContextValue = {
    value: () => valueState.get(),
    setValue: value => valueState.set(value),
    orientation: () => props.orientation ?? 'horizontal',
    baseId,
  }

  return {
    type: TabsContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function TabsList(props: TabsListProps): FictNode {
  const context = useTabsContext('TabsList')

  return {
    type: 'div',
    props: {
      ...props,
      role: 'tablist',
      'aria-orientation': () => context.orientation(),
      'data-tabs-list': '',
      children: {
        type: RovingFocusGroup,
        props: {
          orientation: () => context.orientation(),
          loop: true,
          children: props.children,
        },
      },
    },
  }
}

export function TabsTrigger(props: TabsTriggerProps): FictNode {
  const context = useTabsContext('TabsTrigger')
  const tag = props.as ?? 'button'

  const selected = () => context.value() === props.value

  return Primitive({
    ...props,
    as: tag,
    value: undefined,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    role: 'tab',
    id: `${context.baseId}-trigger-${props.value}`,
    'aria-controls': `${context.baseId}-content-${props.value}`,
    'aria-selected': selected,
    'data-state': () => (selected() ? 'active' : 'inactive'),
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      if (!event.defaultPrevented) {
        context.setValue(props.value)
      }
    },
    children: props.children,
  })
}

export function TabsContent(props: TabsContentProps): FictNode {
  const context = useTabsContext('TabsContent')

  return {
    type: 'div',
    props: {
      'data-tabs-content-wrapper': props.value,
      children: () =>
        context.value() === props.value || props.forceMount
          ? {
              type: 'div',
              props: {
                ...props,
                value: undefined,
                forceMount: undefined,
                role: 'tabpanel',
                id: `${context.baseId}-content-${props.value}`,
                'aria-labelledby': `${context.baseId}-trigger-${props.value}`,
                'data-state': () => (context.value() === props.value ? 'active' : 'inactive'),
                'data-tabs-content': props.value,
                children: props.children,
              },
            }
          : null,
    },
  }
}
