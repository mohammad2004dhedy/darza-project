import type { QueryClient } from '@tanstack/react-query'

export async function invalidatePropertyQueries(client: QueryClient, userId?: number | null) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['properties'] }),
    client.invalidateQueries({ queryKey: ['users', 'me', 'properties'] }),
    ...(userId == null
      ? []
      : [client.invalidateQueries({ queryKey: ['users', userId, 'properties'] })]),
  ])
}
