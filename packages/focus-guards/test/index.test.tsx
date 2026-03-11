/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it } from 'vitest'

import { render } from '@fictjs/runtime'

import { FocusGuards } from '../src/index.js'

describe('@fictjs/focus-guards', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('injects a pair of focus guards while mounted', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const dispose = render(
      () => (
        <FocusGuards>
          <div>Ready</div>
        </FocusGuards>
      ),
      host,
    )

    const guards = document.querySelectorAll('[data-radix-focus-guard]')

    expect(guards).toHaveLength(2)
    expect(document.body.firstElementChild).toBe(guards[0])
    expect(document.body.lastElementChild).toBe(guards[1])

    dispose()

    expect(document.querySelectorAll('[data-radix-focus-guard]')).toHaveLength(0)
  })

  it('keeps shared guards until the last consumer unmounts', () => {
    const hostA = document.createElement('div')
    const hostB = document.createElement('div')
    document.body.append(hostA, hostB)

    const disposeA = render(
      () => (
        <FocusGuards>
          <div>A</div>
        </FocusGuards>
      ),
      hostA,
    )
    const disposeB = render(
      () => (
        <FocusGuards>
          <div>B</div>
        </FocusGuards>
      ),
      hostB,
    )

    expect(document.querySelectorAll('[data-radix-focus-guard]')).toHaveLength(2)

    disposeA()
    expect(document.querySelectorAll('[data-radix-focus-guard]')).toHaveLength(2)

    disposeB()
    expect(document.querySelectorAll('[data-radix-focus-guard]')).toHaveLength(0)
  })
})
