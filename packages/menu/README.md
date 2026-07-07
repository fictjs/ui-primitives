# @fictjs/menu

Menu primitives for Fict, modeled after `@radix-ui/react-menu`. The shared, low-level menu behavior that powers `@fictjs/dropdown-menu`, `@fictjs/context-menu`, and `@fictjs/menubar`.

Part of [`ui-primitives`](https://github.com/fictjs/ui-primitives), a port of [Radix Primitives](https://www.radix-ui.com/primitives) to [Fict](https://github.com/fictjs).

> This is an internal building block. Prefer the higher-level menu packages (`@fictjs/dropdown-menu`, `@fictjs/context-menu`, `@fictjs/menubar`) unless you are composing a new menu-based primitive. It is also re-exported from [`@fictjs/radix-ui/internal`](https://github.com/fictjs/ui-primitives/tree/main/packages/radix-ui).

## Installation

```bash
pnpm add @fictjs/menu fict
```

## Anatomy

Provides the primitives that build a menu surface: **`Root`**, **`Anchor`**, **`Portal`**, **`Content`**, **`Group`**, **`Label`**, **`Item`**, **`CheckboxItem`**, **`RadioGroup`**, **`RadioItem`**, **`ItemIndicator`**, **`Separator`**, **`Arrow`**, and the submenu parts **`Sub`**, **`SubTrigger`**, **`SubContent`**. Handles keyboard navigation, typeahead, focus management, and collision-aware positioning (via `@fictjs/popper`).

## Exports

- **Components:** `Menu` (`Root`), `MenuAnchor` (`Anchor`), `MenuPortal` (`Portal`), `MenuContent` (`Content`), `MenuGroup` (`Group`), `MenuLabel` (`Label`), `MenuItem` (`Item`), `MenuCheckboxItem` (`CheckboxItem`), `MenuRadioGroup` (`RadioGroup`), `MenuRadioItem` (`RadioItem`), `MenuItemIndicator` (`ItemIndicator`), `MenuSeparator` (`Separator`), `MenuArrow` (`Arrow`), `MenuSub` (`Sub`), `MenuSubTrigger` (`SubTrigger`), `MenuSubContent` (`SubContent`), `createMenuScope`.
- **Types:** the matching `*Props` for every component above.

## Documentation

The API mirrors `@radix-ui/react-menu`. See the [`ui-primitives` overview](https://github.com/fictjs/ui-primitives#readme) and the [architecture guide](https://github.com/fictjs/ui-primitives/blob/main/docs/ARCHITECTURE.md) for the Fict-specific reactivity model.

## License

[MIT](https://github.com/fictjs/ui-primitives/blob/main/LICENSE) © Fict contributors.
