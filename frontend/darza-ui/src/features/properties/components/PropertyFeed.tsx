import { useCallback } from 'react'
import { Spinner } from '../../../components/ui/Spinner'
import { Button } from '../../../components/ui/Button'
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll'
import { useFeed } from '../hooks'
import { FeedEmptyState } from './FeedEmptyState'
import { FeedErrorState } from './FeedErrorState'
import { PropertyCard } from './PropertyCard'
import { PropertyCardSkeleton } from './PropertyCardSkeleton'

const grid = 'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'

export function PropertyFeed() {
  const feed = useFeed()
  const { fetchNextPage } = feed
  const loadNext = useCallback(() => void fetchNextPage({ cancelRefetch: false }), [fetchNextPage])
  const { sentinelRef } = useInfiniteScroll(
    feed.hasNextPage && !feed.isFetching && !feed.isError,
    loadNext,
  )
  const properties = feed.data?.pages.flatMap((page) => page.content) ?? []

  return (
    <section aria-labelledby="feed-title" className="space-y-6">
      <header className="space-y-1">
        <h1 id="feed-title" className="text-2xl font-bold text-primary">
          أحدث العقارات
        </h1>
        <p className="text-text-muted">تصفّح العقارات المعروضة للبيع والإيجار.</p>
      </header>
      {feed.isPending ? (
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
              <PropertyCard property={property} eager={i === 0} />
            </li>
          ))}
        </ul>
      ) : !feed.isError && !feed.hasNextPage ? (
        <FeedEmptyState />
      ) : null}
      {feed.isError && (
        <FeedErrorState
          error={feed.error}
          onRetry={feed.isFetchNextPageError ? loadNext : () => void feed.refetch()}
        />
      )}
      {feed.hasNextPage && !feed.isError && (
        <div ref={sentinelRef} className="flex min-h-11 justify-center">
          {feed.isFetchingNextPage ? (
            <Spinner label="جارٍ تحميل المزيد من العقارات" />
          ) : (
            <Button variant="outline" disabled={feed.isFetching} onClick={loadNext}>
              تحميل المزيد
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
