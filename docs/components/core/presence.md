# Presence

`Presence` conditionally mounts children based on `present`, while supporting force mount.

## Props

- `present`: boolean/accessor, default `true`
- `forceMount`: boolean/accessor, default `false`
- `children`: node or render function receiving `{ present }`
