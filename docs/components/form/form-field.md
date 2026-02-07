# Form Field Structure

Semantic form field primitives.

## Components

- `Form`
- `FormField`
- `FormLabel`
- `FormControl`
- `FormDescription`
- `FormMessage`

## Minimal Example

```tsx
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@fictjs/ui-primitives'

<Form>
  <FormField name="email">
    <FormLabel>Email</FormLabel>
    <FormControl as="input" type="email" required />
    <FormDescription>Use your work email.</FormDescription>
    <FormMessage>Invalid email format.</FormMessage>
  </FormField>
</Form>
```

## Accessibility Notes

- `FormLabel` and `FormControl` id wiring is automatic; avoid overriding ids unless necessary.
- Keep `FormMessage` contextual and specific because it is announced with alert semantics.
