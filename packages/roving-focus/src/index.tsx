import { mergeProps, prop, untrack, type FictNode, type JSX } from '@fictjs/runtime'

import { createCollection } from '@fictjs/collection'
import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { composeEventHandlers } from '@fictjs/core-primitive'
import { useDirection, type Direction } from '@fictjs/direction'
import { useId } from '@fictjs/id'
import { Primitive } from '@fictjs/primitive'
import { useCallbackRef } from '@fictjs/use-callback-ref'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

type MaybeAccessor<T> = T | (() => T)
type Orientation = 'horizontal' | 'vertical' | undefined
type ScopedProps<P> = P & { __scopeRovingFocusGroup?: Scope<RovingContextValue | undefined> }
type StyleRecord = Record<string, string | number>
type FocusIntent = 'first' | 'last' | 'prev' | 'next'
type RovingFocusGroupOptions = {
  orientation?: MaybeAccessor<Orientation>
  dir?: MaybeAccessor<Direction | undefined>
  loop?: MaybeAccessor<boolean | undefined>
}
type RovingContextValue = {
  orientation: () => Orientation
  dir: () => Direction
  loop: () => boolean
  currentTabStopId: () => string | null
  onItemFocus: (tabStopId: string) => void
  onItemShiftTab: () => void
  onFocusableItemAdd: () => void
  onFocusableItemRemove: () => void
}
type ItemData = { id: string; focusable: boolean; active: boolean }

const ENTRY_FOCUS = 'rovingFocusGroup.onEntryFocus'
const EVENT_OPTIONS = { bubbles: false, cancelable: true }
const GROUP_NAME = 'RovingFocusGroup'
const ITEM_NAME = 'RovingFocusGroupItem'
const SIGNAL_MARKER = Symbol.for('fict:signal')
const COMPUTED_MARKER = Symbol.for('fict:computed')
const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

const [Collection, useCollection, createCollectionScope] = createCollection<
  HTMLSpanElement,
  ItemData
>(GROUP_NAME)
const [createRovingFocusGroupContext, createRovingFocusGroupScope] = createContextScope(
  GROUP_NAME,
  [createCollectionScope],
)
const [RovingFocusProvider, useRovingFocusContext] =
  createRovingFocusGroupContext<RovingContextValue>(GROUP_NAME)

type RovingFocusGroupProps = RovingFocusGroupImplProps

type RovingFocusGroupImplProps = Omit<JSX.IntrinsicElements['div'], 'dir'> &
  RovingFocusGroupOptions & {
    asChild?: boolean
    currentTabStopId?: MaybeAccessor<string | null | undefined>
    defaultCurrentTabStopId?: MaybeAccessor<string | undefined>
    onCurrentTabStopIdChange?: (tabStopId: string | null) => void
    onEntryFocus?: (event: Event) => void
    preventScrollOnEntryFocus?: MaybeAccessor<boolean | undefined>
  }

type RovingFocusItemProps = Omit<JSX.IntrinsicElements['span'], 'children'> & {
  asChild?: boolean
  tabStopId?: MaybeAccessor<string | undefined>
  focusable?: MaybeAccessor<boolean | undefined>
  active?: MaybeAccessor<boolean | undefined>
  children?:
    | FictNode
    | FictNode[]
    | ((props: { hasTabStop: boolean; isCurrentTabStop: boolean }) => FictNode)
}

// prettier-ignore
const MAP_KEY_TO_FOCUS_INTENT: Record<string, FocusIntent> = {
  ArrowLeft: 'prev', ArrowUp: 'prev',
  ArrowRight: 'next', ArrowDown: 'next',
  PageUp: 'first', Home: 'first',
  PageDown: 'last', End: 'last',
}

function readValue<T>(value: MaybeAccessor<T>): T {
  if (
    typeof value === 'function' &&
    (value.length === 0 ||
      (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
      (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
      (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
  ) {
    return (value as () => T)()
  }

  return value as T
}

function readStyle(value: unknown): StyleRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as StyleRecord
}

function getDirectionAwareKey(key: string, dir?: Direction) {
  if (dir !== 'rtl') return key
  return key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key
}

function getFocusIntent(event: KeyboardEvent, orientation?: Orientation, dir?: Direction) {
  const key = getDirectionAwareKey(event.key, dir)
  if (orientation === 'vertical' && ['ArrowLeft', 'ArrowRight'].includes(key)) return undefined
  if (orientation === 'horizontal' && ['ArrowUp', 'ArrowDown'].includes(key)) return undefined
  return MAP_KEY_TO_FOCUS_INTENT[key]
}

function focusFirst(candidates: HTMLElement[], preventScroll = false) {
  const previousFocusedElement =
    candidates[0]?.ownerDocument.activeElement ?? document.activeElement

  for (const candidate of candidates) {
    if (candidate === previousFocusedElement) return
    candidate.focus({ preventScroll })
    if (candidate.ownerDocument.activeElement !== previousFocusedElement) return
  }
}

function wrapArray<T>(array: T[], startIndex: number) {
  return array.map<T>((_, index) => array[(startIndex + index) % array.length]!)
}

function RovingFocusGroup(props: ScopedProps<RovingFocusGroupProps>): FictNode {
  const implProps = mergeProps(
    prop(() => props as Record<string, unknown>),
    {
      onCurrentTabStopIdChange: prop(() => props.onCurrentTabStopIdChange),
      onEntryFocus: prop(() => props.onEntryFocus),
    },
  )

  return (
    <Collection.Provider scope={props.__scopeRovingFocusGroup}>
      <Collection.Slot scope={props.__scopeRovingFocusGroup}>
        <RovingFocusGroupImpl {...implProps} />
      </Collection.Slot>
    </Collection.Provider>
  )
}

RovingFocusGroup.displayName = GROUP_NAME

function RovingFocusGroupImpl(props: ScopedProps<RovingFocusGroupImplProps>): FictNode {
  const ref = { current: null as HTMLDivElement | null }
  const composedRefs = useComposedRefs(
    props.ref as PossibleRef<HTMLDivElement>,
    ref as PossibleRef<HTMLDivElement>,
  )
  const inheritedDirection = useDirection()
  const orientation = () =>
    props.orientation === undefined
      ? undefined
      : readValue(props.orientation as MaybeAccessor<Orientation>)
  const dir = () =>
    props.dir === undefined
      ? inheritedDirection()
      : (readValue(props.dir as MaybeAccessor<Direction | undefined>) ?? inheritedDirection())
  const loop = () => Boolean(readValue(props.loop as MaybeAccessor<boolean | undefined>))
  const currentTabStopIdProp = () =>
    props.currentTabStopId === undefined
      ? undefined
      : readValue(props.currentTabStopId as MaybeAccessor<string | null | undefined>)
  const defaultCurrentTabStopId = () =>
    props.defaultCurrentTabStopId === undefined
      ? null
      : (readValue(props.defaultCurrentTabStopId as MaybeAccessor<string | undefined>) ?? null)
  const preventScrollOnEntryFocus = () =>
    Boolean(readValue(props.preventScrollOnEntryFocus as MaybeAccessor<boolean | undefined>))
  const [currentTabStopId, setCurrentTabStopId] = useControllableState<string | null>({
    prop: currentTabStopIdProp,
    defaultProp: defaultCurrentTabStopId,
    caller: GROUP_NAME,
    onChange: (nextId) => props.onCurrentTabStopIdChange?.(nextId),
  })
  const isTabbingBackOut = createSignal(false)
  const handleEntryFocus = useCallbackRef<(event: Event) => void>(prop(() => props.onEntryFocus))
  const getItems = useCollection(props.__scopeRovingFocusGroup)
  const isClickFocusRef = { current: false }
  const focusableItemsCount = createSignal(0)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    node.addEventListener(ENTRY_FOCUS, handleEntryFocus as EventListener)
    return () => {
      node.removeEventListener(ENTRY_FOCUS, handleEntryFocus as EventListener)
    }
  })

  const primitiveProps = mergeProps(
    {
      tabIndex: prop(() => (isTabbingBackOut() || focusableItemsCount() === 0 ? -1 : 0)),
      'data-orientation': prop(orientation),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeRovingFocusGroup: undefined,
      currentTabStopId: undefined,
      defaultCurrentTabStopId: undefined,
      dir: undefined,
      loop: undefined,
      onCurrentTabStopIdChange: undefined,
      onEntryFocus: undefined,
      preventScrollOnEntryFocus: undefined,
      ref: undefined,
      orientation: undefined,
      style: prop(() => ({
        outline: 'none',
        ...readStyle(props.style),
      })),
      onBlur: composeEventHandlers<FocusEvent>(
        (event) => (props.onBlur as ((event: FocusEvent) => void) | undefined)?.(event),
        () => {
          isTabbingBackOut(false)
        },
      ),
      onFocus: composeEventHandlers<FocusEvent>(
        (event) => (props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event),
        (event) => {
          const currentTarget = event.currentTarget as HTMLElement | null
          const isKeyboardFocus = !isClickFocusRef.current

          if (
            event.target === currentTarget &&
            currentTarget &&
            isKeyboardFocus &&
            !isTabbingBackOut()
          ) {
            const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS)
            currentTarget.dispatchEvent(entryFocusEvent)

            if (!entryFocusEvent.defaultPrevented) {
              const items = getItems().filter((item) => item.focusable)
              const activeItem = items.find((item) => item.active)
              const currentItem = items.find((item) => item.id === currentTabStopId())
              const candidateItems = [activeItem, currentItem, ...items].filter(
                (item): item is (typeof items)[number] => Boolean(item),
              )
              const candidateNodes = candidateItems
                .map((item) => item.ref.current)
                .filter((node): node is HTMLElement => node !== null)
              focusFirst(candidateNodes, preventScrollOnEntryFocus())
            }
          }

          isClickFocusRef.current = false
        },
      ),
      onMouseDown: composeEventHandlers<MouseEvent>(
        (event) => (props.onMouseDown as ((event: MouseEvent) => void) | undefined)?.(event),
        () => {
          isClickFocusRef.current = true
        },
      ),
    },
  )

  return (
    <RovingFocusProvider
      scope={props.__scopeRovingFocusGroup}
      currentTabStopId={currentTabStopId}
      dir={dir}
      loop={loop}
      onFocusableItemAdd={() => {
        focusableItemsCount(untrack(() => focusableItemsCount()) + 1)
      }}
      onFocusableItemRemove={() => {
        focusableItemsCount(untrack(() => focusableItemsCount()) - 1)
      }}
      onItemFocus={(tabStopId) => {
        setCurrentTabStopId(tabStopId)
      }}
      onItemShiftTab={() => {
        isTabbingBackOut(true)
      }}
      orientation={orientation}
    >
      <Primitive.div {...primitiveProps} ref={composedRefs} />
    </RovingFocusProvider>
  )
}

function RovingFocusGroupItem(props: ScopedProps<RovingFocusItemProps>): FictNode {
  const focusable = () =>
    props.focusable === undefined
      ? true
      : Boolean(readValue(props.focusable as MaybeAccessor<boolean | undefined>))
  const active = () =>
    props.active === undefined
      ? false
      : Boolean(readValue(props.active as MaybeAccessor<boolean | undefined>))
  const id = useId(() =>
    props.tabStopId === undefined
      ? undefined
      : readValue(props.tabStopId as MaybeAccessor<string | undefined>),
  )
  const context = useRovingFocusContext(ITEM_NAME, props.__scopeRovingFocusGroup)
  const isCurrentTabStop = () => context.currentTabStopId() === id()
  const getItems = useCollection(props.__scopeRovingFocusGroup)

  useLayoutEffect(() => {
    if (!focusable()) return

    context.onFocusableItemAdd()
    return () => {
      context.onFocusableItemRemove()
    }
  })

  const primitiveProps = mergeProps(
    {
      tabIndex: prop(() => (isCurrentTabStop() ? 0 : -1)),
      'data-orientation': prop(context.orientation),
    },
    prop(() => props as Record<string, unknown>),
    {
      __scopeRovingFocusGroup: undefined,
      active: undefined,
      children: undefined,
      focusable: undefined,
      tabStopId: undefined,
      onFocus: composeEventHandlers<FocusEvent>(
        (event) => (props.onFocus as ((event: FocusEvent) => void) | undefined)?.(event),
        () => {
          context.onItemFocus(id())
        },
      ),
      onKeyDown: composeEventHandlers<KeyboardEvent>(
        (event) => (props.onKeyDown as ((event: KeyboardEvent) => void) | undefined)?.(event),
        (event) => {
          if (event.key === 'Tab' && event.shiftKey) {
            context.onItemShiftTab()
            return
          }

          if (event.target !== event.currentTarget) return

          const focusIntent = getFocusIntent(event, context.orientation(), context.dir())
          if (focusIntent === undefined) return
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return

          event.preventDefault()

          const items = getItems().filter((item) => item.focusable)
          let candidateItems = items

          if (focusIntent === 'last') {
            candidateItems = [...candidateItems].reverse()
          } else if (focusIntent === 'prev' || focusIntent === 'next') {
            if (focusIntent === 'prev') {
              candidateItems = [...candidateItems].reverse()
            }

            const currentTarget = event.currentTarget as HTMLElement
            const currentIndex = candidateItems.findIndex(
              (item) => item.ref.current === currentTarget,
            )
            candidateItems = context.loop()
              ? wrapArray(candidateItems, currentIndex + 1)
              : candidateItems.slice(currentIndex + 1)
          }

          const nextTabStop = candidateItems[0]
          if (!nextTabStop) return

          context.onItemFocus(nextTabStop.id)
          const candidateIds = candidateItems.map((item) => item.id)

          setTimeout(() => {
            const latestItems = getItems().filter((item) => item.focusable)
            const candidateNodes = candidateIds
              .map(
                (candidateId) => latestItems.find((item) => item.id === candidateId)?.ref.current,
              )
              .filter((node): node is HTMLElement => node !== null)
            focusFirst(candidateNodes)
          })
        },
      ),
      onMouseDown: composeEventHandlers<MouseEvent>(
        (event) => (props.onMouseDown as ((event: MouseEvent) => void) | undefined)?.(event),
        (event) => {
          if (!focusable()) {
            event.preventDefault()
            return
          }

          context.onItemFocus(id())
        },
      ),
    },
  )
  const collectionItemData = { id, focusable, active } as unknown as ItemData

  return (
    <Collection.ItemSlot
      scope={props.__scopeRovingFocusGroup}
      {...collectionItemData}
      ref={props.ref as PossibleRef<HTMLSpanElement>}
    >
      <Primitive.span {...primitiveProps}>
        <>
          {reactive(() => {
            const children = props.children
            return typeof children === 'function'
              ? children({
                  hasTabStop: context.currentTabStopId() != null,
                  isCurrentTabStop: isCurrentTabStop(),
                })
              : children
          })}
        </>
      </Primitive.span>
    </Collection.ItemSlot>
  )
}

RovingFocusGroupItem.displayName = ITEM_NAME

const Root = RovingFocusGroup
const Item = RovingFocusGroupItem

export { createRovingFocusGroupScope, RovingFocusGroup, RovingFocusGroupItem, Root, Item }
export type { RovingFocusGroupProps, RovingFocusItemProps }
