// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ToastContext } from '../components/ui/ToastContext'
import * as api from '../features/admin/api'
import AdminPage from './AdminPage'

vi.mock('../features/admin/api', () => ({
  getAdminProperties: vi.fn(),
  approveProperty: vi.fn(),
  rejectProperty: vi.fn(),
}))
const clients: QueryClient[] = []
function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output aria-label="Current location">
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  )
}
function setup(path = '/admin') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clients.push(client)
  render(
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={{ showToast: vi.fn() }}>
        <MemoryRouter initialEntries={[path]}>
          <Navigation />
          <AdminPage />
        </MemoryRouter>
      </ToastContext.Provider>
    </QueryClientProvider>,
  )
  return client
}
beforeEach(() => {
  vi.mocked(api.getAdminProperties)
    .mockReset()
    .mockResolvedValue({ content: [], hasNext: false, page: 0 })
})
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
})

it.each(['/admin', '/admin?tab=pending', '/admin?tab=unknown'])(
  'defaults to pending at %s with no approved tab',
  async (path) => {
    const client = setup(path)
    expect(screen.getByRole('tab', { name: 'قيد المراجعة' }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(screen.getByRole('tab', { name: 'المرفوضة' }).getAttribute('aria-selected')).toBe(
      'false',
    )
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(await screen.findByText('لا توجد إعلانات قيد المراجعة')).toBeTruthy()
    expect(api.getAdminProperties).toHaveBeenCalledWith('PENDING', 0)
    expect(client.getQueryData(['admin', 'properties', 'PENDING'])).toBeTruthy()
    expect(screen.queryByText('لا توجد إعلانات مرفوضة')).toBeNull()
  },
)

it('opens rejected directly from the URL and uses its own query cache', async () => {
  const client = setup('/admin?tab=rejected')
  expect(screen.getByRole('tab', { name: 'المرفوضة' }).getAttribute('aria-selected')).toBe('true')
  expect(screen.getByRole('tab', { name: 'قيد المراجعة' }).getAttribute('aria-selected')).toBe(
    'false',
  )
  expect(await screen.findByText('لا توجد إعلانات مرفوضة')).toBeTruthy()
  expect(api.getAdminProperties).toHaveBeenCalledWith('REJECTED', 0)
  expect(api.getAdminProperties).not.toHaveBeenCalledWith('PENDING', 0)
  expect(client.getQueryData(['admin', 'properties', 'REJECTED'])).toBeTruthy()
})

it('updates the URL when tabs change and restores the selected tab on back', async () => {
  setup('/admin?tab=pending')
  await screen.findByText('لا توجد إعلانات قيد المراجعة')
  fireEvent.click(screen.getByRole('tab', { name: 'المرفوضة' }))
  expect(await screen.findByText('لا توجد إعلانات مرفوضة')).toBeTruthy()
  expect(screen.getByLabelText('Current location').textContent).toBe('/admin?tab=rejected')
  expect(screen.getByRole('tab', { name: 'المرفوضة' }).getAttribute('aria-selected')).toBe('true')
  expect(api.getAdminProperties).toHaveBeenCalledWith('REJECTED', 0)
  fireEvent.click(screen.getByRole('tab', { name: 'قيد المراجعة' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Current location').textContent).toBe('/admin?tab=pending'),
  )
  expect(screen.getByRole('tab', { name: 'قيد المراجعة' }).getAttribute('aria-selected')).toBe(
    'true',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Current location').textContent).toBe('/admin?tab=rejected'),
  )
  expect(screen.getByRole('tab', { name: 'المرفوضة' }).getAttribute('aria-selected')).toBe('true')
  expect(await screen.findByText('لا توجد إعلانات مرفوضة')).toBeTruthy()
})
