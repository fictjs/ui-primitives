/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
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

async function waitForEffects(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await flushEffects(6)
}

describe('@fictjs/accordion', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
  })

  it('supports single selection and collapsible control', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Accordion type="single" defaultValue="one" collapsible>
          <AccordionItem value="one">
            <AccordionHeader>
              <AccordionTrigger data-testid="one-trigger">One</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent data-testid="one-content">One content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="two">
            <AccordionHeader>
              <AccordionTrigger data-testid="two-trigger">Two</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent data-testid="two-content">Two content</AccordionContent>
          </AccordionItem>
        </Accordion>
      ),
      container,
    )

    await waitForEffects()

    const getTriggers = () => {
      const oneTrigger = container.querySelector('[data-testid="one-trigger"]') as HTMLButtonElement
      const twoTrigger = container.querySelector('[data-testid="two-trigger"]') as HTMLButtonElement
      return [oneTrigger, twoTrigger] as const
    }
    let [oneTrigger, twoTrigger] = getTriggers()

    expect(oneTrigger.getAttribute('aria-expanded')).toBe('true')
    expect((container.querySelector('[data-testid="one-content"]') as HTMLDivElement).hidden).toBe(
      false,
    )

    click(twoTrigger)
    await waitForEffects()
    ;[oneTrigger, twoTrigger] = getTriggers()

    expect(oneTrigger.getAttribute('aria-expanded')).toBe('false')
    expect(twoTrigger.getAttribute('aria-expanded')).toBe('true')

    click(twoTrigger)
    await waitForEffects()
    ;[oneTrigger, twoTrigger] = getTriggers()

    expect(twoTrigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('supports multiple expanded items', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Accordion type="multiple" defaultValue={['one']}>
          <AccordionItem value="one">
            <AccordionHeader>
              <AccordionTrigger data-testid="one-trigger">One</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent data-testid="one-content">One content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="two">
            <AccordionHeader>
              <AccordionTrigger data-testid="two-trigger">Two</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent data-testid="two-content">Two content</AccordionContent>
          </AccordionItem>
        </Accordion>
      ),
      container,
    )

    await waitForEffects()

    const getTriggers = () => {
      const oneTrigger = container.querySelector('[data-testid="one-trigger"]') as HTMLButtonElement
      const twoTrigger = container.querySelector('[data-testid="two-trigger"]') as HTMLButtonElement
      return [oneTrigger, twoTrigger] as const
    }
    let [oneTrigger, twoTrigger] = getTriggers()

    click(twoTrigger)
    await waitForEffects()
    ;[oneTrigger, twoTrigger] = getTriggers()

    expect(oneTrigger.getAttribute('aria-expanded')).toBe('true')
    expect(twoTrigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('moves focus between triggers with arrow keys', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Accordion type="single">
          <AccordionItem value="one">
            <AccordionHeader>
              <AccordionTrigger data-testid="one-trigger">One</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>One content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="two">
            <AccordionHeader>
              <AccordionTrigger data-testid="two-trigger">Two</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>Two content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="three">
            <AccordionHeader>
              <AccordionTrigger data-testid="three-trigger">Three</AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>Three content</AccordionContent>
          </AccordionItem>
        </Accordion>
      ),
      container,
    )

    await waitForEffects()

    const oneTrigger = container.querySelector('[data-testid="one-trigger"]') as HTMLButtonElement
    const twoTrigger = container.querySelector('[data-testid="two-trigger"]') as HTMLButtonElement
    const threeTrigger = container.querySelector(
      '[data-testid="three-trigger"]',
    ) as HTMLButtonElement

    oneTrigger.focus()
    keyDown(oneTrigger, 'ArrowDown')
    await waitForEffects()
    expect(document.activeElement).toBe(twoTrigger)

    keyDown(twoTrigger, 'End')
    await waitForEffects()
    expect(document.activeElement).toBe(threeTrigger)
  })
})
