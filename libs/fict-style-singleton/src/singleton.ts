import { getNonce } from 'get-nonce'

type NullableStyle = HTMLStyleElement | null

export interface StylesheetSingleton {
  add: (style: string) => void
  remove: () => void
}

function getDocument(): Document | undefined {
  if (typeof document === 'undefined') {
    return undefined
  }

  return document
}

function makeStyleTag(): NullableStyle {
  const ownerDocument = getDocument()

  if (!ownerDocument) {
    return null
  }

  const tag = ownerDocument.createElement('style')
  tag.type = 'text/css'

  const nonce = getNonce()

  if (nonce) {
    tag.setAttribute('nonce', nonce)
  }

  return tag
}

function injectStyles(tag: HTMLStyleElement, css: string): void {
  const legacyTag = tag as HTMLStyleElement & {
    styleSheet?: {
      cssText: string
    }
  }

  if (legacyTag.styleSheet) {
    legacyTag.styleSheet.cssText = css
    return
  }

  tag.textContent = css
}

function insertStyleTag(tag: HTMLStyleElement): void {
  const ownerDocument = getDocument()

  if (!ownerDocument) {
    return
  }

  const head =
    ownerDocument.head ??
    ownerDocument.getElementsByTagName('head')[0] ??
    ownerDocument.documentElement

  head?.appendChild(tag)
}

export function stylesheetSingleton(): StylesheetSingleton {
  let counter = 0
  let stylesheet: NullableStyle = null

  return {
    add: (style) => {
      if (counter === 0) {
        const nextStyle = makeStyleTag()

        if (nextStyle) {
          injectStyles(nextStyle, style)
          insertStyleTag(nextStyle)
          stylesheet = nextStyle
        }
      }

      counter += 1
    },
    remove: () => {
      if (counter === 0) {
        return
      }

      counter -= 1

      if (counter === 0 && stylesheet) {
        stylesheet.parentNode?.removeChild(stylesheet)
        stylesheet = null
      }
    },
  }
}
