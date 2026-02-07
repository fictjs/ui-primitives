export function composeEventHandlers<E extends Event>(
  original?: (event: E) => void,
  extra?: (event: E) => void,
  options: { checkDefaultPrevented?: boolean } = { checkDefaultPrevented: true },
): (event: E) => void {
  return (event: E) => {
    original?.(event)
    if (!options.checkDefaultPrevented || !event.defaultPrevented) {
      extra?.(event)
    }
  }
}
