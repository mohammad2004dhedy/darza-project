import { Button } from '../../../components/ui/Button'

export function ChipGroup<T extends string>({ label, options, value, onChange }: {
  label: string
  options: readonly { value: T; label: string }[]
  value?: T
  onChange: (value: T | undefined) => void
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button key={option.value} size="sm" variant={value === option.value ? 'primary' : 'outline'}
            aria-pressed={value === option.value}
            onClick={() => onChange(value === option.value ? undefined : option.value)}>
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
