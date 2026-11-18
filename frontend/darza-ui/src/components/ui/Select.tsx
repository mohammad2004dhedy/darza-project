import { forwardRef, type SelectHTMLAttributes } from 'react'
import { controlStyles } from './controlStyles'

export interface SelectOption {
  value: string
  label: string
}
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly SelectOption[]
  placeholder?: string
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, className = '', children, ...props },
  ref,
) {
  return (
    <select {...props} ref={ref} className={`${controlStyles} ${className}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {children}
    </select>
  )
})
