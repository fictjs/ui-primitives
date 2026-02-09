import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { read } from '../../internal/accessor'
import { useId } from '../../internal/ids'
import { createControllableState } from '../../internal/state'
import type { MaybeAccessor } from '../../internal/types'
import {
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  type PopoverContentPropsExt,
} from '../overlay/popover'
import { CalendarRoot, type CalendarRootProps } from './calendar'

type DateLike = Date | string | null | undefined

function toDate(value: DateLike): Date | null {
  if (value === null || value === undefined) return null
  const next = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  return Number.isNaN(next.getTime()) ? null : next
}

function sameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return a === b
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

interface DatePickerContextValue {
  baseId: string
  value: () => Date | null
  setValue: (value: Date | null) => void
  open: () => boolean
  setOpen: (open: boolean) => void
  locale: () => string
}

export interface DatePickerRootProps {
  id?: string
  value?: MaybeAccessor<DateLike>
  defaultValue?: DateLike
  onValueChange?: (value: Date | null) => void
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  locale?: MaybeAccessor<string>
  children?: FictNode
}

export interface DatePickerTriggerProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface DatePickerValueProps {
  placeholder?: string
  locale?: string
  formatOptions?: Intl.DateTimeFormatOptions
  children?: FictNode
  [key: string]: unknown
}

export interface DatePickerContentProps extends PopoverContentPropsExt {
  closeOnSelect?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface DatePickerCalendarProps
  extends Omit<CalendarRootProps, 'value' | 'defaultValue' | 'onValueChange' | 'locale'> {
  closeOnSelect?: boolean
  locale?: MaybeAccessor<string>
  onValueChange?: (value: Date | null) => void
  children?: FictNode
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null)

function useDatePickerContext(component: string): DatePickerContextValue {
  const context = useContext(DatePickerContext)
  if (!context) {
    throw new Error(`${component} must be used inside DatePickerRoot`)
  }
  return context
}

export function DatePickerRoot(props: DatePickerRootProps): FictNode {
  const baseId = useId(props.id, 'date-picker')

  const valueState = createControllableState<Date | null>({
    value:
      props.value === undefined
        ? undefined
        : (() => {
            const next = toDate(read(props.value as MaybeAccessor<DateLike>, undefined))
            return next ? new Date(next.getFullYear(), next.getMonth(), next.getDate()) : null
          }),
    defaultValue: toDate(props.defaultValue),
    onChange: props.onValueChange,
    equals: (a, b) => sameDay(a, b),
  })

  const openState = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  const context: DatePickerContextValue = {
    baseId,
    value: () => valueState.get(),
    setValue: value => valueState.set(value),
    open: () => openState.get(),
    setOpen: open => openState.set(open),
    locale: () => read(props.locale, 'en-US'),
  }

  return {
    type: DatePickerContext.Provider,
    props: {
      value: context,
      children: {
        type: PopoverRoot,
        props: {
          id: baseId,
          open: () => context.open(),
          onOpenChange: (open: boolean) => context.setOpen(open),
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function DatePickerTrigger(props: DatePickerTriggerProps): FictNode {
  return {
    type: PopoverTrigger,
    props: {
      ...props,
      'data-date-picker-trigger': '',
      children: props.children ?? { type: DatePickerValue, props: {} },
    },
  }
}

export function DatePickerValue(props: DatePickerValueProps): FictNode {
  const context = useDatePickerContext('DatePickerValue')

  return {
    type: 'span',
    props: {
      ...props,
      locale: undefined,
      formatOptions: undefined,
      placeholder: undefined,
      'data-date-picker-value': '',
      children:
        props.children ??
        (() => {
          const value = context.value()
          if (!value) {
            return props.placeholder ?? ''
          }
          return new Intl.DateTimeFormat(props.locale ?? context.locale(), props.formatOptions ?? { dateStyle: 'medium' }).format(value)
        }),
    },
  }
}

export function DatePickerContent(props: DatePickerContentProps): FictNode {
  const context = useDatePickerContext('DatePickerContent')

  return {
    type: PopoverContent,
    props: {
      ...props,
      closeOnSelect: undefined,
      id: props.id ?? `${context.baseId}-content`,
      role: props.role ?? 'dialog',
      'data-date-picker-content': '',
      children:
        props.children ??
        ({
          type: DatePickerCalendar,
          props: {
            closeOnSelect: props.closeOnSelect,
          },
        } as FictNode),
    },
  }
}

export function DatePickerCalendar(props: DatePickerCalendarProps): FictNode {
  const context = useDatePickerContext('DatePickerCalendar')

  return {
    type: CalendarRoot,
    props: {
      ...props,
      closeOnSelect: undefined,
      locale: props.locale ?? context.locale,
      value: () => context.value(),
      onValueChange: (value: Date | null) => {
        props.onValueChange?.(value)
        context.setValue(value)
        if ((props.closeOnSelect ?? true) && value) {
          context.setOpen(false)
        }
      },
      'data-date-picker-calendar': '',
      children: props.children,
    },
  }
}
