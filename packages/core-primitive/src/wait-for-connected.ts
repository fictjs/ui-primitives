const CONNECTION_POLL_INTERVAL = 16

/**
 * Runs `onConnected` once a node becomes connected and returns a disposer.
 *
 * A MutationObserver handles the usual same-document insertion without waiting
 * for a frame. The poll covers adoption into another document and insertion
 * inside a shadow tree, neither of which is observable from the original
 * document.
 *
 * The returned disposer must be called when the owning lifecycle ends before
 * connection. Until then, an intentionally detached node continues polling so
 * a later insertion or cross-document adoption cannot be missed.
 *
 * @returns A disposer that stops all observation and polling. It is idempotent.
 */
function waitForConnected(node: Node, onConnected: () => void): () => void {
  let disposed = false
  let connected = false
  let observedDocument: Document | null = null
  let connectionObserver: MutationObserver | null = null
  let cancelPoll: (() => void) | null = null

  const disconnectObserver = (): void => {
    connectionObserver?.disconnect()
    connectionObserver = null
    observedDocument = null
  }

  const stopWatching = (): void => {
    disconnectObserver()
    cancelPoll?.()
    cancelPoll = null
  }

  const finish = (): void => {
    if (disposed || connected) return

    connected = true
    stopWatching()
    onConnected()
  }

  const schedulePoll = (): void => {
    if (disposed || connected || cancelPoll) return

    const ownerWindow = node.ownerDocument?.defaultView
    const poll = (): void => {
      cancelPoll = null
      checkConnection()
    }

    if (typeof ownerWindow?.requestAnimationFrame === 'function') {
      const frameId = ownerWindow.requestAnimationFrame(poll)
      cancelPoll = () => ownerWindow.cancelAnimationFrame(frameId)
      return
    }

    const timeoutId = setTimeout(poll, CONNECTION_POLL_INTERVAL)
    cancelPoll = () => clearTimeout(timeoutId)
  }

  const observeOwnerDocument = (): void => {
    const ownerDocument = node.ownerDocument
    if (!ownerDocument) {
      disconnectObserver()
      return
    }

    if (ownerDocument === observedDocument && connectionObserver) return

    disconnectObserver()
    observedDocument = ownerDocument

    const MutationObserverCtor =
      ownerDocument.defaultView?.MutationObserver ?? globalThis.MutationObserver
    if (!MutationObserverCtor) return

    connectionObserver = new MutationObserverCtor(checkConnection)
    connectionObserver.observe(ownerDocument, { childList: true, subtree: true })
  }

  function checkConnection(): void {
    if (disposed || connected) return

    if (node.isConnected) {
      finish()
      return
    }

    observeOwnerDocument()
    schedulePoll()
  }

  // Refs may be assigned while their enclosing fragment is still detached.
  // Always allow the current render to finish before inspecting connectivity.
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(checkConnection)
  } else {
    void Promise.resolve().then(checkConnection)
  }

  return () => {
    if (disposed) return

    disposed = true
    stopWatching()
  }
}

export { waitForConnected }
