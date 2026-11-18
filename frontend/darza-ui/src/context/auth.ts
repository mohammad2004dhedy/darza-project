import { createContext, useContext } from 'react'
import type { LoginResponse } from '../types/api'

export interface AuthValue {
  token: string | null
  userId: number | null
  displayName: string | null
  role: LoginResponse['role'] | null
  expiresAt: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (session: LoginResponse) => void
  logout: () => void
}
export const AuthContext = createContext<AuthValue | null>(null)
export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('سياق الجلسة غير متاح')
  return value
}
