import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

let locks = 0

export function useScrollLock(active: boolean) {
  const { key } = useLocation()
  const release = useRef<(() => void) | undefined>(undefined)
  useEffect(() => {
    if (!active) return
    locks += 1
    document.documentElement.classList.add('scroll-locked')
    let held = true
    const unlock = () => {
      if (!held) return
      held = false
      locks -= 1
      if (locks === 0) document.documentElement.classList.remove('scroll-locked')
    }
    release.current = unlock
    return unlock
  }, [active])
  useEffect(() => () => release.current?.(), [key])
}
