import { createContext } from 'react'

export const NavigationGuardContext = createContext<{
  setActive: (active: boolean) => void
  blocked: boolean
  proceed: () => void
  reset: () => void
  allow: (action: () => void) => void
} | null>(null)
