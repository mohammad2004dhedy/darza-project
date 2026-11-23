import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '../../../components/ui/Button'
import { FeedFilters } from '../filters/FeedFilters'
import { hasActiveFilters, parseFilters, serializeFilters, type PropertyFilters } from '../filters/model'
import { usePropertyFeed } from '../hooks'
import { PropertyList } from './PropertyList'

export function PropertyFeed() {
  const [params, setParams] = useSearchParams()
  const filters = parseFilters(params)
  const canonical = serializeFilters(filters).toString()
  const previous = useRef(canonical)
  const feed = usePropertyFeed(filters)
  const active = hasActiveFilters(filters)
  const change = (next: PropertyFilters, replace = false) => setParams(serializeFilters(next), { replace })
  useEffect(() => {
    if (params.toString() !== canonical) setParams(canonical, { replace: true })
    if (previous.current !== canonical) window.scrollTo({ top: 0, behavior: 'instant' })
    previous.current = canonical
  }, [canonical, params, setParams])
  return (
    <section aria-labelledby="feed-title" className="space-y-6">
      <header className="space-y-1">
        <h1 id="feed-title" className="text-2xl font-bold text-primary">
          أحدث العقارات
        </h1>
        <p className="text-text-muted">تصفّح العقارات المعروضة للبيع والإيجار.</p>
      </header>
      <p className="text-sm text-text-muted">جميع العقارات تمت مراجعتها قبل النشر</p>
      <FeedFilters filters={filters} onChange={change} />
      <PropertyList query={feed}
        emptyTitle={active ? 'لا توجد نتائج مطابقة' : undefined}
        emptyDescription={active ? 'جرّب تعديل الفلاتر أو مسحها.' : undefined}
        emptyAction={active ? <Button onClick={() => change({})}>مسح الكل</Button> : undefined}
      />
    </section>
  )
}
