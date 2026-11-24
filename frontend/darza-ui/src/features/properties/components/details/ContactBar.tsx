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
      className="flex w-full flex-col gap-3 md:flex-row"
    >
      <WhatsAppButton phone={contact.phone} message={contact.message} />
      <CallButton phone={contact.phone} />
    </div>
  )
}
