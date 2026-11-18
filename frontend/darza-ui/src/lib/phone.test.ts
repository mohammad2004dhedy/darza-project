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
    ['0599123456', '970', '599123456'],
    ['0569123456', '970', '569123456'],
    ['0549123456', '972', '549123456'],
    ['0509123456', '972', '509123456'],
    ['٠٥٩٩١٢٣٤٥٦', '970', '599123456'],
  ])('types %s', (input, countryCode, phoneNumber) => {
    expect(type(input)).toMatchObject({ countryCode, phoneNumber })
  })

  it.each([
    ['+972599123456', '972', '599123456'],
    ['00970 59-912-3456', '970', '599123456'],
    ['970569123456', '970', '569123456'],
    ['+970509123456', '972', '509123456'],
    ['0599123456789', '970', '599123456'],
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
    expect(type('0599123456', chosen)).toMatchObject({
      countryCode: '972',
      phoneNumber: '599123456',
    })
  })

  it('returns to 970 after an Israeli prefix is replaced by a Palestinian one', () => {
    const israeli = type('054')
    const palestinian = applyPhoneInput(selectCountryCode(israeli, '972'), '59')
    expect(palestinian.countryCode).toBe('972')
    expect(applyPhoneInput(initialPhoneInput, '59').countryCode).toBe('970')
  })

  it('does not allow 970 for Israeli numbers', () => {
    const israeli = type('0549123456')
    expect(selectCountryCode(israeli, '970')).toBe(israeli)
  })
})

describe('phoneFieldsSchema', () => {
  it.each([
    ['970', '599123456', true],
    ['972', '599123456', true],
    ['972', '549123456', true],
    ['970', '549123456', false],
    ['970', '519123456', false],
    ['970', '59912345', false],
    ['971', '599123456', false],
  ])('validates %s %s', (countryCode, phoneNumber, valid) => {
    expect(phoneFieldsSchema.safeParse({ countryCode, phoneNumber }).success).toBe(valid)
  })
})

describe('contact URLs', () => {
  it('creates links only for international numbers', () => {
    expect(toWhatsAppUrl('+970599123456', 'مرحبا')).toBe(
      'https://wa.me/970599123456?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7',
    )
    expect(toTelUrl('+972549123456')).toBe('tel:+972549123456')
    expect(toWhatsAppUrl('0599123456')).toBeNull()
    expect(toTelUrl('0599123456')).toBeNull()
  })
})
