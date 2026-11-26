import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { NavigationGuardContext } from './NavigationGuardProvider'

export function useUnsavedChanges(active: boolean) {
  const navigate = useNavigate()
  const guard = useContext(NavigationGuardContext)
  const setActive = guard?.setActive
  useLayoutEffect(() => {
    setActive?.(active)
    return () => setActive?.(false)
  }, [active, setActive])
  const pending = useRef<(() => void) | undefined>(undefined)
  const [confirming, setConfirming] = useState(false)
  function requestLeave(action: () => void) {
    if (!active) return action()
    pending.current = action
    setConfirming(true)
  }
  useEffect(() => {
    if (!active) return
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!link || link.download || (link.target && link.target !== '_self')) return
      const url = new URL(link.href)
      if (
        url.href === window.location.href ||
        (url.pathname === location.pathname && url.search === location.search && url.hash)
      )
        return
      if (guard && url.origin === location.origin) return
      event.preventDefault()
      event.stopPropagation()
      pending.current = () => {
        if (url.origin === location.origin) navigate(url.pathname + url.search + url.hash)
        else window.location.assign(url.href)
      }
      setConfirming(true)
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [active, navigate, guard])
  return {
    confirming: confirming || !!guard?.blocked,
    requestLeave,
    allowLeave: (action: () => void) => (guard ? guard.allow(action) : action()),
    cancel: () => {
      guard?.reset()
      pending.current = undefined
      setConfirming(false)
    },
    confirm: () => {
      const action = pending.current
      pending.current = undefined
      setConfirming(false)
      if (action) {
        if (guard) guard.allow(action)
        else action()
      } else guard?.proceed()
    },
  }
}
