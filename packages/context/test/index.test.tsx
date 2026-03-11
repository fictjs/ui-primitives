/** @jsxImportSource @fictjs/runtime */

import { describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { createContext, createContextScope } from '../src/index.js'

describe('@fictjs/context', () => {
  it('creates a basic provider and consumer pair', () => {
    const [Provider, useTestContext] = createContext<{ value: string }>('TestRoot')
    let seen = ''

    function Consumer() {
      seen = useTestContext('Consumer').value
      return <div>{seen}</div>
    }

    const container = document.createElement('div')
    render(
      () => (
        <Provider value="ready">
          <Consumer />
        </Provider>
      ),
      container,
    )

    expect(seen).toBe('ready')
    expect(container.textContent).toBe('ready')
  })

  it('supports scoped providers', () => {
    const [createScopedContext, createScopedScope] = createContextScope('ScopedTest')
    const [Provider, useScopedContext] = createScopedContext<{ value: string }>('ScopedRoot')
    let seen = ''

    function Consumer(props: { scope?: Record<string, unknown> }) {
      seen = useScopedContext('ScopedConsumer', props.scope as any).value
      return <div>{seen}</div>
    }

    const useScope = createScopedScope()
    render(() => {
      const scopeProps = useScope(undefined) as Record<string, unknown>
      const scope = scopeProps.__scopeScopedTest as Record<string, unknown>
      return (
        <Provider scope={scope as any} value="scoped">
          <Consumer scope={scope} />
        </Provider>
      )
    }, document.createElement('div'))

    expect(seen).toBe('scoped')
  })

  it('throws for missing required context', () => {
    const [, useStrictContext] = createContext<{ value: string }>('StrictRoot')

    function Consumer() {
      return <div>{useStrictContext('MissingConsumer').value}</div>
    }

    expect(() => render(() => <Consumer />, document.createElement('div'))).toThrow(
      'MissingConsumer must be used within StrictRoot',
    )
  })
})
