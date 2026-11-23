import { useState } from 'react'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { useCities, useTowns } from '../../location/hooks'
import { ChipGroup } from './ChipGroup'
import { currencyOptions, listingTypeOptions, propertyTypeOptions, sortOptions, validatePrices, type PropertyFilters } from './model'

export default function FilterModal({ filters, onApply, onClose, onClear }: {
  filters: PropertyFilters
  onApply: (filters: PropertyFilters) => void
  onClose: () => void
  onClear: () => void
}) {
  const [draft, setDraft] = useState(filters)
  const [prices, setPrices] = useState({ minPrice: String(filters.minPrice ?? ''), maxPrice: String(filters.maxPrice ?? '') })
  const cities = useCities()
  const towns = useTowns(draft.cityId)
  const update = <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))
  const next = { ...draft, minPrice: prices.minPrice === '' ? undefined : Number(prices.minPrice), maxPrice: prices.maxPrice === '' ? undefined : Number(prices.maxPrice) }
  const invalidFormat = Object.values(prices).some((value) => value !== '' && !/^\d+(\.\d{1,2})?$/.test(value))
  const error = invalidFormat ? 'أدخل سعرًا صحيحًا حتى منزلتين عشريتين' : validatePrices(next)
  return (
    <ConfirmModal open title="الفلاتر" message="اختر ما يناسب بحثك" confirmText="تطبيق" cancelText="إلغاء"
      className="max-h-[90dvh] overflow-y-auto" onCancel={onClose}
      confirmDisabled={!!error} onConfirm={() => onApply(next)}>
      <div className="space-y-5">
        <ChipGroup label="نوع العقار" options={propertyTypeOptions} value={draft.propertyType} onChange={(value) => update('propertyType', value)} />
        <ChipGroup label="نوع العرض" options={listingTypeOptions} value={draft.listingType} onChange={(value) => update('listingType', value)} />
        <div className="grid grid-cols-2 gap-3">
          {(['minPrice', 'maxPrice'] as const).map((key) => (
            <label key={key} className="space-y-2">
              <span>{key === 'minPrice' ? 'أقل سعر' : 'أعلى سعر'}</span>
              <Input inputMode="decimal" value={prices[key]} onChange={(event) => setPrices((current) => ({ ...current, [key]: event.target.value }))} />
            </label>
          ))}
        </div>
        <ChipGroup label="العملة" options={currencyOptions} value={draft.currency} onChange={(value) => update('currency', value)} />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <label className="block space-y-2">
          <span>المدينة</span>
          <Select value={draft.cityId ?? ''} placeholder={cities.isPending ? 'جارٍ تحميل المدن' : 'كل المدن'}
            options={(cities.data ?? []).map((city) => ({ value: String(city.id), label: city.name }))}
            onChange={(event) => setDraft((current) => ({ ...current, cityId: event.target.value ? Number(event.target.value) : undefined, townId: undefined }))} />
        </label>
        <label className="block space-y-2">
          <span>البلدة</span>
          <Select value={draft.townId ?? ''} disabled={!draft.cityId} placeholder={draft.cityId && towns.isPending ? 'جارٍ تحميل البلدات' : 'كل البلدات'}
            options={(towns.data ?? []).map((town) => ({ value: String(town.id), label: town.name }))}
            onChange={(event) => update('townId', event.target.value ? Number(event.target.value) : undefined)} />
        </label>
        <ChipGroup label="الترتيب" options={sortOptions} value={draft.sortType ?? 'NEWEST'} onChange={(value) => update('sortType', value)} />
        <Button variant="ghost" onClick={onClear}>مسح الكل</Button>
      </div>
    </ConfirmModal>
  )
}
