// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import * as api from '../features/properties/api'
import PropertyDetailsPage from './PropertyDetailsPage'
import { ToastContext } from '../components/ui/ToastContext'
import * as adminApi from '../features/admin/api'
import type { PropertyDetailsResponse } from '../types/api'

const mocks = vi.hoisted(() => ({ auth: { isAdmin: false, userId: null as number | null } }))
vi.mock('../context/auth', () => ({ useAuth: () => mocks.auth }))
vi.mock('../features/properties/components/details/PropertyGallery', () => ({
  PropertyGallery: () => null,
}))
const clients: QueryClient[] = []
const property: PropertyDetailsResponse = {
  id: 7,
  title: 'إعلان للمراجعة',
  propertyType: 'HOUSE',
  listingType: 'SELL',
  postingStatus: 'PENDING',
  price: 100000,
  currency: 'USD',
  isAvailable: true,
  town: { townId: 1, townName: 'بيرزيت', cityId: 1, cityName: 'رام الله' },
  user: { id: 9, displayName: 'ناشر' },
  images: [],
}
function AdminDestination() {
  const location = useLocation()
  return (
    <output aria-label="Admin destination">
      {location.pathname}
      {location.search}
    </output>
  )
}

function renderPage(id = '7') {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  clients.push(client)
  const view = render(
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={{ showToast: vi.fn() }}>
        <MemoryRouter initialEntries={[`/properties/${id}`]}>
          <Routes>
            <Route path="/properties/:id" element={<PropertyDetailsPage />} />
            <Route path="/admin" element={<AdminDestination />} />
          </Routes>
        </MemoryRouter>
      </ToastContext.Provider>
    </QueryClientProvider>,
  )
  return { client, ...view }
}
beforeEach(() => {
  mocks.auth.isAdmin = false
  mocks.auth.userId = null
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.restoreAllMocks()
})
it('shows the loading skeleton', () => {
  vi.spyOn(api, 'getPropertyDetails').mockReturnValue(new Promise(() => {}))
  renderPage()
  expect(screen.getByRole('status', { name: 'جارٍ تحميل الإعلان' })).toBeTruthy()
})
it.each(['0', '-1', 'abc', '1.5', '9007199254740992'])(
  'rejects invalid id %s without a request',
  (id) => {
    const request = vi.spyOn(api, 'getPropertyDetails')
    renderPage(id)
    expect(screen.getByText('الإعلان غير موجود')).toBeTruthy()
    expect(request).not.toHaveBeenCalled()
  },
)
it.each([400, 403, 404])('shows not found for %s without retry', async (status) => {
  const request = vi
    .spyOn(api, 'getPropertyDetails')
    .mockRejectedValue(new ApiError(status, 'missing'))
  renderPage()
  expect(await screen.findByText('الإعلان غير موجود')).toBeTruthy()
  expect(request).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('link').getAttribute('href')).toBe('/')
})
it('allows retry after a server error', async () => {
  const request = vi.spyOn(api, 'getPropertyDetails').mockRejectedValue(new ApiError(500, 'failed'))
  renderPage()
  fireEvent.click(await screen.findByRole('button', { name: 'حاول مرة أخرى' }))
  await waitFor(() => expect(request.mock.calls.length).toBeGreaterThan(3))
})

it.each([
  [false, 'PENDING', false],
  [true, 'PENDING', true],
  [true, 'APPROVED', false],
  [true, 'REJECTED', false],
] as const)(
  'shows moderation only for admin pending details (%s, %s)',
  async (isAdmin, postingStatus, visible) => {
    mocks.auth.isAdmin = isAdmin
    vi.spyOn(api, 'getPropertyDetails').mockResolvedValue({ ...property, postingStatus })
    renderPage()
    await screen.findByRole('heading', { name: property.title })
    expect(Boolean(screen.queryByRole('region', { name: 'مراجعة الإعلان' }))).toBe(visible)
  },
)

it.each(['approve', 'reject'] as const)(
  'returns to pending moderation after details %s and invalidates both feeds',
  async (action) => {
    mocks.auth.isAdmin = true
    vi.spyOn(api, 'getPropertyDetails').mockResolvedValue(property)
    const approve = vi.spyOn(adminApi, 'approveProperty').mockResolvedValue(undefined)
    const reject = vi.spyOn(adminApi, 'rejectProperty').mockResolvedValue(undefined)
    const { client } = renderPage()
    client.setQueryData(['admin', 'properties', 'PENDING'], { pages: [] })
    client.setQueryData(['properties', 'feed'], { pages: [] })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    fireEvent.click(
      await screen.findByRole('button', { name: action === 'approve' ? 'موافقة' : 'رفض' }),
    )
    if (action === 'reject') {
      fireEvent.change(screen.getByRole('textbox', { name: 'سبب الرفض' }), {
        target: { value: 'بيانات غير مكتملة' },
      })
    }
    fireEvent.click(
      screen.getByRole('button', { name: action === 'approve' ? 'تأكيد الموافقة' : 'إرسال' }),
    )
    expect((await screen.findByLabelText('Admin destination')).textContent).toBe(
      '/admin?tab=pending',
    )
    if (action === 'approve') expect(approve).toHaveBeenCalledWith(7)
    else expect(reject).toHaveBeenCalledWith(7, 'بيانات غير مكتملة')
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'properties'] }),
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['properties'] })
    expect(client.getQueryState(['admin', 'properties', 'PENDING'])?.isInvalidated).toBe(true)
    expect(client.getQueryState(['properties', 'feed'])?.isInvalidated).toBe(true)
  },
)
