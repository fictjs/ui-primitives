# @fictjs/avatar

Avatar primitives for Fict, modeled after `@radix-ui/react-avatar`. An image element with a graceful fallback while the image loads or when it fails.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

## Installation

```bash
pnpm add @fictjs/avatar fict
```

## Usage

```tsx
/** @jsxImportSource fict */
import * as Avatar from '@fictjs/avatar'

export function Example() {
  return (
    <Avatar.Root>
      <Avatar.Image src="/user.jpg" alt="Jane Doe" />
      <Avatar.Fallback delayMs={600}>JD</Avatar.Fallback>
    </Avatar.Root>
  )
}
```

## Anatomy

- **`Avatar.Root`** (`Root`) — wraps the image and fallback.
- **`Avatar.Image`** (`Image`) — `src`, `alt`, `onLoadingStatusChange`. Only renders once the image has loaded.
- **`Avatar.Fallback`** (`Fallback`) — `delayMs` to avoid a flash for fast connections. Rendered until the image loads.

The loading lifecycle is exposed through the `ImageLoadingStatus` type (`"idle" | "loading" | "loaded" | "error"`).

## Exports

- **Components:** `Avatar` (`Root`), `AvatarImage` (`Image`), `AvatarFallback` (`Fallback`), `createAvatarScope`.
- **Types:** `AvatarProps`, `AvatarImageProps`, `AvatarFallbackProps`, `ImageLoadingStatus`.

## Documentation

The API mirrors Radix, so the upstream [Radix Avatar docs](https://www.radix-ui.com/primitives/docs/components/avatar) apply. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
