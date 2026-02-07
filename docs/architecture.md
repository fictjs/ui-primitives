# Architecture Notes

This document describes the design and implementation structure of `@fictjs/ui-primitives`.

## Goals

- Provide headless primitives with minimal assumptions about styling
- Keep accessibility and interaction semantics explicit and testable
- Support controlled and uncontrolled patterns consistently
- Compose small primitives into larger compound components

## Repository Structure

- `src/components/core`: foundational composition primitives
- `src/components/interaction`: focus, dismissal, positioning, live regions
- `src/components/overlay`: dialog/popover/tooltip/hover-card
- `src/components/menu`: dropdown/context/menubar patterns
- `src/components/disclosure`: tabs/accordion/collapsible/navigation menu
- `src/components/form`: form controls and structured field helpers
- `src/components/layout`: layout and visual utility primitives
- `src/internal`: shared internals used across components

## Core Implementation Patterns

### Compound component + context

Many features are implemented as root + parts using context.

Examples:

- `DialogRoot` + `DialogTrigger` + `DialogContent`
- `TabsRoot` + `TabsList` + `TabsTrigger` + `TabsContent`
- `SelectRoot` + `SelectTrigger` + `SelectContent` + `SelectItem`

### Controlled and uncontrolled state

Shared helper:

- `src/internal/state.ts` -> `createControllableState`

This ensures consistent behavior for `value/defaultValue/onChange` style APIs.

### Accessor-safe reads

Shared helper:

- `src/internal/accessor.ts` -> `read`

This unifies plain values and accessor functions (`T | () => T`) across props.

### Id and ref composition

Shared helpers:

- `src/internal/ids.ts` -> deterministic ids for aria wiring
- `src/internal/ref.ts` -> composed refs across parent and child consumers

## Interaction Stack Design

### Focus management

- `FocusScope` handles auto-focus, trap/loop behavior, and restore-focus semantics.
- Modal overlays use focus scoping as part of their lifecycle.

### Dismiss behavior

- `DismissableLayer` centralizes Escape, outside pointer, and outside focus dismissal.
- Only the top-most active layer can dismiss to avoid nested-layer conflicts.

### Positioning

- `PopperRoot`, `PopperAnchor`, and `PopperContent` provide anchor-based placement.
- Overlay and menu primitives compose on top of Popper where needed.

### Portal strategy

- `Portal` and `PortalHost` support default body portaling or scoped containers.
- Overlay components default to portal rendering but can opt into inline rendering.

## Accessibility Strategy

- Prefer native semantics first, then add ARIA for composite widgets.
- Maintain explicit state attributes (`aria-*`, `data-state`) for testability.
- Include keyboard/pointer parity for open/close and navigation behavior.
- Use live regions for async feedback (`Toast`, `LiveRegionProvider`).

See `docs/accessibility.md` for review checklist details.

## Testing Strategy

- Behavior-level tests live in `test/` (Vitest + JSDOM).
- Focus on state transitions, keyboard/pointer interactions, and semantic attributes.
- Avoid snapshot-only confidence; assert behavior and cleanup paths directly.

See `docs/testing.md` for contributor expectations.

## Demo and Baseline Screenshots

- Executable demo app lives in `examples/`.
- Automated baseline capture script lives in `scripts/capture-examples.mjs`.
- Baselines are stored in `examples/screenshots/baseline`.

This supports visual sanity checks alongside behavioral tests.
