import { createContext, useContext, type FictNode } from '@fictjs/runtime'

import { createControllableState } from '../../internal/state'
import { Primitive } from '../core/primitive'
import { PopoverContent, PopoverRoot, PopoverTrigger, type PopoverContentPropsExt } from '../overlay/popover'
import { RovingFocusGroup } from '../interaction/roving-focus'
import { Separator } from '../core/separator'

export interface DropdownMenuRootProps {
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: FictNode
}

export interface DropdownMenuTriggerProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface DropdownMenuContentProps extends Omit<PopoverContentPropsExt, 'role'> {
  children?: FictNode
}

export interface DropdownMenuItemProps {
  as?: string
  asChild?: boolean
  keepOpen?: boolean
  onSelect?: (event: MouseEvent) => void
  children?: FictNode
  [key: string]: unknown
}

export interface DropdownMenuCheckboxItemProps extends DropdownMenuItemProps {
  checked?: boolean | (() => boolean)
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export interface DropdownMenuRadioGroupProps {
  value?: string | (() => string)
  defaultValue?: string
  onValueChange?: (value: string) => void
  children?: FictNode
}

export interface DropdownMenuRadioItemProps extends DropdownMenuItemProps {
  value: string
}

export interface DropdownMenuSubProps {
  open?: boolean | (() => boolean)
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: FictNode
}

export type DropdownMenuSubTriggerProps = Omit<DropdownMenuItemProps, 'keepOpen'>

export interface DropdownMenuSubContentProps extends Omit<DropdownMenuContentProps, 'role'> {
  children?: FictNode
}

interface DropdownMenuContextValue {
  open: () => boolean
  setOpen: (open: boolean) => void
}

interface DropdownRadioContextValue {
  value: () => string
  setValue: (value: string) => void
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null)
const DropdownRadioContext = createContext<DropdownRadioContextValue | null>(null)

function useDropdownMenuContext(component: string): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error(`${component} must be used inside DropdownMenuRoot`)
  }
  return context
}

export function DropdownMenuRoot(props: DropdownMenuRootProps): FictNode {
  const state = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  const context: DropdownMenuContextValue = {
    open: () => state.get(),
    setOpen: open => state.set(open),
  }

  return {
    type: DropdownMenuContext.Provider,
    props: {
      value: context,
      children: {
        type: PopoverRoot,
        props: {
          open: () => context.open(),
          onOpenChange: (open: boolean) => context.setOpen(open),
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function DropdownMenuTrigger(props: DropdownMenuTriggerProps): FictNode {
  return {
    type: PopoverTrigger,
    props,
  }
}

export function DropdownMenuContent(props: DropdownMenuContentProps): FictNode {
  return {
    type: PopoverContent,
    props: {
      ...props,
      role: 'menu',
      'aria-orientation': 'vertical',
      'data-dropdown-menu-content': '',
      children: {
        type: RovingFocusGroup,
        props: {
          orientation: 'vertical',
          loop: true,
          children: props.children,
        },
      },
    },
  }
}

export function DropdownMenuItem(props: DropdownMenuItemProps): FictNode {
  const context = useDropdownMenuContext('DropdownMenuItem')
  const tag = props.as ?? 'button'

  return Primitive({
    ...props,
    as: tag,
    type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
    role: props.role ?? 'menuitem',
    'data-dropdown-menu-item': '',
    onClick: (event: MouseEvent) => {
      ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
      props.onSelect?.(event)
      if (event.defaultPrevented) return
      if (!props.keepOpen) {
        context.setOpen(false)
      }
    },
    children: props.children,
  })
}

export function DropdownMenuCheckboxItem(props: DropdownMenuCheckboxItemProps): FictNode {
  const checkedState = createControllableState<boolean>({
    value: props.checked,
    defaultValue: props.defaultChecked ?? false,
    onChange: props.onCheckedChange,
  })

  return {
    type: DropdownMenuItem,
    props: {
      ...props,
      keepOpen: props.keepOpen ?? true,
      role: 'menuitemcheckbox',
      'aria-checked': () => checkedState.get(),
      'data-checked': () => (checkedState.get() ? 'true' : 'false'),
      onSelect: (event: MouseEvent) => {
        props.onSelect?.(event)
        if (event.defaultPrevented) return
        checkedState.set(!checkedState.get())
      },
      children: props.children,
    },
  }
}

export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps): FictNode {
  const valueState = createControllableState<string>({
    value: props.value,
    defaultValue: props.defaultValue ?? '',
    onChange: props.onValueChange,
  })

  const context: DropdownRadioContextValue = {
    value: () => valueState.get(),
    setValue: value => valueState.set(value),
  }

  return {
    type: DropdownRadioContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}

export function DropdownMenuRadioItem(props: DropdownMenuRadioItemProps): FictNode {
  const radio = useContext(DropdownRadioContext)
  if (!radio) {
    throw new Error('DropdownMenuRadioItem must be used inside DropdownMenuRadioGroup')
  }

  return {
    type: DropdownMenuItem,
    props: {
      ...props,
      keepOpen: props.keepOpen ?? true,
      role: 'menuitemradio',
      'aria-checked': () => radio.value() === props.value,
      'data-checked': () => (radio.value() === props.value ? 'true' : 'false'),
      onSelect: (event: MouseEvent) => {
        props.onSelect?.(event)
        if (event.defaultPrevented) return
        radio.setValue(props.value)
      },
      children: props.children,
    },
  }
}

export function DropdownMenuSub(props: DropdownMenuSubProps): FictNode {
  const state = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  return {
    type: PopoverRoot,
    props: {
      open: () => state.get(),
      onOpenChange: (open: boolean) => state.set(open),
      children: props.children,
    },
  }
}

export function DropdownMenuSubTrigger(props: DropdownMenuSubTriggerProps): FictNode {
  return {
    type: PopoverTrigger,
    props: {
      asChild: true,
      'aria-haspopup': 'menu',
      children: {
        type: DropdownMenuItem,
        props: {
          ...props,
          keepOpen: true,
          'aria-haspopup': props['aria-haspopup'] ?? 'menu',
          'aria-expanded': props['aria-expanded'],
          'data-dropdown-menu-sub-trigger': '',
          children: props.children,
        },
      },
    },
  }
}

export function DropdownMenuSubContent(props: DropdownMenuSubContentProps): FictNode {
  return {
    type: PopoverContent,
    props: {
      ...props,
      role: 'menu',
      side: props.side ?? 'right',
      align: props.align ?? 'start',
      'aria-orientation': 'vertical',
      'data-dropdown-menu-sub-content': '',
      children: {
        type: RovingFocusGroup,
        props: {
          orientation: 'vertical',
          loop: true,
          children: props.children,
        },
      },
    },
  }
}

export function DropdownMenuLabel(props: Record<string, unknown> & { children?: FictNode }): FictNode {
  return {
    type: 'div',
    props: {
      ...props,
      role: props.role ?? 'presentation',
      'data-dropdown-menu-label': '',
      children: props.children,
    },
  }
}

export const DropdownMenuSeparator = Separator
