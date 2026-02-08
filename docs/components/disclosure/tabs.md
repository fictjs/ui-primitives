# Tabs

Accessible tabs primitives with roving focus tab list.

## Components

- `TabsRoot`
- `TabsList`
- `TabsTrigger`
- `TabsContent`

## Key APIs

- `TabsRoot` accepts `id?: string` to stabilize trigger/content id mapping
- `TabsTrigger` supports `asChild`

## Minimal Example

```tsx
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@fictjs/ui-primitives'

<TabsRoot defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview panel</TabsContent>
  <TabsContent value="details">Details panel</TabsContent>
</TabsRoot>
```

## Accessibility Notes

- Keep `TabsTrigger`/`TabsContent` value pairs unique to avoid broken `aria-controls` links.
- Use meaningful trigger labels so screen-reader users can navigate tab options quickly.
