# LiveRegion / Announce

Screen-reader announcement primitives.

## API

- `LiveRegionProvider`
- `useAnnouncer()`
- `Announce`

Two regions are maintained: polite and assertive.

## Minimal Example

```tsx
import { Announce, LiveRegionProvider } from '@fictjs/ui-primitives'

<LiveRegionProvider>
  <Announce politeness="polite" message="Saved successfully" />
</LiveRegionProvider>
```

## Accessibility Notes

- Use `polite` for non-urgent updates and `assertive` only for urgent interruptions.
- Keep announcements short and specific to reduce repeated verbosity in screen readers.
