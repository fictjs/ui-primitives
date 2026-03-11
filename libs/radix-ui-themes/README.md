# @fictjs/radix-ui-themes

Radix Themes for Fict, built on top of `@fictjs/radix-ui`.

This package ports the upstream `@radix-ui/themes` design-token and styled component layer into
the `ui-primitives` workspace for Fict consumers. It keeps the CSS-first distribution model from
Radix Themes while swapping the runtime primitives to `@fictjs/radix-ui`.

## Install

```bash
pnpm add @fictjs/radix-ui-themes @fictjs/radix-ui fict
```

## CSS

Import the full stylesheet once near your app root:

```ts
import '@fictjs/radix-ui-themes/styles.css'
```

Available CSS entrypoints:

- `@fictjs/radix-ui-themes/styles.css`
- `@fictjs/radix-ui-themes/components.css`
- `@fictjs/radix-ui-themes/utilities.css`
- `@fictjs/radix-ui-themes/tokens.css`
- `@fictjs/radix-ui-themes/tokens/base.css`
- `@fictjs/radix-ui-themes/layout.css`
- `@fictjs/radix-ui-themes/layout/tokens.css`
- `@fictjs/radix-ui-themes/layout/components.css`
- `@fictjs/radix-ui-themes/layout/utilities.css`

## Usage

```tsx
/** @jsxImportSource fict */

import '@fictjs/radix-ui-themes/styles.css'

import { Button, Card, Flex, Text, Theme } from '@fictjs/radix-ui-themes'

export function App() {
  return (
    <Theme accentColor="teal" grayColor="slate" radius="large">
      <Card>
        <Flex direction="column" gap="3">
          <Text size="3">Hello from Fict Radix Themes.</Text>
          <Button>Continue</Button>
        </Flex>
      </Card>
    </Theme>
  )
}
```

## Theme

`Theme` is the root provider for tokens and component styling.

Supported theme props mirror the upstream package surface:

- `appearance`
- `accentColor`
- `grayColor`
- `panelBackground`
- `radius`
- `scaling`
- `hasBackground`

Nested themes are supported for localized overrides.

## Included Components

The package re-exports the same public component groups as the local ported source tree, including:

- layout: `Box`, `Flex`, `Grid`, `Container`, `Inset`, `Section`
- typography: `Text`, `Heading`, `Code`, `Kbd`, `Link`, `Quote`, `Blockquote`, `Em`, `Strong`
- controls: `Button`, `IconButton`, `TextField`, `TextArea`, `Checkbox`, `Radio`, `Switch`, `Select`, `Slider`
- overlays and menus: `Dialog`, `AlertDialog`, `Popover`, `HoverCard`, `ContextMenu`, `DropdownMenu`, `Tooltip`
- data display: `Badge`, `Avatar`, `Card`, `Table`, `DataList`, `Progress`, `Skeleton`, `Spinner`
- navigation: `Tabs`, `TabNav`, `SegmentedControl`, `CheckboxCards`, `RadioCards`, `CheckboxGroup`, `RadioGroup`
- utilities: `Portal`, `Slot`, `ScrollArea`, `Separator`, `Reset`, `VisuallyHidden`, `ThemePanel`

## Verification

Run from `ui-primitives/`:

```bash
pnpm --filter @fictjs/radix-ui-themes lint
pnpm --filter @fictjs/radix-ui-themes typecheck
pnpm --filter @fictjs/radix-ui-themes test
pnpm --filter @fictjs/radix-ui-themes build
```

## Notes

- `@radix-ui/colors` and `classnames` stay as production dependencies.
- The primitive layer is swapped from `radix-ui` to `@fictjs/radix-ui`.
- The package publishes compiled JS plus the generated CSS entrypoints listed above.
