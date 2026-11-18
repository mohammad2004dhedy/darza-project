import { useEffect, useRef } from 'react'

const PRELOAD_MARGIN = '300px 0px'

export function useInfiniteScroll(enabled: boolean, onLoad: () => void) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const callbackTriggered = useRef(false)

  useEffect(() => {
    if (!enabled) {
      callbackTriggered.current = false
      return
    }

    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            callbackTriggered.current = false
          } else if (!callbackTriggered.current) {
            callbackTriggered.current = true
            onLoad()
          }
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [enabled, onLoad])

  return { sentinelRef }
}
