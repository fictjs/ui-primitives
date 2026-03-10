import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  canUseDOM,
  composeEventHandlers,
  getActiveElement,
  getOwnerDocument,
  getOwnerWindow,
  isFrame,
} from '../src/index.js'

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
})
