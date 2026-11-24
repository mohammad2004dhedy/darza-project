import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from './schemas'

function firstError(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues[0]?.path[0]
}

describe('loginSchema', () => {
  it('accepts a valid email and trims it', () => {
    const result = loginSchema.parse({ email: ' user@example.com ', password: 'x' })
    expect(result.email).toBe('user@example.com')
  })

  it.each([
    [{ email: '', password: 'x' }, 'email'],
    [{ email: 'not-an-email', password: 'x' }, 'email'],
    [{ email: 'user@example.com', password: '' }, 'password'],
  ])('rejects %j', (values, field) => {
    expect(firstError(loginSchema.safeParse(values))).toBe(field)
  })
})

describe('registerSchema', () => {
  const valid = {
    displayName: 'محمد',
    email: 'user@example.com',
    password: 'password123',
    countryCode: '970' as const,
    phoneNumber: '590000000',
    cityId: '1',
    townId: '2',
    address: '',
  }

  it('accepts valid values with an empty address', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts 972 with a Palestinian prefix', () => {
    expect(registerSchema.safeParse({ ...valid, countryCode: '972' }).success).toBe(true)
  })

  it.each([
    [{ displayName: ' ' }, 'displayName'],
    [{ displayName: 'a'.repeat(101) }, 'displayName'],
    [{ email: `${'a'.repeat(250)}@x.com` }, 'email'],
    [{ password: 'short' }, 'password'],
    [{ password: 'a'.repeat(65) }, 'password'],
    [{ phoneNumber: '' }, 'phoneNumber'],
    [{ phoneNumber: '59000000' }, 'phoneNumber'],
    [{ phoneNumber: '510000000' }, 'phoneNumber'],
    [{ phoneNumber: '+97' }, 'phoneNumber'],
    [{ countryCode: '971' }, 'countryCode'],
    [{ cityId: '' }, 'cityId'],
    [{ townId: '' }, 'townId'],
    [{ address: 'a'.repeat(256) }, 'address'],
  ])('rejects %j', (override, field) => {
    expect(firstError(registerSchema.safeParse({ ...valid, ...override }))).toBe(field)
  })

  it('reports 970 with an Israeli number on the country code', () => {
    const result = registerSchema.safeParse({ ...valid, phoneNumber: '540000000' })
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ['countryCode'],
        message: 'هاد الرقم لازم يكون مع الكود 972',
      }),
    ])
  })
})
