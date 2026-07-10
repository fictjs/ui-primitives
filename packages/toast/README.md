# @fictjs/toast

Toast primitives for Fict, modeled after `@radix-ui/react-toast`. A succinct, accessible message that appears temporarily, announced via an ARIA live region.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/toast fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Toast from '@fictjs/toast'

export function Example() {
  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root>
        <Toast.Title>Saved</Toast.Title>
        <Toast.Description>Your changes have been saved.</Toast.Description>
        <Toast.Action altText="Undo the save">Undo</Toast.Action>
        <Toast.Close>Dismiss</Toast.Close>
      </Toast.Root>
      <Toast.Viewport />
    </Toast.Provider>
  )
}
```

## Anatomy

- **`Toast.Provider`** (`Provider`) — `label`, `duration`, `swipeDirection`, `swipeThreshold`, `announcerContainer`. Wrap your app once.
- **`Toast.Viewport`** (`Viewport`) — the fixed region where toasts render.
- **`Toast.Root`** (`Root`) — `open` / `defaultOpen`, `onOpenChange`, `duration`, `type`, `forceMount`, escape/pause/resume and swipe event callbacks.
- **`Toast.Title`** (`Title`), **`Toast.Description`** (`Description`).
- **`Toast.Action`** (`Action`) — requires `altText`; **`Toast.Close`** (`Close`).

Supports swipe-to-dismiss and exposes `data-state`, `data-swipe`, and `data-swipe-direction`. Foreground toasts are announced assertively and background toasts politely; action `altText` is used only in the announcement while the visible action remains the button's accessible name.

## Exports

- **Components:** `ToastProvider` (`Provider`), `ToastViewport` (`Viewport`), `Toast` (`Root`), `ToastTitle` (`Title`), `ToastDescription` (`Description`), `ToastAction` (`Action`), `ToastClose` (`Close`), `createToastScope`.
- **Types:** `ToastProviderProps`, `ToastViewportProps`, `ToastProps`, `ToastTitleProps`, `ToastDescriptionProps`, `ToastActionProps`, `ToastCloseProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Toast docs](https://www.radix-ui.com/primitives/docs/components/toast) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
