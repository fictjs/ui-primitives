/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prop, render } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'

const hideOthersMock = vi.hoisted(() => vi.fn(() => () => {}))

vi.mock('aria-hidden', () => ({
  hideOthers: hideOthersMock,
}))

vi.mock('@fictjs/fict-remove-scroll', () => ({
  RemoveScroll: (props: { children?: unknown }) => props.children ?? null,
}))

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '../src/index.js'

function click(target: Element): void {
  target.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    }),
  )
}

function pointerDown(target: Element): void {
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
    }),
  )
}

function pressEscape(target: Document): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Escape',
    }),
  )
}

async function flushEffects(cycles = 4): Promise<void> {
  for (let index = 0; index < cycles; index++) {
    await new Promise<void>((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(resolve)
        return
      }

      Promise.resolve().then(resolve)
    })
  }
}

async function waitForEffects(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await flushEffects(6)
}

describe('@fictjs/dialog', () => {
  const cleanups: Array<() => void> = []

  function mount(view: Parameters<typeof render>[0], container: HTMLElement): void {
    cleanups.push(render(view, container))
  }

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.()
    }

    document.body.innerHTML = ''
    document.body.style.pointerEvents = ''
    hideOthersMock.mockClear()
    vi.clearAllMocks()
  })

  it('opens content in a portal and closes via DialogClose', async () => {
    const container = document.createElement('div')
    const portalRoot = document.createElement('div')
    document.body.append(container, portalRoot)

    mount(
      () => (
        <Dialog>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogPortal container={portalRoot}>
            <DialogOverlay data-testid="overlay" />
            <DialogContent data-testid="content">
              <DialogTitle data-testid="title">Preferences</DialogTitle>
              <DialogDescription data-testid="description">Configure options.</DialogDescription>
              <DialogClose data-testid="close">Close</DialogClose>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    click(trigger)
    await waitForEffects()

    const content = portalRoot.querySelector('[data-testid="content"]') as HTMLDivElement
    const overlay = portalRoot.querySelector('[data-testid="overlay"]') as HTMLDivElement
    const title = portalRoot.querySelector('[data-testid="title"]') as HTMLHeadingElement
    const description = portalRoot.querySelector(
      '[data-testid="description"]',
    ) as HTMLParagraphElement

    expect(content).not.toBeNull()
    expect(overlay).not.toBeNull()
    expect(content.getAttribute('role')).toBe('dialog')
    expect(content.getAttribute('data-state')).toBe('open')
    expect(content.getAttribute('id')).toBe(trigger.getAttribute('aria-controls'))
    expect(content.getAttribute('aria-labelledby')).toBe(title.id)
    expect(content.getAttribute('aria-describedby')).toBe(description.id)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    click(portalRoot.querySelector('[data-testid="close"]') as HTMLButtonElement)
    await waitForEffects()

    expect(portalRoot.querySelector('[data-testid="content"]')).toBeNull()
    expect(portalRoot.querySelector('[data-testid="overlay"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('notifies the latest open-change handler from component props', async () => {
    const container = document.createElement('div')
    const calls: string[] = []
    const onOpenChange = createSignal<(open: boolean) => void>((open) => {
      calls.push(`first:${open}`)
    })
    document.body.append(container)

    mount(
      () => (
        <Dialog onOpenChange={prop(() => onOpenChange()) as unknown as (open: boolean) => void}>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogPortal>
            <DialogContent>
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description</DialogDescription>
              <DialogClose data-testid="close">Close</DialogClose>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    click(container.querySelector('[data-testid="trigger"]') as HTMLButtonElement)
    await waitForEffects()
    onOpenChange((open) => calls.push(`second:${open}`))
    click(document.body.querySelector('[data-testid="close"]') as HTMLButtonElement)
    await waitForEffects()

    expect(calls).toEqual(['first:true', 'second:false'])
  })

  it.each([
    ['modal', true],
    ['non-modal', false],
  ] as const)(
    'preserves latest callbacks and reactive DOM props through the %s content chain',
    async (_mode, modal) => {
      const container = document.createElement('div')
      const calls: string[] = []
      const label = createSignal('first label')
      const onEscapeKeyDown = createSignal<(event: KeyboardEvent) => void>(() => {
        calls.push('first')
      })
      document.body.append(container)

      mount(
        () => (
          <Dialog defaultOpen modal={modal}>
            <DialogTrigger>Open</DialogTrigger>
            <DialogPortal>
              <DialogContent
                data-testid="content"
                aria-label={prop(() => label()) as unknown as string}
                onEscapeKeyDown={
                  prop(() => onEscapeKeyDown()) as unknown as (event: KeyboardEvent) => void
                }
              >
                <DialogTitle>Title</DialogTitle>
                <DialogDescription>Description</DialogDescription>
              </DialogContent>
            </DialogPortal>
          </Dialog>
        ),
        container,
      )

      await waitForEffects()
      label('second label')
      onEscapeKeyDown(() => calls.push('second'))
      await flushEffects()

      const content = document.body.querySelector('[data-testid="content"]') as HTMLDivElement
      expect(content.getAttribute('aria-label')).toBe('second label')

      pressEscape(document)
      await waitForEffects()

      expect(calls).toEqual(['second'])
    },
  )

  it('switches overlay and content implementations when modal changes', async () => {
    const container = document.createElement('div')
    const modal = createSignal(true)
    document.body.append(container)

    mount(
      () => (
        <Dialog defaultOpen modal={modal}>
          <DialogPortal>
            <DialogOverlay data-testid="overlay" />
            <DialogContent data-testid="content">
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Dialog description</DialogDescription>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    await waitForEffects()
    expect(document.body.querySelector('[data-testid="overlay"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    modal(false)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="overlay"]')).toBeNull()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    modal(true)
    await flushEffects()
    expect(document.body.querySelector('[data-testid="overlay"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('locks modal focus flow and restores trigger focus on escape', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Dialog>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogPortal>
            <DialogOverlay />
            <DialogContent data-testid="content">
              <DialogTitle>Modal title</DialogTitle>
              <DialogDescription>Modal description</DialogDescription>
              <button data-testid="inside" type="button">
                Inside
              </button>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    trigger.focus()

    click(trigger)
    await waitForEffects()

    expect(hideOthersMock).toHaveBeenCalledTimes(1)
    expect(document.body.style.pointerEvents).toBe('none')

    pressEscape(document)
    await waitForEffects()
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
    expect(document.body.style.pointerEvents).toBe('')
    expect(document.activeElement).toBe(trigger)
  })

  it('supports non-modal dialogs without rendering an overlay', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Dialog modal={false}>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogPortal>
            <DialogOverlay data-testid="overlay" />
            <DialogContent data-testid="content">
              <DialogTitle>Non modal title</DialogTitle>
              <DialogDescription>Non modal description</DialogDescription>
              Non modal
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    click(trigger)
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="overlay"]')).toBeNull()
    expect(hideOthersMock).not.toHaveBeenCalled()
    expect(document.body.style.pointerEvents).toBe('')
  })

  it('checks title and description in the dialog owner document', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const frameDocument = iframe.contentDocument as Document
    const container = frameDocument.createElement('div')
    frameDocument.body.append(container)

    mount(
      () => (
        <Dialog defaultOpen modal={false}>
          <DialogPortal container={frameDocument.body}>
            <DialogContent data-testid="content">
              <DialogTitle data-testid="title">Frame title</DialogTitle>
              <DialogDescription data-testid="description">Frame description</DialogDescription>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    await waitForEffects()
    await waitForEffects()

    const content = frameDocument.body.querySelector('[data-testid="content"]') as HTMLElement
    const title = frameDocument.body.querySelector('[data-testid="title"]') as HTMLElement
    const description = frameDocument.body.querySelector(
      '[data-testid="description"]',
    ) as HTMLElement

    expect(content.ownerDocument).toBe(frameDocument)
    expect(frameDocument.getElementById(content.getAttribute('aria-labelledby') ?? '')).toBe(title)
    expect(frameDocument.getElementById(content.getAttribute('aria-describedby') ?? '')).toBe(
      description,
    )
    expect(consoleError).not.toHaveBeenCalled()
    expect(consoleWarn).not.toHaveBeenCalled()
    consoleError.mockRestore()
    consoleWarn.mockRestore()
  })

  it('dismisses non-modal content on outside pointer interaction', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <>
          <button data-testid="outside" type="button">
            Outside
          </button>
          <Dialog modal={false} defaultOpen>
            <DialogTrigger data-testid="trigger">Open</DialogTrigger>
            <DialogPortal>
              <DialogContent data-testid="content">
                <DialogTitle>Non modal title</DialogTitle>
                <DialogDescription>Non modal description</DialogDescription>
                Non modal
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </>
      ),
      container,
    )

    await waitForEffects()
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()

    pointerDown(container.querySelector('[data-testid="outside"]') as HTMLButtonElement)
    await waitForEffects()
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
  })

  it('supports repeated open and close cycles without leaving modal side effects behind', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(
      () => (
        <Dialog>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogPortal>
            <DialogOverlay />
            <DialogContent data-testid="content">
              <DialogTitle>Preferences</DialogTitle>
              <DialogDescription>Configure options.</DialogDescription>
              <DialogClose data-testid="close">Close</DialogClose>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    for (let index = 0; index < 3; index += 1) {
      click(trigger)
      await waitForEffects()

      expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
      expect(document.body.style.pointerEvents).toBe('none')

      click(document.body.querySelector('[data-testid="close"]') as HTMLButtonElement)
      await waitForEffects()

      expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
      expect(document.body.style.pointerEvents).toBe('')
    }
  })

  it('supports repeated open and close cycles with close autofocus overrides', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const closeRef = { current: null as HTMLButtonElement | null }

    mount(
      () => (
        <Dialog>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogPortal>
            <DialogOverlay />
            <DialogContent
              data-testid="content"
              onOpenAutoFocus={(event) => {
                event.preventDefault()
                queueMicrotask(() => {
                  closeRef.current?.focus({ preventScroll: true })
                })
              }}
            >
              <DialogTitle>Preferences</DialogTitle>
              <DialogDescription>Configure options.</DialogDescription>
              <DialogClose data-testid="close" ref={closeRef}>
                Close
              </DialogClose>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    for (let index = 0; index < 3; index += 1) {
      click(trigger)
      await waitForEffects()

      expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
      expect(document.body.style.pointerEvents).toBe('none')

      click(document.body.querySelector('[data-testid="close"]') as HTMLButtonElement)
      await waitForEffects()

      expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
      expect(document.body.style.pointerEvents).toBe('')
    }
  })

  it('supports repeated cycles with alert-style focus and outside-interaction overrides', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const closeRef = { current: null as HTMLButtonElement | null }

    mount(
      () => (
        <Dialog>
          <DialogTrigger data-testid="trigger">Open</DialogTrigger>
          <DialogPortal>
            <DialogOverlay />
            <DialogContent
              data-testid="content"
              onOpenAutoFocus={(event) => {
                event.preventDefault()
                queueMicrotask(() => {
                  closeRef.current?.focus({ preventScroll: true })
                })
              }}
              onInteractOutside={(event) => {
                event.preventDefault()
              }}
              onPointerDownOutside={(event) => {
                event.preventDefault()
              }}
            >
              <DialogTitle>Preferences</DialogTitle>
              <DialogDescription>Configure options.</DialogDescription>
              <DialogClose data-testid="close" ref={closeRef}>
                Close
              </DialogClose>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ),
      container,
    )

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    for (let index = 0; index < 3; index += 1) {
      click(trigger)
      await waitForEffects()

      expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
      expect(document.body.style.pointerEvents).toBe('none')

      click(document.body.querySelector('[data-testid="close"]') as HTMLButtonElement)
      await waitForEffects()

      expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
      expect(document.body.style.pointerEvents).toBe('')
    }
  })
})
