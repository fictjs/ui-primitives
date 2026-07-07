# @fictjs/use-layout-effect

SSR-safe layout effect for Fict, modeled after `@radix-ui/react-use-layout-effect`. Runs an effect after mount on the client and does nothing on the server, avoiding SSR warnings.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/use-layout-effect fict
```

## Usage

```ts
import { useLayoutEffect } from '@fictjs/use-layout-effect'

useLayoutEffect(() => {
  measure()
  return () => cleanup()
})
```

## API

- **`useLayoutEffect(effect)`** — on the client, runs `effect` after mount inside a reactive effect (and honors its returned cleanup); on the server (no `document`), it is a no-op.

## Exports

- **Values:** `useLayoutEffect`.

## Documentation

The API mirrors `@radix-ui/react-use-layout-effect`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
