import { useInfiniteQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { PropertyList } from '../properties/components/PropertyList'
import { getAdminProperties } from './api'
import { ModerationBar } from './ModerationBar'

export function AdminModeration() {
  const [params] = useSearchParams()
  const tab = params.get('tab') === 'rejected' ? 'rejected' : 'pending'
  const status = tab === 'rejected' ? 'REJECTED' : 'PENDING'
  const query = useInfiniteQuery({
    queryKey: ['admin', 'properties', status],
    queryFn: ({ pageParam }) => getAdminProperties(status, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  })

  return (
    <section aria-labelledby="admin-title" className="space-y-6">
      <h1 id="admin-title" className="text-2xl font-bold text-primary">
        لوحة الإدارة
      </h1>
      <div
        role="tablist"
        aria-label="حالة الإعلانات"
        className="sticky top-20 z-20 flex gap-3 border-b border-border bg-surface py-3"
      >
        {(
          [
            ['pending', 'قيد المراجعة'],
            ['rejected', 'المرفوضة'],
          ] as const
        ).map(([value, label]) => {
          const next = new URLSearchParams(params)
          next.set('tab', value)
          return (
            <Link
              key={value}
              role="tab"
              id={`tab-${value}`}
              aria-controls="admin-properties"
              aria-selected={tab === value}
              to={`?${next}`}
              className={`rounded-md px-4 py-2 font-bold focus-visible:outline-primary ${tab === value ? 'bg-primary text-on-primary' : 'text-text'}`}
            >
              {label}
            </Link>
          )
        })}
      </div>
      <div id="admin-properties" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <PropertyList
          query={query}
          emptyTitle={tab === 'pending' ? 'لا توجد إعلانات قيد المراجعة' : 'لا توجد إعلانات مرفوضة'}
          emptyDescription=""
          renderActions={(property) =>
            property.postingStatus === 'PENDING' ? <ModerationBar propertyId={property.id} /> : null
          }
        />
      </div>
    </section>
  )
}
