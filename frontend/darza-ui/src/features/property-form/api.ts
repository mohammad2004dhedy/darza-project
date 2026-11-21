import { request } from '../../api/client'
import type { PropertyDetailsResponse } from '../../types/api'
import type { CreatePropertyRequest } from './schema'

export interface UploadUrlsResponse {
  uploadUrls: string[]
  imagePaths: string[]
}

export function getUploadUrls(count: number): Promise<UploadUrlsResponse> {
  return request(`/api/storage/upload?count=${count}&type=PROPERTY`)
}
export function createProperty(payload: CreatePropertyRequest): Promise<PropertyDetailsResponse> {
  return request('/api/property', { method: 'POST', body: JSON.stringify(payload) })
}
export function updateProperty(
  id: number,
  payload: CreatePropertyRequest,
): Promise<PropertyDetailsResponse> {
  return request(`/api/property/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export function setAvailability(id: number): Promise<void> {
  return request(`/api/property/${id}/availability`, { method: 'PATCH' })
}
export function deleteProperty(id: number): Promise<void> {
  return request(`/api/property/${id}`, { method: 'DELETE' })
}

export class SignedUploadError extends Error {
  readonly status: number
  readonly ambiguous: boolean
  readonly expired: boolean
  constructor(status: number, ambiguous = false, expired = false) {
    super(
      ambiguous
        ? 'قد تكون الصورة رُفعت دون وصول التأكيد. احذف هذه الصورة وأضفها مجدداً؛ لن نستبدل ملفاً موجوداً'
        : 'تعذر رفع الصورة، أعد المحاولة',
    )
    this.status = status
    this.ambiguous = ambiguous
    this.expired = expired
    this.name = 'SignedUploadError'
  }
}

export async function uploadToSignedUrl(signedUrl: string, blob: Blob): Promise<void> {
  const url = new URL(signedUrl)
  if (url.protocol !== 'https:' || blob.type !== 'image/webp') {
    throw new SignedUploadError(0)
  }
  let response: Response
  try {
    response = await fetch(url.href, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp' },
      credentials: 'omit',
      body: blob,
    })
  } catch {
    // A lost response does not establish whether the object was stored.
    throw new SignedUploadError(0)
  }
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    const exists = response.status === 409 || /asset already exists|duplicate/i.test(message)
    throw new SignedUploadError(
      response.status,
      exists,
      !exists &&
        (response.status === 401 ||
          response.status === 403 ||
          /(?:token|jwt|signature).*expir|expir.*(?:token|jwt|signature)/i.test(message)),
    )
  }
}
