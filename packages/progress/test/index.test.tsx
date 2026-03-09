/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { Progress, ProgressIndicator } from '../src/index.js'

function flushMicrotasks(): Promise<void> {
  return Promise.resolve()
}

describe('@fictjs/progress', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('renders progress semantics and indicator state', () => {
    const container = document.createElement('div')

    render(() => (
      <Progress value={30} max={80} data-testid="progress">
        <ProgressIndicator data-testid="indicator" />
      </Progress>
    ), container)

    const progress = container.querySelector('[data-testid="progress"]') as HTMLDivElement
    const indicator = container.querySelector('[data-testid="indicator"]') as HTMLDivElement

    expect(progress.getAttribute('role')).toBe('progressbar')
    expect(progress.getAttribute('aria-valuemin')).toBe('0')
    expect(progress.getAttribute('aria-valuemax')).toBe('80')
    expect(progress.getAttribute('aria-valuenow')).toBe('30')
    expect(progress.getAttribute('aria-valuetext')).toBe('38%')
    expect(progress.dataset.state).toBe('loading')
    expect(indicator.dataset.state).toBe('loading')
    expect(indicator.dataset.value).toBe('30')
    expect(indicator.dataset.max).toBe('80')
  })

  it('updates state reactively from accessor props', async () => {
    const value = createSignal<number | null>(10)
    const container = document.createElement('div')

    render(() => (
      <Progress value={() => value()}>
        <ProgressIndicator data-testid="indicator" />
      </Progress>
    ), container)

    const progress = container.firstElementChild as HTMLDivElement
    const indicator = container.querySelector('[data-testid="indicator"]') as HTMLDivElement

    expect(progress.dataset.state).toBe('loading')
    expect(indicator.dataset.value).toBe('10')

    value(100)
    await flushMicrotasks()

    expect(progress.dataset.state).toBe('complete')
    expect(progress.getAttribute('aria-valuetext')).toBe('100%')
    expect(indicator.dataset.state).toBe('complete')
    expect(indicator.dataset.value).toBe('100')
  })

  it('warns and falls back for invalid max and value props', async () => {
    const container = document.createElement('div')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(() => (
      <Progress value={150} max={0} data-testid="progress">
        <ProgressIndicator />
      </Progress>
    ), container)

    await flushMicrotasks()

    const progress = container.querySelector('[data-testid="progress"]') as HTMLDivElement

    expect(errorSpy).toHaveBeenCalledTimes(2)
    expect(progress.dataset.max).toBe('100')
    expect(progress.dataset.state).toBe('indeterminate')
    expect(progress.hasAttribute('aria-valuenow')).toBe(false)
  })
})
