# Popover

Floating, dismissable content anchored to a trigger.

## Components

- `PopoverRoot`
- `PopoverTrigger`
- `PopoverContent`
- `PopoverClose`

## Minimal Example

```tsx
import { PopoverRoot, PopoverTrigger, PopoverContent, PopoverClose } from '@fictjs/ui-primitives'

<PopoverRoot>
  <PopoverTrigger>Open filters</PopoverTrigger>
  <PopoverContent side="bottom" align="start">
    Filter options
    <PopoverClose>Close</PopoverClose>
  </PopoverContent>
</PopoverRoot>
```

## Accessibility Notes

- Popover content should expose an appropriate role (`dialog` by default in this implementation).
- Provide a deterministic close action in addition to outside dismissal.
