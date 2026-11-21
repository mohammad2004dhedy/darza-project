import { useAuth } from '../../context/auth'
import { toTelUrl, toWhatsAppUrl } from '../../lib/phone'
import type { PropertyDetailsResponse } from '../../types/api'
import { buildInquiryMessage } from './whatsapp'

export function usePropertyContact(property: PropertyDetailsResponse) {
  const { userId } = useAuth()
  const phone = property.user.phoneNumber
  if (!phone || userId === property.user.id) return null
  const message = buildInquiryMessage({
    title: property.title,
    ...property.town,
    url: `${window.location.origin}/properties/${property.id}`,
  })
  const whatsapp = toWhatsAppUrl(phone, message)
  const tel = toTelUrl(phone)
  return whatsapp || tel ? { whatsapp, tel } : null
}
