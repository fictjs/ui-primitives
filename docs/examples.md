# Usage Examples

Examples below use TSX syntax with `@fictjs/ui-primitives`.

## Dialog (controlled)

```tsx
import { createSignal } from '@fictjs/runtime/advanced'
import {
  DialogRoot,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@fictjs/ui-primitives'

const open = createSignal(false)

<DialogRoot open={() => open()} onOpenChange={next => open(next)}>
  <DialogTrigger>Edit profile</DialogTrigger>
  <DialogOverlay class="overlay" />
  <DialogContent>
    <DialogTitle>Profile</DialogTitle>
    <DialogDescription>Update your display settings.</DialogDescription>
    <DialogClose>Done</DialogClose>
  </DialogContent>
</DialogRoot>
```

## Dropdown Menu (checkbox + radio)

```tsx
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@fictjs/ui-primitives'

<DropdownMenuRoot>
  <DropdownMenuTrigger>Preferences</DropdownMenuTrigger>
  <DropdownMenuContent side="bottom" align="start">
    <DropdownMenuCheckboxItem defaultChecked>Show line numbers</DropdownMenuCheckboxItem>
    <DropdownMenuRadioGroup defaultValue="compact">
      <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenuRoot>
```

## Toast (hook + viewport)

```tsx
import { ToastProvider, ToastViewport, useToast } from '@fictjs/ui-primitives'

function SaveButton() {
  const toast = useToast()
  return (
    <button
      type="button"
      onClick={() => toast.show({ title: 'Saved', description: 'Changes were persisted.' })}
    >
      Save
    </button>
  )
}

<ToastProvider duration={4000}>
  <SaveButton />
  <ToastViewport />
</ToastProvider>
```

## Tabs (controlled)

```tsx
import { createSignal } from '@fictjs/runtime/advanced'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from '@fictjs/ui-primitives'

const tab = createSignal('account')

<TabsRoot value={() => tab()} onValueChange={next => tab(next)}>
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Account settings</TabsContent>
  <TabsContent value="security" forceMount>
    Security settings
  </TabsContent>
</TabsRoot>
```

## Form Field (label + message wiring)

```tsx
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@fictjs/ui-primitives'

<Form>
  <FormField name="email">
    <FormLabel>Email</FormLabel>
    <FormControl as="input" type="email" required />
    <FormDescription>Use your work email.</FormDescription>
    <FormMessage>Invalid email format.</FormMessage>
  </FormField>
</Form>
```

## Select + Combobox

```tsx
import {
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

<SelectRoot defaultValue="apple">
  <SelectTrigger>
    <SelectValue placeholder="Choose fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</SelectRoot>

<ComboboxRoot>
  <ComboboxInput placeholder="Search assignee" />
  <ComboboxList>
    <ComboboxItem value="alice">Alice</ComboboxItem>
    <ComboboxItem value="bob">Bob</ComboboxItem>
  </ComboboxList>
</ComboboxRoot>
```
