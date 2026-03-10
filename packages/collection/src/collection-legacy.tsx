import { type FictNode } from '@fictjs/runtime'

import { useComposedRefs, type PossibleRef } from '@fictjs/compose-refs'
import { createContextScope } from '@fictjs/context'
import { createSlot, type SlotProps } from '@fictjs/slot'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

import { resolveRecord } from './utils.js'

type CollectionElement = HTMLElement
type CollectionProps = SlotProps & {
  scope: any
}
type ItemRefObject<ItemElement extends HTMLElement> = { current: ItemElement | null }

function createCollection<ItemElement extends HTMLElement, ItemData extends object = {}>(name: string) {
  const PROVIDER_NAME = name + 'CollectionProvider'
  const [createCollectionContext, createCollectionScope] = createContextScope(PROVIDER_NAME)

  type ContextValue = {
    collectionRef: { current: CollectionElement | null }
    itemMap: Map<ItemRefObject<ItemElement>, { ref: ItemRefObject<ItemElement> } & ItemData>
  }

  const [CollectionProviderImpl, useCollectionContext] = createCollectionContext<ContextValue>(
    PROVIDER_NAME,
    { collectionRef: { current: null }, itemMap: new Map() },
  )

  function CollectionProvider(props: { children?: FictNode | FictNode[]; scope: any }): FictNode {
    const collectionRef = { current: null as CollectionElement | null }
    const itemMap = new Map<ItemRefObject<ItemElement>, { ref: ItemRefObject<ItemElement> } & ItemData>()

    return (
      <CollectionProviderImpl scope={props.scope} collectionRef={collectionRef} itemMap={itemMap}>
        {props.children}
      </CollectionProviderImpl>
    )
  }

  CollectionProvider.displayName = PROVIDER_NAME

  const COLLECTION_SLOT_NAME = name + 'CollectionSlot'
  const CollectionSlotImpl = createSlot(COLLECTION_SLOT_NAME)
  const CollectionSlotRenderer = CollectionSlotImpl as unknown as (props: Record<string, unknown>) => FictNode

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
  const CollectionItemSlotRenderer =
    CollectionItemSlotImpl as unknown as (props: Record<string, unknown>) => FictNode

  type CollectionItemSlotProps = ItemData & {
    children?: FictNode | FictNode[]
    scope: any
    ref?: PossibleRef<ItemElement>
  }

  function CollectionItemSlot(props: CollectionItemSlotProps): FictNode {
    const { scope, children, ref: forwardedRef, ...itemData } = props
    const itemRef = { current: null as ItemElement | null }
    const composedRefs = useComposedRefs(
      forwardedRef as PossibleRef<ItemElement>,
      itemRef as PossibleRef<ItemElement>,
    )
    const context = useCollectionContext(ITEM_SLOT_NAME, scope)

    useLayoutEffect(() => {
      context.itemMap.set(itemRef, {
        ref: itemRef,
        ...(resolveRecord(itemData) as ItemData),
      })

      return () => {
        context.itemMap.delete(itemRef)
      }
    })

    return CollectionItemSlotRenderer({
      children,
      ref: composedRefs as PossibleRef<Element>,
      [ITEM_DATA_ATTR]: '',
    })
  }

  CollectionItemSlot.displayName = ITEM_SLOT_NAME

  function useCollection(scope: any) {
    const context = useCollectionContext(name + 'CollectionConsumer', scope)

    return () => {
      const collectionNode = context.collectionRef.current
      if (!collectionNode) return []

      const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`))
      const items = Array.from(context.itemMap.values())

      return items.sort(
        (a, b) => orderedNodes.indexOf(a.ref.current as Element) - orderedNodes.indexOf(b.ref.current as Element),
      )
    }
  }

  return [
    { Provider: CollectionProvider, Slot: CollectionSlot, ItemSlot: CollectionItemSlot },
    useCollection,
    createCollectionScope,
  ] as const
}

export { createCollection }
export type { CollectionProps }
