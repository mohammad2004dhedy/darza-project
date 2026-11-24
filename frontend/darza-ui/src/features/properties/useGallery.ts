import { useCallback, useEffect, useRef, useState } from 'react'

let pendingHistoryBack: Promise<void> | undefined

export function useDesktopGallery() {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const update = () => setDesktop(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return desktop
}

export function usePhotoViewer(onClose: () => void) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeCallback = useRef(onClose)
  useEffect(() => {
    closeCallback.current = onClose
  }, [onClose])
  const releaseHistory = useRef<() => void>(() => {})
  const close = useCallback(() => {
    releaseHistory.current()
    closeCallback.current()
  }, [])

  useEffect(() => {
    const element = dialog.current!
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    let active = true
    let owned = false
    const marker = crypto.randomUUID()
    const url = window.location.href
    const ownsEntry = () =>
      owned && window.history.state?.darzaPhotoViewer === marker && window.location.href === url
    const release = () => {
      if (ownsEntry()) {
        pendingHistoryBack = new Promise<void>((resolve) => {
          window.addEventListener(
            'popstate',
            () => {
              pendingHistoryBack = undefined
              resolve()
            },
            { once: true },
          )
        })
        window.history.back()
      }
      owned = false
    }
    releaseHistory.current = release
    // Defer ownership until StrictMode's rehearsal has cleaned up.
    queueMicrotask(async () => {
      if (pendingHistoryBack) await pendingHistoryBack
      if (!active) return
      window.history.pushState({ ...window.history.state, darzaPhotoViewer: marker }, '', url)
      owned = true
    })
    const onPopState = () => {
      if (!owned || ownsEntry()) return
      owned = false
      closeCallback.current()
    }
    window.addEventListener('popstate', onPopState)
    return () => {
      active = false
      window.removeEventListener('popstate', onPopState)
      release()
      element.close()
      if (opener?.isConnected) opener.focus({ preventScroll: true })
      document.body.style.overflow = overflow
    }
  }, [])
  return { dialog, close }
}
