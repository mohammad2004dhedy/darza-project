import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AuthStorage } from '../lib/authStorage'
import { DraftStorage } from '../features/property-form/DraftStorage'
import { setUnauthorizedHandler } from '../api/client'
import type { LoginResponse } from '../types/api'
import { useToast } from '../components/ui/useToast'
import { AuthContext, type AuthValue } from './auth'

interface AuthProviderProps {
  children: ReactNode
}
function initialSession(): LoginResponse | null {
  const session = AuthStorage.getSession()
  if (session && Date.parse(session.expiresAt) > Date.now()) return session
  AuthStorage.clear()
  return null
}
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState(initialSession)
  const activeSession = useRef(session)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const navigateRef = useRef(navigate)
  const toastRef = useRef(showToast)
  useEffect(() => {
    navigateRef.current = navigate
    toastRef.current = showToast
  })
  const endSession = useCallback(
    (expired: boolean) => {
      if (!activeSession.current) return
      DraftStorage.clear(activeSession.current.userId)
      activeSession.current = null
      AuthStorage.clear()
      queryClient.clear()
      if (expired) toastRef.current('انتهت الجلسة، يرجى تسجيل الدخول مجدداً')
      // Update the route and session together so guards cannot race the logout redirect.
      startTransition(() => {
        setSession(null)
        if (!expired) void navigateRef.current('/', { replace: true })
      })
    },
    [queryClient],
  )
  const logout = useCallback(() => endSession(false), [endSession])
  const expireSession = useCallback(() => endSession(true), [endSession])
  useEffect(
    () =>
      AuthStorage.subscribe((next) => {
        const valid = next && Date.parse(next.expiresAt) > Date.now() ? next : null
        queryClient.clear()
        activeSession.current = valid
        setSession(valid)
      }),
    [queryClient],
  )
  const login = useCallback(
    (value: LoginResponse) => {
      if (
        !Number.isFinite(Date.parse(value.expiresAt)) ||
        Date.parse(value.expiresAt) <= Date.now()
      ) {
        expireSession()
        return
      }
      queryClient.clear()
      AuthStorage.saveSession(value)
      activeSession.current = value
      setSession(value)
    },
    [expireSession, queryClient],
  )
  useEffect(() => {
    setUnauthorizedHandler(() => expireSession())
    return () => setUnauthorizedHandler(undefined)
  }, [expireSession])
  useEffect(() => {
    if (!session) return
    let timer: ReturnType<typeof setTimeout>
    const check = () => {
      clearTimeout(timer)
      const remaining = Date.parse(session.expiresAt) - Date.now()
      if (remaining <= 0) expireSession()
      else timer = setTimeout(check, Math.min(remaining, 2 ** 31 - 1))
    }
    check()
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [session, expireSession])
  const value = useMemo<AuthValue>(
    () => ({
      token: session?.token ?? null,
      userId: session?.userId ?? null,
      displayName: session?.displayName ?? null,
      role: session?.role ?? null,
      expiresAt: session?.expiresAt ?? null,
      isAuthenticated: session !== null,
      isAdmin: session?.role === 'ADMIN',
      login,
      logout,
    }),
    [session, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
