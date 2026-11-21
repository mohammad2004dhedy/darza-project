// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import * as api from '../features/properties/api'
import PropertyDetailsPage from './PropertyDetailsPage'

function renderPage(id = '7') {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/properties/${id}`]}>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
afterEach(() => {
  cleanup()
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
