/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Content, Indicator, Item, Link, List, Root, Trigger, Viewport } from '../src/index.js'

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

describe('@fictjs/navigation-menu', () => {
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

  it('opens matching content from a trigger and shows the indicator', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root>
          <List>
            <Item value="docs">
              <Trigger data-testid="trigger">Docs</Trigger>
              <Content data-testid="content">Panel</Content>
            </Item>
          </List>
          <Indicator data-testid="indicator">i</Indicator>
        </Root>
      ),
      container,
    )

    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()

    expect(container.querySelector('[data-testid="content"]')?.textContent).toBe('Panel')
    expect(container.querySelector('[data-testid="indicator"]')?.textContent).toBe('i')
  })

  it('ports active content into the viewport when one is present', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Root defaultValue="docs">
          <List>
            <Item value="docs">
              <Trigger>Docs</Trigger>
              <Content data-testid="content">Panel</Content>
            </Item>
          </List>
          <Viewport data-testid="viewport" />
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const viewport = container.querySelector('[data-testid="viewport"]') as HTMLDivElement
    expect(viewport.querySelector('[data-testid="content"]')?.textContent).toBe('Panel')
  })

  it('updates link active state reactively', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const current = createSignal('docs')

    mount(
      () => (
        <Root>
          <List>
            <Item>
              <Link
                href="/docs"
                data-testid="docs-link"
                active={() => current() === 'docs'}
              >
                Docs
              </Link>
            </Item>
            <Item>
              <Link
                href="/blog"
                data-testid="blog-link"
                active={() => current() === 'blog'}
              >
                Blog
              </Link>
            </Item>
          </List>
        </Root>
      ),
      container,
    )

    await waitForEffects()

    const docsLink = container.querySelector('[data-testid="docs-link"]') as HTMLAnchorElement
    const blogLink = container.querySelector('[data-testid="blog-link"]') as HTMLAnchorElement

    expect(docsLink.getAttribute('data-active')).toBe('')
    expect(docsLink.hasAttribute('active')).toBe(false)
    expect(blogLink.hasAttribute('data-active')).toBe(false)
    expect(blogLink.hasAttribute('active')).toBe(false)

    current('blog')
    await waitForEffects()

    expect(docsLink.hasAttribute('data-active')).toBe(false)
    expect(blogLink.getAttribute('data-active')).toBe('')
  })
})
