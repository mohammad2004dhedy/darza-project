import type { Currency, ListingType, PropertyType, RentPeriod } from '../../types/api'

const propertyTypeLabels: Record<PropertyType, string> = {
  APARTMENT: 'شقة',
  HOUSE: 'منزل',
  VILLA: 'فيلا',
  LAND: 'أرض',
  COMMERCIAL: 'تجاري',
  OTHER: 'أخرى',
}

const listingTypeLabels: Record<ListingType, string> = {
  SELL: 'للبيع',
  RENT: 'للإيجار',
}

const rentPeriodLabels: Record<RentPeriod, string> = {
  HOURLY: 'بالساعة',
  DAILY: 'باليوم',
  MONTHLY: 'بالشهر',
  YEARLY: 'بالسنة',
}

const currencySymbols: Record<Currency, string> = {
  ILS: '₪',
  JOD: 'د.أ',
  USD: '$',
}

const latinNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 3,
})

export function formatPrice(price: number, currency: Currency): string {
  const amount = latinNumberFormatter.format(price)
  const symbol = currencySymbols[currency]
  return currency === 'USD' ? `${symbol}${amount}` : `${amount} ${symbol}`
}

export function getPropertyTypeLabel(propertyType: PropertyType): string {
  return propertyTypeLabels[propertyType]
}

export function getListingTypeLabel(listingType: ListingType): string {
  return listingTypeLabels[listingType]
}

export function getRentPeriodLabel(rentPeriod: RentPeriod): string {
  return rentPeriodLabels[rentPeriod]
}
