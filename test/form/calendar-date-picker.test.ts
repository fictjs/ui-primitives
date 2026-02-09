import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  CalendarRoot,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerValue,
} from '../../src/components/form'

function dateKey(value: Date | null): string {
  if (!value) return ''
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

describe('Calendar and DatePicker', () => {
  it('selects calendar day and emits onValueChange', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const changes: string[] = []

    const dispose = render(
      () => ({
        type: CalendarRoot,
        props: {
          defaultMonth: new Date(2026, 0, 1),
          defaultValue: new Date(2026, 0, 10),
          onValueChange: (value: Date | null) => changes.push(dateKey(value)),
        },
      }),
      container,
    )

    const day = container.querySelector('[data-calendar-day="2026-01-15"]') as HTMLElement
    fireEvent.click(day)
    await Promise.resolve()
    const selectedDay = container.querySelector('[data-calendar-day="2026-01-15"]') as HTMLElement

    expect(changes).toEqual(['2026-01-15'])
    expect(selectedDay.getAttribute('data-state')).toBe('selected')

    dispose()
    container.remove()
  })

  it('navigates calendar month with prev/next controls', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: CalendarRoot,
        props: {
          defaultMonth: new Date(2026, 0, 1),
        },
      }),
      container,
    )

    const title = () => container.querySelector('[data-calendar-title]')?.textContent ?? ''

    expect(title()).toContain('January')
    fireEvent.click(container.querySelector('[data-calendar-next]') as HTMLElement)
    await Promise.resolve()
    expect(title()).toContain('February')

    fireEvent.click(container.querySelector('[data-calendar-prev]') as HTMLElement)
    await Promise.resolve()
    expect(title()).toContain('January')

    dispose()
    container.remove()
  })

  it('selects date from date picker calendar and closes content', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const changes: string[] = []

    const dispose = render(
      () => ({
        type: DatePickerRoot,
        props: {
          defaultOpen: true,
          onValueChange: (value: Date | null) => changes.push(dateKey(value)),
          children: [
            {
              type: DatePickerTrigger,
              props: {
                'data-testid': 'date-trigger',
                children: {
                  type: DatePickerValue,
                  props: { placeholder: 'Pick date' },
                },
              },
            },
            {
              type: DatePickerContent,
              props: {
                portal: false,
                children: {
                  type: DatePickerCalendar,
                  props: {
                    defaultMonth: new Date(2026, 0, 1),
                  },
                },
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-calendar-day="2026-01-20"]') as HTMLElement)
    await Promise.resolve()

    expect(changes).toEqual(['2026-01-20'])
    expect(container.querySelector('[data-date-picker-content]')).toBeNull()

    dispose()
    container.remove()
  })
})
