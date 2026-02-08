import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { Primitive } from '../core/primitive'
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
  type CollapsibleContentProps,
  type CollapsibleTriggerProps,
} from './collapsible'

export interface AccordionRootProps {
  type?: 'single' | 'multiple'
  value?: string | string[] | (() => string | string[])
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  collapsible?: boolean
  children?: FictNode
}

export interface AccordionItemProps {
  value: string
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

interface AccordionContextValue {
  type: () => 'single' | 'multiple'
  values: () => string[]
  toggle: (value: string) => void
}

interface AccordionItemContextValue {
  value: string
  open: () => boolean
}

const AccordionContext = createContext<AccordionContextValue | null>(null)
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

function useAccordionContext(component: string): AccordionContextValue {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error(`${component} must be used inside AccordionRoot`)
  }
  return context
}

function useAccordionItemContext(component: string): AccordionItemContextValue {
  const context = useContext(AccordionItemContext)
  if (!context) {
    throw new Error(`${component} must be used inside AccordionItem`)
  }
  return context
}

function normalize(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export function AccordionRoot(props: AccordionRootProps): FictNode {
  const type = props.type ?? 'single'
  const initialValues = normalize(props.defaultValue)

  const valuesState = createControllableState<string[]>({
    value:
      props.value === undefined
        ? undefined
        : typeof props.value === 'function'
          ? (() => normalize((props.value as () => string | string[])()))
          : normalize(props.value as string | string[]),
    defaultValue: initialValues,
    onChange: next => {
      props.onValueChange?.(type === 'single' ? (next[0] ?? '') : next)
    },
  })

  const context: AccordionContextValue = {
    type: () => type,
    values: () => valuesState.get(),
    toggle: value => {
      const current = valuesState.get()
      const exists = current.includes(value)

      if (type === 'single') {
        if (exists) {
          if (props.collapsible ?? false) {
            valuesState.set([])
          }
          return
        }
        valuesState.set([value])
        return
      }

      if (exists) {
        valuesState.set(current.filter(item => item !== value))
      } else {
        valuesState.set([...current, value])
      }
    },
  }

  return {
    type: AccordionContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function AccordionItem(props: AccordionItemProps): FictNode {
  const accordion = useAccordionContext('AccordionItem')
  const tag = props.as ?? 'div'

  const itemContext: AccordionItemContextValue = {
    value: props.value,
    open: () => accordion.values().includes(props.value),
  }

  return {
    type: AccordionItemContext.Provider,
    props: {
      value: itemContext,
      children: {
        type: CollapsibleRoot,
        props: {
          open: () => itemContext.open(),
          onOpenChange: (open: boolean) => {
            const shouldOpen = open
            if (shouldOpen !== itemContext.open()) {
              accordion.toggle(props.value)
            }
          },
          children: Primitive({
            ...props,
            value: undefined,
            as: tag,
            'data-accordion-item': props.value,
            'data-state': () => (itemContext.open() ? 'open' : 'closed'),
            children: props.children,
          }),
        },
      },
    },
  } as unknown as FictNode
}

export function AccordionTrigger(props: CollapsibleTriggerProps): FictNode {
  useAccordionContext('AccordionTrigger')
  useAccordionItemContext('AccordionTrigger')

  return {
    type: CollapsibleTrigger,
    props,
  }
}

export function AccordionContent(props: CollapsibleContentProps): FictNode {
  return {
    type: CollapsibleContent,
    props,
  }
}
