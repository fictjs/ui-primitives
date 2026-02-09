import { createContext, onDestroy, onMount, useContext, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { useId } from '../../internal/ids'
import { createControllableState } from '../../internal/state'
import type { MaybeAccessor } from '../../internal/types'
import { Primitive } from '../core/primitive'
import { Separator } from '../core/separator'
import { RovingFocusGroup } from '../interaction/roving-focus'
import { DialogClose, DialogContent, DialogRoot, DialogTrigger } from './dialog'

interface CommandRecord {
  value: string
  text: string
  keywords: string[]
}

function normalizeText(node: FictNode): string {
  if (node === null || node === undefined || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) {
    return node.map(item => normalizeText(item as FictNode)).join(' ').trim()
  }
  return ''
}

function matchCommand(query: string, item: CommandRecord): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const searchable = [item.value, item.text, ...item.keywords]
    .map(value => value.toLowerCase())
    .join(' ')

  return searchable.includes(normalized)
}

export interface CommandPaletteRootProps {
  id?: string
  open?: MaybeAccessor<boolean>
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  value?: MaybeAccessor<string | undefined>
  defaultValue?: string
  onValueChange?: (value: string) => void
  query?: MaybeAccessor<string | undefined>
  defaultQuery?: string
  onQueryChange?: (query: string) => void
  resetQueryOnClose?: boolean
  children?: FictNode
}

export interface CommandPaletteTriggerProps {
  as?: string
  asChild?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface CommandPaletteContentProps {
  forceMount?: boolean
  portal?: boolean
  children?: FictNode
  [key: string]: unknown
}

export interface CommandPaletteInputProps {
  placeholder?: string
  [key: string]: unknown
}

export interface CommandPaletteListProps {
  children?: FictNode
  [key: string]: unknown
}

export interface CommandPaletteItemProps {
  value: string
  keywords?: string[]
  keepOpen?: boolean
  as?: string
  asChild?: boolean
  onSelect?: (value: string, event: MouseEvent) => void
  children?: FictNode
  [key: string]: unknown
}

export interface CommandPaletteEmptyProps {
  children?: FictNode
  [key: string]: unknown
}

export interface CommandPaletteGroupProps {
  heading?: FictNode
  children?: FictNode
  [key: string]: unknown
}

interface CommandPaletteContextValue {
  listId: string
  open: () => boolean
  setOpen: (open: boolean) => void
  value: () => string
  setValue: (value: string) => void
  query: () => string
  setQuery: (query: string) => void
  registerItem: (item: CommandRecord) => () => void
  hasMatches: () => boolean
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

function useCommandPaletteContext(component: string): CommandPaletteContextValue {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error(`${component} must be used inside CommandPaletteRoot`)
  }
  return context
}

export function CommandPaletteRoot(props: CommandPaletteRootProps): FictNode {
  const baseId = useId(props.id, 'command-palette')

  const openState = createControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  })

  const valueState = createControllableState<string>({
    value: props.value,
    defaultValue: props.defaultValue ?? '',
    onChange: props.onValueChange,
  })

  const queryState = createControllableState<string>({
    value: props.query,
    defaultValue: props.defaultQuery ?? '',
    onChange: props.onQueryChange,
  })

  const itemsSignal = createSignal<CommandRecord[]>([])

  const context: CommandPaletteContextValue = {
    listId: `${baseId}-list`,
    open: () => openState.get(),
    setOpen: open => {
      openState.set(open)
      if (!open && (props.resetQueryOnClose ?? true)) {
        queryState.set('')
      }
    },
    value: () => valueState.get(),
    setValue: value => valueState.set(value),
    query: () => queryState.get(),
    setQuery: query => queryState.set(query),
    registerItem: item => {
      itemsSignal([...itemsSignal(), item])
      return () => {
        itemsSignal(itemsSignal().filter(entry => entry !== item))
      }
    },
    hasMatches: () => {
      const items = itemsSignal()
      if (items.length === 0) return false
      return items.some(item => matchCommand(queryState.get(), item))
    },
  }

  return {
    type: CommandPaletteContext.Provider,
    props: {
      value: context,
      children: {
        type: DialogRoot,
        props: {
          id: baseId,
          modal: true,
          open: () => context.open(),
          onOpenChange: (open: boolean) => context.setOpen(open),
          children: props.children,
        },
      },
    },
  } as unknown as FictNode
}

export function CommandPaletteTrigger(props: CommandPaletteTriggerProps): FictNode {
  return {
    type: DialogTrigger,
    props: {
      ...props,
      'data-command-trigger': '',
      children: props.children,
    },
  }
}

export function CommandPaletteContent(props: CommandPaletteContentProps): FictNode {
  return {
    type: DialogContent,
    props: {
      ...props,
      role: props.role ?? 'dialog',
      'data-command-content': '',
      children: props.children,
    },
  }
}

export function CommandPaletteInput(props: CommandPaletteInputProps): FictNode {
  const context = useCommandPaletteContext('CommandPaletteInput')

  return {
    type: 'input',
    props: {
      ...props,
      type: 'text',
      role: 'combobox',
      'aria-expanded': () => context.open(),
      'aria-controls': context.listId,
      value: () => context.query(),
      'data-command-input': '',
      onFocus: (event: FocusEvent) => {
        ;(props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event)
        if (!event.defaultPrevented) {
          context.setOpen(true)
        }
      },
      onInput: (event: Event) => {
        ;(props.onInput as ((event: Event) => void) | undefined)?.(event)
        const target = event.target as HTMLInputElement | null
        if (!target) return
        context.setQuery(target.value)
      },
      onKeyDown: (event: KeyboardEvent) => {
        ;(props.onKeyDown as ((event: KeyboardEvent) => void) | undefined)?.(event)
        if (event.defaultPrevented) return
        if (event.key === 'ArrowDown') {
          const list = document.getElementById(context.listId)
          const firstItem = list?.querySelector('[data-command-item]') as HTMLElement | null
          firstItem?.focus()
          event.preventDefault()
        }
      },
    },
  }
}

export function CommandPaletteList(props: CommandPaletteListProps): FictNode {
  const context = useCommandPaletteContext('CommandPaletteList')

  return {
    type: 'div',
    props: {
      ...props,
      id: props.id ?? context.listId,
      role: 'listbox',
      'data-command-list': '',
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

export function CommandPaletteItem(props: CommandPaletteItemProps): FictNode {
  const context = useCommandPaletteContext('CommandPaletteItem')
  const tag = props.as ?? 'button'
  const text = normalizeText(props.children) || props.value

  let cleanup: (() => void) | null = null

  onMount(() => {
    cleanup = context.registerItem({
      value: props.value,
      text,
      keywords: props.keywords ?? [],
    })
  })

  onDestroy(() => {
    cleanup?.()
    cleanup = null
  })

  const matches = () =>
    matchCommand(context.query(), {
      value: props.value,
      text,
      keywords: props.keywords ?? [],
    })

  return {
    type: 'div',
    props: {
      'data-command-item-wrapper': props.value,
      children: () =>
        matches()
          ? Primitive({
              ...props,
              as: tag,
              type: !props.asChild && tag === 'button' ? (props.type ?? 'button') : props.type,
              role: props.role ?? 'option',
              'aria-selected': () => context.value() === props.value,
              'data-state': () => (context.value() === props.value ? 'selected' : 'idle'),
              'data-command-item': props.value,
              onClick: (event: MouseEvent) => {
                ;(props.onClick as ((event: MouseEvent) => void) | undefined)?.(event)
                props.onSelect?.(props.value, event)
                if (event.defaultPrevented) return
                context.setValue(props.value)
                if (!props.keepOpen) {
                  context.setOpen(false)
                }
              },
              children: props.children,
            })
          : null,
    },
  }
}

export function CommandPaletteEmpty(props: CommandPaletteEmptyProps): FictNode {
  const context = useCommandPaletteContext('CommandPaletteEmpty')

  return {
    type: 'div',
    props: {
      ...props,
      'data-command-empty': '',
      children: () => (!context.hasMatches() ? props.children ?? 'No results found.' : null),
    },
  }
}

export function CommandPaletteGroup(props: CommandPaletteGroupProps): FictNode {
  return {
    type: 'div',
    props: {
      ...props,
      heading: undefined,
      role: props.role ?? 'group',
      'data-command-group': '',
      children: [
        props.heading
          ? {
              type: 'div',
              props: {
                'data-command-group-heading': '',
                children: props.heading,
              },
            }
          : null,
        props.children,
      ],
    },
  }
}

export const CommandPaletteSeparator = Separator
export const CommandPaletteClose = DialogClose
