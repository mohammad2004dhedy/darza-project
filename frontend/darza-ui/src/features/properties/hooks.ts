import { useContext, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/auth'
import { ToastContext } from '../../components/ui/ToastContext'
import { toTelUrl, toWhatsAppUrl } from '../../lib/phone'
import type { PropertyDetailsResponse } from '../../types/api'
import { buildInquiryMessage } from './whatsapp'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getFeed, getPropertyDetails } from './api'

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['properties', 'feed'],
    queryFn: ({ pageParam }) => getFeed(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    staleTime: 60_000,
  })
}

export function usePropertyDetails(id: string | undefined) {
  const validId = !!id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
  const query = useQuery({
    queryKey: ['properties', 'details', id],
    queryFn: () => getPropertyDetails(Number(id)),
    enabled: validId,
    staleTime: 60_000,
    retry: (count, error) =>
      !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
  })
  return {
    ...query,
    notFound:
      !validId || (query.error instanceof ApiError && [400, 403, 404].includes(query.error.status)),
  }
}

export function useDescriptionOverflow(text: string | undefined) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || expanded) return
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, expanded])
  return { ref, expanded, overflows, toggle: () => setExpanded((value) => !value) }
}

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

export function useShareProperty(id: number, title: string) {
  const toast = useContext(ToastContext)
  return async () => {
    const url = `${window.location.origin}/properties/${id}`
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        toast?.showToast('تم نسخ رابط الإعلان')
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        toast?.showToast('تعذرت مشاركة الرابط، حاول مرة أخرى')
    }
  }
}
