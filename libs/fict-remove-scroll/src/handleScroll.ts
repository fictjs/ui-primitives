import type { Axis } from './types.js'

const alwaysContainsScroll = (node: Element): boolean => node.tagName === 'TEXTAREA'

const elementCanBeScrolled = (node: Element, overflow: 'overflowX' | 'overflowY'): boolean => {
  if (!(node instanceof Element)) {
    return false
  }

  const styles = window.getComputedStyle(node)

  return (
    styles[overflow] !== 'hidden' &&
    !(
      styles.overflowY === styles.overflowX &&
      !alwaysContainsScroll(node) &&
      styles[overflow] === 'visible'
    )
  )
}

const elementCouldBeVScrolled = (node: HTMLElement): boolean =>
  elementCanBeScrolled(node, 'overflowY')
const elementCouldBeHScrolled = (node: HTMLElement): boolean =>
  elementCanBeScrolled(node, 'overflowX')

export const locationCouldBeScrolled = (axis: Axis, node: HTMLElement): boolean => {
  const ownerDocument = node.ownerDocument
  let current: Node | null = node

  do {
    if (typeof ShadowRoot !== 'undefined' && current instanceof ShadowRoot) {
      current = current.host
    }

    if (!(current instanceof HTMLElement)) {
      current = current?.parentNode ?? null
      continue
    }

    const isScrollable = elementCouldBeScrolled(axis, current)

    if (isScrollable) {
      const [, scrollHeight, clientHeight] = getScrollVariables(axis, current)

      if (scrollHeight > clientHeight) {
        return true
      }
    }

    current = current.parentNode
  } while (current && current !== ownerDocument.body)

  return false
}

type ScrollVariables = [scrollTop: number, scrollHeight: number, clientHeight: number]

const getVScrollVariables = ({
  scrollTop,
  scrollHeight,
  clientHeight,
}: HTMLElement): ScrollVariables => [scrollTop, scrollHeight, clientHeight]

const getHScrollVariables = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
}: HTMLElement): ScrollVariables => [scrollLeft, scrollWidth, clientWidth]

const elementCouldBeScrolled = (axis: Axis, node: HTMLElement): boolean =>
  axis === 'v' ? elementCouldBeVScrolled(node) : elementCouldBeHScrolled(node)

const getScrollVariables = (axis: Axis, node: HTMLElement): ScrollVariables =>
  axis === 'v' ? getVScrollVariables(node) : getHScrollVariables(node)

const getDirectionFactor = (axis: Axis, direction: string | null): number =>
  axis === 'h' && direction === 'rtl' ? -1 : 1

export function handleScroll(
  axis: Axis,
  endTarget: HTMLElement,
  event: Event,
  sourceDelta: number,
  noOverscroll: boolean,
): boolean {
  const directionFactor = getDirectionFactor(axis, window.getComputedStyle(endTarget).direction)
  const delta = directionFactor * sourceDelta

  let target = event.target as HTMLElement | null
  const targetInLock = !!target && endTarget.contains(target)

  let shouldCancelScroll = false
  const isDeltaPositive = delta > 0

  let availableScroll = 0
  let availableScrollTop = 0

  do {
    if (!target) {
      break
    }

    const [position, scroll, capacity] = getScrollVariables(axis, target)
    const elementScroll = scroll - capacity - directionFactor * position

    if (position || elementScroll) {
      if (elementCouldBeScrolled(axis, target)) {
        availableScroll += elementScroll
        availableScrollTop += position
      }
    }

    const parent = target.parentNode
    target = (
      parent && parent.nodeType === Node.DOCUMENT_FRAGMENT_NODE
        ? (parent as ShadowRoot).host
        : parent
    ) as HTMLElement | null
  } while (
    (!targetInLock && target !== document.body) ||
    (targetInLock && !!target && (endTarget.contains(target) || endTarget === target))
  )

  if (
    isDeltaPositive &&
    ((noOverscroll && Math.abs(availableScroll) < 1) || (!noOverscroll && delta > availableScroll))
  ) {
    shouldCancelScroll = true
  } else if (
    !isDeltaPositive &&
    ((noOverscroll && Math.abs(availableScrollTop) < 1) ||
      (!noOverscroll && -delta > availableScrollTop))
  ) {
    shouldCancelScroll = true
  }

  return shouldCancelScroll
}
