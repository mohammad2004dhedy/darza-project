import { describe, expect, it } from 'vitest'
import {
  formatPrice,
  getListingTypeLabel,
  getPropertyTypeLabel,
  getRentPeriodLabel,
} from './format'

describe('formatPrice', () => {
  it.each([
    [1234, 'ILS', '1,234 ₪'],
    [1234, 'JOD', '1,234 د.أ'],
    [1234, 'USD', '$1,234'],
    [1234.5, 'USD', '$1,234.5'],
  ] as const)('formats %s in %s', (price, currency, expected) => {
    expect(formatPrice(price, currency)).toBe(expected)
  })
})

describe('property labels', () => {
  it.each([
    ['APARTMENT', 'شقة'],
    ['HOUSE', 'منزل'],
    ['VILLA', 'فيلا'],
    ['LAND', 'أرض'],
    ['COMMERCIAL', 'تجاري'],
    ['OTHER', 'أخرى'],
  ] as const)('labels property type %s', (value, expected) => {
    expect(getPropertyTypeLabel(value)).toBe(expected)
  })

  it('labels both listing types', () => {
    expect(getListingTypeLabel('SELL')).toBe('للبيع')
    expect(getListingTypeLabel('RENT')).toBe('للإيجار')
  })

  it.each([
    ['HOURLY', 'بالساعة'],
    ['DAILY', 'باليوم'],
    ['MONTHLY', 'بالشهر'],
    ['YEARLY', 'بالسنة'],
  ] as const)('labels rent period %s', (value, expected) => {
    expect(getRentPeriodLabel(value)).toBe(expected)
  })
})
