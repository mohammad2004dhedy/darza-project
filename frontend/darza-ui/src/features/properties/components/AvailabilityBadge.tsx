import { Check, Minus } from 'lucide-react'

export function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  const Icon = isAvailable ? Check : Minus
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${isAvailable ? 'bg-primary text-on-primary' : 'bg-border text-text'}`}
    >
      <Icon aria-hidden="true" className="size-4" />
      {isAvailable ? 'متاح' : 'غير متاح'}
    </span>
  )
}
