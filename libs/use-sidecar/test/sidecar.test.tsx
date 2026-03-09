import { render } from '@fictjs/runtime'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import { createSidecarMedium, env, exportSidecar, setConfig, sidecar } from '../src/index.js'

const tick = async (count = 2) => {
  for (let index = 0; index < count; index++) {
    await Promise.resolve()
  }
}

describe('sidecar', () => {
  beforeEach(() => {
    env.forceCache = false
    env.isNode = false
    setConfig({ onError: (error: Error) => console.error(error) })
  })

  afterEach(() => {
    env.forceCache = false
    env.isNode = typeof window === 'undefined' || typeof document === 'undefined'
  })

  it('does not import sidecars on node when ssr is disabled', async () => {
    env.isNode = true

    const importer = vi.fn(async () => ((() => <div>test</div>) as () => any))
    const Sidecar = sidecar(importer)
    const container = document.createElement('div')

    const dispose = render(() => <Sidecar />, container)
    await tick()

    expect(importer).not.toHaveBeenCalled()
    expect(container.textContent).toBe('')

    dispose()
  })

  it('loads imported components and reuses the cache on remount', async () => {
    const importer = vi.fn(async () => ((() => <div>test</div>) as () => any))
    const Sidecar = sidecar(importer)
    const container = document.createElement('div')

    let dispose = render(() => <Sidecar />, container)

    expect(container.textContent).toBe('')
    await tick(5)
    expect(container.textContent).toBe('test')
    expect(importer).toHaveBeenCalledTimes(1)

    dispose()
    dispose = render(() => <Sidecar />, container)

    expect(container.textContent).toBe('test')
    expect(importer).toHaveBeenCalledTimes(1)

    dispose()
  })

  it('loads exported sidecars through a medium', async () => {
    const medium = createSidecarMedium<{ x?: number }>()
    const SideEffect = exportSidecar(medium, (props: { x?: number }) => (
      <div>value:{String(props.x)}</div>
    ))
    const importer = vi.fn(async () => ({ default: SideEffect }))
    const Sidecar = sidecar(importer)
    const container = document.createElement('div')

    const dispose = render(() => <Sidecar sideCar={medium} x={42} />, container)

    expect(container.textContent).toBe('')
    await tick(5)

    expect(container.textContent).toBe('value:42')
    expect(importer).toHaveBeenCalledTimes(1)

    dispose()
  })

  it('throws when an exported sidecar is rendered without its medium', () => {
    const medium = createSidecarMedium()
    const Exported = exportSidecar(medium, () => <div>test</div>)
    const container = document.createElement('div')

    expect(() => render(() => <Exported sideCar={null as any} />, container)).toThrow(
      'Sidecar: please provide `sideCar` property to import the right car',
    )
  })

  it('supports node-side loading when ssr is enabled on the medium', async () => {
    env.isNode = true

    const medium = createSidecarMedium({ ssr: true })
    const SideEffect = exportSidecar(medium, () => <div>ssr</div>)
    const importer = vi.fn(async () => ({ default: SideEffect }))
    const Sidecar = sidecar(importer)
    const container = document.createElement('div')

    const dispose = render(() => <Sidecar sideCar={medium} />, container)

    expect(container.textContent).toBe('')
    await tick(5)

    expect(container.textContent).toBe('ssr')
    expect(importer).toHaveBeenCalledTimes(1)

    dispose()
  })

  it('reports importer errors through config.onError and renders the fallback', async () => {
    env.isNode = false

    const onError = vi.fn()
    setConfig({ onError })

    const importer = vi.fn(async () => {
      throw new Error('boom')
    })
    const Sidecar = sidecar(importer, <span>failed</span>)
    const container = document.createElement('div')

    const dispose = render(() => <Sidecar />, container)
    await tick(5)

    expect(onError).toHaveBeenCalledTimes(1)
    expect((onError.mock.calls[0] ?? [])[0]).toBeInstanceOf(Error)
    expect(container.textContent).toBe('failed')

    dispose()
  })
})
