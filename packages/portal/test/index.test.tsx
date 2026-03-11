/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { Portal } from '../src/index.js'

function flushMicrotasks(): Promise<void> {
  return Promise.resolve()
}

describe('@fictjs/portal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders into a provided container', async () => {
    const host = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(host, portalRoot)

    render(
      () => (
        <Portal container={portalRoot} id="custom-portal">
          <span>Inside</span>
        </Portal>
      ),
      host,
    )

    await flushMicrotasks()

    const portalNode = portalRoot.querySelector('#custom-portal')
    expect(portalNode).not.toBeNull()
    expect(portalNode?.textContent).toBe('Inside')
    expect(host.querySelector('#custom-portal')).toBeNull()
  })

  it('defaults to document.body once mounted', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    render(() => <Portal id="body-portal">Body content</Portal>, host)

    await flushMicrotasks()

    const portalNode = document.body.querySelector('#body-portal')
    expect(portalNode).not.toBeNull()
    expect(portalNode?.textContent).toBe('Body content')
    expect(host.querySelector('#body-portal')).toBeNull()
  })
})
