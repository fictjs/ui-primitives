export function dataAttr(condition: boolean | undefined): '' | undefined {
  return condition ? '' : undefined
}

export function ariaAttr(condition: boolean | 'mixed' | undefined): true | 'mixed' | undefined {
  if (condition === 'mixed') {
    return 'mixed'
  }

  return condition ? true : undefined
}
