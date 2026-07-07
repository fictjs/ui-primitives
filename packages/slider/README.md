# @fictjs/slider

Slider primitives for Fict, modeled after `@radix-ui/react-slider`. An input for selecting a value or range from a given range, with full keyboard support.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/slider fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Slider from '@fictjs/slider'

export function Example() {
  return (
    <Slider.Root defaultValue={[50]} min={0} max={100} step={1}>
      <Slider.Track>
        <Slider.Range />
      </Slider.Track>
      <Slider.Thumb />
    </Slider.Root>
  )
}
```

## Anatomy

- **`Slider.Root`** (`Root`) — `value` / `defaultValue` (`number[]`), `onValueChange`, `onValueCommit`, `min`, `max`, `step`, `minStepsBetweenThumbs`, `orientation`, `dir`, `inverted`, `disabled`, `name`.
- **`Slider.Track`** (`Track`) + **`Slider.Range`** (`Range`) — the rail and the filled portion.
- **`Slider.Thumb`** (`Thumb`) — render one per value for range sliders.

Parts expose `data-orientation`, `data-disabled`, and `data-state`.

## Exports

- **Components:** `Slider` (`Root`), `SliderTrack` (`Track`), `SliderRange` (`Range`), `SliderThumb` (`Thumb`), `createSliderScope`.
- **Types:** `SliderProps`, `SliderTrackProps`, `SliderRangeProps`, `SliderThumbProps`.

## Documentation

The API mirrors Radix, so the upstream [Radix Slider docs](https://www.radix-ui.com/primitives/docs/components/slider) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
