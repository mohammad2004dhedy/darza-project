// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext, type AuthValue } from '../../../context/auth'
import { LogoutButton } from './LogoutButton'

afterEach(cleanup)

it('uses the existing session logout action', () => {
  const logout = vi.fn()
  const auth: AuthValue = {
    token: null,
    userId: 7,
    displayName: 'أحمد',
    role: 'PUBLISHER',
    expiresAt: null,
    isAuthenticated: true,
    isAdmin: false,
    login: vi.fn(),
    logout,
  }
  render(
    <AuthContext.Provider value={auth}>
      <LogoutButton />
    </AuthContext.Provider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الخروج' }))
  expect(logout).toHaveBeenCalledOnce()
})
