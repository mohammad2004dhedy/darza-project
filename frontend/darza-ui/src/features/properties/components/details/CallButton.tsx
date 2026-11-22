import { Phone } from 'lucide-react'
import { toTelUrl } from '../../../../lib/phone'

export function CallButton({ phone }: { phone: string }) {
  const href = toTelUrl(phone)
  if (!href) return null
  return (
    <a
      href={href}
      className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs leading-5 font-semibold border border-primary text-primary"
    >
      <Phone className="size-4 shrink-0" aria-hidden="true" />
      الاتصال بالمعلن
    </a>
  )
}
