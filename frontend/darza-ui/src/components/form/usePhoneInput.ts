import { useRef } from 'react'
import {
  applyPhoneInput,
  isIsraeliNumber,
  selectCountryCode,
  type CountryCode,
  type PhoneInputState,
} from '../../lib/phone'

export interface PhoneValue {
  countryCode: CountryCode
  phoneNumber: string
}

/** Wires lib/phone.ts to a phone value, remembering whether the user picked the code. */
export function usePhoneInput(value: PhoneValue, onChange: (next: PhoneValue) => void) {
  const codeChosen = useRef(false)

  const update = (next: PhoneInputState) => {
    codeChosen.current = next.codeChosen
    onChange({ countryCode: next.countryCode, phoneNumber: next.phoneNumber })
    return next.phoneNumber
  }
  return {
    israeliNumber: isIsraeliNumber(value.phoneNumber),
    onPhoneNumberChange: (raw: string) =>
      update(applyPhoneInput({ ...value, codeChosen: codeChosen.current }, raw)),
    onCountryCodeChange: (code: CountryCode) =>
      update(selectCountryCode({ ...value, codeChosen: codeChosen.current }, code)),
  }
}
