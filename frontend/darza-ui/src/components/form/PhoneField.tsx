import { useLayoutEffect, useRef, type AriaAttributes, type ChangeEvent } from 'react'
import { FormField } from '../ui/FormField'
import { Input } from '../ui/Input'
import { CountryCodeSelect } from './CountryCodeSelect'
import type { CountryCode } from '../../lib/phone'

export interface PhoneFieldProps {
  countryCode: CountryCode
  phoneNumber: string
  israeliNumber: boolean
  onCountryCodeChange: (code: CountryCode) => void
  onPhoneNumberChange: (raw: string) => string
  onBlur?: () => void
  error?: string
  disabled?: boolean
}

export function PhoneField({ error, ...props }: PhoneFieldProps) {
  return (
    <FormField label="رقم الهاتف" required error={error} hint={<PhoneHint />}>
      <PhoneInputs {...props} />
    </FormField>
  )
}

interface PhoneInputsProps extends Omit<PhoneFieldProps, 'error'>, AriaAttributes {
  id?: string
  required?: boolean
}

// FormField passes id and aria attributes here; they belong on the number input.
function PhoneInputs({
  countryCode,
  phoneNumber,
  israeliNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  onBlur,
  disabled,
  ...inputProps
}: PhoneInputsProps) {
  const numberRef = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    if (numberRef.current && numberRef.current.value !== phoneNumber) {
      numberRef.current.value = phoneNumber
    }
  }, [phoneNumber])
  // Uncontrolled on purpose: letting React restore a rewritten value lost keystrokes
  // from fast or IME input, so the DOM is updated here with the caret kept at the end.
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const next = onPhoneNumberChange(input.value)
    if (input.value !== next) {
      input.value = next
      input.setSelectionRange(next.length, next.length)
    }
  }
  return (
    <div dir="ltr" className="flex gap-2">
      <CountryCodeSelect
        value={countryCode}
        israeliNumber={israeliNumber}
        onChange={onCountryCodeChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={inputProps['aria-invalid']}
        aria-describedby={inputProps['aria-describedby']}
      />
      <Input
        {...inputProps}
        ref={numberRef}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="599123456"
        defaultValue={phoneNumber}
        disabled={disabled}
        onBlur={onBlur}
        onChange={handleChange}
      />
    </div>
  )
}

function PhoneHint() {
  return (
    <>
      تأكد إنه الكود والرقم مثل المسجّلين على واتساب، عشان يسهل على الزباين يتواصلوا معك.{' '}
      <span className="whitespace-nowrap">
        مثال: <span dir="ltr">+970 599123456</span>
      </span>
    </>
  )
}
