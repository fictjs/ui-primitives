/** @jsxImportSource fict */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('get-nonce', () => ({
  getNonce: vi.fn(() => undefined),
}))

import { prop, render } from 'fict'
import { createSignal } from 'fict/advanced'
import { getNonce } from 'get-nonce'

import { styleHookSingleton, styleSingleton, stylesheetSingleton } from '../src/index.js'

const getNonceMock = vi.mocked(getNonce)

const tick = () =>
  new Promise<void>((resolve) =>
    typeof queueMicrotask === 'function'
      ? queueMicrotask(resolve)
      : Promise.resolve().then(resolve),
  )

function getStyleTags(): HTMLStyleElement[] {
  return Array.from(document.head.querySelectorAll('style'))
}

function getStyleText(): string | null {
  return getStyleTags()[0]?.textContent ?? null
}

describe('@fictjs/fict-style-singleton', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    getNonceMock.mockReturnValue(undefined)
  })

  it('injects a single style tag and reference-counts removals', () => {
    const sheet = stylesheetSingleton()

    sheet.add('body { color: red; }')
    sheet.add('body { color: red; }')

    expect(getStyleTags()).toHaveLength(1)
    expect(getStyleText()).toBe('body { color: red; }')

    sheet.remove()
    expect(getStyleTags()).toHaveLength(1)

    sheet.remove()
    expect(getStyleTags()).toHaveLength(0)
  })

  it('applies the CSP nonce when available', () => {
    getNonceMock.mockReturnValue('nonce-value')

    const sheet = stylesheetSingleton()
    sheet.add('body { color: red; }')

    expect(getStyleTags()[0]?.getAttribute('nonce')).toBe('nonce-value')
  })

  it('is a no-op when document is unavailable', () => {
    const originalDocument = globalThis.document

    try {
      vi.stubGlobal('document', undefined)

      const sheet = stylesheetSingleton()

      expect(() => sheet.add('body { color: red; }')).not.toThrow()
      expect(() => sheet.remove()).not.toThrow()
    } finally {
      vi.stubGlobal('document', originalDocument)
    }
  })

  it('supports the legacy styleSheet.cssText injection path', () => {
    const createElement = document.createElement.bind(document)
    let cssText = ''

    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
      const element = createElement(tagName, options)

      if (tagName === 'style') {
        Object.defineProperty(element, 'styleSheet', {
          configurable: true,
          value: {
            get cssText() {
              return cssText
            },
            set cssText(value: string) {
              cssText = value
            },
          },
        })
      }

      return element
    }) as typeof document.createElement)

    try {
      const sheet = stylesheetSingleton()
      sheet.add('body { color: red; }')

      expect(cssText).toBe('body { color: red; }')
      expect(getStyleTags()).toHaveLength(1)

      sheet.remove()
    } finally {
      createElementSpy.mockRestore()
    }
  })

  it('mounts and unmounts styles through the component API', () => {
    const Style = styleSingleton()
    const container = document.createElement('div')

    const dispose = render(
      () => (
        <div>
          <Style styles="body { color: red; }" />
          <span>content</span>
        </div>
      ),
      container,
    )

    expect(getStyleTags()).toHaveLength(1)
    expect(getStyleText()).toBe('body { color: red; }')
    expect(container.textContent).toBe('content')

    dispose()

    expect(getStyleTags()).toHaveLength(0)
  })

  it('shares one style tag across multiple mounted component instances', () => {
    const Style = styleSingleton()
    const container = document.createElement('div')

    const dispose = render(
      () => (
        <div>
          <Style styles="body { color: red; }" />
          <Style styles="body { color: red; }" />
        </div>
      ),
      container,
    )

    expect(getStyleTags()).toHaveLength(1)

    dispose()

    expect(getStyleTags()).toHaveLength(0)
  })

  it('does not react to style changes when dynamic is disabled', async () => {
    const Style = styleSingleton()
    const styles = createSignal('body { color: red; }')
    const container = document.createElement('div')

    const dispose = render(() => <Style styles={prop(() => styles())} />, container)

    expect(getStyleText()).toBe('body { color: red; }')

    styles('body { color: blue; }')
    await tick()

    expect(getStyleText()).toBe('body { color: red; }')

    dispose()
  })

  it('reapplies styles when dynamic is enabled', async () => {
    const Style = styleSingleton()
    const styles = createSignal('body { color: red; }')
    const container = document.createElement('div')

    const dispose = render(() => <Style styles={prop(() => styles())} dynamic />, container)

    expect(getStyleText()).toBe('body { color: red; }')

    styles('body { color: blue; }')
    await tick()

    expect(getStyleText()).toBe('body { color: blue; }')

    dispose()
  })

  it('supports getter-based updates through the hook API', async () => {
    const useStyle = styleHookSingleton()
    const styles = createSignal('body { background: black; }')
    const container = document.createElement('div')

    function App() {
      useStyle(() => styles(), true)
      return <div>hook</div>
    }

    const dispose = render(() => <App />, container)

    expect(getStyleText()).toBe('body { background: black; }')

    styles('body { background: white; }')
    await tick()

    expect(getStyleText()).toBe('body { background: white; }')

    dispose()
  })

  it('can react when the dynamic flag itself changes', async () => {
    const useStyle = styleHookSingleton()
    const styles = createSignal('body { color: red; }')
    const dynamic = createSignal(false)
    const container = document.createElement('div')

    function App() {
      useStyle(
        () => styles(),
        () => dynamic(),
      )
      return <div>toggle-dynamic</div>
    }

    const dispose = render(() => <App />, container)

    expect(getStyleText()).toBe('body { color: red; }')

    styles('body { color: blue; }')
    await tick()
    expect(getStyleText()).toBe('body { color: red; }')

    dynamic(true)
    await tick()
    expect(getStyleText()).toBe('body { color: blue; }')

    styles('body { color: green; }')
    await tick()
    expect(getStyleText()).toBe('body { color: green; }')

    dispose()
  })

  it('creates isolated singleton instances for separate factories', () => {
    const PrimaryStyle = styleSingleton()
    const SecondaryStyle = styleSingleton()
    const container = document.createElement('div')

    const dispose = render(
      () => (
        <div>
          <PrimaryStyle styles="body { color: red; }" />
          <SecondaryStyle styles="body { background: black; }" />
        </div>
      ),
      container,
    )

    expect(getStyleTags()).toHaveLength(2)
    expect(getStyleTags().map((tag) => tag.textContent)).toEqual([
      'body { color: red; }',
      'body { background: black; }',
    ])

    dispose()
  })
})
