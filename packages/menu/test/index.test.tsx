/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMemo, onDestroy, render, type FictNode } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

const hideOthersCleanup = vi.hoisted(() => vi.fn())
const hideOthersMock = vi.hoisted(() => vi.fn(() => hideOthersCleanup))

vi.mock('aria-hidden', () => ({
  hideOthers: hideOthersMock,
}))

import { createContext, createContextScope } from '@fictjs/context'
import { Portal as DistPortal } from '@fictjs/portal'
import { Presence as DistPresence } from '@fictjs/presence'
import { useControllableState } from '@fictjs/use-controllable-state'
import { useLayoutEffect } from '@fictjs/use-layout-effect'

import {
  CheckboxItem,
  Content,
  Item,
  ItemIndicator,
  Menu,
  Portal,
  RadioGroup,
  RadioItem,
  Sub,
  SubContent,
  SubTrigger,
} from '../src/index.js'
import { useEffectEvent } from '../../use-effect-event/src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

function pressEscape(target: Document): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    }),
  )
}

function keyDown(target: Element, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key,
    }),
  )
}

function pointerMove(target: Element): void {
  const PointerEventCtor = globalThis.PointerEvent ?? MouseEvent
  target.dispatchEvent(
    new PointerEventCtor('pointermove', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

async function waitForEffects(cycles = 6): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
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

describe('@fictjs/menu', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    document.body.removeAttribute('data-scroll-locked')
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders content in a portal and closes after selecting an item', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)
    const open = createSignal(true)
    const onSelect = vi.fn()

    mount(
      () => (
        <Menu open={open} onOpenChange={open}>
          <Portal container={portalRoot}>
            <Content data-testid="content">
              <Item data-testid="first" onSelect={onSelect}>
                First
              </Item>
            </Content>
          </Portal>
        </Menu>
      ),
      container,
    )

    await waitForEffects()

    const content = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement
    const item = portalRoot.querySelector('[data-testid="first"]') as HTMLDivElement

    expect(content.getAttribute('role')).toBe('menu')
    expect(content.getAttribute('data-state')).toBe('open')

    click(item)
    await waitForEffects()

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('hides background content from assistive technology while modal', async () => {
    const container = document.createElement('div')
    const background = document.createElement('main')
    const open = createSignal(true)
    document.body.append(background, container)

    mount(
      () => (
        <Menu open={open} onOpenChange={open}>
          <Content data-testid="content">
            <Item>Item</Item>
          </Content>
        </Menu>
      ),
      container,
    )

    await waitForEffects()

    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(hideOthersMock).toHaveBeenCalledOnce()
    expect(hideOthersMock).toHaveBeenCalledWith(content)

    open(false)
    await waitForEffects()

    expect(hideOthersCleanup).toHaveBeenCalledOnce()
  })

  it('supports checkbox and radio menu items with indicators', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const checked = createSignal<true | false>(false)
    const radioValue = createSignal('one')

    mount(
      () => (
        <Menu open={open} onOpenChange={open} modal={false}>
          <Content data-testid="content">
            <CheckboxItem
              checked={checked}
              onCheckedChange={(value) => checked(Boolean(value))}
              data-testid="checkbox"
            >
              Toggle
              <ItemIndicator data-testid="checkbox-indicator">x</ItemIndicator>
            </CheckboxItem>
            <RadioGroup value={radioValue} onValueChange={radioValue}>
              <RadioItem value="one" data-testid="radio-one">
                One
              </RadioItem>
              <RadioItem value="two" data-testid="radio-two">
                Two
                <ItemIndicator data-testid="radio-indicator">dot</ItemIndicator>
              </RadioItem>
            </RadioGroup>
          </Content>
        </Menu>
      ),
      container,
    )

    await waitForEffects()

    click(container.querySelector('[data-testid="checkbox"]') as HTMLDivElement)
    await waitForEffects()
    expect(open()).toBe(false)

    open(true)
    await waitForEffects()
    expect(container.querySelector('[data-testid="checkbox-indicator"]')?.textContent).toBe('x')

    click(container.querySelector('[data-testid="radio-two"]') as HTMLDivElement)
    await waitForEffects()

    expect(radioValue()).toBe('two')
    expect(open()).toBe(false)

    open(true)
    await waitForEffects()
    expect(container.querySelector('[data-testid="radio-indicator"]')?.textContent).toBe('dot')
  })

  it('keeps checkbox items open when selection is prevented', async () => {
    const container = document.createElement('div')
    const open = createSignal(true)
    document.body.append(container)

    mount(
      () => (
        <Menu open={open} onOpenChange={open} modal={false}>
          <Content>
            <CheckboxItem data-testid="checkbox" onSelect={(event) => event.preventDefault()}>
              Toggle
            </CheckboxItem>
          </Content>
        </Menu>
      ),
      container,
    )

    await waitForEffects()
    click(container.querySelector('[data-testid="checkbox"]') as HTMLDivElement)
    await waitForEffects()

    expect(open()).toBe(true)
    expect(container.querySelector('[data-testid="checkbox"]')).not.toBeNull()
  })

  it('marks the focused pointer target as highlighted', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)

    mount(
      () => (
        <Menu open={open} onOpenChange={open} modal={false}>
          <Content data-testid="content">
            <Item data-testid="first">First</Item>
            <Item data-testid="second">Second</Item>
          </Content>
        </Menu>
      ),
      container,
    )

    await waitForEffects()

    const first = container.querySelector('[data-testid="first"]') as HTMLDivElement
    const second = container.querySelector('[data-testid="second"]') as HTMLDivElement

    pointerMove(first)
    await waitForEffects()

    expect(first.hasAttribute('data-highlighted')).toBe(true)
    expect(second.hasAttribute('data-highlighted')).toBe(false)

    pointerMove(second)
    await waitForEffects()

    expect(first.hasAttribute('data-highlighted')).toBe(false)
    expect(second.hasAttribute('data-highlighted')).toBe(true)
  })

  it('composes content key handlers with internal item navigation', async () => {
    const container = document.createElement('div')
    const onKeyDown = vi.fn()
    const open = createSignal(true)
    document.body.append(container)

    mount(
      () => (
        <Menu open={open} onOpenChange={open} modal={false}>
          <Content onKeyDown={onKeyDown}>
            <Item data-testid="first">First</Item>
            <Item data-testid="second">Second</Item>
          </Content>
        </Menu>
      ),
      container,
    )

    await waitForEffects()

    const first = container.querySelector('[data-testid="first"]') as HTMLDivElement
    const second = container.querySelector('[data-testid="second"]') as HTMLDivElement
    first.focus()
    keyDown(first, 'ArrowDown')
    await waitForEffects()

    expect(onKeyDown).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(second)
  })

  it('opens submenu content when the sub trigger is hovered', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)

    mount(
      () => (
        <Menu open={open} onOpenChange={open} modal={false}>
          <Content data-testid="content">
            <Item data-testid="first">First</Item>
            <Sub>
              <SubTrigger data-testid="sub-trigger">More</SubTrigger>
              <SubContent data-testid="sub-content">
                <Item data-testid="nested">Nested</Item>
              </SubContent>
            </Sub>
          </Content>
        </Menu>
      ),
      container,
    )

    await waitForEffects()

    const trigger = container.querySelector('[data-testid="sub-trigger"]') as HTMLDivElement
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 18,
      y: 24,
      width: 96,
      height: 28,
      top: 24,
      right: 114,
      bottom: 52,
      left: 18,
      toJSON: () => ({}),
    } as DOMRect)

    expect(container.querySelector('[data-testid="sub-content"]')).toBeNull()

    pointerMove(trigger)
    await waitForEffects()

    const wrapper = container.querySelector('[data-radix-popper-content-wrapper]') as HTMLDivElement
    const subContent = container.querySelector('[data-testid="sub-content"]') as HTMLDivElement
    const nested = container.querySelector('[data-testid="nested"]') as HTMLDivElement

    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(subContent).not.toBeNull()
    expect(nested.hasAttribute('data-highlighted')).toBe(false)
    expect(document.activeElement).toBe(trigger)
    expect(wrapper.style.position).toBe('fixed')
    expect(wrapper.style.left).toBe('0px')
    expect(wrapper.style.top).toBe('0px')
    expect(wrapper.style.transform).toBe('translate(118px, 24px)')
    expect(wrapper.style.minWidth).toBe('max-content')
    expect(subContent.style.width).toBe('100%')
    expect(subContent.getAttribute('data-side')).toBe('right')
    expect(subContent.getAttribute('data-align')).toBe('start')
    expect(
      subContent.style.getPropertyValue('--radix-dropdown-menu-content-transform-origin'),
    ).toBe('var(--radix-popper-transform-origin)')
    expect(subContent.style.getPropertyValue('--radix-context-menu-content-transform-origin')).toBe(
      'var(--radix-popper-transform-origin)',
    )

    pointerMove(trigger)
    await waitForEffects()

    expect(trigger.getAttribute('data-state')).toBe('open')
    expect(container.querySelector('[data-testid="sub-content"]')).not.toBeNull()
    expect(nested.hasAttribute('data-highlighted')).toBe(false)
  })

  it('flips submenu content to the left when the right edge has less available space', async () => {
    vi.stubGlobal('innerWidth', 180)
    vi.stubGlobal('innerHeight', 320)

    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)

    mount(
      () => (
        <Menu open={open} onOpenChange={open} modal={false}>
          <Content data-testid="content">
            <Sub>
              <SubTrigger data-testid="sub-trigger">More</SubTrigger>
              <SubContent data-testid="sub-content">
                <Item data-testid="nested">Nested</Item>
              </SubContent>
            </Sub>
          </Content>
        </Menu>
      ),
      container,
    )

    await waitForEffects()

    const trigger = container.querySelector('[data-testid="sub-trigger"]') as HTMLDivElement
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 140,
      y: 24,
      width: 30,
      height: 28,
      top: 24,
      right: 170,
      bottom: 52,
      left: 140,
      toJSON: () => ({}),
    } as DOMRect)

    pointerMove(trigger)
    await waitForEffects()
    await waitForEffects()

    const wrapper = container.querySelector('[data-radix-popper-content-wrapper]') as HTMLDivElement
    const subContent = container.querySelector('[data-testid="sub-content"]') as HTMLDivElement

    expect(subContent.getAttribute('data-side')).toBe('left')
    expect(wrapper.style.transform).toBe('translate(136px, 24px) translate(-100%, 0)')
    expect(wrapper.style.getPropertyValue('--radix-popper-available-width')).toBe('136px')
  })

  it.each(['ArrowRight', 'Enter', ' '])(
    'focuses the first submenu item when the sub trigger opens from keyboard with %s',
    async (key) => {
      const container = document.createElement('div')
      document.body.append(container)
      const open = createSignal(true)

      mount(
        () => (
          <Menu open={open} onOpenChange={open} modal={false}>
            <Content data-testid="content">
              <Item data-testid="first">First</Item>
              <Sub>
                <SubTrigger data-testid="sub-trigger">More</SubTrigger>
                <SubContent data-testid="sub-content">
                  <Item data-testid="nested">Nested</Item>
                </SubContent>
              </Sub>
            </Content>
          </Menu>
        ),
        container,
      )

      await waitForEffects()

      const trigger = container.querySelector('[data-testid="sub-trigger"]') as HTMLDivElement
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
        x: 18,
        y: 24,
        width: 96,
        height: 28,
        top: 24,
        right: 114,
        bottom: 52,
        left: 18,
        toJSON: () => ({}),
      } as DOMRect)

      trigger.focus()
      keyDown(trigger, key)
      await waitForEffects()

      const subContent = container.querySelector('[data-testid="sub-content"]') as HTMLDivElement
      const nested = container.querySelector('[data-testid="nested"]') as HTMLDivElement

      expect(trigger.getAttribute('data-state')).toBe('open')
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(subContent).not.toBeNull()
      expect(nested.hasAttribute('data-highlighted')).toBe(true)
      expect(document.activeElement).toBe(nested)
    },
  )

  it('closes portal content on escape', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)
    const open = createSignal(true)

    mount(
      () => (
        <Menu open={open} onOpenChange={open}>
          <Portal container={portalRoot}>
            <Content data-testid="content">
              <Item data-testid="first">First</Item>
            </Content>
          </Portal>
        </Menu>
      ),
      container,
    )

    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).not.toBeNull()

    pressEscape(document)
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('closes body-ported content on escape', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)

    mount(
      () => (
        <Menu open={open} onOpenChange={open}>
          <Portal>
            <Content data-testid="content">
              <Item data-testid="first">First</Item>
            </Content>
          </Portal>
        </Menu>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()

    pressEscape(document)
    await waitForEffects()

    expect(document.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('closes body-ported content when controlled by useControllableState', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    function ControlledMenu() {
      const [open, setOpen] = useControllableState({
        defaultProp: true,
      })

      return (
        <Menu open={open} onOpenChange={setOpen}>
          <Portal>
            <Content data-testid="content">
              <Item data-testid="first">First</Item>
            </Content>
          </Portal>
        </Menu>
      )
    }

    mount(() => <ControlledMenu />, container)

    await waitForEffects()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()

    pressEscape(document)
    await waitForEffects()

    expect(document.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('unmounts a plain portal child inside an extra context provider boundary', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    let renderCount = 0
    let destroyCount = 0

    function PlainPortalChild() {
      renderCount += 1
      onDestroy(() => {
        destroyCount += 1
      })

      return <div data-testid="plain-portal-child">Plain</div>
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <Menu open={open} onOpenChange={open}>
            <Portal>
              <PlainPortalChild />
            </Portal>
          </Menu>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="plain-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(renderCount).toBe(1)
    expect(destroyCount).toBe(1)
    expect(document.querySelector('[data-testid="plain-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal inside an extra context provider boundary', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')

    mount(
      () => (
        <DummyProvider open={open}>
          <DistPresence present={open}>
            <DistPortal>
              <div data-testid="dist-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="dist-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="dist-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal when contexts share the same scope factory', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const [createScopedContext] = createContextScope('SharedMenuScope')
    const [SharedMenuProvider, useSharedMenuContext] = createScopedContext<{ open: () => boolean }>(
      'SharedMenuProvider',
    )
    const [SharedPortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'SharedPortalProvider',
      { forceMount: undefined },
    )

    function SharedMenuPortal() {
      const context = useSharedMenuContext('SharedMenuPortal', undefined)

      return (
        <SharedPortalProvider forceMount={undefined}>
          <DistPresence present={() => context.open()}>
            <DistPortal>
              <div data-testid="shared-scope-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </SharedPortalProvider>
      )
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <SharedMenuProvider open={open}>
            <SharedMenuPortal />
          </SharedMenuProvider>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="shared-scope-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="shared-scope-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal with a full menu-like scoped context value', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const [createScopedContext] = createContextScope('SharedFullMenuScope')
    const [SharedMenuProvider, useSharedMenuContext] = createScopedContext<{
      open: () => boolean
      onOpenChange: (nextOpen: boolean) => void
      dir: () => 'ltr'
      modal: () => boolean
      contentId: () => string
    }>('SharedFullMenuProvider')
    const [SharedPortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'SharedFullPortalProvider',
      { forceMount: undefined },
    )

    function SharedMenuPortal() {
      const context = useSharedMenuContext('SharedMenuPortal', undefined)

      return (
        <SharedPortalProvider forceMount={undefined}>
          <DistPresence present={() => context.open()}>
            <DistPortal style={{ display: 'contents' }}>
              <div data-testid="full-scope-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </SharedPortalProvider>
      )
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <SharedMenuProvider
            open={open}
            onOpenChange={open}
            dir={() => 'ltr'}
            modal={() => true}
            contentId={() => 'shared-content'}
          >
            <SharedMenuPortal />
          </SharedMenuProvider>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="full-scope-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="full-scope-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal with a useControllableState-backed scoped context value', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const [createScopedContext] = createContextScope('SharedControlledMenuScope')
    const [SharedMenuProvider, useSharedMenuContext] = createScopedContext<{
      open: () => boolean
      onOpenChange: (nextOpen: boolean) => void
      dir: () => 'ltr'
      modal: () => boolean
      contentId: () => string
    }>('SharedControlledMenuProvider')
    const [SharedPortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'SharedControlledPortalProvider',
      { forceMount: undefined },
    )

    function ControlledSharedMenuProvider(props: { children?: FictNode }) {
      const [controlledOpen, setControlledOpen] = useControllableState<boolean>({
        prop: () => open(),
        defaultProp: () => false,
      })

      return (
        <SharedMenuProvider
          open={controlledOpen}
          onOpenChange={setControlledOpen}
          dir={() => 'ltr'}
          modal={() => true}
          contentId={() => 'shared-controlled-content'}
        >
          {props.children}
        </SharedMenuProvider>
      )
    }

    function SharedMenuPortal() {
      const context = useSharedMenuContext('SharedMenuPortal', undefined)

      return (
        <SharedPortalProvider forceMount={undefined}>
          <DistPresence present={() => context.open()}>
            <DistPortal style={{ display: 'contents' }}>
              <div data-testid="controlled-scope-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </SharedPortalProvider>
      )
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <ControlledSharedMenuProvider>
            <SharedMenuPortal />
          </ControlledSharedMenuProvider>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="controlled-scope-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="controlled-scope-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal with a createMemo-backed scoped context value', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const [createScopedContext] = createContextScope('SharedMemoMenuScope')
    const [SharedMenuProvider, useSharedMenuContext] = createScopedContext<{
      open: () => boolean
      onOpenChange: (nextOpen: boolean) => void
      dir: () => 'ltr'
      modal: () => boolean
      contentId: () => string
    }>('SharedMemoMenuProvider')
    const [SharedPortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'SharedMemoPortalProvider',
      { forceMount: undefined },
    )

    function MemoSharedMenuProvider(props: { children?: FictNode }) {
      const memoOpen = createMemo(() => open())

      return (
        <SharedMenuProvider
          open={memoOpen}
          onOpenChange={open}
          dir={() => 'ltr'}
          modal={() => true}
          contentId={() => 'shared-memo-content'}
        >
          {props.children}
        </SharedMenuProvider>
      )
    }

    function SharedMenuPortal() {
      const context = useSharedMenuContext('SharedMenuPortal', undefined)

      return (
        <SharedPortalProvider forceMount={undefined}>
          <DistPresence present={() => context.open()}>
            <DistPortal style={{ display: 'contents' }}>
              <div data-testid="memo-scope-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </SharedPortalProvider>
      )
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <MemoSharedMenuProvider>
            <SharedMenuPortal />
          </MemoSharedMenuProvider>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="memo-scope-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="memo-scope-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal with a createMemo accessor plus a layout effect reader', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const [createScopedContext] = createContextScope('SharedMemoEffectMenuScope')
    const [SharedMenuProvider, useSharedMenuContext] = createScopedContext<{
      open: () => boolean
      onOpenChange: (nextOpen: boolean) => void
      dir: () => 'ltr'
      modal: () => boolean
      contentId: () => string
    }>('SharedMemoEffectMenuProvider')
    const [SharedPortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'SharedMemoEffectPortalProvider',
      { forceMount: undefined },
    )

    function MemoEffectSharedMenuProvider(props: { children?: FictNode }) {
      const memoOpen = createMemo(() => open())

      useLayoutEffect(() => {
        open()
      })

      return (
        <SharedMenuProvider
          open={memoOpen}
          onOpenChange={open}
          dir={() => 'ltr'}
          modal={() => true}
          contentId={() => 'shared-memo-effect-content'}
        >
          {props.children}
        </SharedMenuProvider>
      )
    }

    function SharedMenuPortal() {
      const context = useSharedMenuContext('SharedMenuPortal', undefined)

      return (
        <SharedPortalProvider forceMount={undefined}>
          <DistPresence present={() => context.open()}>
            <DistPortal style={{ display: 'contents' }}>
              <div data-testid="memo-effect-scope-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </SharedPortalProvider>
      )
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <MemoEffectSharedMenuProvider>
            <SharedMenuPortal />
          </MemoEffectSharedMenuProvider>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="memo-effect-scope-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="memo-effect-scope-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal with a recursively-unwrapped accessor plus a layout effect reader', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const [createScopedContext] = createContextScope('SharedRecursiveMenuScope')
    const [SharedMenuProvider, useSharedMenuContext] = createScopedContext<{
      open: () => boolean
      onOpenChange: (nextOpen: boolean) => void
      dir: () => 'ltr'
      modal: () => boolean
      contentId: () => string
    }>('SharedRecursiveMenuProvider')
    const [SharedPortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'SharedRecursivePortalProvider',
      { forceMount: undefined },
    )

    const SIGNAL_MARKER = Symbol.for('fict:signal')
    const COMPUTED_MARKER = Symbol.for('fict:computed')
    const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

    function isReadableAccessor<T>(value: T | (() => T)): value is () => T {
      return (
        typeof value === 'function' &&
        (value.length === 0 ||
          (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
          (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
          (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
      )
    }

    function readValue<T>(value: T | (() => T)): T {
      let currentValue: unknown = value

      for (
        let depth = 0;
        depth < 10 && isReadableAccessor(currentValue as T | (() => T));
        depth += 1
      ) {
        currentValue = (currentValue as () => unknown)()
      }

      return currentValue as T
    }

    function RecursiveSharedMenuProvider(props: { children?: FictNode }) {
      const controlledState = () => readValue(() => open())
      const memoOpen = createMemo(() => controlledState())

      useLayoutEffect(() => {
        controlledState()
      })

      return (
        <SharedMenuProvider
          open={memoOpen}
          onOpenChange={open}
          dir={() => 'ltr'}
          modal={() => true}
          contentId={() => 'shared-recursive-content'}
        >
          {props.children}
        </SharedMenuProvider>
      )
    }

    function SharedMenuPortal() {
      const context = useSharedMenuContext('SharedMenuPortal', undefined)

      return (
        <SharedPortalProvider forceMount={undefined}>
          <DistPresence present={() => context.open()}>
            <DistPortal style={{ display: 'contents' }}>
              <div data-testid="recursive-scope-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </SharedPortalProvider>
      )
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <RecursiveSharedMenuProvider>
            <SharedMenuPortal />
          </RecursiveSharedMenuProvider>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="recursive-scope-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="recursive-scope-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal with a plain recursively-unwrapped accessor plus a layout effect reader', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const [createScopedContext] = createContextScope('SharedPlainRecursiveMenuScope')
    const [SharedMenuProvider, useSharedMenuContext] = createScopedContext<{
      open: () => boolean
      onOpenChange: (nextOpen: boolean) => void
      dir: () => 'ltr'
      modal: () => boolean
      contentId: () => string
    }>('SharedPlainRecursiveMenuProvider')
    const [SharedPortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'SharedPlainRecursivePortalProvider',
      { forceMount: undefined },
    )

    const SIGNAL_MARKER = Symbol.for('fict:signal')
    const COMPUTED_MARKER = Symbol.for('fict:computed')
    const PROP_GETTER_MARKER = Symbol.for('fict:prop-getter')

    function isReadableAccessor<T>(value: T | (() => T)): value is () => T {
      return (
        typeof value === 'function' &&
        (value.length === 0 ||
          (value as Record<symbol, unknown>)[SIGNAL_MARKER] === true ||
          (value as Record<symbol, unknown>)[COMPUTED_MARKER] === true ||
          (value as Record<symbol, unknown>)[PROP_GETTER_MARKER] === true)
      )
    }

    function readValue<T>(value: T | (() => T)): T {
      let currentValue: unknown = value

      for (
        let depth = 0;
        depth < 10 && isReadableAccessor(currentValue as T | (() => T));
        depth += 1
      ) {
        currentValue = (currentValue as () => unknown)()
      }

      return currentValue as T
    }

    function PlainRecursiveSharedMenuProvider(props: { children?: FictNode }) {
      const controlledState = () => readValue(() => open())
      const plainOpen = () => controlledState()

      useLayoutEffect(() => {
        controlledState()
      })

      return (
        <SharedMenuProvider
          open={plainOpen}
          onOpenChange={open}
          dir={() => 'ltr'}
          modal={() => true}
          contentId={() => 'shared-plain-recursive-content'}
        >
          {props.children}
        </SharedMenuProvider>
      )
    }

    function SharedMenuPortal() {
      const context = useSharedMenuContext('SharedMenuPortal', undefined)

      return (
        <SharedPortalProvider forceMount={undefined}>
          <DistPresence present={() => context.open()}>
            <DistPortal style={{ display: 'contents' }}>
              <div data-testid="plain-recursive-scope-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </SharedPortalProvider>
      )
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <PlainRecursiveSharedMenuProvider>
            <SharedMenuPortal />
          </PlainRecursiveSharedMenuProvider>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(
      document.querySelector('[data-testid="plain-recursive-scope-portal-child"]'),
    ).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="plain-recursive-scope-portal-child"]')).toBeNull()
  })

  it('unmounts dist Presence + Portal with a plain accessor plus useEffectEvent and a layout effect reader', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const [createScopedContext] = createContextScope('SharedEffectEventMenuScope')
    const [SharedMenuProvider, useSharedMenuContext] = createScopedContext<{
      open: () => boolean
      onOpenChange: (nextOpen: boolean) => void
      dir: () => 'ltr'
      modal: () => boolean
      contentId: () => string
    }>('SharedEffectEventMenuProvider')
    const [SharedPortalProvider] = createScopedContext<{ forceMount: boolean | undefined } | null>(
      'SharedEffectEventPortalProvider',
      { forceMount: undefined },
    )

    function EffectEventSharedMenuProvider(props: { children?: FictNode }) {
      const plainOpen = () => open()
      const emitChange = useEffectEvent<(_: boolean) => void>(() => {})

      useLayoutEffect(() => {
        open()
      })

      return (
        <SharedMenuProvider
          open={plainOpen}
          onOpenChange={(nextOpen) => {
            emitChange(nextOpen)
            open(nextOpen)
          }}
          dir={() => 'ltr'}
          modal={() => true}
          contentId={() => 'shared-effect-event-content'}
        >
          {props.children}
        </SharedMenuProvider>
      )
    }

    function SharedMenuPortal() {
      const context = useSharedMenuContext('SharedMenuPortal', undefined)

      return (
        <SharedPortalProvider forceMount={undefined}>
          <DistPresence present={() => context.open()}>
            <DistPortal style={{ display: 'contents' }}>
              <div data-testid="effect-event-scope-portal-child">Plain</div>
            </DistPortal>
          </DistPresence>
        </SharedPortalProvider>
      )
    }

    mount(
      () => (
        <DummyProvider open={open}>
          <EffectEventSharedMenuProvider>
            <SharedMenuPortal />
          </EffectEventSharedMenuProvider>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="effect-event-scope-portal-child"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(document.querySelector('[data-testid="effect-event-scope-portal-child"]')).toBeNull()
  })

  it('unmounts inline content inside an extra context provider boundary', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const open = createSignal(true)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')

    mount(
      () => (
        <DummyProvider open={open}>
          <Menu open={open} onOpenChange={open}>
            <Content data-testid="content">
              <Item data-testid="first">First</Item>
            </Content>
          </Menu>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()

    open(false)
    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('closes body-ported content inside an extra context provider boundary', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')

    function ControlledMenu() {
      const [open, setOpen] = useControllableState({
        defaultProp: true,
      })

      return (
        <DummyProvider open={open}>
          <Menu open={open} onOpenChange={setOpen}>
            <Portal>
              <Content data-testid="content">
                <Item data-testid="first">First</Item>
              </Content>
            </Portal>
          </Menu>
        </DummyProvider>
      )
    }

    mount(() => <ControlledMenu />, container)

    await waitForEffects()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()

    pressEscape(document)
    await waitForEffects()

    expect(document.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('closes body-ported content inside an extra context provider boundary with a raw signal', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const [DummyProvider] = createContext<{ open: () => boolean } | null>('DummyProvider')
    const open = createSignal(true)

    mount(
      () => (
        <DummyProvider open={open}>
          <Menu open={open} onOpenChange={open}>
            <Portal>
              <Content data-testid="content">
                <Item data-testid="first">First</Item>
              </Content>
            </Portal>
          </Menu>
        </DummyProvider>
      ),
      container,
    )

    await waitForEffects()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()

    pressEscape(document)
    await waitForEffects()

    expect(document.querySelector('[data-testid="content"]')).toBeNull()
  })
})
