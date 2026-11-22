// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import type { PropertyCardResponse, SliceResponse } from '../../../types/api'
import { UserPropertiesSection } from './UserPropertiesSection'

vi.mock('../../../context/auth', () => ({ useAuth: () => ({ userId: 1 }) }))
vi.mock('../../../components/ui/useToast', () => ({ useToast: () => ({ showToast: vi.fn() }) }))

const property: PropertyCardResponse = {
  id: 1,
  title: 'شقة في نابلس',
  user: { id: 1, displayName: 'ناشر' },
  listingType: 'SELL',
  propertyType: 'APARTMENT',
  price: 150000,
  currency: 'USD',
  town: { townId: 1, townName: 'بيتا', cityId: 2, cityName: 'نابلس' },
  isAvailable: false,
  postingStatus: 'PENDING',
}

function renderSection(
  fetchPage: (page: number) => Promise<SliceResponse<PropertyCardResponse>>,
  showStatus = false,
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Harness() {
    const query = useInfiniteQuery({
      queryKey: ['test-properties'],
      queryFn: ({ pageParam }) => fetchPage(pageParam),
      initialPageParam: 0,
      getNextPageParam: (page) => (page.hasNext ? page.page + 1 : undefined),
    })
    return <UserPropertiesSection query={query} showStatus={showStatus} />
  }
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('reserves a six-card grid while loading', () => {
  renderSection(() => new Promise(() => {}))
  expect(screen.getByRole('heading', { name: 'الإعلانات' })).toBeTruthy()
  expect(screen.getByRole('status').children).toHaveLength(7)
  expect(screen.queryByText('لا توجد إعلانات حالياً')).toBeNull()
})

it.each([
  [false, 'لا توجد إعلانات حالياً'],
  [true, 'لم تنشر أي إعلان بعد'],
] as const)(
  'shows the appropriate empty state (owner: %s) with an owner-only create button',
  async (owner, message) => {
    renderSection(async () => ({ page: 0, hasNext: false, content: [] }), owner)
    expect(await screen.findByText(message)).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    if (owner)
      expect(screen.getByRole('link', { name: 'إنشاء إعلان' }).getAttribute('href')).toBe(
        '/properties/new',
      )
    else expect(screen.queryByRole('link')).toBeNull()
  },
)

it('retries an initial error', async () => {
  const fetchPage = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ page: 0, hasNext: false, content: [] })
  renderSection(fetchPage)
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByText('لا توجد إعلانات حالياً')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }))
  expect(await screen.findByText('لا توجد إعلانات حالياً')).toBeTruthy()
  expect(fetchPage.mock.calls).toEqual([[0], [0]])
})

it('preserves loaded properties and retries the same failed next page', async () => {
  const fetchPage = vi
    .fn()
    .mockResolvedValueOnce({ page: 0, hasNext: true, content: [property] })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({
      page: 1,
      hasNext: false,
      content: [{ ...property, id: 2, title: 'بيت جديد' }],
    })
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
  renderSection(fetchPage, true)
  await waitFor(() => expect(intersect).toBeDefined())
  expect(screen.queryByRole('button', { name: 'تحميل المزيد' })).toBeNull()
  act(() => intersect!())
  expect(screen.getByTestId('pagination-sentinel')).toBeTruthy()
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByText(property.title)).toBeTruthy()
  expect(screen.getByText('قيد المراجعة')).toBeTruthy()
  expect(screen.getByText('غير متاح')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }))
  expect(await screen.findByText('بيت جديد')).toBeTruthy()
  expect(screen.getByText(property.title)).toBeTruthy()
  expect(fetchPage.mock.calls).toEqual([[0], [1], [1]])
})

it('omits moderation status when absent from the response', async () => {
  renderSection(async () => ({
    page: 0,
    hasNext: false,
    content: [{ ...property, postingStatus: undefined }],
  }))
  expect(await screen.findByText(property.title)).toBeTruthy()
  expect(screen.queryByText('قيد المراجعة')).toBeNull()
})
