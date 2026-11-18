import { memo, type SelectHTMLAttributes } from 'react'
import { Select } from '../ui/Select'
import { COUNTRY_CODES, type CountryCode } from '../../lib/phone'

interface CountryCodeSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> {
  value: CountryCode
  onChange: (code: CountryCode) => void
  israeliNumber: boolean
}
// Memoized: re-rendering a controlled select on every keystroke in the number input
// moved that input's caret in Chrome and dropped typed digits.
export const CountryCodeSelect = memo(function CountryCodeSelect({
  value,
  onChange,
  israeliNumber,
  className = '',
  ...props
}: CountryCodeSelectProps) {
  const options = COUNTRY_CODES.map((code) => ({
    value: code,
    label: `+${code}`,
    disabled: code === '970' && israeliNumber,
  }))
  return (
    <Select
      {...props}
      aria-label="كود الدولة"
      dir="ltr"
      value={value}
      options={options}
      onChange={(event) => onChange(event.target.value as CountryCode)}
      className={`w-28 shrink-0 ${className}`}
    />
  )
})
