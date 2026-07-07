# @fictjs/rect

Rectangle observation utility for Fict, modeled after `@radix-ui/rect`. Efficiently observes an element's bounding rectangle and notifies you when it changes, using a single shared `requestAnimationFrame` loop.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Low-level utility. For a reactive accessor in components, prefer [`@fictjs/use-rect`](https://github.com/fictjs/ui-primitives/tree/main/packages/use-rect).

## Installation

```bash
pnpm add @fictjs/rect
```

## Usage

```ts
import { observeElementRect } from '@fictjs/rect'

const unobserve = observeElementRect(element, (rect) => {
  console.log(rect.width, rect.height)
})

// later
unobserve()
```

## API

- **`observeElementRect(element, callback)`** — invokes `callback` with the element's `DOMRect` whenever it changes; returns an unobserve function. Observations share one rAF loop that stops when the last observer is removed.

## Exports

- **Values:** `observeElementRect`.
- **Types:** `Measurable`.

## Documentation

The API mirrors `@radix-ui/rect`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md).

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
