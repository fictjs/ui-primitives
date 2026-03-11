/** @jsxImportSource @fictjs/runtime */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

import { AvatarFallback, AvatarImage, Root } from '../src/index.js'

const FALLBACK_TEXT = 'AB'
const IMAGE_ALT_TEXT = 'Avatar image'
const LOAD_DELAY = 40
const cache = new Set<string>()
const OriginalImage = window.Image

class MockImage extends EventTarget {
  private currentSrc = ''
  crossOrigin: string | null = null
  referrerPolicy = ''

  get src(): string {
    return this.currentSrc
  }

  set src(src: string) {
    if (!src) {
      return
    }

    this.currentSrc = src
    this.onSrcChange()
  }

  get complete(): boolean {
    return cache.has(this.currentSrc)
  }

  get naturalWidth(): number {
    return this.complete ? 300 : 0
  }

  protected onSrcChange(): void {
    window.setTimeout(() => {
      cache.add(this.currentSrc)
      this.dispatchEvent(new Event('load'))
    }, LOAD_DELAY)
  }
}

class MockNoReferrerImage extends MockImage {
  protected override onSrcChange(): void {
    window.setTimeout(() => {
      this.dispatchEvent(new Event(this.referrerPolicy === 'no-referrer' ? 'load' : 'error'))
      if (this.referrerPolicy === 'no-referrer') {
        cache.add(this.src)
      }
    }, LOAD_DELAY)
  }
}

function mount(view: () => ReturnType<typeof Root>) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(view, container)
  return { container, dispose }
}

async function flushEffects(cycles = 6): Promise<void> {
  for (let index = 0; index < cycles; index++) {
    await Promise.resolve()
  }
}

async function flushHydration(): Promise<void> {
  await flushEffects()
}

async function flushLoad(): Promise<void> {
  await vi.advanceTimersByTimeAsync(LOAD_DELAY)
  await flushEffects()
}

describe('@fictjs/avatar', () => {
  beforeEach(() => {
    cache.clear()
    vi.useFakeTimers()
    window.Image = MockImage as unknown as typeof window.Image
  })

  afterEach(() => {
    document.body.innerHTML = ''
    window.Image = OriginalImage
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders fallback content when no image is provided', () => {
    const { container } = mount(() => (
      <Root data-testid="avatar-root">
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
      </Root>
    ))

    expect(container.textContent).toContain(FALLBACK_TEXT)
    expect(container.querySelector('img')).toBeNull()
  })

  it('loads the image after hydration and hides the fallback', async () => {
    const { container } = mount(() => (
      <Root>
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
        <AvatarImage alt={IMAGE_ALT_TEXT} src="/test.png" />
      </Root>
    ))

    expect(container.textContent).toContain(FALLBACK_TEXT)
    expect(container.querySelector('img')).toBeNull()

    await flushHydration()
    await flushLoad()

    const image = container.querySelector('img') as HTMLImageElement | null

    expect(image).not.toBeNull()
    expect(image?.getAttribute('alt')).toBe(IMAGE_ALT_TEXT)
    expect(container.textContent).not.toContain(FALLBACK_TEXT)
  })

  it('emits loading status changes for the image lifecycle', async () => {
    const onLoadingStatusChange = vi.fn()

    mount(() => (
      <Root>
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
        <AvatarImage
          alt={IMAGE_ALT_TEXT}
          onLoadingStatusChange={onLoadingStatusChange}
          src="/test.png"
        />
      </Root>
    ))

    await flushHydration()
    expect(onLoadingStatusChange).toHaveBeenCalled()
    expect(['loading', 'loaded']).toContain(onLoadingStatusChange.mock.calls.at(-1)?.[0])

    await flushLoad()
    expect(onLoadingStatusChange).toHaveBeenLastCalledWith('loaded')
  })

  it('supports changing src values reactively', async () => {
    const src = createSignal('/first.png')
    const { container } = mount(() => (
      <Root>
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
        <AvatarImage alt={IMAGE_ALT_TEXT} src={src} />
      </Root>
    ))

    await flushHydration()
    await flushLoad()

    expect(container.querySelector('img')).not.toBeNull()

    src('/second.png')
    await flushEffects()

    expect(container.querySelector('img')).toBeNull()

    await flushLoad()
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('renders cached images immediately on subsequent mounts', async () => {
    const first = mount(() => (
      <Root>
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
        <AvatarImage alt={IMAGE_ALT_TEXT} src="/cached.png" />
      </Root>
    ))

    await flushHydration()
    await flushLoad()
    expect(first.container.querySelector('img')).not.toBeNull()
    first.dispose()

    const second = mount(() => (
      <Root>
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
        <AvatarImage alt={IMAGE_ALT_TEXT} src="/cached.png" />
      </Root>
    ))

    await flushHydration()
    await flushEffects()

    expect(second.container.querySelector('img')).not.toBeNull()
  })

  it('does not render an image when src is missing or empty', async () => {
    const src = createSignal<string | undefined>('/initial.png')
    const { container } = mount(() => (
      <Root>
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
        <AvatarImage alt={IMAGE_ALT_TEXT} src={src} />
      </Root>
    ))

    await flushHydration()
    await flushLoad()
    expect(container.querySelector('img')).not.toBeNull()

    src(undefined)
    await flushEffects()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain(FALLBACK_TEXT)

    src('')
    await flushEffects()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain(FALLBACK_TEXT)
  })

  it('delays fallback rendering when delayMs is provided', async () => {
    const { container } = mount(() => (
      <Root>
        <AvatarFallback delayMs={LOAD_DELAY}>{FALLBACK_TEXT}</AvatarFallback>
      </Root>
    ))

    expect(container.textContent).not.toContain(FALLBACK_TEXT)

    await vi.advanceTimersByTimeAsync(LOAD_DELAY)
    await flushEffects()

    expect(container.textContent).toContain(FALLBACK_TEXT)
  })

  it('respects image referrerPolicy when determining the load status', async () => {
    window.Image = MockNoReferrerImage as unknown as typeof window.Image

    const success = mount(() => (
      <Root>
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
        <AvatarImage alt={IMAGE_ALT_TEXT} referrerPolicy="no-referrer" src="/secure.png" />
      </Root>
    ))

    await flushHydration()
    await flushLoad()
    expect(success.container.querySelector('img')).not.toBeNull()
    success.dispose()

    cache.clear()

    const failure = mount(() => (
      <Root>
        <AvatarFallback>{FALLBACK_TEXT}</AvatarFallback>
        <AvatarImage alt={IMAGE_ALT_TEXT} referrerPolicy="origin" src="/secure.png" />
      </Root>
    ))

    await flushHydration()
    await flushLoad()

    expect(failure.container.querySelector('img')).toBeNull()
    expect(failure.container.textContent).toContain(FALLBACK_TEXT)
  })
})
