// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext, type AuthValue } from '../../../context/auth'
import { LogoutButton } from './LogoutButton'
import { LogoutConfirmationProvider } from './LogoutConfirmationProvider'

HTMLDialogElement.prototype.showModal = function () {
  this.open = true
}
HTMLDialogElement.prototype.close = function () {
  this.open = false
}
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
      <LogoutConfirmationProvider>
        <LogoutButton />
        <LogoutButton />
      </LogoutConfirmationProvider>
    </AuthContext.Provider>,
  )
  fireEvent.click(screen.getAllByRole('button', { name: 'تسجيل الخروج' })[0])
  expect(logout).not.toHaveBeenCalled()
  expect(screen.getAllByRole('dialog')).toHaveLength(1)
  expect(screen.getByText('هل أنت متأكد من تسجيل الخروج؟')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'إلغاء' }))
  expect(logout).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getAllByRole('button', { name: 'تسجيل الخروج' })[1])
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تسجيل الخروج' }))
  expect(logout).toHaveBeenCalledOnce()
})
