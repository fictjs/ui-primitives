/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { createCollection, unstable_createCollection } from '../src/index.js'
import { OrderedDict } from '../src/ordered-dictionary.js'

type LegacyItem = {
  ref: { current: HTMLDivElement | null }
  textValue: string
}

type ModernItem = {
  element: HTMLDivElement
  textValue: string
}

const [LegacyCollection, useLegacyCollection] = createCollection<HTMLDivElement, { textValue: string }>('LegacyTest')
const [ModernCollection, { useCollection: useModernCollection, useInitCollection }] =
  unstable_createCollection<HTMLDivElement, { textValue: string }>('ModernTest')

let readLegacyItems: (() => LegacyItem[]) | undefined
let readModernCollection: (() => OrderedDict<HTMLDivElement, ModernItem>) | undefined

function LegacyConsumer() {
  readLegacyItems = useLegacyCollection(undefined)
  return null
}

function ModernConsumer() {
  readModernCollection = useModernCollection(undefined) as () => OrderedDict<HTMLDivElement, ModernItem>
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
            {() =>
              props.showMiddle() ? (
                <LegacyCollection.ItemSlot scope={undefined} textValue="middle">
                  <div data-value="middle">Middle</div>
                </LegacyCollection.ItemSlot>
              ) : null}
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
            {() =>
              props.showMiddle() ? (
                <ModernCollection.ItemSlot scope={undefined} textValue="middle">
                  <div data-value="middle">Middle</div>
                </ModernCollection.ItemSlot>
              ) : null}
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
    expect(Array.from(collection?.values() ?? []).map((item) => item.textValue)).toEqual(['first', 'last'])
  })
})
