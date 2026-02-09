# Calendar

Headless date grid primitive with month navigation and controlled/uncontrolled value.

## Components

- `CalendarRoot` (alias: `Calendar`)
- `CalendarHeader`
- `CalendarTitle`
- `CalendarPrevButton`
- `CalendarNextButton`
- `CalendarGrid`

## Key APIs

- `value/defaultValue/onValueChange` for selected day
- `month/defaultMonth/onMonthChange` for visible month
- `showOutsideDays`, `weekStartsOn`, `weekdayFormat`, `locale`
- `disabled?: (date: Date) => boolean` to block specific dates

## Minimal Example

```tsx
import { CalendarRoot } from '@fictjs/ui-primitives'

<CalendarRoot
  defaultMonth={new Date(2026, 0, 1)}
  onValueChange={date => console.log(date)}
/>
```

## Accessibility Notes

- Calendar grid uses `role="grid"` / `role="gridcell"` with `aria-selected`.
- Keep day labels and surrounding form labels explicit for screen-reader context.
