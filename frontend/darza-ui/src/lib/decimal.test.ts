import { expect, it } from 'vitest'
import { sanitizeDecimal } from './decimal'

it.each([
  ['Arabic digits', '٠٠٧٫٥', 10, 2, '7.5'],
  ['Persian digits', '۱۲۳,۴۵', 10, 2, '123.45'],
  ['comma', '12,34', 10, 2, '12.34'],
  ['multiple separators', '1.2.3,4', 10, 2, '1.23'],
  ['third decimal truncated on paste', '1.234', 10, 2, '1.23'],
  ['integer overflow truncated on paste', '12345.67', 3, 2, '123.67'],
  ['mixed paste', 'السعر ٠٠١٢,٣٤ USD', 10, 2, '12.34'],
  ['integers only', '12.34', 4, 0, '12'],
  ['leading zeros', '007', 10, 2, '7'],
  ['fractional zero', '0.5', 10, 2, '0.5'],
  ['empty', '', 10, 2, ''],
  ['garbage', 'abc', 10, 2, ''],
  ['separator first', '.5', 10, 2, '0.5'],
] as const)('%s', (_label, text, maxIntegerDigits, maxDecimals, expected) => {
  expect(sanitizeDecimal(text, { maxIntegerDigits, maxDecimals })).toBe(expected)
})
