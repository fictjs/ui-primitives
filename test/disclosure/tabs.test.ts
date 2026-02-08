import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from '../../src/components/disclosure/tabs'

describe('Tabs', () => {
  it('switches tab content when trigger is clicked', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: TabsRoot,
        props: {
          defaultValue: 'tab-a',
          children: [
            {
              type: TabsList,
              props: {
                children: [
                  { type: TabsTrigger, props: { value: 'tab-a', 'data-testid': 'tab-a', children: 'A' } },
                  { type: TabsTrigger, props: { value: 'tab-b', 'data-testid': 'tab-b', children: 'B' } },
                ],
              },
            },
            { type: TabsContent, props: { value: 'tab-a', children: 'Panel A' } },
            { type: TabsContent, props: { value: 'tab-b', children: 'Panel B' } },
          ],
        },
      }),
      container,
    )

    expect(container.textContent).toContain('Panel A')
    expect(container.textContent).not.toContain('Panel B')

    fireEvent.click(container.querySelector('[data-testid="tab-b"]') as HTMLElement)
    await Promise.resolve()

    expect(container.textContent).toContain('Panel B')

    dispose()
    container.remove()
  })

  it('supports controlled value and emits onValueChange', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const value = createSignal('tab-a')
    const changes: string[] = []

    const dispose = render(
      () => ({
        type: TabsRoot,
        props: {
          value: () => value(),
          onValueChange: (next: string) => changes.push(next),
          children: [
            {
              type: TabsList,
              props: {
                children: [
                  { type: TabsTrigger, props: { value: 'tab-a', 'data-testid': 'tab-a', children: 'A' } },
                  { type: TabsTrigger, props: { value: 'tab-b', 'data-testid': 'tab-b', children: 'B' } },
                ],
              },
            },
            { type: TabsContent, props: { value: 'tab-a', children: 'Panel A' } },
            { type: TabsContent, props: { value: 'tab-b', children: 'Panel B' } },
          ],
        },
      }),
      container,
    )

    expect(container.textContent).toContain('Panel A')
    fireEvent.click(container.querySelector('[data-testid="tab-b"]') as HTMLElement)
    await Promise.resolve()

    expect(changes).toEqual(['tab-b'])
    expect(container.textContent).toContain('Panel A')
    expect(container.textContent).not.toContain('Panel B')

    value('tab-b')
    await Promise.resolve()
    expect(container.textContent).toContain('Panel B')

    dispose()
    container.remove()
  })

  it('keeps panel mounted when forceMount is enabled', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: TabsRoot,
        props: {
          defaultValue: 'tab-a',
          children: [
            {
              type: TabsList,
              props: {
                children: [
                  { type: TabsTrigger, props: { value: 'tab-a', 'data-testid': 'tab-a', children: 'A' } },
                  { type: TabsTrigger, props: { value: 'tab-b', 'data-testid': 'tab-b', children: 'B' } },
                ],
              },
            },
            { type: TabsContent, props: { value: 'tab-a', children: 'Panel A' } },
            {
              type: TabsContent,
              props: {
                value: 'tab-b',
                forceMount: true,
                children: 'Panel B',
              },
            },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()

    const inactivePanel = container.querySelector('[data-tabs-content="tab-b"]')
    expect(inactivePanel).not.toBeNull()
    expect(inactivePanel?.getAttribute('data-state')).toBe('inactive')

    dispose()
    container.remove()
  })

  it('supports asChild trigger composition', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: TabsRoot,
        props: {
          defaultValue: 'tab-a',
          children: [
            {
              type: TabsList,
              props: {
                children: [
                  {
                    type: TabsTrigger,
                    props: {
                      value: 'tab-a',
                      asChild: true,
                      children: {
                        type: 'span',
                        props: { role: 'tab', 'data-testid': 'tab-a-child', children: 'A' },
                      },
                    },
                  },
                  {
                    type: TabsTrigger,
                    props: {
                      value: 'tab-b',
                      asChild: true,
                      children: {
                        type: 'span',
                        props: { role: 'tab', 'data-testid': 'tab-b-child', children: 'B' },
                      },
                    },
                  },
                ],
              },
            },
            { type: TabsContent, props: { value: 'tab-a', children: 'Panel A' } },
            { type: TabsContent, props: { value: 'tab-b', children: 'Panel B' } },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="tab-b-child"]') as HTMLElement)
    await Promise.resolve()
    expect(container.textContent).toContain('Panel B')

    dispose()
    container.remove()
  })

  it('supports explicit root id for deterministic aria mapping', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: TabsRoot,
        props: {
          id: 'settings-tabs',
          defaultValue: 'tab-a',
          children: [
            {
              type: TabsList,
              props: {
                children: [
                  { type: TabsTrigger, props: { value: 'tab-a', 'data-testid': 'id-tab-a', children: 'A' } },
                  { type: TabsTrigger, props: { value: 'tab-b', children: 'B' } },
                ],
              },
            },
            { type: TabsContent, props: { value: 'tab-a', children: 'Panel A' } },
            { type: TabsContent, props: { value: 'tab-b', children: 'Panel B' } },
          ],
        },
      }),
      container,
    )

    await Promise.resolve()

    const trigger = container.querySelector('[data-testid="id-tab-a"]') as HTMLElement
    const panel = container.querySelector('[data-tabs-content="tab-a"]') as HTMLElement
    expect(trigger.id).toBe('settings-tabs-trigger-tab-a')
    expect(panel.id).toBe('settings-tabs-content-tab-a')
    expect(trigger.getAttribute('aria-controls')).toBe('settings-tabs-content-tab-a')

    dispose()
    container.remove()
  })
})
