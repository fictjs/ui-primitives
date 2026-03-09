export interface DefaultPreventable {
  defaultPrevented?: boolean
}

export type EventHandler<E> = (event: E) => void

export interface ComposeEventHandlersOptions {
  checkDefaultPrevented?: boolean
}

export function composeEventHandlers<E extends DefaultPreventable>(
  originalHandler?: EventHandler<E>,
  nextHandler?: EventHandler<E>,
  { checkDefaultPrevented = true }: ComposeEventHandlersOptions = {},
): EventHandler<E> {
  return (event) => {
    originalHandler?.(event)

    if (!checkDefaultPrevented || !event.defaultPrevented) {
      nextHandler?.(event)
    }
  }
}
