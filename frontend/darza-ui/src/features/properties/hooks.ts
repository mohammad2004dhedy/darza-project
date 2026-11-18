import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from './api'

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['properties', 'feed'],
    queryFn: ({ pageParam }) => getFeed(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 60_000,
  })
}
