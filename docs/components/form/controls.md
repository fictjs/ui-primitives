# Form Controls

Core form-control primitives.

## Components

- `Label`
- `Checkbox`
- `RadioGroup` / `RadioItem`
- `Switch` / `SwitchThumb`
- `Toggle` / `ToggleGroup` / `ToggleGroupItem`

## Minimal Example

```tsx
import {
  Label,
  Checkbox,
  RadioGroup,
  RadioItem,
  Switch,
  SwitchThumb,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from '@fictjs/ui-primitives'

<Label htmlFor="tos">Accept terms</Label>
<Checkbox id="tos" name="tos" defaultChecked>Accept</Checkbox>

<RadioGroup name="density" defaultValue="comfortable">
  <RadioItem value="compact">Compact</RadioItem>
  <RadioItem value="comfortable">Comfortable</RadioItem>
</RadioGroup>

<Switch name="notifications" defaultChecked>
  <SwitchThumb />
</Switch>

<Toggle defaultPressed>Bold</Toggle>

<ToggleGroup type="multiple" defaultValue={['left']}>
  <ToggleGroupItem value="left">Left</ToggleGroupItem>
  <ToggleGroupItem value="center">Center</ToggleGroupItem>
</ToggleGroup>
```

## Accessibility Notes

- Keep textual labels adjacent to icon-only controls (`Checkbox`, `Switch`, `Toggle`).
- Radio groups should represent one conceptual choice and use clear item labels.
- `aria-checked` / `aria-pressed` states are built-in; ensure visual state mirrors them.
