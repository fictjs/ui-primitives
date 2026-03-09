export type GapMode = 'padding' | 'margin'

export interface GapOffset {
  left: number
  top: number
  right: number
  gap: number
}

export const zeroGap: GapOffset = {
  left: 0,
  top: 0,
  right: 0,
  gap: 0,
}

function parse(value: string | null): number {
  return parseInt(value || '', 10) || 0
}

function getOffset(gapMode: GapMode): [number, number, number] {
  const computedStyles = window.getComputedStyle(document.body)

  const left = computedStyles[gapMode === 'padding' ? 'paddingLeft' : 'marginLeft']
  const top = computedStyles[gapMode === 'padding' ? 'paddingTop' : 'marginTop']
  const right = computedStyles[gapMode === 'padding' ? 'paddingRight' : 'marginRight']

  return [parse(left), parse(top), parse(right)]
}

export function getGapWidth(gapMode: GapMode = 'margin'): GapOffset {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.body) {
    return zeroGap
  }

  const [left, top, right] = getOffset(gapMode)
  const documentWidth = document.documentElement.clientWidth
  const windowWidth = window.innerWidth

  return {
    left,
    top,
    right,
    gap: Math.max(0, windowWidth - documentWidth + right - left),
  }
}
