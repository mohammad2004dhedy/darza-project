import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../context/auth'
export function GuestRoute() {
  const { isAuthenticated } = useAuth()

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
}
