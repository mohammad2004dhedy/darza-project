// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, act, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthContext'
import { useAuth } from './auth'
import { AuthStorage } from '../lib/authStorage'
import { ToastProvider } from '../components/ui/ToastProvider'
import { LogoutButton } from '../features/users/components/LogoutButton'

HTMLDialogElement.prototype.showModal = function () {
  this.open = true
}
HTMLDialogElement.prototype.close = function () {
  this.open = false
}
afterEach(() => {
  cleanup()
  AuthStorage.clear()
  vi.useRealTimers()
})

function Session() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      <span>{isAuthenticated ? 'signed in' : 'signed out'}</span>
      <LogoutButton />
    </>
  )
}
function renderSession() {
  AuthStorage.saveSession({
    token: 'test',
    userId: 7,
    displayName: 'أحمد',
    role: 'PUBLISHER',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <AuthProvider>
            <Session />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

it('keeps the session on cancel and ends it only after manual confirmation', async () => {
  renderSession()
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الخروج' }))
  fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))
  expect(screen.getByText('signed in')).toBeTruthy()
  expect(AuthStorage.getSession()).not.toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الخروج' }))
  await act(async () =>
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'تسجيل الخروج' }),
    ),
  )
  expect(screen.getByText('signed out')).toBeTruthy()
  expect(AuthStorage.getSession()).toBeNull()
})

it('expires the session automatically without opening logout confirmation', async () => {
  vi.useFakeTimers()
  renderSession()
  await act(async () => {
    vi.advanceTimersByTime(60_001)
  })
  expect(screen.getByText('signed out')).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(AuthStorage.getSession()).toBeNull()
})
