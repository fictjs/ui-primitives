# Toast

Queued toast primitives with provider-managed lifecycle.

## Components / Hook

- `ToastProvider`
- `ToastViewport`
- `ToastRoot`
- `ToastTitle`
- `ToastDescription`
- `ToastAction`
- `ToastClose`
- `useToast()`

## Provider API

- `ToastProvider`
- `duration?: number` default timeout for queued toasts
- `useToast().show({ title, description, duration? })` enqueues a toast and returns `id`
- `useToast().dismiss(id)` removes a toast immediately

## Viewport Semantics

- `ToastViewport` renders queued toasts with `aria-live="polite"`
- Toasts auto-dismiss by duration (item duration overrides provider default)

## Toast Parts

- `ToastRoot` renders title/description and default close action
- `ToastAction` requires `altText` and maps it to accessible label
- `ToastClose` is a plain close button primitive for custom templates

## Minimal Example

```tsx
import { ToastProvider, ToastViewport, useToast } from '@fictjs/ui-primitives'

function SaveButton() {
  const toast = useToast()
  return (
    <button
      type="button"
      onClick={() => toast.show({ title: 'Saved', description: 'Changes synced.' })}
    >
      Save
    </button>
  )
}

<ToastProvider duration={3000}>
  <SaveButton />
  <ToastViewport />
</ToastProvider>
```

## Accessibility Notes

- Keep toast title/description concise so live-region announcements stay scannable.
- `ToastAction` must include meaningful `altText` for assistive technologies.
