import { createEffect } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { config } from './config.js'
import { env } from './env.js'
import type { Accessor, FictComponent, Importer, SideMedium } from './types.js'

type SidecarOptions = {
  async?: boolean
  ssr?: boolean
}

const cache = new WeakMap<object, unknown>()

function getOptions(effect?: { options?: Record<string, unknown> }): SidecarOptions {
  const options = effect?.options
  const nextOptions: SidecarOptions = {}

  if (typeof options?.async === 'boolean') {
    nextOptions.async = options.async
  }

  if (typeof options?.ssr === 'boolean') {
    nextOptions.ssr = options.ssr
  }

  return nextOptions
}

function reportError(error: Error): void {
  try {
    config.onError(error)
  } catch (configError) {
    console.error(configError)
  }
}

function resolveImportedCar<TProps extends Record<string, unknown>>(
  importer: Importer<TProps>,
  effect?: SideMedium<FictComponent<TProps>>,
): Promise<FictComponent<TProps>> {
  return importer().then((car: Awaited<ReturnType<Importer<TProps>>>) => {
    const resolved = effect ? effect.read() : 'default' in car ? car.default : car

    if (resolved) {
      return resolved
    }

    console.error('Sidecar error: with importer', importer)

    if (effect) {
      console.error('Sidecar error: with medium', effect)
      throw new Error('Sidecar medium was not found')
    }

    throw new Error('Sidecar was not found in exports')
  })
}

export function useSidecar<TProps extends Record<string, unknown>>(
  importer: Importer<TProps>,
  effect?: SideMedium<FictComponent<TProps>>,
): [Accessor<FictComponent<TProps> | null>, Accessor<Error | null>] {
  const options = getOptions(effect)

  if (env.isNode && !options.ssr) {
    return [() => null, () => null]
  }

  return useRealSidecar(importer, effect)
}

function useRealSidecar<TProps extends Record<string, unknown>>(
  importer: Importer<TProps>,
  effect?: SideMedium<FictComponent<TProps>>,
): [Accessor<FictComponent<TProps> | null>, Accessor<Error | null>] {
  const options = getOptions(effect)
  const couldUseCache = env.forceCache || (env.isNode && !!options.ssr) || !options.async
  const initialCar = couldUseCache
    ? (cache.get(importer as object) as FictComponent<TProps> | undefined)
    : undefined

  const car = createSignal<FictComponent<TProps> | null>(initialCar ?? null)
  const error = createSignal<Error | null>(null)

  if (!initialCar) {
    createEffect(() => {
      let active = true

      void resolveImportedCar(importer, effect)
        .then((resolved) => {
          if (!active) return
          cache.set(importer as object, resolved)
          car(resolved)
        })
        .catch((nextError) => {
          if (!active) return
          const resolvedError =
            nextError instanceof Error ? nextError : new Error(String(nextError))
          error(resolvedError)
          reportError(resolvedError)
        })

      return () => {
        active = false
      }
    })
  }

  return [car, error]
}
