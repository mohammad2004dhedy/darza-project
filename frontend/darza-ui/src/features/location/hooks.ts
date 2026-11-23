import { useQuery } from '@tanstack/react-query'
import { locationApi } from '../../api/locationApi'

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: locationApi.getCities,
    staleTime: Infinity,
  })
}

export function useTowns(cityId: number | undefined) {
  return useQuery({
    queryKey: ['towns', cityId],
    queryFn: () => locationApi.getTowns(cityId as number),
    enabled: cityId !== undefined,
    staleTime: Infinity,
  })
}
