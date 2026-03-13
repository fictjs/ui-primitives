/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

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
    vi.clearAllMocks()
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
})
