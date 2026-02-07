# Accordion

Accordion primitives built on collapsible behavior.

## Components

- `AccordionRoot`
- `AccordionItem`
- `AccordionTrigger`
- `AccordionContent`

## Minimal Example

```tsx
import {
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@fictjs/ui-primitives'

<AccordionRoot type="single" defaultValue="account" collapsible>
  <AccordionItem value="account">
    <AccordionTrigger>Account</AccordionTrigger>
    <AccordionContent>Account details</AccordionContent>
  </AccordionItem>
</AccordionRoot>
```

## Accessibility Notes

- `AccordionTrigger` should remain a button-like control so `aria-expanded` semantics stay valid.
- Preserve heading hierarchy around triggers/content when embedding in structured pages.
