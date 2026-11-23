import { ApiError } from '../../api/client'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getFeed, getPropertyDetails, searchProperties } from './api'
import { hasActiveFilters, type PropertyFilters } from './filters/model'

export function usePropertyFeed(filters: PropertyFilters) {
  return useInfiniteQuery({
    queryKey: ['properties', filters],
    queryFn: ({ pageParam }) =>
      hasActiveFilters(filters) ? searchProperties(filters, pageParam) : getFeed(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    staleTime: 60_000,
  })
}

export function usePropertyDetails(id: string | undefined) {
  const validId = !!id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
  const query = useQuery({
    queryKey: ['properties', 'details', id],
    queryFn: () => getPropertyDetails(Number(id)),
    enabled: validId,
    staleTime: 60_000,
    retry: (count, error) =>
      !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
  })
  return {
    ...query,
    notFound:
      !validId || (query.error instanceof ApiError && [400, 403, 404].includes(query.error.status)),
  }
}
