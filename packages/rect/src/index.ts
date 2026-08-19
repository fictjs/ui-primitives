type Measurable = { getBoundingClientRect(): DOMRect }
type CallbackFn = (rect: DOMRect) => void

type ObservedData = {
  rect: DOMRect
  callbacks: CallbackFn[]
}

let rafId = 0
const observedElements = new Map<Measurable, ObservedData>()

function observeElementRect(elementToObserve: Measurable, callback: CallbackFn): () => void {
  const observedData = observedElements.get(elementToObserve)

  if (observedData === undefined) {
    observedElements.set(elementToObserve, {
      rect: {} as DOMRect,
      callbacks: [callback],
    })

    if (observedElements.size === 1) {
      rafId = requestAnimationFrame(runLoop)
    }
  } else {
    observedData.callbacks.push(callback)
    callback(elementToObserve.getBoundingClientRect())
  }

  return () => {
    const nextObservedData = observedElements.get(elementToObserve)
    if (nextObservedData === undefined) return

    const index = nextObservedData.callbacks.indexOf(callback)
    if (index > -1) {
      nextObservedData.callbacks.splice(index, 1)
    }

    if (nextObservedData.callbacks.length === 0) {
      observedElements.delete(elementToObserve)

      if (observedElements.size === 0 && rafId !== 0) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
    }
  }
}

function runLoop(): void {
  rafId = 0
  const changedRectsData: ObservedData[] = []

  observedElements.forEach((data, element) => {
    const nextRect = element.getBoundingClientRect()

    if (!rectEquals(data.rect, nextRect)) {
      data.rect = nextRect
      changedRectsData.push(data)
    }
  })

  for (const data of changedRectsData) {
    for (const callback of [...data.callbacks]) {
      callback(data.rect)
    }
  }

  if (observedElements.size > 0) {
    rafId = requestAnimationFrame(runLoop)
  }
}

function rectEquals(rect1: DOMRect, rect2: DOMRect): boolean {
  return (
    rect1.width === rect2.width &&
    rect1.height === rect2.height &&
    rect1.top === rect2.top &&
    rect1.right === rect2.right &&
    rect1.bottom === rect2.bottom &&
    rect1.left === rect2.left
  )
}

export { observeElementRect }
export type { Measurable }
