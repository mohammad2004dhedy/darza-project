import { describe, expect, it } from 'vitest'
import {
  applyPhoneInput,
  initialPhoneInput,
  phoneFieldsSchema,
  selectCountryCode,
  toTelUrl,
  toWhatsAppUrl,
  type PhoneInputState,
} from './phone'

function type(text: string, state: PhoneInputState = initialPhoneInput): PhoneInputState {
  let current = state
  for (let index = 1; index <= text.length; index++) {
    current = applyPhoneInput(current, text.slice(0, index))
  }
  return current
}

describe('applyPhoneInput', () => {
  it.each([
    ['0590000000', '', '590000000'],
    ['0560000000', '', '560000000'],
    ['0540000000', '972', '540000000'],
    ['0500000000', '972', '500000000'],
    ['٠٥٩٠٠٠٠٠٠٠', '', '590000000'],
  ])('types %s', (input, countryCode, phoneNumber) => {
    expect(type(input)).toMatchObject({ countryCode, phoneNumber })
  })

  it.each([
    ['+972590000000', '972', '590000000'],
    ['00970 59-000-0000', '970', '590000000'],
    ['970560000000', '970', '560000000'],
    ['+970500000000', '972', '500000000'],
    ['0590000000000', '', '590000000'],
  ])('pastes %s', (input, countryCode, phoneNumber) => {
    expect(applyPhoneInput(initialPhoneInput, input)).toMatchObject({ countryCode, phoneNumber })
  })

  it('removes a typed code and selects it', () => {
    expect(type('+972599')).toMatchObject({ countryCode: '972', phoneNumber: '599' })
    expect(type('972599')).toMatchObject({ countryCode: '972', phoneNumber: '599' })
  })

  it.each(['4', '51', '57'])('rejects %s', (input) => {
    expect(applyPhoneInput(initialPhoneInput, input)).toBe(initialPhoneInput)
  })

  it('ignores letters and symbols', () => {
    expect(applyPhoneInput(initialPhoneInput, '59a9-1')).toMatchObject({ phoneNumber: '5991' })
  })

  it('keeps a manually chosen code for Palestinian numbers', () => {
    const chosen = selectCountryCode(initialPhoneInput, '972')
    expect(type('0590000000', chosen)).toMatchObject({
      countryCode: '972',
      phoneNumber: '590000000',
    })
  })

  it('requires a choice after an automatic Israeli code, but keeps an explicit choice', () => {
    const israeli = type('054')
    expect(applyPhoneInput(israeli, '59').countryCode).toBe('')
    const palestinian = applyPhoneInput(selectCountryCode(israeli, '972'), '59')
    expect(palestinian.countryCode).toBe('972')
    expect(applyPhoneInput(initialPhoneInput, '59').countryCode).toBe('')
  })

  it('does not allow 970 for Israeli numbers', () => {
    const israeli = type('0540000000')
    expect(selectCountryCode(israeli, '970')).toBe(israeli)
  })
})

describe('phoneFieldsSchema', () => {
  it.each(['560000000', '590000000'])('requires a code for %s', (phoneNumber) => {
    const result = phoneFieldsSchema.safeParse({ countryCode: '', phoneNumber })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]).toMatchObject({
      path: ['countryCode'],
      message: 'اختار كود الدولة +970 أو +972',
    })
  })

  it.each([
    ['970', '590000000', true],
    ['972', '590000000', true],
    ['972', '540000000', true],
    ['970', '540000000', false],
    ['970', '510000000', false],
    ['970', '59000000', false],
    ['971', '590000000', false],
  ])('validates %s %s', (countryCode, phoneNumber, valid) => {
    expect(phoneFieldsSchema.safeParse({ countryCode, phoneNumber }).success).toBe(valid)
  })
})

describe('contact URLs', () => {
  it('creates links only for international numbers', () => {
    expect(toWhatsAppUrl('+970590000000', 'مرحبا')).toBe(
      'https://wa.me/970590000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7',
    )
    expect(toTelUrl('+972540000000')).toBe('tel:+972540000000')
    expect(toWhatsAppUrl('0590000000')).toBeNull()
    expect(toTelUrl('0590000000')).toBeNull()
  })
})
