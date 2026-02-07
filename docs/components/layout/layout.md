# Layout and P2 Primitives

## Components

- `ScrollArea`, `ScrollAreaViewport`, `ScrollAreaScrollbar`, `ScrollAreaThumb`
- `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`
- `AspectRatio`
- `Progress`, `Meter`
- `Skeleton`
- `KeyboardModeProvider`, `FocusVisible`, `useKeyboardMode`

## Minimal Example

```tsx
import {
  ScrollArea,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  AspectRatio,
  Progress,
  Meter,
  Skeleton,
  KeyboardModeProvider,
  FocusVisible,
} from '@fictjs/ui-primitives'

<ScrollArea>
  <ScrollAreaViewport style={{ maxHeight: '120px' }}>Long content...</ScrollAreaViewport>
  <ScrollAreaScrollbar orientation="vertical">
    <ScrollAreaThumb />
  </ScrollAreaScrollbar>
</ScrollArea>

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={40}>Left</ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={60}>Right</ResizablePanel>
</ResizablePanelGroup>

<AspectRatio ratio={16 / 9}>
  <img src="/placeholder.jpg" alt="Preview" />
</AspectRatio>

<Progress value={65} max={100} />
<Meter value={0.7} min={0} max={1} low={0.3} high={0.8} optimum={0.9} />
<Skeleton loading>Loading card...</Skeleton>

<KeyboardModeProvider>
  <FocusVisible as="button">Focusable action</FocusVisible>
</KeyboardModeProvider>
```

## Accessibility Notes

- Custom scroll/resize affordances should preserve keyboard access and visible focus states.
- `Progress` and `Meter` should have nearby textual context explaining value meaning.
- `Skeleton` placeholders are visual only; pair with status messaging for assistive tech when needed.
