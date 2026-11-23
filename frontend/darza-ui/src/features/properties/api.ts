import { serializeFilters, type PropertyFilters } from './filters/model'
import { request } from '../../api/client'
import type { PropertyCardResponse, PropertyDetailsResponse, SliceResponse } from '../../types/api'

export function getFeed(page: number): Promise<SliceResponse<PropertyCardResponse>> {
  return request(`/api/public/properties/feed?page=${page}`)
}

export function getPropertyDetails(id: number): Promise<PropertyDetailsResponse> {
  return request(`/api/public/properties/${id}`)
}

export function searchProperties(filters: PropertyFilters, page: number): Promise<SliceResponse<PropertyCardResponse>> {
  const params = serializeFilters(filters)
  params.set('page', String(page))
  return request(`/api/public/properties/search?${params}`)
}
