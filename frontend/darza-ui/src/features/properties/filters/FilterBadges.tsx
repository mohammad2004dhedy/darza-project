import { X } from 'lucide-react'
import { useCities, useTowns } from '../../location/hooks'
import { currencyOptions, listingTypeOptions, propertyTypeOptions, sortOptions, removeFilter, type PropertyFilters } from './model'

export function FilterBadges({ filters, onChange }: { filters: PropertyFilters; onChange: (filters: PropertyFilters) => void }) {
  const cities = useCities()
  const towns = useTowns(filters.cityId)
  const badges: { key: keyof PropertyFilters | 'price'; label: string }[] = []
  const add = (key: keyof PropertyFilters, options: readonly { value: string; label: string }[]) => {
    const option = options.find((item) => item.value === filters[key])
    if (option) badges.push({ key, label: option.label })
  }
  add('propertyType', propertyTypeOptions)
  add('listingType', listingTypeOptions)
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const currency = currencyOptions.find((option) => option.value === filters.currency)?.label ?? ''
    badges.push({ key: 'price', label: filters.minPrice !== undefined && filters.maxPrice !== undefined
      ? `من ${filters.minPrice} إلى ${filters.maxPrice} ${currency}`
      : filters.minPrice !== undefined ? `من ${filters.minPrice} ${currency}` : `إلى ${filters.maxPrice} ${currency}` })
  } else add('currency', currencyOptions)
  if (filters.cityId) badges.push({ key: 'cityId', label: cities.data?.find((city) => city.id === filters.cityId)?.name ?? 'المدينة…' })
  if (filters.townId) badges.push({ key: 'townId', label: towns.data?.find((town) => town.id === filters.townId)?.name ?? 'البلدة…' })
  if (filters.sortType && filters.sortType !== 'NEWEST') add('sortType', sortOptions)
  if (filters.text) badges.push({ key: 'text', label: filters.text })
  return (
    <div aria-label="الفلاتر المطبقة" className="flex w-full flex-wrap gap-2">
      {badges.map(({ key, label }) => (
        <button key={key} type="button" aria-label={`إزالة ${label}`} onClick={() => onChange(removeFilter(filters, key))}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface ps-3 pe-3 py-1 text-sm text-text">
          <span className="break-words">{label}</span><X size={14} className="shrink-0" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
