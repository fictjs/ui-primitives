# @fictjs/announce

Live-region announcement primitive for Fict. Renders content inline and mirrors it into a shared ARIA live region so screen readers announce dynamic updates, without you having to manage the live region yourself.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> Internal building block for accessible announcements (used by primitives such as Toast).

## Installation

```bash
pnpm add @fictjs/announce fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Announce from '@fictjs/announce'

export function Example() {
  return <Announce.Root type="polite">Message sent</Announce.Root>
}
```

## Anatomy

- **`Announce.Root`** (`Root`) — renders its children in place and copies them into a shared, visually hidden live region.
  - `type` — `"polite" | "assertive" | "off"` (defaults to `"polite"`); drives the `aria-live` value.
  - `role` — `"status" | "alert" | "log" | "none"` (derived from `type` when omitted).
  - `aria-atomic`, `aria-relevant` — forwarded to the live region.
  - `regionIdentifier` — group announcements into a dedicated region.

Matching regions are reused across instances, and the region is downgraded to `off`/`none` while the document is hidden.

## Exports

- **Components:** `Announce` (`Root`).
- **Types:** `AnnounceProps`.

## Documentation

See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
