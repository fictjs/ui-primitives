# Tooltip

Hover/focus tooltip primitives with open delay.

## Components

- `TooltipProvider`
- `TooltipRoot`
- `TooltipTrigger`
- `TooltipContent`

## Minimal Example

```tsx
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from '@fictjs/ui-primitives'

<TooltipProvider delayDuration={200}>
  <TooltipRoot>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent side="top">Helpful hint</TooltipContent>
  </TooltipRoot>
</TooltipProvider>
```

## Accessibility Notes

- Tooltip text should supplement, not replace, the control's accessible name.
- Keep tooltip content short and avoid interactive controls inside tooltip surfaces.
