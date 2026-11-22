import { request } from '../../api/client'
import type { PropertyCardResponse, SliceResponse } from '../../types/api'

export type ModerationStatus = 'PENDING' | 'REJECTED'

export function getAdminProperties(status: ModerationStatus, page: number) {
  return request<SliceResponse<PropertyCardResponse>>(
    `/api/admin/properties?status=${status}&page=${page}`,
  )
}

export function approveProperty(id: number) {
  return request<void>(`/api/admin/properties/${id}/approve`, { method: 'PATCH' })
}

export function rejectProperty(id: number, reason: string) {
  return request<void>(`/api/admin/properties/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason: reason }),
  })
}
