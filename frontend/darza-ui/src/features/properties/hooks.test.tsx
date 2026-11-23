// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as propertiesApi from './api'
import { usePropertyFeed } from './hooks'

const page = (number: number, hasNext: boolean, ids: number[]) => ({
  content: ids.map((id) => ({ id })),
  hasNext,
  page: number,
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

afterEach(() => vi.restoreAllMocks())

describe('usePropertyFeed', () => {
  it('starts at page zero and requests subsequent pages until hasNext is false', async () => {
    const getFeed = vi
      .spyOn(propertiesApi, 'getFeed')
      .mockResolvedValueOnce(page(0, true, [1]) as never)
      .mockResolvedValueOnce(page(1, false, [2]) as never)
    const { result } = renderHook(() => usePropertyFeed({}), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getFeed).toHaveBeenNthCalledWith(1, 0)
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      await result.current.fetchNextPage()
    })

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    expect(getFeed).toHaveBeenNthCalledWith(2, 1)
    expect(result.current.data?.pages.map(({ page }) => page)).toEqual([0, 1])
    expect(result.current.hasNextPage).toBe(false)
  })

  it('keeps loaded pages and can retry a failed next page', async () => {
    const getFeed = vi
      .spyOn(propertiesApi, 'getFeed')
      .mockResolvedValueOnce(page(0, true, [1]) as never)
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(page(1, false, [2]) as never)
    const { result } = renderHook(() => usePropertyFeed({}), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await act(async () => {
      await result.current.fetchNextPage()
    })

    await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true))
    expect(result.current.data?.pages.map(({ page }) => page)).toEqual([0])

    await act(async () => {
      await result.current.fetchNextPage()
    })

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    expect(getFeed).toHaveBeenNthCalledWith(3, 1)
    expect(result.current.data?.pages.map(({ page }) => page)).toEqual([0, 1])
  })
})

it('switches between feed and search and resets pagination when filters change', async () => {
  const getFeed = vi.spyOn(propertiesApi, 'getFeed').mockResolvedValue(page(0, false, []) as never)
  const search = vi.spyOn(propertiesApi, 'searchProperties').mockResolvedValue(page(0, false, []) as never)
  const { result, rerender } = renderHook(
    ({ filters }) => usePropertyFeed(filters),
    { wrapper: createWrapper(), initialProps: { filters: {} as import('./filters/model').PropertyFilters } },
  )
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  rerender({ filters: { currency: 'USD' } })
  await waitFor(() => expect(getFeed).toHaveBeenCalledTimes(2))
  expect(search).not.toHaveBeenCalled()
  rerender({ filters: { text: 'شقة', currency: 'USD' } })
  await waitFor(() => expect(search).toHaveBeenCalledWith({ text: 'شقة', currency: 'USD' }, 0))
})
