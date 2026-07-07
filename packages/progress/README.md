# @fictjs/progress

Progress primitives for Fict, modeled after `@radix-ui/react-progress`. An accessible progress bar with `role="progressbar"` and the correct ARIA attributes.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/progress fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Progress from '@fictjs/progress'

export function Example() {
  return (
    <Progress.Root value={60} max={100}>
      <Progress.Indicator style={{ transform: 'translateX(-40%)' }} />
    </Progress.Root>
  )
}
```

## Anatomy

- **`Progress.Root`** (`Root`) — `value` (`number | null`), `max` (defaults to `100`), `getValueLabel`.
- **`Progress.Indicator`** (`Indicator`) — the visual fill; style it from the value.

Parts expose `data-state` (`"indeterminate"` / `"loading"` / `"complete"`), `data-value`, and `data-max`.

## Exports

- **Components:** `Progress` (`Root`), `ProgressIndicator` (`Indicator`), `createProgressScope`.
- **Types:** `ProgressProps`, `ProgressIndicatorProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Progress docs](https://www.radix-ui.com/primitives/docs/components/progress) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
