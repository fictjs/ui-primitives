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
