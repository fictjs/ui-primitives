/** @jsxImportSource @fictjs/runtime */

import { afterEach, describe, expect, it, vi } from 'vitest'

import { render } from '@fictjs/runtime'

const hideOthersMock = vi.hoisted(() => vi.fn(() => () => {}))

vi.mock('aria-hidden', () => ({
  hideOthers: hideOthersMock,
}))

vi.mock('@fictjs/fict-remove-scroll', () => ({
  RemoveScroll: (props: { children?: unknown }) => props.children ?? null,
}))

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
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

describe('@fictjs/alert-dialog', () => {
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

  it('forces modal behavior and focuses cancel on open', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <AlertDialog>
        <AlertDialogTrigger data-testid="trigger">Delete</AlertDialogTrigger>
        <AlertDialogPortal>
          <AlertDialogOverlay data-testid="overlay" />
          <AlertDialogContent data-testid="content">
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            <AlertDialogAction data-testid="action">Confirm</AlertDialogAction>
            <AlertDialogCancel data-testid="cancel">Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    ), container)

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement
    click(trigger)
    await waitForEffects()

    const content = document.body.querySelector('[data-testid="content"]') as HTMLDivElement
    const cancel = document.body.querySelector('[data-testid="cancel"]') as HTMLButtonElement

    expect(content.getAttribute('role')).toBe('alertdialog')
    expect(document.body.querySelector('[data-testid="overlay"]')).not.toBeNull()
    expect(document.activeElement).toBe(cancel)
  })

  it('prevents outside interaction from dismissing the dialog', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <>
        <button data-testid="outside" type="button">
          Outside
        </button>
        <AlertDialog defaultOpen>
          <AlertDialogTrigger>Delete</AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogContent data-testid="content">
              <AlertDialogTitle>Delete item</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      </>
    ), container)

    await waitForEffects()
    await waitForEffects()

    pointerDown(container.querySelector('[data-testid="outside"]') as HTMLButtonElement)
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('closes via action and cancel buttons', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    mount(() => (
      <AlertDialog>
        <AlertDialogTrigger data-testid="trigger">Delete</AlertDialogTrigger>
        <AlertDialogPortal>
          <AlertDialogOverlay />
          <AlertDialogContent data-testid="content">
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            <AlertDialogAction data-testid="action">Confirm</AlertDialogAction>
            <AlertDialogCancel data-testid="cancel">Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    ), container)

    const trigger = container.querySelector('[data-testid="trigger"]') as HTMLButtonElement

    click(trigger)
    await waitForEffects()
    click(document.body.querySelector('[data-testid="action"]') as HTMLButtonElement)
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()

    click(trigger)
    await waitForEffects()
    click(document.body.querySelector('[data-testid="cancel"]') as HTMLButtonElement)
    await waitForEffects()

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull()
  })
})
