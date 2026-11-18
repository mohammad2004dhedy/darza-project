import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/auth'
export function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
