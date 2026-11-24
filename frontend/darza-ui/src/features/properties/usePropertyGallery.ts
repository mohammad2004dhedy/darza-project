import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

export function usePropertyGallery(count: number, initialIndex = 0) {
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const track = useRef<HTMLDivElement>(null)
  const navigation = useRef({ isProgrammatic: false, targetIndex: 0 })
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const position = useCallback(() => {
    const element = track.current
    if (!element?.children.length) return 0
    const origin = (element.children[0] as HTMLElement).offsetLeft
    let nearest = 0
    let distance = Infinity
    Array.from(element.children).forEach((child, index) => {
      const delta = Math.abs(
        Math.abs((child as HTMLElement).offsetLeft - origin) - Math.abs(element.scrollLeft),
      )
      if (delta < distance) {
        distance = delta
        nearest = index
      }
    })
    return nearest
  }, [])

  const settle = useCallback(() => {
    const index = position()
    // An earlier scroll can finish after a new target was selected.
    if (navigation.current.isProgrammatic && index !== navigation.current.targetIndex) return
    clearTimeout(idle.current)
    navigation.current.isProgrammatic = false
    setActiveIndex(index)
  }, [position])

  useEffect(() => {
    const element = track.current
    element?.addEventListener('scrollend', settle)
    return () => {
      element?.removeEventListener('scrollend', settle)
      clearTimeout(idle.current)
    }
  }, [settle])

  const goTo = useCallback(
    (next: number, behavior: ScrollBehavior = 'auto') => {
      const element = track.current
      const targetIndex = Math.max(0, Math.min(count - 1, next))
      const slide = element?.children[targetIndex] as HTMLElement | undefined
      if (!element || !slide) return
      navigation.current = { isProgrammatic: true, targetIndex }
      setActiveIndex(targetIndex)
      clearTimeout(idle.current)
      idle.current = setTimeout(() => {
        navigation.current.isProgrammatic = false
      }, 400)
      element.scrollTo({
        left: slide.offsetLeft - (element.children[0] as HTMLElement).offsetLeft,
        behavior,
      })
    },
    [count],
  )

  const onScroll = () => {
    if (navigation.current.isProgrammatic) return
    clearTimeout(idle.current)
    idle.current = setTimeout(settle, 120)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    goTo(activeIndex + (event.key === 'ArrowRight' ? 1 : -1))
  }

  return { activeIndex, track, goTo, onScroll, onKeyDown }
}
