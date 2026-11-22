import type { UseFormRegisterReturn } from 'react-hook-form'
import type { RentPeriod } from '../../../types/api'

const periods: { value: RentPeriod; label: string }[] = [
  { value: 'HOURLY', label: 'بالساعة' },
  { value: 'DAILY', label: 'يومي' },
  { value: 'MONTHLY', label: 'شهري' },
  { value: 'YEARLY', label: 'سنوي' },
]

export function RentPeriodChips({
  registration,
  error,
}: {
  registration: UseFormRegisterReturn
  error?: string
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold">فترة الإيجار *</legend>
      <div
        role="radiogroup"
        aria-label="فترة الإيجار"
        aria-required="true"
        aria-invalid={Boolean(error)}
        className="grid grid-cols-4 gap-2"
      >
        {periods.map(({ value, label }) => (
          <label key={value} className="relative cursor-pointer">
            <input {...registration} type="radio" value={value} className="peer sr-only" />
            <span className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-2 text-sm text-text peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
              {label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
