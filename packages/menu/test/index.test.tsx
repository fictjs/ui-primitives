/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import {
  CheckboxItem,
  Content,
  Item,
  ItemIndicator,
  Menu,
  Portal,
  RadioGroup,
  RadioItem,
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
    vi.clearAllMocks()
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
    expect(container.querySelector('[data-testid="checkbox-indicator"]')?.textContent).toBe('x')

    open(true)
    await waitForEffects()
    click(container.querySelector('[data-testid="radio-two"]') as HTMLDivElement)
    await waitForEffects()

    expect(radioValue()).toBe('two')
    expect(container.querySelector('[data-testid="radio-indicator"]')?.textContent).toBe('dot')
  })
})
