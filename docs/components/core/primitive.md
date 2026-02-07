# Primitive

`Primitive` is the polymorphic base element wrapper for all headless components.

## API

- `as`: intrinsic element tag, default `div`
- `asChild`: when `true`, merges props into the child vnode via `Slot`

## Example

```tsx
<Primitive as="button" type="button">Open</Primitive>
<Primitive asChild>
  <a href="/docs">Docs</a>
</Primitive>
```
