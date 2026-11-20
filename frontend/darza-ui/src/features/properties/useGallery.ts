import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

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

export function useGallery(count: number, initialIndex = 0) {
  const [index, setIndex] = useState(initialIndex)
  const track = useRef<HTMLDivElement>(null)
  const goTo = useCallback(
    (next: number, behavior: ScrollBehavior = 'smooth') => {
      const current = Math.max(0, Math.min(count - 1, next))
      const element = track.current
      const slide = element?.children[current] as HTMLElement | undefined
      if (!element || !slide) return
      element.scrollTo({
        left: slide.offsetLeft - (element.children[0] as HTMLElement).offsetLeft,
        behavior,
      })
      setIndex(current)
    },
    [count],
  )
  const onScroll = () => {
    const element = track.current
    if (!element || !element.children.length) return
    const origin = (element.children[0] as HTMLElement).offsetLeft
    let nearest = 0
    let distance = Infinity
    Array.from(element.children).forEach((child, position) => {
      const delta = Math.abs((child as HTMLElement).offsetLeft - origin - element.scrollLeft)
      if (delta < distance) {
        distance = delta
        nearest = position
      }
    })
    setIndex(nearest)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    goTo(index + (event.key === 'ArrowRight' ? 1 : -1))
  }
  return { index, track, goTo, onScroll, onKeyDown }
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
      if (ownsEntry()) window.history.back()
      owned = false
    }
    releaseHistory.current = release
    // Defer ownership until StrictMode's rehearsal has cleaned up.
    queueMicrotask(() => {
      if (!active) return
      window.history.pushState({ ...window.history.state, darzaPhotoViewer: marker }, '', url)
      owned = true
    })
    const onPopState = () => {
      if (ownsEntry()) return
      owned = false
      closeCallback.current()
    }
    window.addEventListener('popstate', onPopState)
    return () => {
      active = false
      window.removeEventListener('popstate', onPopState)
      release()
      element.close()
      document.body.style.overflow = overflow
    }
  }, [])
  return { dialog, close }
}
