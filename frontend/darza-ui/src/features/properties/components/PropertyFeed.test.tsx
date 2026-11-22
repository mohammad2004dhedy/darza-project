// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { PropertyFeed } from './PropertyFeed'

function renderFeed() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PropertyFeed />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const property = {
  id: 1,
  title: 'شقة في نابلس',
  user: { id: 1, displayName: 'ناشر' },
  listingType: 'SELL',
  propertyType: 'APARTMENT',
  price: 150000,
  currency: 'USD',
  town: { cityName: 'نابلس', townName: 'بيتا' },
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('retries a failed next page without replacing the first page', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({ page: 0, hasNext: true, content: [property] }))
    .mockResolvedValueOnce(Response.json({ message: 'تعذر الاتصال' }, { status: 503 }))
    .mockResolvedValueOnce(
      Response.json({
        page: 1,
        hasNext: false,
        content: [{ ...property, id: 2, title: 'منزل في نابلس' }],
      }),
    )
  vi.stubGlobal('fetch', fetch)
  let intersect: (() => void) | undefined
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = () =>
          callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          )
      }
      observe() {}
      disconnect() {}
    },
  )
  renderFeed()
  await waitFor(() => expect(intersect).toBeDefined())
  expect(screen.queryByRole('button', { name: 'تحميل المزيد' })).toBeNull()
  act(() => intersect!())
  expect(screen.getByTestId('pagination-sentinel')).toBeTruthy()
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('تعذر الاتصال'),
  )
  expect(screen.getByText(property.title)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }))
  expect(await screen.findByText('منزل في نابلس')).toBeTruthy()
  expect(screen.getByText(property.title)).toBeTruthy()
  expect(screen.getByText('تم مشاهدة جميع العقارات المتاحة')).toBeTruthy()
  expect(screen.getByTestId('pagination-sentinel')).toBeTruthy()
  expect(fetch.mock.calls.map(([url]) => url.split('?')[1])).toEqual(['page=0', 'page=1', 'page=1'])
  expect(screen.queryByRole('button', { name: 'تحميل المزيد' })).toBeNull()
})

it('can recover from an initial error into the empty state', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: 'الخادم غير متاح' }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ page: 0, hasNext: false, content: [] })),
  )
  renderFeed()
  fireEvent.click(await screen.findByRole('button', { name: 'إعادة المحاولة' }))
  expect(screen.getByTestId('pagination-sentinel')).toBeTruthy()
  expect(await screen.findByText('ما في عقارات معروضة حاليًا')).toBeTruthy()
  expect(screen.queryByText('تم مشاهدة جميع العقارات المتاحة')).toBeNull()
  expect(screen.getByTestId('pagination-sentinel')).toBeTruthy()
})
