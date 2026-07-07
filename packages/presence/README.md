# @fictjs/presence

Presence primitive for Fict, modeled after `@radix-ui/react-presence`. Keeps an element mounted until its exit animation/transition finishes, enabling enter/exit animations on conditionally-rendered content.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block used by primitives with mount/unmount animations (dialogs, popovers, collapsible content, etc.). Also re-exported from [`@fictjs/radix-ui/internal`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui).

## Installation

```bash
pnpm add @fictjs/presence fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import { Presence } from '@fictjs/presence'

// `present` is an accessor; the child stays mounted through its exit animation.
function Content({ open }: { open: () => boolean }) {
  return (
    <Presence present={() => open()}>
      <div class="content" />
    </Presence>
  )
}
```

## API

- **`Presence`** (`Root`) — `present` (a boolean or accessor). Renders its child while present and waits for any running CSS animation/transition to complete before unmounting. Also supports a function child that receives `{ present }`.

## Exports

- **Components:** `Presence` (`Root`).
- **Types:** `PresenceProps`.

## Documentation

The API mirrors `@radix-ui/react-presence`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
