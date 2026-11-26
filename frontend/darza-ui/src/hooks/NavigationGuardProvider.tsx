import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useBlocker } from 'react-router'
import { NavigationGuardContext } from './navigationGuardContext'

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const bypass = useRef(false)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (bypass.current) {
      bypass.current = false
      return false
    }
    const current = new URLSearchParams(currentLocation.search)
    const next = new URLSearchParams(nextLocation.search)
    current.delete('step')
    next.delete('step')
    current.delete('from')
    next.delete('from')
    const wizardStep =
      /^\/properties\/(new|[^/]+\/edit)$/.test(currentLocation.pathname) &&
      currentLocation.pathname === nextLocation.pathname &&
      current.toString() === next.toString()
    return active && !wizardStep
  })
  const allow = useCallback((action: () => void) => {
    bypass.current = true
    try {
      action()
    } finally {
      bypass.current = false
    }
  }, [])
  return (
    <NavigationGuardContext.Provider
      value={{
        setActive,
        blocked: blocker.state === 'blocked',
        proceed: () => blocker.state === 'blocked' && blocker.proceed(),
        reset: () => blocker.state === 'blocked' && blocker.reset(),
        allow,
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  )
}
