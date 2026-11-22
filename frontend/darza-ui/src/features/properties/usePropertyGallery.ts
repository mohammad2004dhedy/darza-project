import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

export function usePropertyGallery(count: number) {
  const [activeIndex, setActiveIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const navigation = useRef({ isProgrammatic: false, targetIndex: 0 })
  const idle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const frame = useRef<number | undefined>(undefined)

  const position = useCallback(() => {
    const element = track.current
    if (!element?.children.length) return 0
    const origin = (element.children[0] as HTMLElement).offsetLeft
    let nearest = 0
    let distance = Infinity
    Array.from(element.children).forEach((child, index) => {
      const delta = Math.abs(Math.abs((child as HTMLElement).offsetLeft - origin) - Math.abs(element.scrollLeft))
      if (delta < distance) {
        distance = delta
        nearest = index
      }
    })
    return nearest
  }, [])

  const settle = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    frame.current = undefined
    clearTimeout(idle.current)
    navigation.current.isProgrammatic = false
    setActiveIndex(position())
  }, [position])

  useEffect(() => {
    const element = track.current
    element?.addEventListener('scrollend', settle)
    return () => {
      element?.removeEventListener('scrollend', settle)
      clearTimeout(idle.current)
      if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    }
  }, [settle])

  const goTo = useCallback((next: number) => {
    const element = track.current
    const targetIndex = Math.max(0, Math.min(count - 1, next))
    const slide = element?.children[targetIndex] as HTMLElement | undefined
    if (!element || !slide) return
    navigation.current = { isProgrammatic: true, targetIndex }
    setActiveIndex(targetIndex)
    clearTimeout(idle.current)
    idle.current = setTimeout(settle, 300)
    element.scrollTo({
      left: slide.offsetLeft - (element.children[0] as HTMLElement).offsetLeft,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }, [count, settle])

  const onScroll = () => {
    clearTimeout(idle.current)
    idle.current = setTimeout(settle, 300)
    if (navigation.current.isProgrammatic || frame.current !== undefined) return
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined
      if (!navigation.current.isProgrammatic) setActiveIndex(position())
    })
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    goTo(activeIndex + (event.key === 'ArrowRight' ? 1 : -1))
  }

  return { activeIndex, track, goTo, onScroll, onKeyDown }
}
