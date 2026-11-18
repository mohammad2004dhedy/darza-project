import type { AriaAttributes } from 'react'
import { FormField } from '../ui/FormField'
import { Input } from '../ui/Input'
import { CountryCodeSelect } from './CountryCodeSelect'
import type { CountryCode } from '../../lib/phone'

export interface PhoneFieldProps {
  countryCode: CountryCode
  phoneNumber: string
  israeliNumber: boolean
  onCountryCodeChange: (code: CountryCode) => void
  onPhoneNumberChange: (raw: string) => void
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
      <div className="min-w-0 flex-1">
        <Input
          {...inputProps}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="599123456"
          value={phoneNumber}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => onPhoneNumberChange(event.target.value)}
        />
      </div>
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
