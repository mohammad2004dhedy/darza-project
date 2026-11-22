import { describe, expect, it } from 'vitest'
import { accountSchema } from './schema'
const values = {
  displayName: ' اسم ',
  countryCode: '970',
  phoneNumber: '591234567',
  cityId: '1',
  townId: '2',
  address: '',
}
describe('account schema', () => {
  it('trims the name and permits empty optional address', () => {
    expect(accountSchema.parse(values).displayName).toBe('اسم')
  })
  it.each([
    { displayName: ' ' },
    { phoneNumber: '123' },
    { countryCode: '970', phoneNumber: '521234567' },
    { townId: '0' },
    { cityId: 'NaN' },
    { address: 'a'.repeat(256) },
  ])('rejects invalid fields %j', (invalid) => {
    expect(accountSchema.safeParse({ ...values, ...invalid }).success).toBe(false)
  })
})
