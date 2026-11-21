import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useCallback } from 'react'
import { Spinner } from '../../../components/ui/Spinner'
import { Button } from '../../../components/ui/Button'
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll'
import type { PropertyCardResponse, SliceResponse } from '../../../types/api'
import { FeedEmptyState } from './FeedEmptyState'
import { FeedErrorState } from './FeedErrorState'
import { PropertyCard } from './PropertyCard'
import { PropertyCardSkeleton } from './PropertyCardSkeleton'

export type PropertyListQuery = UseInfiniteQueryResult<
  InfiniteData<SliceResponse<PropertyCardResponse>>,
  Error
>

interface PropertyListProps {
  query: PropertyListQuery
  showStatus?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

const grid = 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'

export function PropertyList({
  query,
  showStatus = false,
  emptyTitle,
  emptyDescription,
}: PropertyListProps) {
  const { fetchNextPage } = query
  const loadNext = useCallback(() => void fetchNextPage({ cancelRefetch: false }), [fetchNextPage])
  const { sentinelRef } = useInfiniteScroll(
    query.hasNextPage && !query.isFetching && !query.isError,
    loadNext,
  )
  const properties = query.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <>
      {query.isPending ? (
        <div role="status" className={grid}>
          <span className="sr-only">جارٍ تحميل العقارات</span>
          {Array.from({ length: 6 }, (_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length > 0 ? (
        <ul className={grid}>
          {properties.map((property, i) => (
            <li key={property.id}>
              <PropertyCard property={property} eager={i === 0} showStatus={showStatus} />
            </li>
          ))}
        </ul>
      ) : !query.isError && !query.hasNextPage ? (
        <FeedEmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}
      {query.isError && (
        <FeedErrorState
          error={query.error}
          onRetry={query.isFetchNextPageError ? loadNext : () => void query.refetch()}
        />
      )}
      {query.hasNextPage && !query.isError && (
        <div ref={sentinelRef} className="flex min-h-11 justify-center">
          {query.isFetchingNextPage ? (
            <Spinner label="جارٍ تحميل المزيد من العقارات" />
          ) : (
            <Button variant="outline" disabled={query.isFetching} onClick={loadNext}>
              تحميل المزيد
            </Button>
          )}
        </div>
      )}
    </>
  )
}
