// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TopNavbar } from './TopNavbar'
const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  isAdmin: false,
  logout: vi.fn(),
}))
vi.mock('../../context/auth', () => ({ useAuth: () => auth }))
beforeEach(() => {
  auth.isAuthenticated = false
  auth.isAdmin = false
  auth.logout.mockClear()
})
afterEach(cleanup)

function renderNavbar() {
  render(
    <MemoryRouter>
      <TopNavbar />
    </MemoryRouter>,
  )
}

it('shows home and login without authenticated links to guests', () => {
  renderNavbar()
  expect(screen.getByRole('link', { name: 'الرئيسية' }).getAttribute('href')).toBe('/')
  expect(screen.getByRole('link', { name: 'تسجيل الدخول' }).getAttribute('href')).toBe('/login')
  expect(screen.queryByRole('link', { name: 'أضف عقار' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'حسابي' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'لوحة الإدارة' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'تسجيل الخروج' })).toBeNull()
})

it('links authenticated users to home, create and account alongside working logout', () => {
  auth.isAuthenticated = true
  renderNavbar()
  const navigation = within(screen.getByRole('navigation'))
  expect(navigation.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
    '/',
    '/properties/new',
    '/profile',
  ])
  expect(navigation.getByRole('link', { name: 'أضف عقار' })).toBeTruthy()
  expect(navigation.getByRole('link', { name: 'حسابي' })).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'تسجيل الدخول' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'لوحة الإدارة' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'تسجيل الخروج' }))
  expect(auth.logout).toHaveBeenCalledOnce()
})

it('adds the dashboard link for admins', () => {
  auth.isAuthenticated = true
  auth.isAdmin = true
  renderNavbar()
  expect(screen.getByRole('link', { name: 'لوحة الإدارة' }).getAttribute('href')).toBe('/admin')
  expect(within(screen.getByRole('navigation')).getAllByRole('link')).toHaveLength(4)
  expect(screen.getByRole('button', { name: 'تسجيل الخروج' })).toBeTruthy()
})

it('keeps navigation desktop-only without hiding the mobile login or logout', () => {
  renderNavbar()
  const navigation = screen.getByRole('navigation')
  expect(navigation.classList.contains('hidden')).toBe(true)
  expect(navigation.classList.contains('md:flex')).toBe(true)
  expect(navigation.contains(screen.getByRole('link', { name: 'تسجيل الدخول' }))).toBe(false)
  cleanup()
  auth.isAuthenticated = true
  renderNavbar()
  expect(
    screen.getByRole('navigation').contains(screen.getByRole('button', { name: 'تسجيل الخروج' })),
  ).toBe(false)
})
