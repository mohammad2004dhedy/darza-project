import { MessageCircle, Phone } from 'lucide-react'
import type { PropertyDetailsResponse } from '../../../../types/api'
import { usePropertyContact } from '../../usePropertyContact'
export function ContactBar({
  property,
  desktop = false,
}: {
  property: PropertyDetailsResponse
  desktop?: boolean
}) {
  const contact = usePropertyContact(property)
  if (!contact) return null
  return (
    <div
      aria-label="تواصل مع الناشر"
      className={
        desktop
          ? 'hidden gap-3 lg:flex'
          : 'fixed inset-x-0 bottom-[calc(5rem+max(0px,env(safe-area-inset-bottom)-0.5rem))] z-20 flex gap-3 border-t border-border bg-surface p-3 md:bottom-0 lg:hidden'
      }
    >
      {contact.whatsapp && (
        <a
          href={contact.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 font-semibold text-on-primary"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          واتساب
        </a>
      )}
      {contact.tel && (
        <a
          href={contact.tel}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-primary px-3 font-semibold text-primary"
        >
          <Phone className="size-5" aria-hidden="true" />
          اتصال
        </a>
      )}
    </div>
  )
}
