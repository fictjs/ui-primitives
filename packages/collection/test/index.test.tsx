/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { createCollection, unstable_createCollection } from '../src/index.js'
import type { OrderedDict } from '../src/ordered-dictionary.js'

type LegacyItem = {
  ref: { current: HTMLDivElement | null }
  textValue: string
}

type ModernItem = {
  element: HTMLDivElement
  textValue: string
}

const [LegacyCollection, useLegacyCollection] = createCollection<
  HTMLDivElement,
  { textValue: string }
>('LegacyTest')
const [ModernCollection, { useCollection: useModernCollection, useInitCollection }] =
  unstable_createCollection<HTMLDivElement, { textValue: string }>('ModernTest')

let readLegacyItems: (() => LegacyItem[]) | undefined
let readModernCollection: (() => OrderedDict<HTMLDivElement, ModernItem>) | undefined

function LegacyConsumer() {
  readLegacyItems = useLegacyCollection(undefined)
  return null
}

function ModernConsumer() {
  readModernCollection = useModernCollection(undefined) as () => OrderedDict<
    HTMLDivElement,
    ModernItem
  >
  return null
}

function LegacyHarness(props: { showMiddle: () => boolean }) {
  return (
    <LegacyCollection.Provider scope={undefined}>
      <LegacyCollection.Slot scope={undefined}>
        <div data-testid="legacy-root">
          <LegacyCollection.ItemSlot scope={undefined} textValue="first">
            <div data-value="first">First</div>
          </LegacyCollection.ItemSlot>
          <>
            {reactive(() =>
              props.showMiddle() ? (
                <LegacyCollection.ItemSlot scope={undefined} textValue="middle">
                  <div data-value="middle">Middle</div>
                </LegacyCollection.ItemSlot>
              ) : null,
            )}
          </>
          <LegacyCollection.ItemSlot scope={undefined} textValue="last">
            <div data-value="last">Last</div>
          </LegacyCollection.ItemSlot>
        </div>
      </LegacyCollection.Slot>
      <LegacyConsumer />
    </LegacyCollection.Provider>
  )
}

function ModernHarness(props: { showMiddle: () => boolean }) {
  const state = useInitCollection()

  return (
    <ModernCollection.Provider scope={undefined} state={state}>
      <ModernCollection.Slot scope={undefined}>
        <div data-testid="modern-root">
          <ModernCollection.ItemSlot scope={undefined} textValue="first">
            <div data-value="first">First</div>
          </ModernCollection.ItemSlot>
          <>
            {reactive(() =>
              props.showMiddle() ? (
                <ModernCollection.ItemSlot scope={undefined} textValue="middle">
                  <div data-value="middle">Middle</div>
                </ModernCollection.ItemSlot>
              ) : null,
            )}
          </>
          <ModernCollection.ItemSlot scope={undefined} textValue="last">
            <div data-value="last">Last</div>
          </ModernCollection.ItemSlot>
        </div>
      </ModernCollection.Slot>
      <ModernConsumer />
    </ModernCollection.Provider>
  )
}

function ModernReactiveDataHarness(props: { firstText: () => string }) {
  const state = useInitCollection()

  return (
    <ModernCollection.Provider scope={undefined} state={state}>
      <ModernCollection.Slot scope={undefined}>
        <div>
          <ModernCollection.ItemSlot
            scope={undefined}
            textValue={props.firstText as unknown as string}
          >
            <div>First</div>
          </ModernCollection.ItemSlot>
          <ModernCollection.ItemSlot scope={undefined} textValue="last">
            <div>Last</div>
          </ModernCollection.ItemSlot>
        </div>
      </ModernCollection.Slot>
      <ModernConsumer />
    </ModernCollection.Provider>
  )
}

async function flushEffects(cycles = 4): Promise<void> {
  for (let index = 0; index < cycles; index++) {
    await new Promise<void>((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(resolve)
        return
      }

      Promise.resolve().then(resolve)
    })
  }
}

describe('@fictjs/collection', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    readLegacyItems = undefined
    readModernCollection = undefined
    vi.restoreAllMocks()
  })

  it('orders legacy collection items and removes unmounted entries', async () => {
    const showMiddle = createSignal(true)
    const container = document.createElement('div')
    document.body.append(container)

    render(() => <LegacyHarness showMiddle={showMiddle} />, container)

    await flushEffects()

    expect(readLegacyItems?.().map((item) => item.textValue)).toEqual(['first', 'middle', 'last'])

    showMiddle(false)
    await flushEffects()

    expect(readLegacyItems?.().map((item) => item.textValue)).toEqual(['first', 'last'])
  })

  it('indexes legacy DOM order once instead of scanning it for every comparison', async () => {
    const showMiddle = createSignal(true)
    const container = document.createElement('div')
    document.body.append(container)

    render(() => <LegacyHarness showMiddle={showMiddle} />, container)
    await flushEffects()

    let domOrderScans = 0
    const originalIndexOf = Array.prototype.indexOf
    vi.spyOn(Array.prototype, 'indexOf').mockImplementation(function (
      this: unknown[],
      searchElement: unknown,
      fromIndex?: number,
    ) {
      if (searchElement instanceof Element && this.some((item) => item instanceof Element)) {
        domOrderScans += 1
      }
      return originalIndexOf.call(this, searchElement, fromIndex)
    })
    const items = readLegacyItems?.()

    expect(items?.map((item) => item.textValue)).toEqual(['first', 'middle', 'last'])
    expect(domOrderScans).toBe(0)
  })

  it('tracks ordered-dictionary collections with externally initialized state', async () => {
    const showMiddle = createSignal(true)
    const container = document.createElement('div')
    document.body.append(container)

    render(() => <ModernHarness showMiddle={showMiddle} />, container)

    await flushEffects()

    let collection = readModernCollection?.()
    expect(collection?.size).toBe(3)
    expect(Array.from(collection?.values() ?? []).map((item) => item.textValue)).toEqual([
      'first',
      'middle',
      'last',
    ])

    const firstElement = collection?.keys().next().value as HTMLDivElement | undefined
    expect(firstElement).toBeDefined()
    expect(collection?.get(firstElement as HTMLDivElement)?.textValue).toBe('first')

    showMiddle(false)
    await flushEffects()

    collection = readModernCollection?.()
    expect(collection?.size).toBe(2)
    expect(Array.from(collection?.values() ?? []).map((item) => item.textValue)).toEqual([
      'first',
      'last',
    ])
  })

  it('updates modern item data without re-sorting unchanged elements', async () => {
    const firstText = createSignal('first')
    const container = document.createElement('div')
    document.body.append(container)

    render(() => <ModernReactiveDataHarness firstText={firstText} />, container)
    await flushEffects()

    const compareDocumentPosition = vi.spyOn(Element.prototype, 'compareDocumentPosition')
    firstText('updated')
    await flushEffects()

    expect(
      Array.from(readModernCollection?.().values() ?? []).map((item) => item.textValue),
    ).toEqual(['updated', 'last'])
    expect(compareDocumentPosition).not.toHaveBeenCalled()
  })
})
