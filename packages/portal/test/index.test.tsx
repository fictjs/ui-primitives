/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { createContext, createMemo, prop, render, type FictNode } from '@fictjs/runtime'
import { createSignal, reactive } from '@fictjs/runtime/advanced'

import { createContext as createScopedContext } from '../../context/src/index.js'
import { Presence } from '../../presence/src/index.js'
import { Portal } from '../src/index.js'

function flushMicrotasks(): Promise<void> {
  return Promise.resolve()
}

describe('@fictjs/portal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders into a provided container', async () => {
    const host = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(host, portalRoot)

    render(
      () => (
        <Portal container={portalRoot} id="custom-portal">
          <span>Inside</span>
        </Portal>
      ),
      host,
    )

    await flushMicrotasks()

    const portalNode = portalRoot.querySelector('#custom-portal')
    expect(portalNode).not.toBeNull()
    expect(portalNode?.textContent).toBe('Inside')
    expect(host.querySelector('#custom-portal')).toBeNull()
  })

  it('moves existing content when the container prop changes', async () => {
    const host = document.createElement('div')
    const firstPortalRoot = document.createElement('div')
    const secondPortalRoot = document.createElement('div')
    const portalRoot = createSignal<Element | DocumentFragment | null>(firstPortalRoot)
    document.body.append(host, firstPortalRoot, secondPortalRoot)

    render(
      () => (
        <Portal
          container={prop(() => portalRoot()) as unknown as Element | DocumentFragment | null}
          id="moving-portal"
        >
          Moving content
        </Portal>
      ),
      host,
    )

    await flushMicrotasks()
    expect(firstPortalRoot.querySelector('#moving-portal')).not.toBeNull()

    portalRoot(secondPortalRoot)
    await flushMicrotasks()

    expect(firstPortalRoot.querySelector('#moving-portal')).toBeNull()
    expect(secondPortalRoot.querySelector('#moving-portal')?.textContent).toBe('Moving content')
  })

  it('defaults to document.body once mounted', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    render(() => <Portal id="body-portal">Body content</Portal>, host)

    await flushMicrotasks()

    const portalNode = document.body.querySelector('#body-portal')
    expect(portalNode).not.toBeNull()
    expect(portalNode?.textContent).toBe('Body content')
    expect(host.querySelector('#body-portal')).toBeNull()
  })

  it('removes a body portal when the parent tree unmounts it', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const present = createSignal(true)

    render(
      () => (
        <>
          {reactive(() =>
            present() ? (
              <Portal id="body-portal-cleanup">
                <span>Cleanup</span>
              </Portal>
            ) : null,
          )}
        </>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-cleanup')).not.toBeNull()

    present(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-cleanup')).toBeNull()
  })

  it('removes a body portal when wrapped in an extra context provider boundary', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const present = createSignal(true)
    const DummyContext = createContext<{ present: () => boolean } | null>(null)

    render(
      () => (
        <DummyContext.Provider value={{ present }}>
          <>
            {reactive(() =>
              present() ? (
                <Portal id="body-portal-context-cleanup">
                  <span>Cleanup</span>
                </Portal>
              ) : null,
            )}
          </>
        </DummyContext.Provider>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-context-cleanup')).not.toBeNull()

    present(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-context-cleanup')).toBeNull()
  })

  it('removes a body portal when wrapped in an extra scoped context provider boundary', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const present = createSignal(true)
    const [DummyProvider] = createScopedContext<{ present: () => boolean } | null>('DummyProvider')

    render(
      () => (
        <DummyProvider present={present}>
          <>
            {reactive(() =>
              present() ? (
                <Portal id="body-portal-scoped-context-cleanup">
                  <span>Cleanup</span>
                </Portal>
              ) : null,
            )}
          </>
        </DummyProvider>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-scoped-context-cleanup')).not.toBeNull()

    present(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-scoped-context-cleanup')).toBeNull()
  })

  it('updates portal content that reads scoped context through an extra provider boundary', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const open = createSignal(true)
    const [OuterProvider] = createScopedContext<{ present: () => boolean } | null>('OuterProvider')
    const [InnerProvider, useInnerContext] = createScopedContext<{ open: () => boolean }>(
      'InnerProvider',
    )

    function InnerContent() {
      const context = useInnerContext('InnerContent')

      return (
        <>
          {reactive(() => (context.open() ? <div id="body-portal-inner-content">Open</div> : null))}
        </>
      )
    }

    render(
      () => (
        <OuterProvider present={open}>
          <InnerProvider open={open}>
            <Portal>
              <InnerContent />
            </Portal>
          </InnerProvider>
        </OuterProvider>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-inner-content')).not.toBeNull()

    open(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-inner-content')).toBeNull()
  })

  it('unmounts a portal wrapped in Presence through an extra scoped context provider boundary', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const open = createSignal(true)
    const [DummyProvider] = createScopedContext<{ open: () => boolean } | null>('DummyProvider')

    render(
      () => (
        <DummyProvider open={open}>
          <Presence present={open}>
            <Portal id="body-portal-presence-cleanup">
              <span>Cleanup</span>
            </Portal>
          </Presence>
        </DummyProvider>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-presence-cleanup')).not.toBeNull()

    open(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-presence-cleanup')).toBeNull()
  })

  it('unmounts a portal wrapped in Presence through a nested scoped provider boundary', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const open = createSignal(true)
    const [DummyProvider] = createScopedContext<{ open: () => boolean } | null>('DummyProvider')
    const [PortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'PortalProvider',
      null,
    )

    render(
      () => (
        <DummyProvider open={open}>
          <PortalProvider forceMount={undefined}>
            <Presence present={open}>
              <Portal id="body-portal-nested-presence-cleanup">
                <span>Cleanup</span>
              </Portal>
            </Presence>
          </PortalProvider>
        </DummyProvider>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-nested-presence-cleanup')).not.toBeNull()

    open(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-nested-presence-cleanup')).toBeNull()
  })

  it('unmounts a portal when Presence reads open from scoped context through an extra boundary', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const open = createSignal(true)
    const [DummyProvider] = createScopedContext<{ open: () => boolean } | null>('DummyProvider')
    const [MenuProvider, useMenuContext] = createScopedContext<{ open: () => boolean }>(
      'MenuProvider',
    )

    function MenuPortalLike() {
      const context = useMenuContext('MenuPortalLike')

      return (
        <Presence present={() => context.open()}>
          <Portal id="body-portal-context-presence-cleanup">
            <span>Cleanup</span>
          </Portal>
        </Presence>
      )
    }

    render(
      () => (
        <DummyProvider open={open}>
          <MenuProvider open={open}>
            <MenuPortalLike />
          </MenuProvider>
        </DummyProvider>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-context-presence-cleanup')).not.toBeNull()

    open(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-context-presence-cleanup')).toBeNull()
  })

  it('unmounts a portal when Presence reads a computed accessor from scoped context', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const open = createSignal(true)
    const [DummyProvider] = createScopedContext<{ open: () => boolean } | null>('DummyProvider')
    const [MenuProvider, useMenuContext] = createScopedContext<{ open: () => boolean }>(
      'MenuProvider',
    )

    function ControlledMenuProvider(props: { children?: FictNode }) {
      const computedOpen = createMemo(() => open())

      return <MenuProvider open={computedOpen}>{props.children}</MenuProvider>
    }

    function MenuPortalLike() {
      const context = useMenuContext('MenuPortalLike')

      return (
        <Presence present={() => context.open()}>
          <Portal id="body-portal-computed-context-cleanup">
            <span>Cleanup</span>
          </Portal>
        </Presence>
      )
    }

    render(
      () => (
        <DummyProvider open={open}>
          <ControlledMenuProvider>
            <MenuPortalLike />
          </ControlledMenuProvider>
        </DummyProvider>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-computed-context-cleanup')).not.toBeNull()

    open(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-computed-context-cleanup')).toBeNull()
  })

  it('unmounts a display-contents portal wrapped in Presence through an extra scoped boundary', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const open = createSignal(true)
    const [DummyProvider] = createScopedContext<{ open: () => boolean } | null>('DummyProvider')

    render(
      () => (
        <DummyProvider open={open}>
          <Presence present={open}>
            <Portal id="body-portal-display-contents-cleanup" style={{ display: 'contents' }}>
              <span>Cleanup</span>
            </Portal>
          </Presence>
        </DummyProvider>
      ),
      host,
    )

    await flushMicrotasks()
    expect(document.body.querySelector('#body-portal-display-contents-cleanup')).not.toBeNull()

    open(false)
    await flushMicrotasks()

    expect(document.body.querySelector('#body-portal-display-contents-cleanup')).toBeNull()
  })
})
