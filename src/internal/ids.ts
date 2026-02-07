let nextId = 0

export function createId(prefix = 'fict-ui'): string {
  nextId += 1
  return `${prefix}-${nextId}`
}
