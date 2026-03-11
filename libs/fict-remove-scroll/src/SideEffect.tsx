/** @jsxImportSource fict */

import { createEffect, onCleanup, onMount } from 'fict'
import type { FictNode } from 'fict'
import { RemoveScrollBar } from '@fictjs/fict-remove-scroll-bar'
import { styleSingleton } from '@fictjs/fict-style-singleton'

import { nonPassive } from './aggresiveCapture.js'
import { handleScroll, locationCouldBeScrolled } from './handleScroll.js'
import type { Axis, GapMode, IRemoveScrollEffectProps, MaybeAccessor } from './types.js'

type QueueItem = {
  name: string
  delta: number[]
  shadowParent?: HTMLElement | null
  should: boolean
  target: EventTarget | null
}

const noopCallbacks = {
  onScrollCapture() {},
  onWheelCapture() {},
  onTouchMoveCapture() {},
}

export const getTouchXY = (event: TouchEvent | Event): [number, number] =>
  'changedTouches' in event && event.changedTouches.length > 0
    ? (() => {
        const touch = event.changedTouches.item(0)
        return touch ? ([touch.clientX, touch.clientY] as [number, number]) : [0, 0]
      })()
    : [0, 0]

export const getDeltaXY = (event: Event): [number, number] =>
  'deltaX' in event && 'deltaY' in event
    ? [(event as WheelEvent).deltaX ?? 0, (event as WheelEvent).deltaY ?? 0]
    : [0, 0]

const extractRef = (
  ref: HTMLElement | { current: HTMLElement | null } | null | undefined,
): HTMLElement | null => {
  if (!ref) {
    return null
  }

  return 'current' in ref ? ref.current : ref
}

const deltaCompare = (x: number[], y: number[]): boolean => x[0] === y[0] && x[1] === y[1]

const generateStyle = (id: number): string => `
  .block-interactivity-${id} {pointer-events: none;}
  .allow-interactivity-${id} {pointer-events: all;}
`

let idCounter = 0
let lockStack: unknown[] = []

function readBoolean(
  value: MaybeAccessor<boolean | undefined> | undefined,
  fallback = false,
): boolean {
  if (typeof value === 'function') {
    return Boolean((value as () => boolean | undefined)())
  }

  return value ?? fallback
}

function readGapMode(value: MaybeAccessor<GapMode | undefined> | undefined): GapMode | undefined {
  if (typeof value === 'function') {
    return (value as () => GapMode | undefined)()
  }

  return value
}

function readShards(
  value:
    | MaybeAccessor<Array<HTMLElement | { current: HTMLElement | null }> | undefined>
    | undefined,
): Array<HTMLElement | { current: HTMLElement | null }> {
  if (typeof value === 'function') {
    return (value as () => Array<HTMLElement | { current: HTMLElement | null }> | undefined)() ?? []
  }

  return value ?? []
}

function scheduleMicrotask(callback: () => void): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback)
    return
  }

  void Promise.resolve().then(callback)
}

export function RemoveScrollSideCar(props: IRemoveScrollEffectProps): FictNode {
  const shouldPreventQueue: QueueItem[] = []
  const touchStartRef: [number, number] = [0, 0]
  let activeAxis: Axis | undefined
  const id = idCounter++
  const Style = styleSingleton()

  const shouldCancelEvent = (event: WheelEvent | TouchEvent, parent: HTMLElement): boolean => {
    if (
      ('touches' in event && event.touches.length === 2) ||
      (event.type === 'wheel' && event.ctrlKey)
    ) {
      return !readBoolean(props.allowPinchZoom, false)
    }

    const touch = getTouchXY(event)
    const deltaX = 'deltaX' in event ? event.deltaX : touchStartRef[0] - touch[0]
    const deltaY = 'deltaY' in event ? event.deltaY : touchStartRef[1] - touch[1]
    const target = event.target as HTMLElement
    const moveDirection: Axis = Math.abs(deltaX) > Math.abs(deltaY) ? 'h' : 'v'

    if (
      'touches' in event &&
      moveDirection === 'h' &&
      target instanceof HTMLInputElement &&
      target.type === 'range'
    ) {
      return false
    }

    const selection = typeof window !== 'undefined' ? window.getSelection() : null
    const anchorNode = selection?.anchorNode
    const isTouchingSelection = anchorNode
      ? anchorNode === target || anchorNode.contains(target)
      : false

    if (isTouchingSelection) {
      return false
    }

    let currentAxis: Axis | undefined
    let canBeScrolledInMainDirection = locationCouldBeScrolled(moveDirection, target)

    if (!canBeScrolledInMainDirection) {
      return true
    }

    if (canBeScrolledInMainDirection) {
      currentAxis = moveDirection
    } else {
      currentAxis = moveDirection === 'v' ? 'h' : 'v'
      canBeScrolledInMainDirection = locationCouldBeScrolled(moveDirection, target)
    }

    if (!canBeScrolledInMainDirection) {
      return false
    }

    if (!activeAxis && 'changedTouches' in event && (deltaX || deltaY)) {
      activeAxis = currentAxis
    }

    if (!currentAxis) {
      return true
    }

    const cancelingAxis = activeAxis || currentAxis

    return handleScroll(cancelingAxis, parent, event, cancelingAxis === 'h' ? deltaX : deltaY, true)
  }

  const shouldPrevent = (_event: Event): void => {
    const event = _event as WheelEvent | TouchEvent

    if (!lockStack.length || lockStack[lockStack.length - 1] !== Style) {
      return
    }

    const delta = 'deltaY' in event ? getDeltaXY(event) : getTouchXY(event)
    const sourceEvent = shouldPreventQueue.filter(
      (entry) =>
        entry.name === event.type &&
        (entry.target === event.target || event.target === entry.shadowParent) &&
        deltaCompare(entry.delta, delta),
    )[0]

    if (sourceEvent && sourceEvent.should) {
      if (event.cancelable) {
        event.preventDefault()
      }

      return
    }

    if (!sourceEvent) {
      const shardNodes = readShards(props.shards)
        .map(extractRef)
        .filter((node): node is HTMLElement => !!node)
        .filter((node) => node.contains(event.target as Node))

      const shouldStop =
        shardNodes.length > 0
          ? shouldCancelEvent(event, shardNodes[0]!)
          : !readBoolean(props.noIsolation, false)

      if (shouldStop && event.cancelable) {
        event.preventDefault()
      }
    }
  }

  const shouldCancel = (
    name: string,
    delta: number[],
    target: EventTarget | null,
    should: boolean,
  ): void => {
    const event: QueueItem = {
      name,
      delta,
      shadowParent: getOutermostShadowParent(target as Node | null),
      should,
      target,
    }

    shouldPreventQueue.push(event)

    setTimeout(() => {
      const index = shouldPreventQueue.indexOf(event)
      if (index >= 0) {
        shouldPreventQueue.splice(index, 1)
      }
    }, 1)
  }

  const scrollTouchStart = (event: Event): void => {
    const [x, y] = getTouchXY(event)
    touchStartRef[0] = x
    touchStartRef[1] = y
    activeAxis = undefined
  }

  const scrollWheel = (event: Event): void => {
    const parent = props.lockRef.current

    if (!parent) {
      return
    }

    shouldCancel(
      event.type,
      getDeltaXY(event),
      event.target,
      shouldCancelEvent(event as WheelEvent, parent),
    )
  }

  const scrollTouchMove = (event: Event): void => {
    const parent = props.lockRef.current

    if (!parent) {
      return
    }

    shouldCancel(
      event.type,
      getTouchXY(event),
      event.target,
      shouldCancelEvent(event as TouchEvent, parent),
    )
  }

  onMount(() => {
    const stopInertEffect = createEffect(() => {
      if (typeof document === 'undefined' || !document.body || !readBoolean(props.inert, false)) {
        return
      }

      document.body.classList.add(`block-interactivity-${id}`)

      let cancelled = false
      let allow: HTMLElement[] = []

      scheduleMicrotask(() => {
        if (cancelled) {
          return
        }

        allow = [props.lockRef.current, ...readShards(props.shards).map(extractRef)].filter(
          (node): node is HTMLElement => !!node,
        )

        for (const element of allow) {
          element.classList.add(`allow-interactivity-${id}`)
        }
      })

      onCleanup(() => {
        cancelled = true
        document.body.classList.remove(`block-interactivity-${id}`)

        for (const element of allow) {
          element.classList.remove(`allow-interactivity-${id}`)
        }
      })
    })

    lockStack.push(Style)

    props.setCallbacks({
      onScrollCapture: scrollWheel,
      onTouchMoveCapture: scrollTouchMove as (event: TouchEvent) => void,
      onWheelCapture: scrollWheel as (event: WheelEvent) => void,
    })

    document.addEventListener('wheel', shouldPrevent, nonPassive)
    document.addEventListener('touchmove', shouldPrevent, nonPassive)
    document.addEventListener('touchstart', scrollTouchStart, nonPassive)

    return () => {
      stopInertEffect()
      lockStack = lockStack.filter((instance) => instance !== Style)
      props.setCallbacks(noopCallbacks)

      document.removeEventListener('wheel', shouldPrevent, nonPassive)
      document.removeEventListener('touchmove', shouldPrevent, nonPassive)
      document.removeEventListener('touchstart', scrollTouchStart, nonPassive)
    }
  })

  return (
    <>
      {() => (readBoolean(props.inert, false) ? <Style styles={generateStyle(id)} /> : null)}
      {() =>
        readBoolean(props.removeScrollBar, true)
          ? (() => {
              const gapMode = readGapMode(props.gapMode)

              return (
                <RemoveScrollBar
                  noRelative={readBoolean(props.noRelative, false)}
                  {...(gapMode === undefined ? {} : { gapMode })}
                />
              )
            })()
          : null
      }
    </>
  )
}

function getOutermostShadowParent(node: Node | null): HTMLElement | null {
  let shadowParent: HTMLElement | null = null

  while (node !== null) {
    if (node instanceof ShadowRoot) {
      shadowParent = node.host as HTMLElement
      node = node.host
    }

    node = node.parentNode
  }

  return shadowParent
}
