import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/auth'
import { getRedirectTarget } from './redirectTarget'
export function GuestRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  return isAuthenticated ? <Navigate to={getRedirectTarget(location.state)} replace /> : <Outlet />
}
