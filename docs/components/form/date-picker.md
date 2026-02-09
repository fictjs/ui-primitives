# DatePicker

Popover-based date picker composed from `Popover` + `Calendar`.

## Components

- `DatePickerRoot`
- `DatePickerTrigger`
- `DatePickerValue`
- `DatePickerContent`
- `DatePickerCalendar`

## Key APIs

- `DatePickerRoot`: `value/defaultValue/onValueChange`, `open/defaultOpen/onOpenChange`
- `DatePickerTrigger`: supports polymorphism and `asChild` through inherited popover trigger semantics
- `DatePickerContent`: `closeOnSelect` defaults to `true`
- `DatePickerCalendar`: forwards calendar options while binding to date-picker value/open state

## Minimal Example

```tsx
import {
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerValue,
  DatePickerContent,
  DatePickerCalendar,
} from '@fictjs/ui-primitives'

<DatePickerRoot>
  <DatePickerTrigger>
    <DatePickerValue placeholder="Pick a date" />
  </DatePickerTrigger>
  <DatePickerContent>
    <DatePickerCalendar />
  </DatePickerContent>
</DatePickerRoot>
```

## Accessibility Notes

- Trigger/content wiring is inherited from popover/dialog semantics.
- Keep explicit labels around date picker fields so users understand date context and format expectations.
