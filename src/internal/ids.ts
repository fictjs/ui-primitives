import { createContext, hasContext, useContext, type FictNode } from '@fictjs/runtime'

interface IdContextValue {
  prefix: string
  next: () => number
}

export interface IdProviderProps {
  prefix?: string
  children?: FictNode
}

const IdContext = createContext<IdContextValue | null>(null)
const globalCounters = new Map<string, number>()

function nextCounter(prefix: string): number {
  const current = globalCounters.get(prefix) ?? 0
  const next = current + 1
  globalCounters.set(prefix, next)
  return next
}

function tryReadIdContext(): IdContextValue | null {
  try {
    if (!hasContext(IdContext)) {
      return null
    }
    return useContext(IdContext)
  } catch {
    return null
  }
}

export function createId(prefix = 'fict-ui'): string {
  return `${prefix}-${nextCounter(prefix)}`
}

export function useId(id: string | undefined, prefix = 'fict-ui'): string {
  if (id) return id

  const context = tryReadIdContext()
  if (context) {
    return `${context.prefix}-${context.next()}`
  }

  return createId(prefix)
}

export function IdProvider(props: IdProviderProps): FictNode {
  const parent = tryReadIdContext()
  let localCounter = 0

  const prefix = props.prefix ?? parent?.prefix ?? 'fict-ui'
  const context: IdContextValue = {
    prefix,
    next: () => {
      localCounter += 1
      return localCounter
    },
  }

  return {
    type: IdContext.Provider,
    props: {
      value: context,
      children: props.children,
    },
  } as unknown as FictNode
}
