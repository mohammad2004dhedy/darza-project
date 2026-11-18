import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react'
import { FormField } from '../../../components/ui/FormField'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'

export interface LocationOption {
  id: number
  name: string
}
export interface LocationSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  items: readonly LocationOption[] | undefined
  placeholder: string
  error?: string
  loadError?: string
  onRetry?: () => void
}

export const LocationSelect = forwardRef<HTMLSelectElement, LocationSelectProps>(
  function LocationSelect(
    { label, items, placeholder, error, loadError, onRetry, required, ...props },
    ref,
  ) {
    let hint: ReactNode
    if (loadError) {
      hint = (
        <span className="flex items-center gap-2 text-danger">
          {loadError}
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              إعادة المحاولة
            </Button>
          )}
        </span>
      )
    }
    const options = (items ?? []).map((item) => ({ value: String(item.id), label: item.name }))
    return (
      <FormField label={label} required={required} error={error} hint={hint}>
        <Select {...props} ref={ref} options={options} placeholder={placeholder} />
      </FormField>
    )
  },
)
