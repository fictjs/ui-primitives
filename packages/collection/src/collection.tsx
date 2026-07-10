import { type FictNode } from '@fictjs/runtime'
import { createSignal, type Signal } from '@fictjs/runtime/advanced'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope, type Scope } from '@fictjs/context'
import { createSlot, type SlotProps } from '@fictjs/slot'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

import { OrderedDict, type EntryOf } from './ordered-dictionary.js'
import { resolveRecord, shallowEqual } from './utils.js'

type CollectionElement = HTMLElement
type CollectionProps = SlotProps & {
  scope: Scope
}
type BaseItemData = {
  id?: string
}
type ItemDataWithElement<
  ItemData extends BaseItemData,
  ItemElement extends HTMLElement,
> = ItemData & {
  element: ItemElement
}
type ItemMap<ItemElement extends HTMLElement, ItemData extends BaseItemData> = OrderedDict<
  ItemElement,
  ItemDataWithElement<ItemData, ItemElement>
>
type SetCollectionState<T> = (value: T | ((previousValue: T) => T)) => void
type CollectionState<ItemElement extends HTMLElement, ItemData extends BaseItemData> = [
  itemMap: Signal<ItemMap<ItemElement, ItemData>>,
  setItemMap: SetCollectionState<ItemMap<ItemElement, ItemData>>,
]

function createCollection<ItemElement extends HTMLElement, ItemData extends object = object>(
  name: string,
) {
  type AllItemData = ItemData & BaseItemData

  const PROVIDER_NAME = name + 'CollectionProvider'
  const [createCollectionContext, createCollectionScope] = createContextScope(PROVIDER_NAME)

  type ContextValue = {
    collectionElement: () => CollectionElement | null
    collectionRef: PossibleRef<CollectionElement>
    collectionRefObject: { current: CollectionElement | null }
    itemMap: () => ItemMap<ItemElement, AllItemData>
    setItemMap: SetCollectionState<ItemMap<ItemElement, AllItemData>>
  }

  const [CollectionContextProvider, useCollectionContext] = createCollectionContext<ContextValue>(
    PROVIDER_NAME,
    {
      collectionElement: () => null,
      collectionRef: { current: null },
      collectionRefObject: { current: null },
      itemMap: () => new OrderedDict(),
      setItemMap: () => {},
    },
  )

  function CollectionProvider(props: {
    children?: FictNode | FictNode[]
    scope: Scope
    state?: CollectionState<ItemElement, AllItemData>
  }): FictNode {
    const state = props.state ?? useInitCollection()
    return (
      <CollectionProviderImpl scope={props.scope} state={state}>
        {props.children}
      </CollectionProviderImpl>
    )
  }

  CollectionProvider.displayName = PROVIDER_NAME

  function CollectionProviderImpl(props: {
    children?: FictNode | FictNode[]
    scope: Scope
    state: CollectionState<ItemElement, AllItemData>
  }): FictNode {
    const collectionElement = createSignal<CollectionElement | null>(null)
    const collectionRefObject = { current: null as CollectionElement | null }
    const collectionRef = (node: CollectionElement | null) => {
      collectionRefObject.current = node
      collectionElement(node)
    }
    const [itemMap, setItemMap] = props.state

    return (
      <CollectionContextProvider
        scope={props.scope}
        collectionElement={collectionElement}
        collectionRef={collectionRef}
        collectionRefObject={collectionRefObject}
        itemMap={itemMap}
        setItemMap={setItemMap}
      >
        {props.children}
      </CollectionContextProvider>
    )
  }

  CollectionProviderImpl.displayName = PROVIDER_NAME + 'Impl'

  const COLLECTION_SLOT_NAME = name + 'CollectionSlot'
  const CollectionSlotImpl = createSlot(COLLECTION_SLOT_NAME)
  const CollectionSlotRenderer = CollectionSlotImpl as unknown as (
    props: Record<string, unknown>,
  ) => FictNode

  function CollectionSlot(
    props: CollectionProps & { ref?: PossibleRef<CollectionElement> },
  ): FictNode {
    const { scope, children, ref: forwardedRef } = props
    const context = useCollectionContext(COLLECTION_SLOT_NAME, scope)
    const composedRefs = useComposedRefs(
      forwardedRef as PossibleRef<CollectionElement>,
      context.collectionRef as PossibleRef<CollectionElement>,
    )

    return CollectionSlotRenderer({ children, ref: composedRefs as PossibleRef<Element> })
  }

  CollectionSlot.displayName = COLLECTION_SLOT_NAME

  const ITEM_SLOT_NAME = name + 'CollectionItemSlot'
  const ITEM_DATA_ATTR = 'data-radix-collection-item'
  const CollectionItemSlotImpl = createSlot(ITEM_SLOT_NAME)
  const CollectionItemSlotRenderer = CollectionItemSlotImpl as unknown as (
    props: Record<string, unknown>,
  ) => FictNode

  type CollectionItemSlotProps = AllItemData & {
    children?: FictNode | FictNode[]
    scope: Scope
    ref?: PossibleRef<ItemElement>
  }

  function CollectionItemSlot(props: CollectionItemSlotProps): FictNode {
    const { scope, children, ref: forwardedRef, ...itemData } = props
    const element = createSignal<ItemElement | null>(null)
    const elementRefObject = { current: null as ItemElement | null }
    const composedRefs = useComposedRefs(
      forwardedRef as PossibleRef<ItemElement>,
      elementRefObject as PossibleRef<ItemElement>,
      (node) => element(node),
    )
    const context = useCollectionContext(ITEM_SLOT_NAME, scope)
    let memoizedItemData = resolveRecord(itemData) as AllItemData

    useLayoutEffect(() => {
      const currentElement = element()
      const nextItemData = resolveRecord(itemData) as AllItemData

      if (!shallowEqual(memoizedItemData, nextItemData)) {
        memoizedItemData = nextItemData
      }

      context.setItemMap((map: ItemMap<ItemElement, AllItemData>) => {
        if (!currentElement) {
          return map
        }

        if (!map.has(currentElement)) {
          map.set(currentElement, { ...memoizedItemData, element: currentElement })
          return map.toSorted(sortByDocumentPosition)
        }

        return map
          .set(currentElement, { ...memoizedItemData, element: currentElement })
          .toSorted(sortByDocumentPosition)
      })

      return () => {
        context.setItemMap((map: ItemMap<ItemElement, AllItemData>) => {
          if (!currentElement || !map.has(currentElement)) {
            return map
          }

          map.delete(currentElement)
          return new OrderedDict(map)
        })
      }
    })

    return CollectionItemSlotRenderer({
      children,
      ref: composedRefs as PossibleRef<Element>,
      [ITEM_DATA_ATTR]: '',
    })
  }

  CollectionItemSlot.displayName = ITEM_SLOT_NAME

  function useInitCollection() {
    let currentItemMap = new OrderedDict<
      ItemElement,
      ItemDataWithElement<AllItemData, ItemElement>
    >()
    const itemMap = createSignal<ItemMap<ItemElement, AllItemData>>(currentItemMap)
    const setItemMap: SetCollectionState<ItemMap<ItemElement, AllItemData>> = (value) => {
      currentItemMap =
        typeof value === 'function'
          ? (
              value as (
                previousValue: ItemMap<ItemElement, AllItemData>,
              ) => ItemMap<ItemElement, AllItemData>
            )(currentItemMap)
          : value
      itemMap(currentItemMap)
    }

    return [itemMap, setItemMap] as CollectionState<ItemElement, AllItemData>
  }

  function useCollection(scope: Scope) {
    const { itemMap } = useCollectionContext(name + 'CollectionConsumer', scope)
    return itemMap
  }

  return [
    { Provider: CollectionProvider, Slot: CollectionSlot, ItemSlot: CollectionItemSlot },
    { createCollectionScope, useCollection, useInitCollection },
  ] as const
}

function isElementPreceding(a: Element, b: Element) {
  return Boolean(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING)
}

function sortByDocumentPosition<E extends HTMLElement, T extends BaseItemData>(
  a: EntryOf<ItemMap<E, T>>,
  b: EntryOf<ItemMap<E, T>>,
) {
  return !a[1].element || !b[1].element
    ? 0
    : isElementPreceding(a[1].element, b[1].element)
      ? -1
      : 1
}

export { createCollection }
export type { CollectionProps }
