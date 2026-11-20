import { request } from '../../api/client'
import type { PropertyCardResponse, PropertyDetailsResponse, SliceResponse } from '../../types/api'

export function getFeed(page: number): Promise<SliceResponse<PropertyCardResponse>> {
  return request(`/api/public/properties/feed?page=${page}`)
}

export function getPropertyDetails(id: number): Promise<PropertyDetailsResponse> {
  return request(`/api/public/properties/${id}`)
}
