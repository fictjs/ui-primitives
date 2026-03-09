import { describe, expect, it, vi } from 'vitest'

import * as sidecarApi from '../src/index.js'

const tick = () =>
  new Promise<void>((resolve) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve)
      return
    }

    void Promise.resolve().then(resolve)
  })

describe('createMedium', () => {
  it('reads the latest buffered value', () => {
    const medium = sidecarApi.createMedium(42)

    expect(medium.read()).toBe(42)

    medium.useMedium(24)
    medium.useMedium(100)

    expect(medium.read()).toBe(100)
  })

  it('flushes buffered values asynchronously when assigned', async () => {
    const medium = sidecarApi.createMedium<number>()
    medium.useMedium(42)
    medium.useMedium(24)

    const spy = vi.fn((value: number) => {
      if (value === 42) {
        medium.useMedium(100)
      }
    })

    medium.assignMedium(spy)

    expect(spy.mock.calls.map((call) => call[0])).toEqual([42, 24])

    await tick()

    expect(spy.mock.calls.map((call) => call[0])).toEqual([42, 24, 100])
  })

  it('flushes synchronously when assignSyncMedium is used', () => {
    const medium = sidecarApi.createMedium<number>()
    medium.useMedium(42)
    medium.useMedium(24)

    const spy = vi.fn((value: number) => {
      if (value === 42) {
        medium.useMedium(100)
      }
    })

    medium.assignSyncMedium(spy)

    expect(spy.mock.calls.map((call) => call[0])).toEqual([42, 24, 100])
  })

  it('pushes new values after assignment', async () => {
    const medium = sidecarApi.createMedium<number>()
    medium.useMedium(42)

    const spy = vi.fn<(value: number) => void>()
    medium.assignMedium(spy)
    medium.useMedium(24)

    expect(spy.mock.calls.map((call) => call[0])).toEqual([42])

    await tick()

    expect(spy.mock.calls.map((call) => call[0])).toEqual([42, 24])
  })

  it('supports callback-style module exports typing', async () => {
    const utilMedium = sidecarApi.createMedium<(api: typeof sidecarApi) => void>()
    const importer = vi.fn(() => Promise.resolve((() => null) as () => null))
    const seen = vi.fn((api: typeof sidecarApi) => {
      const Comp = api.sidecar(importer)
      expect(typeof Comp).toBe('function')
    })

    utilMedium.useMedium(seen)
    utilMedium.assignMedium((cb: (api: typeof sidecarApi) => void) => cb(sidecarApi))

    await tick()

    expect(seen).toHaveBeenCalledTimes(1)
  })
})
