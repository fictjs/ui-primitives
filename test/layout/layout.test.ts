import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/dom'

import { render } from '@fictjs/runtime'

import {
  AspectRatio,
  FocusVisible,
  KeyboardModeProvider,
  Meter,
  Progress,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  Skeleton,
} from '../../src/components/layout'

describe('Layout primitives', () => {
  it('renders scroll-area structure', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: ScrollArea,
        props: {
          children: [
            { type: ScrollAreaViewport, props: { children: 'Body' } },
            {
              type: ScrollAreaScrollbar,
              props: {
                orientation: 'vertical',
                children: { type: ScrollAreaThumb, props: {} },
              },
            },
          ],
        },
      }),
      container,
    )

    expect(container.querySelector('[data-scroll-area]')).not.toBeNull()
    expect(container.querySelector('[data-scroll-area-viewport]')).not.toBeNull()
    expect(container.querySelector('[data-scroll-area-thumb]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('renders resizable and aspect ratio primitives', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: 'div',
        props: {
          children: [
            {
              type: ResizablePanelGroup,
              props: {
                children: [
                  { type: ResizablePanel, props: { children: 'Left' } },
                  { type: ResizableHandle, props: { withHandle: true } },
                  { type: ResizablePanel, props: { children: 'Right' } },
                ],
              },
            },
            { type: AspectRatio, props: { ratio: 16 / 9, children: 'Media' } },
          ],
        },
      }),
      container,
    )

    expect(container.querySelector('[data-resizable-panel-group]')).not.toBeNull()
    expect(container.querySelector('[data-aspect-ratio]')).not.toBeNull()

    dispose()
    container.remove()
  })

  it('renders progress meter skeleton and focus-visible state', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const dispose = render(
      () => ({
        type: KeyboardModeProvider,
        props: {
          children: {
            type: 'div',
            props: {
              children: [
                { type: Progress, props: { value: 40, max: 100 } },
                { type: Meter, props: { value: 65, min: 0, max: 100 } },
                { type: Skeleton, props: { loading: true, children: 'Loading...' } },
                { type: FocusVisible, props: { 'data-testid': 'focus', children: 'Focusable' } },
              ],
            },
          },
        },
      }),
      container,
    )

    fireEvent.keyDown(document, { key: 'Tab' })
    await Promise.resolve()

    expect(container.querySelector('[data-progress-indicator]')).not.toBeNull()
    expect(container.querySelector('[data-meter]')).not.toBeNull()
    expect(container.querySelector('[data-skeleton]')).not.toBeNull()
    expect(container.querySelector('[data-testid="focus"]')?.getAttribute('data-focus-visible')).toBe('true')

    dispose()
    container.remove()
  })
})
