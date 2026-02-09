import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { read } from '../../internal/accessor'
import { useId } from '../../internal/ids'
import { createControllableState } from '../../internal/state'
import type { MaybeAccessor } from '../../internal/types'
import { Primitive } from '../core/primitive'

type DateLike = Date | string | null | undefined

function toDate(value: DateLike): Date | null {
  if (value === null || value === undefined) return null
  const next = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  return Number.isNaN(next.getTime()) ? null : next
}

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function normalizeMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function clampWeekday(value: number): number {
  if (!Number.isFinite(value)) return 0
  const next = Math.floor(value)
  if (next < 0) return 0
  if (next > 6) return 6
  return next
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return a === b
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function addMonths(month: Date, offset: number): Date {
  return normalizeMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1))
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function resolveDate(value: MaybeAccessor<DateLike>): Date | null {
  const next = toDate(read(value, undefined))
  return next ? normalizeDate(next) : null
}

function buildVisibleDays(month: Date, weekStartsOn: number): Date[] {
  const firstOfMonth = normalizeMonth(month)
  const firstWeekday = firstOfMonth.getDay()
  const offset = (firstWeekday - weekStartsOn + 7) % 7
  const start = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1 - offset)

  return Array.from({ length: 42 }, (_, index) => normalizeDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)))
}

function weekdayLabels(locale: string, format: 'narrow' | 'short' | 'long', weekStartsOn: number): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format })
  const start = new Date(2026, 0, 4) // Sunday
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + ((weekStartsOn + index) % 7))
    return formatter.format(day)
  })
}

export interface CalendarRootProps {
  id?: string
  value?: MaybeAccessor<DateLike>
  defaultValue?: DateLike
  onValueChange?: (value: Date | null) => void
  month?: MaybeAccessor<DateLike>
  defaultMonth?: DateLike
  onMonthChange?: (month: Date) => void
  locale?: MaybeAccessor<string>
  weekStartsOn?: MaybeAccessor<number>
  weekdayFormat?: MaybeAccessor<'narrow' | 'short' | 'long'>
  showOutsideDays?: MaybeAccessor<boolean>
  disabled?: (date: Date) => boolean
  children?: FictNode
  [key: string]: unknown
}

export interface CalendarHeaderProps {
  children?: FictNode
  [key: string]: unknown
}

export interface CalendarTitleProps {
  children?: FictNode
  [key: string]: unknown
}

export interface CalendarNavButtonProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface CalendarGridProps {
  showOutsideDays?: MaybeAccessor<boolean>
  onDaySelect?: (day: Date, event: MouseEvent) => void
  children?: FictNode
  [key: string]: unknown
}

interface CalendarContextValue {
  baseId: string
  gridId: string
  value: () => Date | null
  setValue: (value: Date | null) => void
  month: () => Date
  setMonth: (month: Date) => void
  locale: () => string
  weekStartsOn: () => number
  weekdayFormat: () => 'narrow' | 'short' | 'long'
  showOutsideDays: () => boolean
  disabled: (date: Date) => boolean
}

const CalendarContext = createContext<CalendarContextValue | null>(null)

function useCalendarContext(component: string): CalendarContextValue {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error(`${component} must be used inside CalendarRoot`)
  }
  return context
}

export function CalendarRoot(props: CalendarRootProps): FictNode {
  const initialValue = toDate(props.defaultValue)
  const initialMonth = normalizeMonth(toDate(props.defaultMonth) ?? initialValue ?? new Date())
  const baseId = useId(props.id, 'calendar')

  const valueState = createControllableState<Date | null>({
    value: props.value === undefined ? undefined : (() => resolveDate(props.value as MaybeAccessor<DateLike>)),
    defaultValue: initialValue ? normalizeDate(initialValue) : null,
    onChange: props.onValueChange,
    equals: (a, b) => isSameDay(a, b),
  })

  const monthState = createControllableState<Date>({
    value:
      props.month === undefined
        ? undefined
        : (() => {
            const next = toDate(read(props.month as MaybeAccessor<DateLike>, undefined))
            return normalizeMonth(next ?? initialMonth)
          }),
    defaultValue: initialMonth,
    onChange: props.onMonthChange,
    equals: (a, b) => isSameMonth(a, b),
  })

  const context: CalendarContextValue = {
    baseId,
    gridId: `${baseId}-grid`,
    value: () => valueState.get(),
    setValue: value => valueState.set(value ? normalizeDate(value) : null),
    month: () => normalizeMonth(monthState.get()),
    setMonth: month => monthState.set(normalizeMonth(month)),
    locale: () => read(props.locale, 'en-US'),
    weekStartsOn: () => clampWeekday(read(props.weekStartsOn, 0)),
    weekdayFormat: () => read(props.weekdayFormat, 'short'),
    showOutsideDays: () => read(props.showOutsideDays, true),
    disabled: date => props.disabled?.(normalizeDate(date)) ?? false,
  }

  const defaultChildren = [
    {
      type: CalendarHeader,
      props: {
        children: [
          { type: CalendarPrevButton, props: { 'data-calendar-prev-button': '', children: 'Prev' } },
          { type: CalendarTitle, props: {} },
          { type: CalendarNextButton, props: { 'data-calendar-next-button': '', children: 'Next' } },
        ],
      },
    },
    { type: CalendarGrid, props: {} },
  ]

  return {
    type: CalendarContext.Provider,
    props: {
      value: context,
      children: {
        type: 'div',
        props: {
          ...props,
          id: baseId,
          value: undefined,
          defaultValue: undefined,
          onValueChange: undefined,
          month: undefined,
          defaultMonth: undefined,
          onMonthChange: undefined,
          locale: undefined,
          weekStartsOn: undefined,
          weekdayFormat: undefined,
          showOutsideDays: undefined,
          disabled: undefined,
          'data-calendar-root': '',
          children: props.children ?? defaultChildren,
        },
      },
    },
  } as unknown as FictNode
}

export const Calendar = CalendarRoot

export function CalendarHeader(props: CalendarHeaderProps): FictNode {
  return {
    type: 'div',
    props: {
      ...props,
      'data-calendar-header': '',
      children: props.children,
    },
  }
}

export function CalendarTitle(props: CalendarTitleProps): FictNode {
  const context = useCalendarContext('CalendarTitle')

  return {
    type: 'span',
    props: {
      ...props,
      'data-calendar-title': '',
      children:
        props.children ??
        (() =>
          new Intl.DateTimeFormat(context.locale(), {
            month: 'long',
            year: 'numeric',
          }).format(context.month())),
    },
  }
}

export function CalendarPrevButton(props: CalendarNavButtonProps): FictNode {
  const context = useCalendarContext('CalendarPrevButton')
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    'aria-controls': context.gridId,
    'data-calendar-prev': '',
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      if (event.defaultPrevented) return
      context.setMonth(addMonths(context.month(), -1))
    },
    children: props.children ?? 'Prev',
  })
}

export function CalendarNextButton(props: CalendarNavButtonProps): FictNode {
  const context = useCalendarContext('CalendarNextButton')
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    'aria-controls': context.gridId,
    'data-calendar-next': '',
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      if (event.defaultPrevented) return
      context.setMonth(addMonths(context.month(), 1))
    },
    children: props.children ?? 'Next',
  })
}

export function CalendarGrid(props: CalendarGridProps): FictNode {
  const context = useCalendarContext('CalendarGrid')

  return {
    type: 'div',
    props: {
      ...props,
      showOutsideDays: undefined,
      onDaySelect: undefined,
      id: props.id ?? context.gridId,
      role: 'grid',
      'data-calendar-grid': '',
      children: () => {
        const month = context.month()
        const weekStartsOn = context.weekStartsOn()
        const showOutside = read(props.showOutsideDays, context.showOutsideDays())
        const labels = weekdayLabels(context.locale(), context.weekdayFormat(), weekStartsOn)
        const days = buildVisibleDays(month, weekStartsOn)

        const header = {
          type: 'div',
          props: {
            role: 'row',
            'data-calendar-weekdays': '',
            children: labels.map((label, index) => ({
              type: 'span',
              props: {
                role: 'columnheader',
                'data-calendar-weekday': index,
                children: label,
              },
            })),
          },
        }

        const rows = Array.from({ length: 6 }, (_, weekIndex) => {
          const start = weekIndex * 7
          const weekDays = days.slice(start, start + 7)

          return {
            type: 'div',
            props: {
              role: 'row',
              'data-calendar-week': weekIndex,
              children: weekDays.map(day => {
                const key = formatDateKey(day)
                const outsideMonth = !isSameMonth(day, month)
                const selected = isSameDay(context.value(), day)
                const disabled = context.disabled(day)

                if (!showOutside && outsideMonth) {
                  return {
                    type: 'span',
                    props: {
                      role: 'gridcell',
                      'data-calendar-day-placeholder': key,
                      'aria-hidden': 'true',
                      children: '',
                    },
                  }
                }

                return {
                  type: 'button',
                  props: {
                    type: 'button',
                    role: 'gridcell',
                    'aria-selected': selected,
                    disabled,
                    'data-calendar-day': key,
                    'data-state': selected ? 'selected' : 'idle',
                    'data-outside-month': outsideMonth ? 'true' : undefined,
                    onClick: (event: MouseEvent) => {
                      ;(props.onDaySelect as ((day: Date, event: MouseEvent) => void) | undefined)?.(day, event)
                      if (event.defaultPrevented || disabled) return
                      context.setValue(day)
                      context.setMonth(day)
                    },
                    children: String(day.getDate()),
                  },
                }
              }),
            },
          }
        })

        return [header, ...rows]
      },
    },
  }
}
