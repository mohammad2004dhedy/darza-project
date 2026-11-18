import { forwardRef, type ReactNode } from 'react'
import { FormField } from '../ui/FormField'
import { PasswordInput, type PasswordInputProps } from '../ui/PasswordInput'

interface PasswordFieldProps extends PasswordInputProps {
  label: string
  error?: string
  hint?: ReactNode
}
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, error, hint, required, ...props }, ref) {
    return (
      <FormField label={label} error={error} hint={hint} required={required}>
        <PasswordInput {...props} ref={ref} dir="ltr" />
      </FormField>
    )
  },
)
