export function useSearchParams() {
  if (typeof window === 'undefined') {
    return new URLSearchParams()
  }

  return new URLSearchParams(window.location.search)
}
