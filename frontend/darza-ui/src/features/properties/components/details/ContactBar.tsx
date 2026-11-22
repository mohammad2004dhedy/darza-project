import { WhatsAppButton } from './WhatsAppButton'
import { CallButton } from './CallButton'
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
      <WhatsAppButton phone={contact.phone} message={contact.message} />
      <CallButton phone={contact.phone} />
    </div>
  )
}
