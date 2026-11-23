import { lazy, Suspense, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { FilterBadges } from './FilterBadges'
import { SearchBar } from './SearchBar'
import { serializeFilters, type PropertyFilters } from './model'

const FilterModal = lazy(() => import('./FilterModal'))

export function FeedFilters({ filters, onChange }: {
  filters: PropertyFilters
  onChange: (filters: PropertyFilters, replace?: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const key = serializeFilters(filters).toString()
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar key={key} text={filters.text} onChange={(text) => onChange({ ...filters, text }, true)} />
        <Button variant="outline" onClick={() => setOpen(true)}>الفلاتر</Button>
        {key && <FilterBadges filters={filters} onChange={onChange} />}
      </div>
      {open && <Suspense fallback={<p role="status">جارٍ تحميل الفلاتر</p>}>
        <FilterModal filters={filters} onClose={() => setOpen(false)} onApply={(next) => { onChange(next); setOpen(false) }} />
      </Suspense>}
    </div>
  )
}
