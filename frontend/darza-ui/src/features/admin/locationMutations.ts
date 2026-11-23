import { useMutation, useQueryClient } from '@tanstack/react-query'
import { request } from '../../api/client'

export type LocationTarget = { kind: 'city' | 'town'; id?: number; cityId?: number; name: string }

export function useLocationMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ target, name, remove = false }: { target: LocationTarget; name?: string; remove?: boolean }) =>
      request<void>(`/api/admin/location/${target.kind}${target.id ? `/${target.id}` : ''}`, {
        method: remove ? 'DELETE' : target.id ? 'PUT' : 'POST',
        ...(remove ? {} : { body: JSON.stringify(target.kind === 'city' ? { name } : { cityId: target.cityId, townName: name }) }),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['cities'] }),
        client.invalidateQueries({ queryKey: ['towns'] }),
      ])
    },
  })
}
