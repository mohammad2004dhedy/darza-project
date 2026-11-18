import { z } from 'zod'

export const COUNTRY_CODES = ['970', '972'] as const
export type CountryCode = (typeof COUNTRY_CODES)[number]

// verify against official numbering plans
export const PS_PREFIXES = ['56', '59'] as const
export const IL_PREFIXES = ['50', '52', '53', '54', '55', '58'] as const
const PREFIXES: readonly string[] = [...PS_PREFIXES, ...IL_PREFIXES]

export interface PhoneInputState {
  countryCode: CountryCode
  phoneNumber: string
  /** The user picked or pasted the code, so typing must not override it. */
  codeChosen: boolean
}

export const initialPhoneInput: PhoneInputState = {
  countryCode: '970',
  phoneNumber: '',
  codeChosen: false,
}

function toAsciiDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
}

export function isIsraeliNumber(phoneNumber: string): boolean {
  return IL_PREFIXES.some((prefix) => phoneNumber.startsWith(prefix))
}

function isPalestinianNumber(phoneNumber: string): boolean {
  return PS_PREFIXES.some((prefix) => phoneNumber.startsWith(prefix))
}

/** Applies typed or pasted text; returns the previous state when the text cannot become a valid number. */
export function applyPhoneInput(state: PhoneInputState, raw: string): PhoneInputState {
  const value = toAsciiDigits(raw)
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '')
  const withCode = /^(?:\+|00)?(97[02])(\d*)$/.exec(value)
  // Keep a partially typed code such as "+97" until it is complete.
  if (!withCode && /^(?:\+|\+?9|\+?97)$/.test(value)) return { ...state, phoneNumber: value }

  const pastedCode = withCode?.[1] as CountryCode | undefined
  const phoneNumber = (withCode?.[2] ?? value.replace(/^\+/, '')).replace(/^0+/, '').slice(0, 9)
  if (phoneNumber && !phoneNumber.startsWith('5')) return state
  if (phoneNumber.length >= 2 && !PREFIXES.includes(phoneNumber.slice(0, 2))) return state

  if (isIsraeliNumber(phoneNumber)) return { countryCode: '972', phoneNumber, codeChosen: true }
  if (pastedCode) return { countryCode: pastedCode, phoneNumber, codeChosen: true }
  if (isPalestinianNumber(phoneNumber) && !state.codeChosen) {
    return { ...state, countryCode: '970', phoneNumber }
  }
  return { ...state, phoneNumber }
}

export function selectCountryCode(state: PhoneInputState, code: CountryCode): PhoneInputState {
  if (code === '970' && isIsraeliNumber(state.phoneNumber)) return state
  return { ...state, countryCode: code, codeChosen: true }
}

/** Mirrors the backend rules for the countryCode and phoneNumber request fields. */
export function isValidPhone(countryCode: string, phoneNumber: string): boolean {
  if (!/^5\d{8}$/.test(phoneNumber)) return false
  if (countryCode === '972') return isIsraeliNumber(phoneNumber) || isPalestinianNumber(phoneNumber)
  return countryCode === '970' && isPalestinianNumber(phoneNumber)
}

export const phoneFieldsSchema = z
  .object({ countryCode: z.enum(COUNTRY_CODES), phoneNumber: z.string() })
  .superRefine(({ countryCode, phoneNumber }, context) => {
    if (!/^5\d{8}$/.test(phoneNumber) || !PREFIXES.includes(phoneNumber.slice(0, 2))) {
      context.addIssue({
        code: 'custom',
        path: ['phoneNumber'],
        message: 'رقم الهاتف لازم يكون 9 أرقام ويبلش بمقدمة فلسطينية أو إسرائيلية',
      })
    } else if (!isValidPhone(countryCode, phoneNumber)) {
      context.addIssue({
        code: 'custom',
        path: ['countryCode'],
        message: 'هاد الرقم لازم يكون مع الكود 972',
      })
    }
  })

const STORED_PHONE = /^\+97[02]5\d{8}$/

/** Returns null for numbers not stored in international form, since their code is unknown. */
export function toWhatsAppUrl(storedPhone: string, message?: string): string | null {
  if (!STORED_PHONE.test(storedPhone)) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${storedPhone.slice(1)}${text}`
}

export function toTelUrl(storedPhone: string): string | null {
  return STORED_PHONE.test(storedPhone) ? `tel:${storedPhone}` : null
}
