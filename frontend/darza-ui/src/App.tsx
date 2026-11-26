import { createBrowserRouter, RouterProvider } from 'react-router'
import { NavigationGuardProvider } from './hooks/NavigationGuardProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from './api/client'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/ToastProvider'
import { OverlayRouteCleanup } from './components/ui/OverlayRouteCleanup'
import { AppRoutes } from './routes/AppRoutes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 1,
    },
  },
})
function AppContent() {
  return (
    <NavigationGuardProvider>
      <OverlayRouteCleanup />
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </NavigationGuardProvider>
  )
}

const router = createBrowserRouter([{ path: '*', element: <AppContent /> }])

export default function App() {
  return <RouterProvider router={router} />
}
