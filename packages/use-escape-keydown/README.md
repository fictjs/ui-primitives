# @fictjs/use-escape-keydown

Escape-key listener for Fict, modeled after `@radix-ui/react-use-escape-keydown`. Runs a callback when the user presses Escape, listening on the capture phase so overlays can react first.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/use-escape-keydown fict
```

## Usage

```ts
import { useEscapeKeydown } from '@fictjs/use-escape-keydown'

useEscapeKeydown((event) => {
  close()
})
```

## API

- **`useEscapeKeydown(onEscapeKeyDown, ownerDocument?)`** — attaches a capture-phase `keydown` listener that calls `onEscapeKeyDown` on Escape, and cleans it up automatically. `ownerDocument` defaults to `document`.

## Exports

- **Values:** `useEscapeKeydown`.

## Documentation

The API mirrors `@radix-ui/react-use-escape-keydown`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
