import { MessageCircle } from 'lucide-react'
import { toWhatsAppUrl } from '../../../../lib/phone'

export function WhatsAppButton({ phone, message }: { phone: string; message?: string }) {
  const href = toWhatsAppUrl(phone, message)
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs leading-5 font-semibold bg-primary text-on-primary"
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
      التواصل على واتساب
    </a>
  )
}
