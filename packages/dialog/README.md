# @fictjs/dialog

Dialog primitives for Fict, modeled after `@radix-ui/react-dialog`. A modal window overlaid on the page, with focus trapping, scroll locking, and accessible labelling.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/dialog fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Dialog from '@fictjs/dialog'

export function Example() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>Edit profile</Dialog.Title>
          <Dialog.Description>Make changes to your profile here.</Dialog.Description>
          <Dialog.Close>Save</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

## Anatomy

- **`Dialog.Root`** (`Root`) — `open` / `defaultOpen`, `onOpenChange`, `modal` (defaults to `true`).
- **`Dialog.Trigger`** (`Trigger`), **`Dialog.Portal`** (`Portal`), **`Dialog.Overlay`** (`Overlay`), **`Dialog.Content`** (`Content`), **`Dialog.Close`** (`Close`).
- **`Dialog.Title`** (`Title`), **`Dialog.Description`** (`Description`) — provide the accessible name/description; dev warnings fire if they are missing.

`WarningProvider` lets you customize/suppress the accessibility dev warnings. Parts expose `data-state` (`"open"` / `"closed"`).

## Exports

- **Components:** `Dialog` (`Root`), `DialogTrigger` (`Trigger`), `DialogPortal` (`Portal`), `DialogOverlay` (`Overlay`), `DialogContent` (`Content`), `DialogTitle` (`Title`), `DialogDescription` (`Description`), `DialogClose` (`Close`), `WarningProvider`, `createDialogScope`.
- **Types:** `DialogProps`, `DialogTriggerProps`, `DialogPortalProps`, `DialogOverlayProps`, `DialogContentProps`, `DialogTitleProps`, `DialogDescriptionProps`, `DialogCloseProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Dialog docs](https://www.radix-ui.com/primitives/docs/components/dialog) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
