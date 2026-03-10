/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Content, Root, Trigger } from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

async function flushEffects(cycles = 4): Promise<void> {
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

describe('@fictjs/collapsible', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('toggles content visibility from the trigger', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => (
      <Root>
        <Trigger>Toggle</Trigger>
        <Content data-testid="content">Body</Content>
      </Root>
    ), container)

    await flushEffects()

    let trigger = container.querySelector('button') as HTMLButtonElement
    let content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(content.hidden).toBe(true)
    expect(content.getAttribute('data-state')).toBe('closed')

    click(trigger)
    await flushEffects()

    trigger = container.querySelector('button') as HTMLButtonElement
    content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('aria-controls')).toBe(content.id)
    expect(content.hidden).toBe(false)
    expect(content.textContent).toBe('Body')
    expect(content.getAttribute('data-state')).toBe('open')

    click(trigger)
    await flushEffects()

    content = container.querySelector('[data-testid="content"]') as HTMLDivElement
    expect(content.hidden).toBe(true)
  })

  it('supports uncontrolled defaultOpen and emits close changes', async () => {
    const onOpenChange = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)

    render(() => (
      <Root defaultOpen onOpenChange={onOpenChange}>
        <Trigger>Toggle</Trigger>
        <Content data-testid="content">Body</Content>
      </Root>
    ), container)

    await flushEffects()

    const trigger = container.querySelector('button') as HTMLButtonElement
    let content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(content.hidden).toBe(false)

    click(trigger)
    await flushEffects()

    content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(content.hidden).toBe(true)
  })

  it('supports controlled open state without closing until the parent updates', async () => {
    const open = createSignal(true)
    const onOpenChange = vi.fn((nextOpen: boolean) => {
      if (nextOpen) {
        open(nextOpen)
      }
    })
    const container = document.createElement('div')
    document.body.append(container)

    render(() => (
      <Root open={open} onOpenChange={onOpenChange}>
        <Trigger>Toggle</Trigger>
        <Content data-testid="content">Body</Content>
      </Root>
    ), container)

    await flushEffects()

    const trigger = container.querySelector('button') as HTMLButtonElement
    let content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    click(trigger)
    await flushEffects()

    content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(content.hidden).toBe(false)
  })

  it('keeps the content tree mounted when forceMount is set', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    render(() => (
      <Root>
        <Trigger>Toggle</Trigger>
        <Content data-testid="content" forceMount>
          Body
        </Content>
      </Root>
    ), container)

    await flushEffects()

    const content = container.querySelector('[data-testid="content"]') as HTMLDivElement

    expect(content).not.toBeNull()
    expect(content.hidden).toBe(false)
    expect(content.textContent).toBe('Body')
  })

  it('forwards ref mount and cleanup through the root element', async () => {
    const calls: Array<string | null> = []
    const container = document.createElement('div')
    document.body.append(container)

    const dispose = render(() => (
      <Root
        ref={(node) => {
          calls.push(node?.tagName ?? null)
        }}
      >
        <Trigger>Toggle</Trigger>
        <Content>Body</Content>
      </Root>
    ), container)

    await flushEffects()
    expect(calls).toEqual(['DIV'])

    dispose()

    await flushEffects()
    expect(calls).toEqual(['DIV', null])
  })
})
