import {
  createElement,
  createPortal as createFictPortal,
  type FictNode,
  type JSX,
} from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { useComposedRefs } from '@fictjs/compose-refs'
import { Primitive } from '@fictjs/primitive'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

type MaybeAccessor<T> = T | (() => T)
type RegionType = 'polite' | 'assertive' | 'off'
type RegionRole = 'status' | 'alert' | 'log' | 'none'

type AnnounceProps = Omit<JSX.IntrinsicElements['div'], 'children' | 'role'> & {
  'aria-atomic'?: boolean | 'true' | 'false'
  'aria-relevant'?: string | string[]
  children: FictNode | FictNode[]
  regionIdentifier?: MaybeAccessor<string | undefined>
  role?: RegionRole
  type?: MaybeAccessor<RegionType>
}

type LiveRegionOptions = {
  type: RegionType
  relevant?: string | undefined
  role: RegionRole
  atomic?: boolean | undefined
  id?: string | undefined
}

const ROLES: Record<RegionType, RegionRole> = {
  polite: 'status',
  assertive: 'alert',
  off: 'none',
}

const listenerMap = new Map<Element, number>()

function readValue<T>(value: MaybeAccessor<T>): T {
  if (typeof value === 'function' && value.length === 0) {
    return (value as () => T)()
  }

  return value as T
}

function buildLiveRegionElement(
  ownerDocument: Document,
  { type, relevant, role, atomic, id }: LiveRegionOptions,
): HTMLElement {
  const element = ownerDocument.createElement('div')

  element.setAttribute(getLiveRegionPartDataAttr(id), '')
  element.setAttribute(
    'style',
    'position: absolute; top: -1px; width: 1px; height: 1px; overflow: hidden;',
  )

  const parent = ownerDocument.body ?? ownerDocument.documentElement
  parent?.appendChild(element)

  element.setAttribute('aria-live', type)
  element.setAttribute('aria-atomic', String(atomic || false))
  element.setAttribute('role', role)
  if (relevant) {
    element.setAttribute('aria-relevant', relevant)
  }

  return element
}

function buildSelector({ type, relevant, role, atomic, id }: LiveRegionOptions): string {
  return `[${getLiveRegionPartDataAttr(id)}]${[
    ['aria-live', type],
    ['aria-atomic', atomic],
    ['aria-relevant', relevant],
    ['role', role],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([attr, value]) => `[${attr}=${String(value)}]`)
    .join('')}`
}

function getLiveRegionPartDataAttr(id?: string): string {
  return 'data-radix-announce-region' + (id ? `-${id}` : '')
}

function Announce(props: AnnounceProps): FictNode {
  const {
    'aria-relevant': ariaRelevant,
    children,
    ref: forwardedRef,
    role: roleProp,
    type: typeProp = 'polite',
    regionIdentifier,
    ...regionProps
  } = props

  const ownerDocument = createSignal<Document | null>(
    typeof document !== 'undefined' ? document : null,
  )
  const region = createSignal<HTMLElement | null>(null)
  const ref = useComposedRefs(forwardedRef, (node: HTMLDivElement | null) => {
    if (node) {
      ownerDocument(node.ownerDocument)
    }
  })

  const relevant = () => {
    if (!ariaRelevant) return undefined
    return Array.isArray(ariaRelevant) ? ariaRelevant.join(' ') : ariaRelevant
  }

  const type = () => readValue(typeProp)
  const role = () => roleProp ?? ROLES[type()]
  const id = () => readValue(regionIdentifier)
  const atomic = () => ['true', true].includes(regionProps['aria-atomic'] as boolean | string)

  const getLiveRegionElement = (): HTMLElement | null => {
    const currentOwnerDocument = ownerDocument()
    if (!currentOwnerDocument) return null

    const options = {
      type: type(),
      role: role(),
      relevant: relevant(),
      id: id(),
      atomic: atomic(),
    }
    const selector = buildSelector(options)
    const existing = currentOwnerDocument.querySelector(selector)

    return (existing as HTMLElement | null) ?? buildLiveRegionElement(currentOwnerDocument, options)
  }

  useLayoutEffect(() => {
    region(getLiveRegionElement())
  })

  useLayoutEffect(() => {
    const currentOwnerDocument = ownerDocument()
    const regionElement = getLiveRegionElement()

    if (!currentOwnerDocument || !regionElement) return

    const doc = currentOwnerDocument
    const liveRegionElement = regionElement

    function updateAttributesOnVisibilityChange() {
      liveRegionElement.setAttribute('role', doc.hidden ? 'none' : role())
      liveRegionElement.setAttribute('aria-live', doc.hidden ? 'off' : type())
    }

    const currentCount = listenerMap.get(liveRegionElement) ?? 0
    if (currentCount === 0) {
      doc.addEventListener('visibilitychange', updateAttributesOnVisibilityChange)
    }

    listenerMap.set(liveRegionElement, currentCount + 1)
    updateAttributesOnVisibilityChange()

    return () => {
      const announceCount = listenerMap.get(liveRegionElement) ?? 0
      if (announceCount <= 1) {
        listenerMap.delete(liveRegionElement)
        doc.removeEventListener('visibilitychange', updateAttributesOnVisibilityChange)
        return
      }

      listenerMap.set(liveRegionElement, announceCount - 1)
    }
  })

  return (
    <>
      <Primitive.div {...(regionProps as Record<string, unknown>)} ref={ref}>
        {children}
      </Primitive.div>
      {reactive(() => {
        const liveRegion = region()
        if (!liveRegion) return null

        return createFictPortal(liveRegion, () => <div>{children}</div>, createElement)
      })}
    </>
  )
}

Announce.displayName = 'Announce'

const Root = Announce

export { Announce, Root }
export type { AnnounceProps }
