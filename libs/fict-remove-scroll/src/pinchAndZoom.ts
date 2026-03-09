const directionsSeparate = (ab: number[]): boolean => {
  const first = ab[0] ?? 0
  const second = ab[1] ?? 0

  return (first <= 0 && second >= 0) || (first >= 0 && second <= 0)
}

const sign = (x: number): number => (x < 0 ? -1 : 1)

export function pinchOrZoom(event: TouchEvent, cache: Record<number, Touch>) {
  if (!event.changedTouches) {
    return false
  }

  if (event.touches.length === 2) {
    const firstTouch = event.touches.item(0)
    const secondTouch = event.touches.item(1)

    if (!firstTouch || !secondTouch) {
      return false
    }

    const oldFirst = cache[firstTouch.identifier]
    const oldSecond = cache[secondTouch.identifier]

    if (oldFirst && oldSecond) {
      const diffx = [oldFirst.clientX - firstTouch.clientX, oldSecond.clientX - secondTouch.clientX]
      const diffy = [oldFirst.clientY - firstTouch.clientY, oldSecond.clientY - secondTouch.clientY]

      if (directionsSeparate(diffx) || directionsSeparate(diffy)) {
        return { action: 'zoom' as const }
      }

      const maxX = Math.max(Math.abs(diffx[0] ?? 0), Math.abs(diffx[1] ?? 0))
      const maxY = Math.max(Math.abs(diffy[0] ?? 0), Math.abs(diffy[1] ?? 0))

      return {
        action: 'pinch' as const,
        coords: [maxX * sign(diffx[0] ?? 0), maxY * sign(diffx[1] ?? 0)],
      }
    }
  }

  Array.from(event.changedTouches).forEach((touch) => {
    cache[touch.identifier] = touch
  })

  return {
    action: 'move' as const,
    coords: [event.changedTouches[0]!.clientX, event.changedTouches[0]!.clientY],
  }
}
