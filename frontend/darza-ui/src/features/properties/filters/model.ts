import type { Currency, ListingType, PropertyType } from '../../../types/api'

export const propertyTypeOptions = [
  { value: 'APARTMENT', label: 'شقة' },
  { value: 'HOUSE', label: 'منزل' },
  { value: 'VILLA', label: 'فيلا' },
  { value: 'LAND', label: 'أرض' },
  { value: 'COMMERCIAL', label: 'تجاري' },
  { value: 'OTHER', label: 'أخرى' },
] as const satisfies readonly { value: PropertyType; label: string }[]

export const listingTypeOptions = [
  { value: 'SELL', label: 'للبيع' },
  { value: 'RENT', label: 'للإيجار' },
] as const satisfies readonly { value: ListingType; label: string }[]

export const currencyOptions = [
  { value: 'ILS', label: 'شيكل' },
  { value: 'JOD', label: 'دينار أردني' },
  { value: 'USD', label: 'دولار أمريكي' },
] as const satisfies readonly { value: Currency; label: string }[]

export const sortOptions = [
  { value: 'NEWEST', label: 'الأحدث' },
  { value: 'OLDEST', label: 'الأقدم' },
  { value: 'PRICE_ASC', label: 'السعر: من الأقل إلى الأعلى' },
  { value: 'PRICE_DESC', label: 'السعر: من الأعلى إلى الأقل' },
] as const

export type PropertyFilters = {
  text?: string
  propertyType?: PropertyType
  listingType?: ListingType
  minPrice?: number
  maxPrice?: number
  currency?: Currency
  cityId?: number
  townId?: number
  sortType?: (typeof sortOptions)[number]['value']
}

const filterKeys = [
  'text', 'propertyType', 'listingType', 'minPrice', 'maxPrice',
  'currency', 'cityId', 'townId', 'sortType',
] as const

function optionValue<T extends string>(value: string | null, options: readonly { value: T }[]): T | undefined {
  return options.find((option) => option.value === value)?.value
}

function validPrice(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value < 10_000_000_000 && /^\d+(\.\d{1,2})?$/.test(String(value))
}

function parsePrice(value: string | null): number | undefined {
  if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return undefined
  const price = Number(value)
  return validPrice(price) ? price : undefined
}

function parseId(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}

export function parseFilters(params: URLSearchParams): PropertyFilters {
  const filters: PropertyFilters = {}
  const text = params.get('text')?.trim()
  if (text && text.length <= 100) filters.text = text
  const propertyType = optionValue(params.get('propertyType'), propertyTypeOptions)
  const listingType = optionValue(params.get('listingType'), listingTypeOptions)
  const currency = optionValue(params.get('currency'), currencyOptions)
  const sortType = optionValue(params.get('sortType'), sortOptions)
  if (propertyType) filters.propertyType = propertyType
  if (listingType) filters.listingType = listingType
  if (currency) filters.currency = currency
  if (sortType && sortType !== 'NEWEST') filters.sortType = sortType
  const cityId = parseId(params.get('cityId'))
  const townId = parseId(params.get('townId'))
  if (cityId !== undefined) {
    filters.cityId = cityId
    if (townId !== undefined) filters.townId = townId
  }
  if (currency) {
    const minPrice = parsePrice(params.get('minPrice'))
    const maxPrice = parsePrice(params.get('maxPrice'))
    if (minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice) {
      if (minPrice !== undefined) filters.minPrice = minPrice
      if (maxPrice !== undefined) filters.maxPrice = maxPrice
    }
  }
  return filters
}

export function serializeFilters(filters: PropertyFilters): URLSearchParams {
  const raw = new URLSearchParams()
  for (const key of filterKeys) {
    const value = filters[key]
    if (value !== undefined) raw.set(key, String(value))
  }
  const valid = parseFilters(raw)
  const params = new URLSearchParams()
  for (const key of filterKeys) {
    const value = valid[key]
    if (value !== undefined) params.set(key, String(value))
  }
  return params
}

export function hasActiveFilters(filters: PropertyFilters): boolean {
  return [...serializeFilters(filters).keys()].some((key) => key !== 'currency')
}

export function validatePrices(filters: PropertyFilters): string | undefined {
  const { minPrice, maxPrice, currency } = filters
  if (minPrice === undefined && maxPrice === undefined) return undefined
  if (!currencyOptions.some((option) => option.value === currency)) return 'يرجى اختيار العملة عند تحديد السعر'
  if ([minPrice, maxPrice].some((price) => price !== undefined && !validPrice(price))) {
    return 'يجب أن يكون السعر غير سالب وبحد أقصى منزلتين عشريتين و١٠ أرقام صحيحة'
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return 'يجب أن يكون الحد الأدنى للسعر أقل من أو يساوي الحد الأعلى'
  }
  return undefined
}

export function removeFilter(filters: PropertyFilters, key: keyof PropertyFilters | 'price'): PropertyFilters {
  const next = { ...filters }
  if (key === 'price' || key === 'currency') {
    delete next.minPrice
    delete next.maxPrice
    delete next.currency
  } else {
    delete next[key]
    if (key === 'cityId') delete next.townId
  }
  return parseFilters(serializeFilters(next))
}
