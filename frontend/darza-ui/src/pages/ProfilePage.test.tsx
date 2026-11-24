// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import * as client from '../api/client'
import { AuthContext, type AuthValue } from '../context/auth'
import ProfilePage from './ProfilePage'
import { LogoutConfirmationProvider } from '../features/users/components/LogoutConfirmationProvider'
import { AppRoutes } from '../routes/AppRoutes'

const publicUser = { id: 7, displayName: 'معلن', createdAt: '2025-01-01T00:00:00Z' }
const privateUser = { ...publicUser, phoneNumber: '+970590000000', email: 'private@example.com' }
const properties = { content: [], page: 0, hasNext: false }

function renderPage(id = '7', userId: number | null = null, appRoute?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  const auth: AuthValue = {
    token: userId ? 'token' : null,
    userId,
    displayName: null,
    role: null,
    expiresAt: null,
    isAuthenticated: userId !== null,
    isAdmin: false,
    login: vi.fn(),
    logout: vi.fn(),
  }
  render(
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[appRoute ?? `/users/${id}`]}>
          {appRoute ? (
            <LogoutConfirmationProvider>
              <AppRoutes />
            </LogoutConfirmationProvider>
          ) : (
            <Routes>
              <Route path="/users/:id" element={<ProfilePage />} />
            </Routes>
          )}
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  )
  return { queryClient, auth }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('shows the owner view and calls only the private endpoints', async () => {
  const request = vi.spyOn(client, 'request').mockImplementation(async (path) => {
    if (path === '/api/users/me') return privateUser as never
    if (path === '/api/users/me/properties?page=0') return properties as never
    throw new Error(`Unexpected endpoint: ${path}`)
  })
  const { auth } = renderPage('7', 7)
  expect(await screen.findByRole('heading', { name: 'معلن' })).toBeTruthy()
  expect(screen.queryByText('private@example.com')).toBeNull()
  expect(await screen.findByText('لم تنشر أي إعلان بعد')).toBeTruthy()
  expect(request.mock.calls.map(([path]) => path)).toEqual([
    '/api/users/me',
    '/api/users/me/properties?page=0',
  ])
  expect(screen.queryByRole('button', { name: 'تسجيل الخروج' })).toBeNull()
  expect(auth.logout).not.toHaveBeenCalled()
  expect(screen.getByRole('link', { name: 'الإعدادات' }).getAttribute('href')).toBe('/settings')
  expect(screen.getByRole('link', { name: 'إنشاء إعلان' }).getAttribute('href')).toBe(
    '/properties/new',
  )
  expect(screen.getByRole('heading', { name: 'إعلاناتي' })).toBeTruthy()
})

it.each([null, 8])(
  'shows the public view for viewer %s and calls no private endpoints',
  async (userId) => {
    const request = vi.spyOn(client, 'request').mockImplementation(async (path) => {
      if (path === '/api/public/users/7/profile') return publicUser as never
      if (path === '/api/public/users/7/properties?page=0') return properties as never
      throw new Error(`Unexpected endpoint: ${path}`)
    })
    renderPage('7', userId)
    expect(await screen.findByRole('heading', { name: 'معلن' })).toBeTruthy()
    expect(await screen.findByText('لا توجد إعلانات حالياً')).toBeTruthy()
    expect(screen.queryByText('private@example.com')).toBeNull()
    expect(screen.queryByRole('link', { name: 'الإعدادات' })).toBeNull()
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      '/api/public/users/7/profile',
      '/api/public/users/7/properties?page=0',
    ])
  },
)

it.each(['0', '-1', '1.5', 'abc', '1e2', '01', '9007199254740992'])(
  'rejects invalid ID %s without requests',
  (id) => {
    const request = vi.spyOn(client, 'request')
    renderPage(id)
    expect(screen.getByRole('heading', { name: 'الملف الشخصي غير موجود' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'العودة للرئيسية' }).getAttribute('href')).toBe('/')
    expect(request).not.toHaveBeenCalled()
  },
)

it('shows a fixed-size loading skeleton while the profile is pending', () => {
  vi.spyOn(client, 'request').mockReturnValue(new Promise(() => {}))
  renderPage()
  expect(screen.getByRole('status', { name: 'جارٍ تحميل الملف الشخصي' })).toBeTruthy()
})

it.each([null, 7])('shows not found for a 404 for viewer %s', async (userId) => {
  const request = vi.spyOn(client, 'request').mockImplementation(async (path) => {
    if (path.includes('properties')) return properties as never
    throw new ApiError(404, 'missing')
  })
  renderPage('7', userId)
  expect(await screen.findByRole('heading', { name: 'الملف الشخصي غير موجود' })).toBeTruthy()
  expect(request).toHaveBeenCalledTimes(2)
})

it('retries a profile server error', async () => {
  let failed = true
  vi.spyOn(client, 'request').mockImplementation(async (path) => {
    if (path.includes('properties')) return properties as never
    if (failed) throw new ApiError(503, 'unavailable')
    return publicUser as never
  })
  renderPage()
  expect(await screen.findByText('تعذر تحميل الملف الشخصي')).toBeTruthy()
  failed = false
  fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }))
  await waitFor(() => expect(screen.getByRole('heading', { name: 'معلن' })).toBeTruthy())
})

it('exposes the lazy public profile route to logged-out visitors', async () => {
  vi.spyOn(client, 'request').mockImplementation(
    async (path) => (path.includes('properties') ? properties : publicUser) as never,
  )
  renderPage('7', null, '/users/7')
  expect(await screen.findByRole('heading', { name: 'معلن' })).toBeTruthy()
})

it.each(['/profile', '/my-properties'])(
  'redirects %s to the current user profile',
  async (route) => {
    const request = vi
      .spyOn(client, 'request')
      .mockImplementation(
        async (path) => (path.includes('properties') ? properties : privateUser) as never,
      )
    renderPage('7', 7, route)
    expect(await screen.findByRole('heading', { name: 'معلن' })).toBeTruthy()
    expect(screen.queryByText('private@example.com')).toBeNull()
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      '/api/users/me',
      '/api/users/me/properties?page=0',
    ])
  },
)
