# Primitive

`Primitive` is the polymorphic base element wrapper for all headless components.

## API

- `as`: intrinsic element tag, default `div`
- `asChild`: when `true`, merges props into the child vnode via `Slot`

## Minimal Example

```tsx
<Primitive as="button" type="button">Open</Primitive>
<Primitive asChild>
  <a href="/docs">Docs</a>
</Primitive>
```

## Accessibility Notes

- `as` and `asChild` can change semantics; choose an element with correct native role/keyboard behavior.
- Avoid replacing native buttons/links with generic tags unless you fully re-implement accessibility semantics.
