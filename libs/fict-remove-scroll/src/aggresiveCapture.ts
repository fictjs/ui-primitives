let passiveSupported = false

if (typeof window !== 'undefined') {
  try {
    const options = Object.defineProperty({}, 'passive', {
      get() {
        passiveSupported = true
        return true
      },
    })

    window.addEventListener('test', options as EventListenerOrEventListenerObject, options)
    window.removeEventListener('test', options as EventListenerOrEventListenerObject, options)
  } catch {
    passiveSupported = false
  }
}

export const nonPassive: AddEventListenerOptions | boolean = passiveSupported
  ? { passive: false }
  : false
