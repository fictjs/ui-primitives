import { render } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'
import { describe, expect, it } from 'vitest'

import { env, renderCar, sidecar } from '../src/index.js'

const tick = async (count = 3) => {
  for (let index = 0; index < count; index++) {
    await Promise.resolve()
  }
}

describe('renderCar', () => {
  it('uses defaults until the sidecar loads and then reacts to sidecar updates', async () => {
    let resolveExternal: ((value: { default: (props: any) => any }) => void) | undefined

    const external = new Promise<{ default: (props: any) => any }>((resolve) => {
      resolveExternal = resolve
    })

    env.forceCache = true
    env.isNode = false

    const source = createSignal(1)
    const calls: Array<{ y: number }> = []

    const Car = sidecar(() => external)
    const CarRender = renderCar(Car, (props: { x: number }) => [{ y: props.x + 1 }])

    const container = document.createElement('div')
    const dispose = render(
      () => (
        <div>
          <CarRender x={1}>
            {(payload: { y: number }) => {
              calls.push(payload)
              return payload.y
            }}
          </CarRender>
        </div>
      ),
      container,
    )

    expect(container.textContent).toBe('2')
    expect(calls).toEqual([{ y: 2 }])

    resolveExternal?.({
      default: (props: { children: (payload: { y: number }) => unknown }) => (
        <>{reactive(() => props.children({ y: (source() + 2) * 2 }))}</>
      ),
    })

    await tick()

    expect(container.textContent).toBe('6')
    expect(calls).toEqual([{ y: 2 }, { y: 6 }])

    source(2)
    await tick()

    expect(container.textContent).toBe('8')
    expect(calls).toEqual([{ y: 2 }, { y: 6 }, { y: 8 }])

    dispose()
    env.forceCache = false
  })
})
