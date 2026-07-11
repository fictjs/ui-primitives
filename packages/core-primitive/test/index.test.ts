import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  canUseDOM,
  composeEventHandlers,
  getActiveElement,
  getOwnerDocument,
  getOwnerWindow,
  isFrame,
  waitForConnected,
} from '../src/index.js'

async function waitForConnectionPoll(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 24))
  await Promise.resolve()
}

describe('@fictjs/core-primitive', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('exposes DOM availability in browser-like environments', () => {
    expect(canUseDOM).toBe(true)
  })

  it('composes event handlers and respects default prevention by default', () => {
    const calls: string[] = []
    const event = new Event('click', { cancelable: true }) as Event & { defaultPrevented: boolean }
    const handler = composeEventHandlers<Event & { defaultPrevented: boolean }>(
      (currentEvent) => {
        calls.push('original')
        currentEvent.preventDefault()
      },
      () => {
        calls.push('ours')
      },
    )

    handler(event)

    expect(calls).toEqual(['original'])
  })

  it('can ignore default prevention when requested', () => {
    const calls: string[] = []
    const event = new Event('click', { cancelable: true }) as Event & { defaultPrevented: boolean }
    const handler = composeEventHandlers<Event & { defaultPrevented: boolean }>(
      (currentEvent) => {
        calls.push('original')
        currentEvent.preventDefault()
      },
      () => {
        calls.push('ours')
      },
      { checkForDefaultPrevented: false },
    )

    handler(event)

    expect(calls).toEqual(['original', 'ours'])
  })

  it('returns owner document and window from the provided node', () => {
    const element = document.createElement('div')
    document.body.append(element)

    expect(getOwnerDocument(element)).toBe(document)
    expect(getOwnerWindow(element)).toBe(window)
    expect(getOwnerDocument(null)).toBe(document)
    expect(getOwnerWindow(null)).toBe(window)
  })

  it('returns the active descendant when requested', () => {
    const input = document.createElement('input')
    const activeDescendant = document.createElement('div')

    activeDescendant.id = 'active-descendant'
    input.setAttribute('aria-activedescendant', activeDescendant.id)
    document.body.append(input, activeDescendant)
    input.focus()

    expect(getActiveElement(document.body)).toBe(input)
    expect(getActiveElement(document.body, true)).toBe(activeDescendant)
  })

  it('detects iframe elements', () => {
    expect(isFrame(document.createElement('iframe'))).toBe(true)
    expect(isFrame(document.createElement('div'))).toBe(false)
  })

  it('waits until a same-document node is connected', async () => {
    const node = document.createElement('div')
    const onConnected = vi.fn()

    waitForConnected(node, onConnected)
    expect(onConnected).not.toHaveBeenCalled()

    await Promise.resolve()
    expect(onConnected).not.toHaveBeenCalled()

    document.body.append(node)
    await Promise.resolve()

    expect(onConnected).toHaveBeenCalledTimes(1)
  })

  it('follows a detached node adopted into an iframe document', async () => {
    const iframe = document.createElement('iframe')
    const node = document.createElement('div')
    const onConnected = vi.fn()
    document.body.append(iframe)

    const frameDocument = iframe.contentDocument as Document
    waitForConnected(node, onConnected)
    await Promise.resolve()

    frameDocument.body.append(frameDocument.adoptNode(node))
    await waitForConnectionPoll()

    expect(node.ownerDocument).toBe(frameDocument)
    expect(onConnected).toHaveBeenCalledTimes(1)
  })

  it('detects insertion into a connected shadow root', async () => {
    const host = document.createElement('div')
    const node = document.createElement('div')
    const onConnected = vi.fn()
    const shadowRoot = host.attachShadow({ mode: 'open' })
    document.body.append(host)

    waitForConnected(node, onConnected)
    await Promise.resolve()

    shadowRoot.append(node)
    await waitForConnectionPoll()

    expect(node.getRootNode()).toBe(shadowRoot)
    expect(onConnected).toHaveBeenCalledTimes(1)
  })

  it('cancels pending observation and polling when disposed', async () => {
    vi.useFakeTimers()
    const disconnect = vi.spyOn(window.MutationObserver.prototype, 'disconnect')
    const node = document.createElement('div')
    const onConnected = vi.fn()

    try {
      const dispose = waitForConnected(node, onConnected)
      await Promise.resolve()

      expect(vi.getTimerCount()).toBe(1)
      dispose()
      expect(disconnect).toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)

      document.body.append(node)
      await vi.runAllTimersAsync()
      await Promise.resolve()

      expect(onConnected).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
