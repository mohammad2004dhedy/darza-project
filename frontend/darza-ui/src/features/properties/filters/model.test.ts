import { describe, expect, it } from 'vitest'
import {
  hasActiveFilters,
  parseFilters,
  removeFilter,
  serializeFilters,
  validatePrices,
  type PropertyFilters,
} from './model'

describe('filter URL model', () => {
  it('round-trips all supported filters using API parameter names', () => {
    const filters: PropertyFilters = {
      text: 'شقة جميلة', propertyType: 'APARTMENT', listingType: 'SELL',
      minPrice: 0, maxPrice: 1500.25, currency: 'ILS', cityId: 1, townId: 2,
      sortType: 'PRICE_ASC',
    }
    const params = serializeFilters(filters)
    expect(Object.fromEntries(params)).toEqual({
      text: 'شقة جميلة', propertyType: 'APARTMENT', listingType: 'SELL',
      minPrice: '0', maxPrice: '1500.25', currency: 'ILS', cityId: '1', townId: '2',
      sortType: 'PRICE_ASC',
    })
    expect(parseFilters(params)).toEqual(filters)
  })

  it('drops unknown and invalid values without throwing', () => {
    expect(parseFilters(new URLSearchParams({
      unknown: 'value', page: '3', text: 'x'.repeat(101), propertyType: 'CASTLE',
      listingType: 'sale', currency: 'EUR', sortType: 'RANDOM',
      cityId: '9007199254740992', townId: '2', minPrice: '-1', maxPrice: 'NaN',
    }))).toEqual({})
  })

  it.each(['', 'text=&propertyType=&cityId=&minPrice=', 'text=+++&sortType=NEWEST'])('normalizes empty filters: %s', (query) => {
    expect(parseFilters(new URLSearchParams(query))).toEqual({})
    expect(serializeFilters(parseFilters(new URLSearchParams(query))).toString()).toBe('')
  })

  it('sanitizes values on serialization and trims text', () => {
    expect(serializeFilters({ text: '  القدس  ', sortType: 'NEWEST', townId: 2, minPrice: 5 }).toString())
      .toBe(new URLSearchParams({ text: 'القدس' }).toString())
  })

  it.each(['0', '-1', '1.5', 'Infinity', '1e2', '9007199254740992'])('rejects invalid IDs: %s', (cityId) => {
    expect(parseFilters(new URLSearchParams({ cityId, townId: '2' }))).toEqual({})
  })

  it('accepts safe positive IDs and discards a town without its city', () => {
    expect(parseFilters(new URLSearchParams({ cityId: '9007199254740991', townId: '2' })))
      .toEqual({ cityId: Number.MAX_SAFE_INTEGER, townId: 2 })
    expect(parseFilters(new URLSearchParams({ townId: '2' }))).toEqual({})
  })

  it.each(['-1', '1.234', 'NaN', 'Infinity', '1e2', '10000000000'])('drops invalid prices: %s', (minPrice) => {
    expect(parseFilters(new URLSearchParams({ minPrice, maxPrice: '10', currency: 'USD' })))
      .toEqual({ maxPrice: 10, currency: 'USD' })
  })

  it('accepts the backend price ceiling and rejects values above it', () => {
    expect(parseFilters(new URLSearchParams('minPrice=9999999999.99&maxPrice=9999999999.99&currency=ILS')))
      .toEqual({ minPrice: 9999999999.99, maxPrice: 9999999999.99, currency: 'ILS' })
    expect(parseFilters(new URLSearchParams('minPrice=10000000000&maxPrice=10000000000.01&currency=ILS')))
      .toEqual({ currency: 'ILS' })
  })

  it('drops prices without currency and both bounds in a reversed range', () => {
    expect(parseFilters(new URLSearchParams('minPrice=10&maxPrice=20'))).toEqual({})
    expect(parseFilters(new URLSearchParams('minPrice=20&maxPrice=10&currency=JOD'))).toEqual({ currency: 'JOD' })
  })
})

describe('feed/search decision', () => {
  it.each([{}, { text: '' }, { text: '  ' }, { currency: 'ILS' }, { sortType: 'NEWEST' }, { currency: 'USD', sortType: 'NEWEST' }] satisfies PropertyFilters[])('uses the plain feed for %j', (filters) => {
      expect(hasActiveFilters(filters)).toBe(false)
    })

  it.each([
    { text: 'شقة' }, { propertyType: 'HOUSE' }, { listingType: 'RENT' },
    { minPrice: 0, currency: 'ILS' }, { maxPrice: 100, currency: 'USD' },
    { cityId: 1 }, { sortType: 'OLDEST' }, { sortType: 'PRICE_ASC' }, { sortType: 'PRICE_DESC' },
  ] satisfies PropertyFilters[])('uses search for %j', (filters) => {
    expect(hasActiveFilters(filters)).toBe(true)
  })
})

describe('price validation', () => {
  it.each([{ minPrice: 0 }, { maxPrice: 1 }, { minPrice: 1, maxPrice: 2 }])('requires currency for %j', (filters) => {
    expect(validatePrices(filters)).toBe('يرجى اختيار العملة عند تحديد السعر')
  })

  it.each([-1, 1.234, Infinity, NaN, 10_000_000_000])('rejects invalid bound %s', (price) => {
    expect(validatePrices({ minPrice: price, currency: 'ILS' })).toBeDefined()
    expect(validatePrices({ maxPrice: price, currency: 'ILS' })).toBeDefined()
  })

  it('enforces the backend price ceiling on draft bounds', () => {
    expect(validatePrices({ minPrice: 9999999999.99, maxPrice: 9999999999.99, currency: 'ILS' }))
      .toBeUndefined()
    expect(validatePrices({ minPrice: 10000000000, currency: 'ILS' })).toBeDefined()
    expect(validatePrices({ maxPrice: 10000000000.01, currency: 'ILS' })).toBeDefined()
  })

  it('rejects reversed bounds and allows equal, zero, decimal, and single bounds', () => {
    expect(validatePrices({ minPrice: 2, maxPrice: 1, currency: 'USD' })).toBeDefined()
    for (const filters of [{}, { currency: 'ILS' }, { minPrice: 0, maxPrice: 0, currency: 'ILS' }, { maxPrice: 10.25, currency: 'JOD' }] satisfies PropertyFilters[]) {
      expect(validatePrices(filters)).toBeUndefined()
    }
  })
})

describe('badge removal', () => {
  const filters: PropertyFilters = {
    text: 'بيت', propertyType: 'HOUSE', listingType: 'RENT', minPrice: 10,
    maxPrice: 20, currency: 'USD', cityId: 1, townId: 2, sortType: 'OLDEST',
  }

  it('removes only an independent filter without mutating the input', () => {
    const result = removeFilter(filters, 'text')
    expect(result).toEqual(Object.fromEntries(Object.entries(filters).filter(([key]) => key !== 'text')))
    expect(filters.text).toBe('بيت')
  })

  it('removes the town with its city but preserves the city when removing a town', () => {
    const remaining = { ...filters }
    delete remaining.cityId
    delete remaining.townId
    expect(removeFilter(filters, 'cityId')).toEqual(remaining)
    expect(removeFilter(filters, 'townId')).toEqual({ ...remaining, cityId: 1 })
  })

  it.each(['price', 'currency'] as const)('removes both price bounds and currency for %s', (key) => {
    const remaining = { ...filters }
    delete remaining.minPrice
    delete remaining.maxPrice
    delete remaining.currency
    expect(removeFilter(filters, key)).toEqual(remaining)
  })

  it('preserves the other bound and currency when removing one bound', () => {
    const remaining = { ...filters }
    delete remaining.minPrice
    expect(removeFilter(filters, 'minPrice')).toEqual(remaining)
  })
})
