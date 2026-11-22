import { WhatsAppButton } from './WhatsAppButton'
import { CallButton } from './CallButton'
import type { PropertyDetailsResponse } from '../../../../types/api'
import { usePropertyContact } from '../../usePropertyContact'
export function ContactBar({ property }: { property: PropertyDetailsResponse }) {
  const contact = usePropertyContact(property)
  if (!contact) return null
  return (
    <div
      aria-label="تواصل مع الناشر"
      className="fixed inset-x-0 bottom-[calc(5rem+max(0px,env(safe-area-inset-bottom)-0.5rem))] z-20 flex gap-3 border-t border-border bg-surface p-3 md:bottom-0 lg:static lg:border-0 lg:p-0"
    >
      <WhatsAppButton phone={contact.phone} message={contact.message} />
      <CallButton phone={contact.phone} />
    </div>
  )
}
