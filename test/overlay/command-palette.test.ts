import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  CommandPaletteContent,
  CommandPaletteEmpty,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPaletteRoot,
  CommandPaletteTrigger,
} from '../../src/components/overlay/command-palette'

describe('CommandPalette', () => {
  it('opens from trigger and filters items by query', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: CommandPaletteRoot,
        props: {
          children: [
            { type: CommandPaletteTrigger, props: { 'data-testid': 'command-trigger', children: 'Open' } },
            {
              type: CommandPaletteContent,
              props: {
                portal: false,
                children: [
                  { type: CommandPaletteInput, props: { 'data-testid': 'command-input' } },
                  {
                    type: CommandPaletteList,
                    props: {
                      children: [
                        { type: CommandPaletteItem, props: { value: 'projects', children: 'Projects' } },
                        { type: CommandPaletteItem, props: { value: 'settings', children: 'Settings' } },
                        { type: CommandPaletteEmpty, props: { children: 'No match' } },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-testid="command-trigger"]') as HTMLElement)
    await Promise.resolve()

    const input = container.querySelector('[data-testid="command-input"]') as HTMLInputElement
    input.value = 'proj'
    fireEvent.input(input)
    await Promise.resolve()

    expect(container.querySelector('[data-command-item="projects"]')).not.toBeNull()
    expect(container.querySelector('[data-command-item="settings"]')).toBeNull()

    dispose()
    container.remove()
  })

  it('selects an item, emits value change, and closes content', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const changes: string[] = []

    const dispose = render(
      () => ({
        type: CommandPaletteRoot,
        props: {
          defaultOpen: true,
          onValueChange: (value: string) => changes.push(value),
          children: {
            type: CommandPaletteContent,
            props: {
              portal: false,
              children: {
                type: CommandPaletteList,
                props: {
                  children: { type: CommandPaletteItem, props: { value: 'settings', children: 'Settings' } },
                },
              },
            },
          },
        },
      }),
      container,
    )

    fireEvent.click(container.querySelector('[data-command-item="settings"]') as HTMLElement)
    await Promise.resolve()

    expect(changes).toEqual(['settings'])
    expect(container.querySelector('[data-command-content]')).toBeNull()

    dispose()
    container.remove()
  })

  it('renders empty state when query has no matches', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: CommandPaletteRoot,
        props: {
          defaultOpen: true,
          children: {
            type: CommandPaletteContent,
            props: {
              portal: false,
              children: [
                { type: CommandPaletteInput, props: { 'data-testid': 'command-input-empty' } },
                {
                  type: CommandPaletteList,
                  props: {
                    children: [
                      { type: CommandPaletteItem, props: { value: 'profile', children: 'Profile' } },
                      { type: CommandPaletteEmpty, props: { 'data-testid': 'command-empty', children: 'No results' } },
                    ],
                  },
                },
              ],
            },
          },
        },
      }),
      container,
    )

    const input = container.querySelector('[data-testid="command-input-empty"]') as HTMLInputElement
    input.value = 'zzz'
    fireEvent.input(input)
    await Promise.resolve()

    expect(container.querySelector('[data-testid="command-empty"]')?.textContent).toContain('No results')

    dispose()
    container.remove()
  })
})
