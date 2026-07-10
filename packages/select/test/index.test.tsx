/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createElement, Fragment, onMount, render, type FictNode } from '@fictjs/runtime'

import {
  Content,
  Item,
  ItemIndicator,
  ItemText,
  Portal,
  Root,
  Trigger,
  Value,
} from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
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

describe('@fictjs/select', () => {
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

  it('opens content and updates the trigger value after selecting an item', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content">
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
            </Item>
            <Item value="orange" data-testid="item-orange">
              <ItemText>Orange</ItemText>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Choose one')

    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()
    click(container.querySelector('[data-testid="item-orange"]') as HTMLDivElement)
    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')).toBeNull()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Orange')
  })

  it('renders the selected item text for defaultValue while content is closed', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="apple">
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content">
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
            </Item>
            <Item value="orange" data-testid="item-orange">
              <ItemText>Orange</ItemText>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')).toBeNull()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Apple')
  })

  it('resolves the closed selected text without mounting content children twice', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    let itemTextMounts = 0

    function CountedItemText(props: { children?: FictNode | FictNode[] }): FictNode {
      onMount(() => {
        itemTextMounts += 1
      })

      return <ItemText>{props.children}</ItemText>
    }

    mount(
      () => (
        <Root defaultValue="apple">
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content">
            <Item value="apple" data-testid="item-apple">
              <CountedItemText>Apple</CountedItemText>
            </Item>
            <Item value="orange" data-testid="item-orange">
              <CountedItemText>Orange</CountedItemText>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    expect(container.querySelector('[data-testid="content"]')).toBeNull()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Apple')
    expect(itemTextMounts).toBe(0)

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    click(trigger)
    await waitForEffects()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()
    expect(itemTextMounts).toBe(2)

    click(trigger)
    await waitForEffects()
    expect(document.querySelector('[data-testid="content"]')).toBeNull()
    expect(itemTextMounts).toBe(2)

    click(trigger)
    await waitForEffects()
    expect(document.querySelector('[data-testid="content"]')).not.toBeNull()
    expect(itemTextMounts).toBe(4)
  })

  it('resolves the closed selected text from static item components', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    let fruitItemsCalls = 0

    function FruitItems(): FictNode {
      fruitItemsCalls += 1

      return (
        <>
          <Item value="orange" data-testid="item-orange">
            <ItemText>Orange</ItemText>
          </Item>
          <Item value="apple" data-testid="item-apple">
            <ItemText>Apple</ItemText>
          </Item>
        </>
      )
    }

    mount(
      () => (
        <Root defaultValue="apple">
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content">
            <FruitItems />
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')).toBeNull()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Apple')
    expect(fruitItemsCalls).toBe(1)
  })

  it('resolves the closed selected text from compiler-created fragments', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    function FruitItems(): FictNode {
      return createElement({
        type: Fragment,
        props: {
          children: [
            <Item value="orange" data-testid="item-orange">
              <ItemText>Orange</ItemText>
            </Item>,
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
            </Item>,
          ],
        },
      })
    }

    mount(
      () => (
        <Root defaultValue="apple">
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content">
            <FruitItems />
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')).toBeNull()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Apple')
  })

  it('wraps default content in a positioned popper wrapper', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content">
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()

    const wrapper = document.querySelector(
      '[data-radix-popper-content-wrapper]',
    ) as HTMLDivElement | null
    const content = document.querySelector('[data-testid="content"]') as HTMLDivElement | null

    expect(wrapper).not.toBeNull()
    expect(content).not.toBeNull()
    expect(wrapper?.style.position).toBe('fixed')
    expect(wrapper?.style.transform).not.toBe('')
  })

  it('renders the indicator for the selected item', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="apple" defaultOpen>
          <Trigger>
            <Value />
          </Trigger>
          <Content>
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
              <ItemIndicator data-testid="indicator">x</ItemIndicator>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    expect(container.querySelector('[data-testid="indicator"]')?.textContent).toBe('x')
  })

  it('resolves the closed selected text from item text without indicator content', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="apple">
          <Trigger>
            <Value data-testid="value" />
          </Trigger>
          <Content>
            <Item value="apple">
              <ItemText>Apple</ItemText>
              <ItemIndicator data-testid="indicator">x</ItemIndicator>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Apple')
    expect(container.querySelector('[data-testid="indicator"]')).toBeNull()
  })

  it('does not open content when the select root is disabled', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root disabled>
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content">
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    expect(trigger.disabled).toBe(true)

    click(trigger)
    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('participates in nested and explicitly associated forms', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <form data-testid="nested-form">
            <Root name="fruit" required defaultValue="apple">
              <Trigger data-testid="nested-trigger">
                <Value />
              </Trigger>
              <Content>
                <Item value="apple">
                  <ItemText>Apple</ItemText>
                </Item>
              </Content>
            </Root>
          </form>
          <form id="external-form" data-testid="external-form" />
          <Root name="drink" form="external-form" defaultValue="tea">
            <Trigger>
              <Value />
            </Trigger>
            <Content>
              <Item value="tea">
                <ItemText>Tea</ItemText>
              </Item>
            </Content>
          </Root>
        </>
      ),
      container,
    )

    await waitForEffects()

    const nestedForm = container.querySelector('[data-testid="nested-form"]') as HTMLFormElement
    const externalForm = container.querySelector('[data-testid="external-form"]') as HTMLFormElement
    const nativeSelect = nestedForm.querySelector('select[name="fruit"]') as HTMLSelectElement

    expect(nativeSelect.required).toBe(true)
    expect(nativeSelect.checkValidity()).toBe(true)
    expect(new FormData(nestedForm).get('fruit')).toBe('apple')
    expect(new FormData(externalForm).get('drink')).toBe('tea')
  })

  it('restores the initial value on native form reset and bubbles value changes', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const onInput = vi.fn()
    const onChange = vi.fn()

    mount(
      () => (
        <form data-testid="form" onInput={onInput} onChange={onChange}>
          <Root name="fruit" defaultValue="apple">
            <Trigger data-testid="trigger">
              <Value data-testid="value" />
            </Trigger>
            <Content>
              <Item value="apple" data-testid="item-apple">
                <ItemText>Apple</ItemText>
              </Item>
              <Item value="orange" data-testid="item-orange">
                <ItemText>Orange</ItemText>
              </Item>
            </Content>
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()
    click(container.querySelector('[data-testid="item-orange"]') as HTMLDivElement)
    await waitForEffects()

    expect(new FormData(form).get('fruit')).toBe('orange')
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)

    form.reset()
    await waitForEffects()

    expect(new FormData(form).get('fruit')).toBe('apple')
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Apple')
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('keeps the current value when native form reset is canceled', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const onInput = vi.fn()
    const onChange = vi.fn()

    mount(
      () => (
        <form data-testid="form" onInput={onInput} onChange={onChange}>
          <Root name="fruit" defaultValue="apple">
            <Trigger data-testid="trigger">
              <Value data-testid="value" />
            </Trigger>
            <Content>
              <Item value="apple" data-testid="item-apple">
                <ItemText>Apple</ItemText>
              </Item>
              <Item value="orange" data-testid="item-orange">
                <ItemText>Orange</ItemText>
              </Item>
            </Content>
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    form.addEventListener('reset', (event) => event.preventDefault())

    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()
    click(container.querySelector('[data-testid="item-orange"]') as HTMLDivElement)
    await waitForEffects()

    form.reset()
    await waitForEffects()

    expect(new FormData(form).get('fruit')).toBe('orange')
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Orange')
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('preserves a controlled value without notifying when its form resets', async () => {
    const container = document.createElement('div')
    const value = createSignal('apple')
    const onValueChange = vi.fn()
    document.body.append(container)

    mount(
      () => (
        <form data-testid="form">
          <Root name="fruit" value={prop(() => value())} onValueChange={onValueChange}>
            <Trigger>
              <Value data-testid="value" />
            </Trigger>
            <Content>
              <Item value="apple">
                <ItemText>Apple</ItemText>
              </Item>
              <Item value="orange">
                <ItemText>Orange</ItemText>
              </Item>
            </Content>
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()
    value('orange')
    await waitForEffects()
    onValueChange.mockClear()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    form.reset()
    await waitForEffects()

    expect(value()).toBe('orange')
    expect(new FormData(form).get('fruit')).toBe('orange')
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Orange')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('restores the initial value through an explicitly associated form reset', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <form id="external-select-form" data-testid="form" />
          <Root form="external-select-form" name="fruit" defaultValue="apple">
            <Trigger data-testid="trigger">
              <Value data-testid="value" />
            </Trigger>
            <Content>
              <Item value="apple" data-testid="item-apple">
                <ItemText>Apple</ItemText>
              </Item>
              <Item value="orange" data-testid="item-orange">
                <ItemText>Orange</ItemText>
              </Item>
            </Content>
          </Root>
        </>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()
    click(container.querySelector('[data-testid="item-orange"]') as HTMLDivElement)
    await waitForEffects()

    expect(new FormData(form).get('fruit')).toBe('orange')

    form.reset()
    await waitForEffects()

    expect(new FormData(form).get('fruit')).toBe('apple')
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Apple')
  })

  it('exposes native required and disabled form semantics', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <form data-testid="form">
          <Root name="required-fruit" required>
            <Trigger />
          </Root>
          <Root name="disabled-fruit" disabled defaultValue="apple">
            <Trigger />
          </Root>
        </form>
      ),
      container,
    )

    await waitForEffects()

    const form = container.querySelector('[data-testid="form"]') as HTMLFormElement
    const requiredSelect = form.querySelector('select[name="required-fruit"]') as HTMLSelectElement

    expect(requiredSelect.validity.valueMissing).toBe(true)
    expect(form.checkValidity()).toBe(false)
    expect(new FormData(form).has('disabled-fruit')).toBe(false)
  })

  it('closes portaled content after selecting an item when mounted in document.body', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultOpen>
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Portal>
            <Content data-testid="content">
              <Item value="apple" data-testid="item-apple">
                <ItemText>Apple</ItemText>
              </Item>
              <Item value="orange" data-testid="item-orange">
                <ItemText>Orange</ItemText>
              </Item>
            </Content>
          </Portal>
        </Root>
      ),
      container,
    )

    await waitForEffects()
    click(document.querySelector('[data-testid="item-orange"]') as HTMLDivElement)
    await waitForEffects()
    await waitForEffects()

    expect(document.querySelector('[data-testid="content"]')).toBeNull()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('Orange')
  })

  it('wraps popper-positioned content in a popper content wrapper', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultOpen>
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content" position="popper">
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const wrapper = document.querySelector(
      '[data-radix-popper-content-wrapper]',
    ) as HTMLDivElement | null
    const content = document.querySelector('[data-testid="content"]') as HTMLDivElement | null

    expect(wrapper).not.toBeNull()
    expect(content).not.toBeNull()
    expect(content?.getAttribute('data-side')).toBe('bottom')
    expect(content?.style.width).toBe('100%')
    expect(wrapper?.style.position).toBe('fixed')
  })

  it('flips popper-positioned content above the trigger near the viewport bottom', async () => {
    vi.stubGlobal('innerWidth', 480)
    vi.stubGlobal('innerHeight', 320)

    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content" position="popper">
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
            </Item>
            <Item value="orange" data-testid="item-orange">
              <ItemText>Orange</ItemText>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
      x: 18,
      y: 280,
      width: 96,
      height: 30,
      top: 280,
      right: 114,
      bottom: 310,
      left: 18,
      toJSON: () => ({}),
    } as DOMRect)

    click(trigger)
    await waitForEffects()

    const wrapper = document.querySelector(
      '[data-radix-popper-content-wrapper]',
    ) as HTMLDivElement | null
    const content = document.querySelector('[data-testid="content"]') as HTMLDivElement | null

    expect(wrapper).not.toBeNull()
    expect(content).not.toBeNull()
    expect(content?.getAttribute('data-side')).toBe('top')
    expect(wrapper?.style.transform).toBe('translate(18px, 276px) translate(0, -100%)')
    expect(wrapper?.style.getPropertyValue('--radix-popper-available-height')).toBe('276px')
  })

  it('locks document scroll while open and highlights hovered items', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <Trigger data-testid="trigger">
            <Value data-testid="value" placeholder="Choose one" />
          </Trigger>
          <Content data-testid="content">
            <Item value="apple" data-testid="item-apple">
              <ItemText>Apple</ItemText>
            </Item>
            <Item value="orange" data-testid="item-orange">
              <ItemText>Orange</ItemText>
            </Item>
          </Content>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()

    const apple = document.querySelector('[data-testid="item-apple"]') as HTMLDivElement | null
    const orange = document.querySelector('[data-testid="item-orange"]') as HTMLDivElement | null

    expect(document.body.getAttribute('data-scroll-locked')).toBe('1')
    expect(apple).not.toBeNull()
    expect(orange).not.toBeNull()

    pointerMove(orange as HTMLDivElement)
    await waitForEffects()

    expect(orange?.hasAttribute('data-highlighted')).toBe(true)
    expect(apple?.hasAttribute('data-highlighted')).toBe(false)

    click(orange as HTMLDivElement)
    await waitForEffects()
    await waitForEffects()

    expect(document.querySelector('[data-testid="content"]')).toBeNull()
    expect(document.body.getAttribute('data-scroll-locked')).toBeNull()
  })
})
