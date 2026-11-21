// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import type { PropertyCardResponse, SliceResponse } from '../../../types/api'
import { UserPropertiesSection } from './UserPropertiesSection'

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

afterEach(cleanup)

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
  'shows the appropriate empty state (owner: %s) with no create button',
  async (owner, message) => {
    renderSection(async () => ({ page: 0, hasNext: false, content: [] }), owner)
    expect(await screen.findByText(message)).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
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
  renderSection(fetchPage, true)
  fireEvent.click(await screen.findByRole('button', { name: 'تحميل المزيد' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByText(property.title)).toBeTruthy()
  expect(screen.getByText('قيد المراجعة')).toBeTruthy()
  expect(screen.getByText('غير متاح')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'إعادة المحاولة' }))
  expect(await screen.findByText('بيت جديد')).toBeTruthy()
  expect(screen.getByText(property.title)).toBeTruthy()
  expect(fetchPage.mock.calls).toEqual([[0], [1], [1]])
})

it('hides moderation status in the public list', async () => {
  renderSection(async () => ({ page: 0, hasNext: false, content: [property] }))
  expect(await screen.findByText(property.title)).toBeTruthy()
  expect(screen.queryByText('قيد المراجعة')).toBeNull()
})
