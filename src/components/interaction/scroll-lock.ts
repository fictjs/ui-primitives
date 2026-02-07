import { createEffect, onDestroy, type FictNode } from '@fictjs/runtime'

import { read } from '../../internal/accessor'
import type { MaybeAccessor } from '../../internal/types'

export interface ScrollLockProps {
  enabled?: MaybeAccessor<boolean>
}

let lockCount = 0
let previousOverflow = ''
let previousPaddingRight = ''

function lockBodyScroll(): void {
  if (typeof document === 'undefined') return

  if (lockCount === 0) {
    const body = document.body
    previousOverflow = body.style.overflow
    previousPaddingRight = body.style.paddingRight

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }
  }

  lockCount += 1
}

function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return
  if (lockCount === 0) return

  lockCount -= 1

  if (lockCount === 0) {
    const body = document.body
    body.style.overflow = previousOverflow
    body.style.paddingRight = previousPaddingRight
  }
}

export function ScrollLock(props: ScrollLockProps): FictNode {
  let locked = false

  createEffect(() => {
    const enabled = read(props.enabled, true)

    if (enabled && !locked) {
      lockBodyScroll()
      locked = true
      return
    }

    if (!enabled && locked) {
      unlockBodyScroll()
      locked = false
    }
  })

  onDestroy(() => {
    if (locked) {
      unlockBodyScroll()
      locked = false
    }
  })

  return null
}
