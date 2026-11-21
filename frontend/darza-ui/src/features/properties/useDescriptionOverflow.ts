import { useEffect, useRef, useState } from 'react'

export function useDescriptionOverflow(text: string | undefined) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || expanded) return
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, expanded])
  return { ref, expanded, overflows, toggle: () => setExpanded((value) => !value) }
}
