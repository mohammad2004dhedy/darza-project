// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { TopNavbar } from './TopNavbar'
const auth = vi.hoisted(() => ({ isAuthenticated: false, logout: vi.fn() }))
vi.mock('../../context/auth', () => ({ useAuth: () => auth }))
afterEach(cleanup)
it('shows login but no publishing entry to guests', () => {
  auth.isAuthenticated = false
  render(
    <MemoryRouter>
      <TopNavbar />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'تسجيل الدخول' }).getAttribute('href')).toBe('/login')
  expect(screen.queryByRole('link', { name: 'أضف عقار' })).toBeNull()
})
it('links authenticated publishers to the existing protected create route', () => {
  auth.isAuthenticated = true
  render(
    <MemoryRouter>
      <TopNavbar />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'أضف عقار' }).getAttribute('href')).toBe(
    '/properties/new',
  )
  expect(screen.getByRole('button', { name: 'تسجيل الخروج' })).toBeTruthy()
})
