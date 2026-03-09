import { getDPR } from './getDPR.js'

export function roundByDPR(element: Element, value: number): number {
  const dpr = getDPR(element)
  return Math.round(value * dpr) / dpr
}
