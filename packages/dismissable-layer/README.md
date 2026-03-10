# @fictjs/dismissable-layer

Dismissable layer primitives for Fict UI primitives, modeled after `@radix-ui/react-dismissable-layer`.

Exports `DismissableLayer`, `DismissableLayerBranch`, and the matching `Root` / `Branch` aliases.

The Fict port keeps the Radix layering semantics, but capture handlers follow Fict event props:
use `oncapture:pointerdown`, `oncapture:focus`, and `oncapture:blur` instead of React's
`onPointerDownCapture`, `onFocusCapture`, and `onBlurCapture`.
