import { useAuth } from '../../context/auth'
import type { PropertyDetailsResponse } from '../../types/api'
import { buildInquiryMessage } from './whatsapp'

export function usePropertyContact(property: PropertyDetailsResponse) {
  const { userId } = useAuth()
  const phone = property.user.phoneNumber
  if (!phone || userId === property.user.id || !/^\+97[02]5\d{8}$/.test(phone)) return null
  const message = buildInquiryMessage({
    title: property.title,
    ...property.town,
    url: `${window.location.origin}/properties/${property.id}`,
  })
  return { phone, message }
}
