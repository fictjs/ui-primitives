import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render } from 'fict'
import { HoverCard as ThemedHoverCard, Link, Theme } from '@fictjs/radix-ui-themes'
import { HoverCard } from '@fictjs/radix-ui'

const cleanups: Array<() => void> = []

function pointerEvent(target: Element, type: string, init: PointerEventInit = {}) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
      ...init,
    }),
  )
}

async function flushEffects(cycles = 4) {
  for (let index = 0; index < cycles; index += 1) {
    await new Promise<void>((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(resolve)
        return
      }

      Promise.resolve().then(resolve)
    })
  }
}

async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms)
  await flushEffects()
}

describe('primitive hover card', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it.skip('closes content after leaving the trigger', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <HoverCard.Root openDelay={0} closeDelay={20}>
            <HoverCard.Trigger>
              <a data-testid="trigger">Primitive trigger</a>
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Content data-testid="content">
                <p>Preview</p>
              </HoverCard.Content>
            </HoverCard.Portal>
          </HoverCard.Root>
        ),
        container,
      ),
    )

    const trigger = container.querySelector('[data-testid="trigger"]')
    expect(trigger).not.toBeNull()

    pointerEvent(trigger as Element, 'pointerenter')
    await advance(0)

    const content = document.body.querySelector('[data-testid="content"]')
    expect(content).not.toBeNull()

    pointerEvent(trigger as Element, 'pointerleave')
    await advance(20)

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
  })

  it.skip('closes content after leaving the trigger when wrapped in Theme asChild', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <HoverCard.Root openDelay={0} closeDelay={20}>
            <HoverCard.Trigger>
              <a data-testid="theme-trigger">Theme trigger</a>
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <Theme asChild>
                <HoverCard.Content
                  align="start"
                  collisionPadding={10}
                  data-testid="theme-content"
                  sideOffset={8}
                  class="rt-PopperContent rt-HoverCardContent"
                >
                  <p>Preview</p>
                </HoverCard.Content>
              </Theme>
            </HoverCard.Portal>
          </HoverCard.Root>
        ),
        container,
      ),
    )

    const trigger = container.querySelector('[data-testid="theme-trigger"]')
    expect(trigger).not.toBeNull()

    pointerEvent(trigger as Element, 'pointerenter')
    await advance(0)

    const content = document.body.querySelector('[data-testid="theme-content"]')
    expect(content).not.toBeNull()

    pointerEvent(trigger as Element, 'pointerleave')
    await advance(20)

    expect(document.body.querySelector('[data-testid="theme-content"]')).toBeNull()
  })

  it.skip('closes content after leaving a themed trigger with primitive content', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <HoverCard.Root openDelay={0} closeDelay={20}>
            <ThemedHoverCard.Trigger>
              <Link data-testid="mixed-trigger">Mixed trigger</Link>
            </ThemedHoverCard.Trigger>
            <HoverCard.Portal>
              <Theme asChild>
                <HoverCard.Content
                  align="start"
                  collisionPadding={10}
                  data-testid="mixed-content"
                  sideOffset={8}
                  class="rt-PopperContent rt-HoverCardContent"
                >
                  <p>Preview</p>
                </HoverCard.Content>
              </Theme>
            </HoverCard.Portal>
          </HoverCard.Root>
        ),
        container,
      ),
    )

    const trigger = container.querySelector('[data-testid="mixed-trigger"]')
    expect(trigger).not.toBeNull()

    pointerEvent(trigger as Element, 'pointerenter')
    await advance(0)
    expect(document.body.querySelector('[data-testid="mixed-content"]')).not.toBeNull()

    pointerEvent(trigger as Element, 'pointerleave')
    await advance(20)

    const currentTrigger = container.querySelector('[data-testid="mixed-trigger"]')
    expect(currentTrigger?.getAttribute('data-state')).toBe('closed')
    expect(document.body.querySelector('[data-testid="mixed-content"]')).toBeNull()
  })

  it.skip('closes content after leaving a primitive trigger with themed content', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <HoverCard.Root openDelay={0} closeDelay={20}>
            <HoverCard.Trigger>
              <a data-testid="mixed-primitive-trigger">Primitive trigger</a>
            </HoverCard.Trigger>
            <ThemedHoverCard.Content data-testid="mixed-themed-content">
              <p>Preview</p>
            </ThemedHoverCard.Content>
          </HoverCard.Root>
        ),
        container,
      ),
    )

    const trigger = container.querySelector('[data-testid="mixed-primitive-trigger"]')
    expect(trigger).not.toBeNull()

    pointerEvent(trigger as Element, 'pointerenter')
    await advance(0)
    expect(document.body.querySelector('[data-testid="mixed-themed-content"]')).not.toBeNull()

    pointerEvent(trigger as Element, 'pointerleave')
    await advance(20)

    expect(document.body.querySelector('[data-testid="mixed-themed-content"]')).toBeNull()
  })
})
