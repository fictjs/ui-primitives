function detectNodeEnvironment(): boolean {
  return typeof window === 'undefined' || typeof document === 'undefined'
}

export const env = {
  forceCache: false,
  isNode: detectNodeEnvironment(),
}
