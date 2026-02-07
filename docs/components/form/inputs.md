# Advanced Inputs

Interactive input primitives.

## Components

- `Slider`
- `RangeSlider`
- `SelectRoot` / `SelectTrigger` / `SelectValue` / `SelectContent` / `SelectItem`
- `ComboboxRoot` / `ComboboxInput` / `ComboboxList` / `ComboboxItem`

## Slider / RangeSlider

- Controlled + uncontrolled support via `value/defaultValue/onValueChange`
- `Slider` maps to native range input semantics
- `RangeSlider` maintains ordered tuple `[start, end]`

## Select

- `SelectRoot` supports both controlled and uncontrolled `value` and `open`
- `SelectTrigger` toggles listbox visibility (`aria-haspopup="listbox"`)
- `SelectContent` supports `forceMount` for always-mounted popups
- `SelectItem` commits value and closes popup by default

## Combobox

- `ComboboxInput` drives query and opens list on focus/input
- `ComboboxItem` performs simple text filtering against current query
- Selecting an item commits value, syncs query, and closes list

## Minimal Example

```tsx
import {
  Slider,
  RangeSlider,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ComboboxRoot,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
} from '@fictjs/ui-primitives'

<Slider min={0} max={100} defaultValue={40} />
<RangeSlider min={0} max={100} defaultValue={[20, 80]} />

<SelectRoot defaultValue="apple">
  <SelectTrigger>
    <SelectValue placeholder="Pick one" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</SelectRoot>

<ComboboxRoot>
  <ComboboxInput placeholder="Search user" />
  <ComboboxList>
    <ComboboxItem value="alice">Alice</ComboboxItem>
    <ComboboxItem value="bob">Bob</ComboboxItem>
  </ComboboxList>
</ComboboxRoot>
```

## Accessibility Notes

- For select/combobox, keep option text concise and distinct to avoid ambiguous announcements.
- If you force-mount popup content, keep hidden-state signaling consistent.
- Range-like controls should include external labels that describe scale and intent.
