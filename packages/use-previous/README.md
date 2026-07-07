# @fictjs/use-previous

Previous-value accessor for Fict, modeled after `@radix-ui/react-use-previous`. Tracks the previous value of a reactive input across updates.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/use-previous fict
```

## Usage

```ts
import { usePrevious } from '@fictjs/use-previous'

const previousValue = usePrevious(() => value())
// previousValue() returns the value from before the latest change
```

## API

- **`usePrevious(value)`** — accepts a value or accessor and returns an accessor (`() => T | undefined`) for the value prior to the most recent change.

## Exports

- **Values:** `usePrevious`.

## Documentation

The API mirrors `@radix-ui/react-use-previous`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
