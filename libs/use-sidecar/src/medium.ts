import type {
  FictComponent,
  MediumCallback,
  MiddlewareCallback,
  SideCarMedium,
  SideCarMediumOptions,
  SideMedium,
  SidePush,
} from './types.js'

function identity<T>(value: T): T {
  return value
}

function scheduleMicrotask(fn: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(fn)
    return
  }
  void Promise.resolve().then(fn)
}

function innerCreateMedium<T>(
  defaults?: T,
  middleware: MiddlewareCallback<T> = identity,
): SideMedium<T> {
  let buffer: SidePush<T> = []
  let assigned = false

  const medium: SideMedium<T> = {
    read(): T | undefined {
      if (assigned) {
        throw new Error(
          'Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useSidecar`.',
        )
      }

      if (buffer.length) {
        return (buffer as T[])[buffer.length - 1]
      }

      return defaults
    },

    useMedium(data: T) {
      const item = middleware(data, assigned)
      buffer.push(item)

      return () => {
        buffer = buffer.filter((entry: T) => entry !== item)
      }
    },

    assignSyncMedium(cb: MediumCallback<T>) {
      assigned = true

      while (buffer.length) {
        const queue = buffer as T[]
        buffer = []
        queue.forEach(cb)
      }

      buffer = {
        push(value: T) {
          cb(value)
        },
        filter() {
          return buffer
        },
      }
    },

    assignMedium(cb: MediumCallback<T>) {
      assigned = true

      let pendingQueue: T[] = []

      if (buffer.length) {
        const queue = buffer as T[]
        buffer = []
        queue.forEach(cb)
        pendingQueue = buffer as T[]
      }

      const executeQueue = () => {
        const queue = pendingQueue
        pendingQueue = []
        queue.forEach(cb)
      }

      const cycle = () => scheduleMicrotask(executeQueue)

      cycle()

      buffer = {
        push(value: T) {
          pendingQueue.push(value)
          cycle()
        },
        filter(filter: (value: T) => boolean) {
          pendingQueue = pendingQueue.filter(filter)
          return buffer
        },
      }
    },
  }

  return medium
}

export function createMedium<T>(
  defaults?: T,
  middleware: MiddlewareCallback<T> = identity,
): Readonly<SideMedium<T>> {
  return innerCreateMedium(defaults, middleware)
}

export function createSidecarMedium<TProps = Record<string, unknown>>(
  options: SideCarMediumOptions = {},
): Readonly<SideCarMedium<TProps>> {
  const medium = innerCreateMedium<FictComponent<TProps> | null>(
    null as FictComponent<TProps> | null,
  )

  medium.options = {
    async: true,
    ssr: false,
    ...options,
  }

  return medium as Readonly<SideCarMedium<TProps>>
}
