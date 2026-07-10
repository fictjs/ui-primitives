# @fictjs/use-effect-event

Stable event callback wrapper for Fict, modeled after `@radix-ui/react-use-effect-event` (React's `useEffectEvent`). Returns a function with a stable identity that always calls the latest callback — useful for event handlers referenced from effects.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/use-effect-event fict
```

## Usage

```ts
import { prop } from 'fict'
import { useEffectEvent } from '@fictjs/use-effect-event'

const onChange = useEffectEvent<(value: string) => void>(prop(() => props.onChange))
// `onChange` never changes identity, but always invokes the current props.onChange
```

## API

- **`useEffectEvent(callback)`** — returns a stable function that forwards to `callback`. A direct callback is retained as provided; when a parent can replace it, pass a Fict signal, computed value, or `prop(() => callback)` so each invocation reads the current callback. An undefined current callback is a no-op.

## Exports

- **Values:** `useEffectEvent`.

## Documentation

The API mirrors `@radix-ui/react-use-effect-event`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
