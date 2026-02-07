# Slot

`Slot` provides `asChild` behavior by cloning a single child vnode and merging props.

Merged behavior:

- event handlers are composed (`child` then `slot`)
- `class` / `className` values are concatenated
- `style` objects are shallow-merged
- refs are composed
