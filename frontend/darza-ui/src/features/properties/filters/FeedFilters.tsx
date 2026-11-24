import { X } from 'lucide-react'
import { lazy, Suspense, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { FilterBadges } from './FilterBadges'
import { SearchBar, type SearchBarHandle } from './SearchBar'
import { serializeFilters, type PropertyFilters } from './model'

const FilterModal = lazy(() => import('./FilterModal'))

export function FeedFilters({ filters, onChange }: {
  filters: PropertyFilters
  onChange: (filters: PropertyFilters, replace?: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const search = useRef<SearchBarHandle>(null)
  const key = serializeFilters(filters).toString()
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar ref={search} text={filters.text} onChange={(text) => onChange({ ...filters, text }, true)} />
        <Button variant="outline" onClick={() => { search.current?.flush(); setOpen(true) }}>الفلاتر</Button>
        {key && <button type="button" className="inline-flex items-center gap-2 text-sm text-primary" onClick={() => { search.current?.clear(); onChange({}) }}>
          مسح الكل<X size={14} aria-hidden="true" />
        </button>}
      </div>
      {key && <FilterBadges filters={filters} onChange={(next) => { search.current?.flush(); onChange(next) }} />}
      {open && <Suspense fallback={<p role="status">جارٍ تحميل الفلاتر</p>}>
        <FilterModal onClear={() => { search.current?.clear(); onChange({}); setOpen(false) }} filters={filters} onClose={() => setOpen(false)} onApply={(next) => { onChange({ ...next, text: search.current?.flush() ?? filters.text }); setOpen(false) }} />
      </Suspense>}
    </div>
  )
}
