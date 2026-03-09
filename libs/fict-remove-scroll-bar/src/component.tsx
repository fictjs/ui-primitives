/** @jsxImportSource fict */

import type { Component } from 'fict'
import { onMount } from 'fict'
import { styleSingleton } from '@fictjs/fict-style-singleton'

import {
  fullWidthClassName,
  noScrollbarsClassName,
  removedBarSizeVariable,
  zeroRightClassName,
} from './constants.js'
import { type GapMode, type GapOffset, getGapWidth } from './utils.js'

export type BodyScroll = Record<string, unknown> & {
  noRelative?: boolean
  noImportant?: boolean
  gapMode?: GapMode
}

const Style = styleSingleton()

export const lockAttribute = 'data-scroll-locked'

function getStyles(
  { left, top, right, gap }: GapOffset,
  allowRelative: boolean,
  gapMode: GapMode = 'margin',
  important: string,
): string {
  return `
  .${noScrollbarsClassName} {
   overflow: hidden ${important};
   padding-right: ${gap}px ${important};
  }
  body[${lockAttribute}] {
    overflow: hidden ${important};
    overscroll-behavior: contain;
    ${[
      allowRelative && `position: relative ${important};`,
      gapMode === 'margin' &&
        `
    padding-left: ${left}px;
    padding-top: ${top}px;
    padding-right: ${right}px;
    margin-left: 0;
    margin-top: 0;
    margin-right: ${gap}px ${important};
    `,
      gapMode === 'padding' && `padding-right: ${gap}px ${important};`,
    ]
      .filter(Boolean)
      .join('')}
  }

  .${zeroRightClassName} {
    right: ${gap}px ${important};
  }

  .${fullWidthClassName} {
    margin-right: ${gap}px ${important};
  }

  .${zeroRightClassName} .${zeroRightClassName} {
    right: 0 ${important};
  }

  .${fullWidthClassName} .${fullWidthClassName} {
    margin-right: 0 ${important};
  }

  body[${lockAttribute}] {
    ${removedBarSizeVariable}: ${gap}px;
  }
`
}

function getBody(): HTMLBodyElement | null {
  if (typeof document === 'undefined') {
    return null
  }

  return (document.body as HTMLBodyElement | null) ?? null
}

function getCurrentUseCounter(): number {
  const body = getBody()

  if (!body) {
    return 0
  }

  const counter = parseInt(body.getAttribute(lockAttribute) || '0', 10)

  return Number.isFinite(counter) ? counter : 0
}

export function useLockAttribute(): void {
  onMount(() => {
    const body = getBody()

    if (!body) {
      return
    }

    body.setAttribute(lockAttribute, String(getCurrentUseCounter() + 1))

    return () => {
      const currentBody = getBody()

      if (!currentBody) {
        return
      }

      const newCounter = getCurrentUseCounter() - 1

      if (newCounter <= 0) {
        currentBody.removeAttribute(lockAttribute)
      } else {
        currentBody.setAttribute(lockAttribute, String(newCounter))
      }
    }
  })
}

/**
 * Removes page scrollbar and blocks page scroll while mounted.
 *
 * This matches the singleton behavior of the React package: the first mounted
 * instance wins for the injected stylesheet, while lock counting remains nested.
 */
export const RemoveScrollBar: Component<BodyScroll> = (props: BodyScroll) => {
  const gapMode = props.gapMode ?? 'margin'
  const gap = getGapWidth(gapMode)
  const styles = getStyles(gap, !props.noRelative, gapMode, !props.noImportant ? '!important' : '')

  useLockAttribute()

  return <Style styles={styles} />
}
