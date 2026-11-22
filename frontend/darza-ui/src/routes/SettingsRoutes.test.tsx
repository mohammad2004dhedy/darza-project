// @vitest-environment jsdom
import { Suspense } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext, type AuthValue } from '../context/auth'
import { AppRoutes } from './AppRoutes'

vi.mock('../pages/LoginPage', () => ({ default: () => <h1>Login destination</h1> }))
afterEach(cleanup)
it.each(['/settings', '/settings/account'])('protects %s from anonymous visitors', async (path) => {
  const auth: AuthValue = {
    token: null,
    userId: null,
    displayName: null,
    role: null,
    expiresAt: null,
    isAuthenticated: false,
    isAdmin: false,
    login: vi.fn(),
    logout: vi.fn(),
  }
  render(
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[path]}>
          <Suspense>
            <AppRoutes />
          </Suspense>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  )
  expect(await screen.findByRole('heading', { name: 'Login destination' })).toBeTruthy()
})
