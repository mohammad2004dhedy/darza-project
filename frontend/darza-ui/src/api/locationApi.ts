import type { CityResponse, TownResponse } from '../types/api'
import { buildQueryParams, request } from './client'

export function getCities(): Promise<CityResponse[]> {
  return request('/api/public/location/city/getAll')
}

export function getTowns(cityId: number): Promise<TownResponse[]> {
  return request(`/api/public/location/town/getAll${buildQueryParams({ cityId })}`)
}

export const locationApi = { getCities, getTowns }
