import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useCallback, type ReactNode } from 'react'
import { Spinner } from '../../../components/ui/Spinner'
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
  renderActions?: (property: PropertyCardResponse) => ReactNode
  emptyAction?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
}

const grid = 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'

export function PropertyList({
  query,
  emptyTitle,
  emptyDescription,
  renderActions,
  emptyAction,
}: PropertyListProps) {
  const { fetchNextPage } = query
  const loadNext = useCallback(() => void fetchNextPage({ cancelRefetch: false }), [fetchNextPage])
  const { sentinelRef } = useInfiniteScroll(
    query.hasNextPage && !query.isFetching && !query.isError,
    loadNext,
  )
  const seen = new Set<number>()
  const properties = (query.data?.pages.flatMap((page) => page.content) ?? []).filter(
    (property) => {
      if (seen.has(property.id)) return false
      seen.add(property.id)
      return true
    },
  )

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
              <PropertyCard
                property={property}
                eager={i === 0}
                actions={renderActions?.(property)}
              />
            </li>
          ))}
        </ul>
      ) : !query.isError && !query.hasNextPage ? (
        <div className="space-y-4 text-center">
          <FeedEmptyState title={emptyTitle} description={emptyDescription} />
          {emptyAction}
        </div>
      ) : null}
      {query.isError && (
        <FeedErrorState
          error={query.error}
          onRetry={query.isFetchNextPageError ? loadNext : () => void query.refetch()}
        />
      )}
      <div
        ref={sentinelRef}
        data-testid="pagination-sentinel"
        className="flex min-h-11 justify-center"
      >
        {query.isFetchingNextPage && <Spinner label="جارٍ تحميل المزيد من العقارات" />}
      </div>
      {query.hasNextPage === false && properties.length > 0 && (
        <p className="text-center text-text-muted">تم مشاهدة جميع العقارات المتاحة</p>
      )}
    </>
  )
}
