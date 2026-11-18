import { request } from '../../api/client'
import type { PropertyCardResponse, SliceResponse } from '../../types/api'

export function getFeed(page: number): Promise<SliceResponse<PropertyCardResponse>> {
  return request(`/api/public/properties/feed?page=${page}`)
}
