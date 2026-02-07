export function getDocument(node?: Node | null): Document | null {
  if (node && 'ownerDocument' in node && node.ownerDocument) {
    return node.ownerDocument
  }
  if (typeof document !== 'undefined') {
    return document
  }
  return null
}

export function getFocusableCandidates(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ]

  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(','))).filter(element => {
    if (element.hasAttribute('disabled')) return false
    if (element.getAttribute('aria-hidden') === 'true') return false
    if (element.tabIndex < 0) return false
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden'
  })
}

export function focusFirst(container: HTMLElement): void {
  const [first] = getFocusableCandidates(container)
  first?.focus()
}

export function focusLast(container: HTMLElement): void {
  const candidates = getFocusableCandidates(container)
  candidates[candidates.length - 1]?.focus()
}
