import { request } from '../../api/client'
import type {
  MyProfileUserResponse,
  PublicUserProfileResponse,
  PropertyCardResponse,
  SliceResponse,
} from '../../types/api'

export function getMyProfile(signal?: AbortSignal): Promise<MyProfileUserResponse> {
  return request('/api/users/me', { signal })
}

export function getPublicProfile(
  id: number,
  signal?: AbortSignal,
): Promise<PublicUserProfileResponse> {
  return request(`/api/public/users/${id}/profile`, { signal })
}

export function getMyProperties(
  page: number,
  signal?: AbortSignal,
): Promise<SliceResponse<PropertyCardResponse>> {
  return request(`/api/users/me/properties?page=${page}`, { signal })
}

export function getUserProperties(
  id: number,
  page: number,
  signal?: AbortSignal,
): Promise<SliceResponse<PropertyCardResponse>> {
  return request(`/api/public/users/${id}/properties?page=${page}`, { signal })
}
