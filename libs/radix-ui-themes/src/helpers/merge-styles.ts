import type { CSSProperties } from './element.js'

type InlineStyle = CSSProperties | Record<string, string | number | null | undefined> | undefined
type StyleObject = Record<string, string | number>

// Merges CSS styles like `classNames` merges CSS classes
export function mergeStyles(...styles: Array<InlineStyle>): CSSProperties | undefined {
  const result: StyleObject = {}
  let hasObject = false
  let lastString: string | undefined

  for (const style of styles) {
    if (!style) {
      continue
    }

    if (typeof style === 'string') {
      lastString = style
      continue
    }

    hasObject = true
    for (const [key, value] of Object.entries(style)) {
      if (value !== null && value !== undefined) {
        result[key] = value
      }
    }
  }

  if (hasObject) {
    return Object.keys(result).length ? result : undefined
  }

  return lastString
}
