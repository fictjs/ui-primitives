import { batch, createEffect, createMemo, onCleanup, untrack } from '@fictjs/runtime'
import { createSignal } from '@fictjs/runtime/advanced'
import { computePosition } from '@floating-ui/dom'

import type {
  ComputePositionConfig,
  FloatingStyles,
  ReferenceType,
  UseFloatingData,
  UseFloatingOptions,
  UseFloatingReturn,
} from './types.js'
import { deepEqual } from './utils/deepEqual.js'
import { createManagedRef } from './utils/createManagedRef.js'
import { getDPR } from './utils/getDPR.js'
import { roundByDPR } from './utils/roundByDPR.js'
import { toValue } from './utils/toValue.js'
import { unwrapElement } from './utils/unwrapElement.js'

function syncFloatingStyleObject(target: FloatingStyles, next: FloatingStyles): void {
  target.position = next.position
  target.left = next.left
  target.top = next.top

  if (next.transform !== undefined) {
    target.transform = next.transform
  } else {
    delete target.transform
  }

  if (next.willChange !== undefined) {
    target.willChange = next.willChange
  } else {
    delete target.willChange
  }
}

function applyFloatingStyles(element: HTMLElement, styles: FloatingStyles): void {
  element.style.position = String(styles.position ?? 'absolute')
  element.style.left =
    typeof styles.left === 'number' ? `${styles.left}px` : String(styles.left ?? 0)
  element.style.top = typeof styles.top === 'number' ? `${styles.top}px` : String(styles.top ?? 0)

  if (styles.transform !== undefined) {
    element.style.transform = styles.transform
  } else {
    element.style.removeProperty('transform')
  }

  if (styles.willChange !== undefined) {
    element.style.willChange = styles.willChange
  } else {
    element.style.removeProperty('will-change')
  }
}

/**
 * Provides data to position a floating element.
 * Dynamic options should be wrapped in Fict accessors to stay reactive.
 */
export function useFloating<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions<RT> = {},
): UseFloatingReturn<RT> {
  const internalReference = createSignal<RT | null>(null)
  const internalFloating = createSignal<HTMLElement | null>(null)
  const x = createSignal(0)
  const y = createSignal(0)
  const strategyState = createSignal(toValue(options.strategy) ?? 'absolute')
  const placementState = createSignal(toValue(options.placement) ?? 'bottom')
  const middlewareDataState = createSignal<UseFloatingData['middlewareData']>({})
  const isPositionedState = createSignal(false)
  const floatingStyles: FloatingStyles = {
    position: strategyState(),
    left: 0,
    top: 0,
  }

  const setReference = (node: RT | null) => {
    if (!Object.is(internalReference(), node)) {
      internalReference(node)
    }
  }

  const referenceElement = createMemo<RT | null>(() => {
    const externalReference = unwrapElement(toValue(options.elements?.reference))
    return externalReference ?? internalReference()
  })

  const floatingElement = createMemo<HTMLElement | null>(() => {
    const externalFloating = unwrapElement(toValue(options.elements?.floating))
    return externalFloating ?? internalFloating()
  })

  const middlewareOption = createMemo(() => toValue(options.middleware) ?? [])
  const placementOption = createMemo(() => toValue(options.placement) ?? 'bottom')
  const strategyOption = createMemo(() => toValue(options.strategy) ?? 'absolute')
  const platformOption = createMemo(() => toValue(options.platform))
  const openOption = createMemo(() => toValue(options.open))
  const transformOption = createMemo(() => toValue(options.transform) ?? true)

  function createFloatingStylesSnapshot(currentFloating: HTMLElement | null): FloatingStyles {
    const strategy = strategyState()
    const nextStyles: FloatingStyles = {
      position: strategy,
      left: 0,
      top: 0,
    }

    if (!currentFloating) {
      return nextStyles
    }

    const roundedX = roundByDPR(currentFloating, x())
    const roundedY = roundByDPR(currentFloating, y())

    if (transformOption()) {
      nextStyles.transform = `translate(${roundedX}px, ${roundedY}px)`
      if (getDPR(currentFloating) >= 1.5) {
        nextStyles.willChange = 'transform'
      }
      return nextStyles
    }

    nextStyles.left = roundedX
    nextStyles.top = roundedY
    return nextStyles
  }

  const setFloating = (node: HTMLElement | null) => {
    if (!Object.is(internalFloating(), node)) {
      internalFloating(node)
      if (node) {
        const nextStyles = createFloatingStylesSnapshot(node)
        syncFloatingStyleObject(floatingStyles, nextStyles)
        applyFloatingStyles(node, nextStyles)
      }
    }
  }

  let disposed = false
  let requestId = 0
  let mountedCleanup: void | (() => void)
  let mountedReference: RT | null = null
  let mountedFloating: HTMLElement | null = null
  let queuedReference: RT | null = null
  let queuedFloating: HTMLElement | null = null
  let attachScheduled = false
  let snapshot: UseFloatingData = {
    x: 0,
    y: 0,
    strategy: strategyOption(),
    placement: placementOption(),
    middlewareData: {},
    isPositioned: false,
  }

  const update = () => {
    const currentRequest = ++requestId
    const reference = referenceElement()
    const floating = floatingElement()

    if (!reference || !floating) {
      return
    }

    const config: ComputePositionConfig = {
      middleware: middlewareOption(),
      placement: placementOption(),
      strategy: strategyOption(),
    }
    const platform = platformOption()
    if (platform) {
      config.platform = platform
    }

    void computePosition(reference, floating, config).then((next) => {
      if (disposed || currentRequest !== requestId) {
        return
      }

      const fullData: UseFloatingData = {
        ...next,
        isPositioned: openOption() !== false,
      }

      if (deepEqual(snapshot, fullData)) {
        return
      }

      snapshot = fullData
      batch(() => {
        x(fullData.x)
        y(fullData.y)
        strategyState(fullData.strategy)
        placementState(fullData.placement)
        middlewareDataState(fullData.middlewareData)
        isPositionedState(fullData.isPositioned)
      })
    })
  }

  createEffect(() => {
    placementOption()
    strategyOption()
    platformOption()
    middlewareOption()
    openOption()

    untrack(() => {
      update()
    })
  })

  createEffect(() => {
    if (openOption() === false) {
      snapshot = { ...snapshot, isPositioned: false }
      isPositionedState(false)
    }
  })

  const cleanupMountedElements = () => {
    if (mountedCleanup) {
      mountedCleanup()
      mountedCleanup = undefined
    }

    mountedReference = null
    mountedFloating = null
    queuedReference = null
    queuedFloating = null
  }

  const scheduleMountedAttachment = (reference: RT, floating: HTMLElement) => {
    queuedReference = reference
    queuedFloating = floating

    if (attachScheduled) {
      return
    }

    attachScheduled = true
    queueMicrotask(() => {
      attachScheduled = false

      const nextReference = queuedReference
      const nextFloating = queuedFloating
      queuedReference = null
      queuedFloating = null

      if (
        disposed ||
        !nextReference ||
        !nextFloating ||
        referenceElement() !== nextReference ||
        floatingElement() !== nextFloating
      ) {
        return
      }

      if (nextReference === mountedReference && nextFloating === mountedFloating) {
        return
      }

      cleanupMountedElements()
      mountedReference = nextReference
      mountedFloating = nextFloating
      mountedCleanup = options.whileElementsMounted?.(nextReference, nextFloating, update)
    })
  }

  createEffect(() => {
    const reference = referenceElement()
    const floating = floatingElement()

    if (!reference || !floating) {
      cleanupMountedElements()
      return
    }

    if (options.whileElementsMounted) {
      scheduleMountedAttachment(reference, floating)
      return
    }

    untrack(() => {
      update()
    })
  })

  createEffect(() => {
    const currentFloating = floatingElement()
    const nextStyles = createFloatingStylesSnapshot(currentFloating)

    syncFloatingStyleObject(floatingStyles, nextStyles)

    if (currentFloating) {
      applyFloatingStyles(currentFloating, nextStyles)
    }
  })

  onCleanup(() => {
    disposed = true
    requestId += 1
    cleanupMountedElements()
  })

  const refs = {
    reference: createManagedRef<RT>(setReference, () => (disposed ? null : referenceElement())),
    floating: createManagedRef<HTMLElement>(setFloating, () =>
      disposed ? null : floatingElement(),
    ),
    setReference,
    setFloating,
  }

  const elements = {
    get reference() {
      return disposed ? null : referenceElement()
    },
    get floating() {
      return disposed ? null : floatingElement()
    },
  }

  return {
    x,
    y,
    strategy: strategyState,
    placement: placementState,
    middlewareData: middlewareDataState,
    isPositioned: isPositionedState,
    floatingStyles,
    update,
    refs,
    elements,
  }
}
