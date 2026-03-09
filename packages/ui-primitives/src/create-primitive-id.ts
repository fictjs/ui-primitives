function normalizeSegment(value: string | number | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9:_-]/g, '')

  return normalized || undefined
}

export function createPrimitiveId(
  namespace: string,
  part: string,
  value?: string | number,
): string {
  return [namespace, part, value]
    .map((segment) => normalizeSegment(segment))
    .filter((segment): segment is string => segment !== undefined)
    .join(':')
}
