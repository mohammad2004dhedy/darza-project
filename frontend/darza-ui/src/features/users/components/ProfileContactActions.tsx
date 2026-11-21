import { MessageCircle, Phone } from 'lucide-react'
import { ButtonLink } from '../../../components/ui/ButtonLink'
import { toTelUrl, toWhatsAppUrl } from '../../../lib/phone'

export function ProfileContactActions({ phoneNumber }: { phoneNumber?: string }) {
  const whatsAppUrl = toWhatsAppUrl(
    phoneNumber,
    'مرحبا، شفت ملفك على درزة وأود الاستفسار عن إعلاناتك.',
  )
  const telUrl = toTelUrl(phoneNumber)
  if (!whatsAppUrl && !telUrl) return null

  return (
    <section aria-label="التواصل مع الناشر" className="flex flex-wrap gap-3">
      {whatsAppUrl && (
        <ButtonLink href={whatsAppUrl} target="_blank" className="transition-none">
          <MessageCircle aria-hidden="true" className="size-5" />
          واتساب
        </ButtonLink>
      )}
      {telUrl && (
        <ButtonLink href={telUrl} variant="outline" className="transition-none">
          <Phone aria-hidden="true" className="size-5" />
          اتصال
        </ButtonLink>
      )}
    </section>
  )
}
