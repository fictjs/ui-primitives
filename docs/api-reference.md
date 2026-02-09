# API Reference Index

This document lists runtime exports from `@fictjs/ui-primitives`.

Note: each module also exports related TypeScript interfaces/types for props.

## Core

- `Primitive`
- `PrimitiveElements`
- `Slot`
- `Presence`
- `Portal`
- `PortalHost`
- `VisuallyHidden`
- `Separator`
- `AccessibleIcon`
- `IdProvider`
- `useId`

## Interaction

- `FocusScope`
- `FocusTrap`
- `DismissableLayer`
- `RovingFocusGroup`
- `RovingFocusItem`
- `ScrollLock`
- `LiveRegionProvider`
- `useAnnouncer`
- `Announce`
- `PopperRoot`
- `PopperAnchor`
- `PopperContent`
- `PopperArrow`

## Overlay

- `DialogRoot`
- `DialogPortal`
- `DialogTrigger`
- `DialogOverlay`
- `DialogContent`
- `DialogClose`
- `DialogTitle`
- `DialogDescription`
- `AlertDialogRoot`
- `AlertDialogTrigger`
- `AlertDialogPortal`
- `AlertDialogOverlay`
- `AlertDialogContent`
- `AlertDialogTitle`
- `AlertDialogDescription`
- `AlertDialogAction`
- `AlertDialogCancel`
- `PopoverRoot`
- `PopoverTrigger`
- `PopoverContent`
- `PopoverClose`
- `TooltipProvider`
- `TooltipRoot`
- `TooltipTrigger`
- `TooltipContent`
- `HoverCardRoot`
- `HoverCardTrigger`
- `HoverCardContent`
- `CommandPaletteRoot`
- `CommandPaletteTrigger`
- `CommandPaletteContent`
- `CommandPaletteInput`
- `CommandPaletteList`
- `CommandPaletteItem`
- `CommandPaletteEmpty`
- `CommandPaletteGroup`
- `CommandPaletteSeparator`
- `CommandPaletteClose`

## Menu

- `DropdownMenuRoot`
- `DropdownMenuTrigger`
- `DropdownMenuContent`
- `DropdownMenuItem`
- `DropdownMenuCheckboxItem`
- `DropdownMenuRadioGroup`
- `DropdownMenuRadioItem`
- `DropdownMenuSub`
- `DropdownMenuSubTrigger`
- `DropdownMenuSubContent`
- `DropdownMenuLabel`
- `DropdownMenuSeparator`
- `ContextMenuRoot`
- `ContextMenuTrigger`
- `ContextMenuContent`
- `ContextMenuItem`
- `ContextMenuSub`
- `ContextMenuSubTrigger`
- `ContextMenuSubContent`
- `MenubarRoot`
- `MenubarMenu`
- `MenubarTrigger`
- `MenubarContent`
- `MenubarItem`

## Feedback

- `ToastProvider`
- `ToastViewport`
- `ToastRoot`
- `ToastTitle`
- `ToastDescription`
- `ToastAction`
- `ToastClose`
- `useToast`

## Disclosure and Navigation

- `CollapsibleRoot`
- `CollapsibleTrigger`
- `CollapsibleContent`
- `AccordionRoot`
- `AccordionItem`
- `AccordionTrigger`
- `AccordionContent`
- `TabsRoot`
- `TabsList`
- `TabsTrigger`
- `TabsContent`
- `NavigationMenuRoot`
- `NavigationMenuList`
- `NavigationMenuItem`
- `NavigationMenuTrigger`
- `NavigationMenuContent`
- `NavigationMenuLink`
- `NavigationMenuIndicator`
- `NavigationMenuViewport`

## Form and Inputs

- `Label`
- `Checkbox`
- `RadioGroup`
- `RadioItem`
- `Switch`
- `SwitchThumb`
- `Toggle`
- `ToggleGroup`
- `ToggleGroupItem`
- `Slider`
- `RangeSlider`
- `CalendarRoot`
- `Calendar`
- `CalendarHeader`
- `CalendarTitle`
- `CalendarPrevButton`
- `CalendarNextButton`
- `CalendarGrid`
- `DatePickerRoot`
- `DatePickerTrigger`
- `DatePickerValue`
- `DatePickerContent`
- `DatePickerCalendar`
- `SelectRoot`
- `SelectTrigger`
- `SelectValue`
- `SelectContent`
- `SelectItem`
- `ComboboxRoot`
- `ComboboxInput`
- `ComboboxList`
- `ComboboxItem`
- `Form`
- `FormField`
- `FormLabel`
- `FormControl`
- `FormDescription`
- `FormMessage`

## Layout

- `ScrollArea`
- `ScrollAreaViewport`
- `ScrollAreaScrollbar`
- `ScrollAreaThumb`
- `ResizablePanelGroup`
- `ResizablePanel`
- `ResizableHandle`
- `AspectRatio`
- `Progress`
- `Meter`
- `Skeleton`
- `KeyboardModeProvider`
- `FocusVisible`
- `useKeyboardMode`

## Import Pattern

```ts
import { DialogRoot, TabsRoot, ToastProvider } from '@fictjs/ui-primitives'
```
