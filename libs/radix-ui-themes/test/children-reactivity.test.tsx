/** @jsxImportSource fict */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render, type FictNode } from 'fict'
import { createSignal } from 'fict/advanced'

import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Em,
  Flex,
  Grid,
  IconButton,
  Inset,
  Kbd,
  Quote,
  Reset,
  Section,
  Strong,
  Theme,
} from '../src/index.js'
import { isValidElement } from '../src/helpers/element.js'
import { copyReactiveChildren } from '../src/helpers/render-children.js'

async function flushEffects(cycles = 6): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  for (let index = 0; index < cycles; index++) {
    await Promise.resolve()
  }
}

describe('themed children reactivity', () => {
  const cleanups: Array<() => void> = []

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }
    document.body.innerHTML = ''
  })

  it('updates getter-backed children in place across structural components', async () => {
    const entries = [
      ['badge', createSignal('Badge first')],
      ['box', createSignal('Box first')],
      ['card', createSignal('Card first')],
      ['code', createSignal('Code first')],
      ['em', createSignal('Em first')],
      ['flex', createSignal('Flex first')],
      ['grid', createSignal('Grid first')],
      ['inset', createSignal('Inset first')],
      ['kbd', createSignal('Kbd first')],
      ['quote', createSignal('Quote first')],
      ['section', createSignal('Section first')],
      ['strong', createSignal('Strong first')],
    ] as const
    const values = Object.fromEntries(entries) as Record<string, (value?: string) => string>
    const child = (key: string) => prop(() => values[key]!()) as unknown as FictNode
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <Theme>
            <Badge data-testid="badge" tabIndex={0}>
              {child('badge')}
            </Badge>
            <Box data-testid="box" tabIndex={0}>
              {child('box')}
            </Box>
            <Card data-testid="card" tabIndex={0}>
              {child('card')}
            </Card>
            <Code data-testid="code" tabIndex={0}>
              {child('code')}
            </Code>
            <Em data-testid="em" tabIndex={0}>
              {child('em')}
            </Em>
            <Flex data-testid="flex" tabIndex={0}>
              {child('flex')}
            </Flex>
            <Grid data-testid="grid" tabIndex={0}>
              {child('grid')}
            </Grid>
            <Inset data-testid="inset" tabIndex={0}>
              {child('inset')}
            </Inset>
            <Kbd data-testid="kbd" tabIndex={0}>
              {child('kbd')}
            </Kbd>
            <Quote data-testid="quote" tabIndex={0}>
              {child('quote')}
            </Quote>
            <Section data-testid="section" tabIndex={0}>
              {child('section')}
            </Section>
            <Strong data-testid="strong" tabIndex={0}>
              {child('strong')}
            </Strong>
          </Theme>
        ),
        container,
      ),
    )

    await flushEffects()

    for (const [key, value] of entries) {
      const node = container.querySelector(`[data-testid="${key}"]`) as HTMLElement
      node.focus()
      expect(document.activeElement).toBe(node)

      value(`${key} second`)
      await flushEffects()

      expect(container.querySelector(`[data-testid="${key}"]`)).toBe(node)
      expect(node.textContent).toBe(`${key} second`)
      expect(document.activeElement).toBe(node)
    }
  })

  it('renders ordinary lazy child functions synchronously', () => {
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => <Card data-testid="lazy-card">{(() => 'Lazy child') as unknown as FictNode}</Card>,
        container,
      ),
    )

    expect(container.querySelector('[data-testid="lazy-card"]')?.textContent).toBe('Lazy child')
  })

  it('copies VNode-producing child callbacks synchronously', () => {
    const lazyChild = vi.fn(() => <span data-testid="copied-child">Lazy child</span>)
    const reactiveLazyChild = prop(() => lazyChild)

    const copiedChild = copyReactiveChildren(() => reactiveLazyChild)

    expect(lazyChild).toHaveBeenCalledTimes(1)
    expect(copiedChild).not.toBe(lazyChild)
  })

  it('does not mistake rendered DOM controls for Fict elements', () => {
    expect(isValidElement(document.createElement('button'))).toBe(false)
    expect(isValidElement(document.createElement('input'))).toBe(false)
    expect(isValidElement({ type: 'span', props: null })).toBe(true)
  })

  it('accepts compiler-rendered DOM elements in single-child slots', () => {
    const list = document.createElement('ul')
    list.dataset.testid = 'compiled-list'
    list.append(document.createElement('li'))
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(render(() => <Reset>{list}</Reset>, container))

    expect(container.querySelector('[data-testid="compiled-list"]')).toBe(list)
    expect(list.classList.contains('rt-reset')).toBe(true)
  })

  it('updates getter-backed children inside slotted buttons', async () => {
    const buttonText = createSignal('Button first')
    const iconText = createSignal('Icon first')
    const container = document.createElement('div')
    document.body.append(container)

    cleanups.push(
      render(
        () => (
          <Theme>
            <Button asChild>
              <button data-testid="button" type="button">
                {prop(() => buttonText()) as unknown as FictNode}
              </button>
            </Button>
            <IconButton asChild>
              <button data-testid="icon-button" type="button">
                {prop(() => iconText()) as unknown as FictNode}
              </button>
            </IconButton>
          </Theme>
        ),
        container,
      ),
    )

    await flushEffects()
    const button = container.querySelector('[data-testid="button"]') as HTMLButtonElement
    const iconButton = container.querySelector('[data-testid="icon-button"]') as HTMLButtonElement

    button.focus()
    buttonText('Button second')
    await flushEffects()
    expect(container.querySelector('[data-testid="button"]')).toBe(button)
    expect(button.textContent).toBe('Button second')
    expect(document.activeElement).toBe(button)

    iconButton.focus()
    iconText('Icon second')
    await flushEffects()
    expect(container.querySelector('[data-testid="icon-button"]')).toBe(iconButton)
    expect(iconButton.textContent).toBe('Icon second')
    expect(document.activeElement).toBe(iconButton)
  })
})
