import {
  createContext as createBaseContext,
  useContext as useBaseContext,
  type Context as BaseContext,
  type FictNode,
} from '@fictjs/runtime'

type Scope<C = unknown> = { [scopeName: string]: BaseContext<C | undefined>[] } | undefined
type ScopeHook = (scope: Scope) => { [scopeProp: string]: Scope }
interface CreateScope {
  scopeName: string;
  (): ScopeHook
}

function createContext<ContextValueType extends object | null>(
  rootComponentName: string,
  defaultContext?: ContextValueType,
) {
  const Context = createBaseContext<ContextValueType | undefined>(defaultContext)
  Context.displayName = rootComponentName + 'Context'

  function Provider(props: ContextValueType & { children?: FictNode | FictNode[] }) {
    const { children, ...context } = props
    return Context.Provider({
      value: context as ContextValueType,
      children,
    })
  }

  function useContext(consumerName: string) {
    const context = useBaseContext(Context)
    if (context) return context
    if (defaultContext !== undefined) return defaultContext
    throw new Error(consumerName + ' must be used within ' + rootComponentName)
  }

  return [Provider, useContext] as const
}

function createContextScope(scopeName: string, createContextScopeDeps: CreateScope[] = []) {
  let defaultContexts: unknown[] = []

  function createScopedContext<ContextValueType extends object | null>(
    rootComponentName: string,
    defaultContext?: ContextValueType,
  ) {
    const BaseContext = createBaseContext<ContextValueType | undefined>(defaultContext)
    BaseContext.displayName = rootComponentName + 'Context'
    const index = defaultContexts.length
    defaultContexts = [...defaultContexts, defaultContext]

    function Provider(
      props: ContextValueType & {
        children?: FictNode | FictNode[]
        scope?: Scope<ContextValueType | undefined>
      },
    ) {
      const { children, scope, ...context } = props
      const Context = scope?.[scopeName]?.[index] || BaseContext
      return Context.Provider({
        value: context as ContextValueType,
        children,
      })
    }

    function useContext(consumerName: string, scope: Scope<ContextValueType | undefined>) {
      const Context = scope?.[scopeName]?.[index] || BaseContext
      const context = useBaseContext(Context)
      if (context) return context
      if (defaultContext !== undefined) return defaultContext
      throw new Error(consumerName + ' must be used within ' + rootComponentName)
    }

    return [Provider, useContext] as const
  }

  const createScope = (() => {
    const scopeContexts = defaultContexts.map((defaultContext) => createBaseContext(defaultContext))
    const useScope = (scope: Scope) => {
      const contexts = scope?.[scopeName] || scopeContexts
      return { ['__scope' + scopeName]: { ...scope, [scopeName]: contexts } }
    }
    return useScope
  }) as CreateScope

  createScope.scopeName = scopeName
  return [
    createScopedContext,
    composeContextScopes(createScope, ...createContextScopeDeps),
  ] as const
}

function composeContextScopes(...scopes: [CreateScope, ...CreateScope[]]): CreateScope {
  const baseScope = scopes[0]
  if (scopes.length === 1) return baseScope

  const createScope = (() => {
    const scopeHooks = scopes.map((scopeFactory) => ({
      scopeName: scopeFactory.scopeName,
      useScope: scopeFactory(),
    }))
    const useComposedScopes = (overrideScopes: Scope) => {
      const nextScopes = scopeHooks.reduce<Record<string, BaseContext<unknown>[]>>((acc, item) => {
        const scopeProps = item.useScope(overrideScopes)
        const currentScope = scopeProps['__scope' + item.scopeName] as Record<
          string,
          BaseContext<unknown>[]
        >
        return { ...acc, ...currentScope }
      }, {})
      return { ['__scope' + baseScope.scopeName]: nextScopes }
    }
    return useComposedScopes
  }) as CreateScope

  createScope.scopeName = baseScope.scopeName
  return createScope
}

export { createContext, createContextScope }
export type { CreateScope, Scope }
