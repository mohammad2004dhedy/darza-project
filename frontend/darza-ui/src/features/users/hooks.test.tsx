// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { AuthContext, type AuthValue } from '../../context/auth'
import * as api from './api'
import { useMyProfile, useMyProperties, usePublicProfile, useUserProperties } from './hooks'

function setup(userId: number | null = 7) {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } })
  const auth: AuthValue = {
    token: userId ? 'token' : null,
    userId,
    displayName: null,
    role: null,
    expiresAt: null,
    isAuthenticated: userId !== null,
    isAdmin: false,
    login: vi.fn(),
    logout: vi.fn(),
  }
  return {
    client,
    wrapper: ({ children }: PropsWithChildren) => (
      <AuthContext.Provider value={auth}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </AuthContext.Provider>
    ),
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('uses four distinct private/public cache keys', async () => {
  vi.spyOn(api, 'getMyProfile').mockResolvedValue({ id: 7, email: 'private' } as never)
  vi.spyOn(api, 'getPublicProfile').mockResolvedValue({ id: 7, displayName: 'public' } as never)
  vi.spyOn(api, 'getMyProperties').mockResolvedValue({ content: [], page: 0, hasNext: false })
  vi.spyOn(api, 'getUserProperties').mockResolvedValue({ content: [], page: 0, hasNext: false })
  const { client, wrapper } = setup()
  const { result } = renderHook(
    () => [useMyProfile(), usePublicProfile(7), useMyProperties(), useUserProperties(7)],
    { wrapper },
  )
  await waitFor(() => expect(result.current.every((query) => query.isSuccess)).toBe(true))
  expect(
    client
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey),
  ).toEqual([
    ['users', 'me'],
    ['users', 7, 'public'],
    ['users', 'me', 'properties'],
    ['users', 7, 'properties'],
  ])
  expect(client.getQueryData(['users', 7, 'public'])).toEqual({ id: 7, displayName: 'public' })
  expect(api.getMyProfile).toHaveBeenCalledWith(expect.any(AbortSignal))
  expect(api.getPublicProfile).toHaveBeenCalledWith(7, expect.any(AbortSignal))
})

it('does not request private data without an authenticated user', () => {
  const profile = vi.spyOn(api, 'getMyProfile')
  const properties = vi.spyOn(api, 'getMyProperties')
  const { wrapper } = setup(null)
  renderHook(() => [useMyProfile(), useMyProperties()], { wrapper })
  expect(profile).not.toHaveBeenCalled()
  expect(properties).not.toHaveBeenCalled()
})

it.each([0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'does not request invalid public ID %s',
  (id) => {
    const profile = vi.spyOn(api, 'getPublicProfile')
    const properties = vi.spyOn(api, 'getUserProperties')
    renderHook(() => [usePublicProfile(id), useUserProperties(id)], { wrapper: setup().wrapper })
    expect(profile).not.toHaveBeenCalled()
    expect(properties).not.toHaveBeenCalled()
  },
)

it.each(['private', 'public'])('retains %s pages and retries a failed next page', async (view) => {
  const endpoint = vi.spyOn(api, view === 'private' ? 'getMyProperties' : 'getUserProperties')
  endpoint
    .mockResolvedValueOnce({ content: [{ id: 1 }], page: 0, hasNext: true } as never)
    .mockRejectedValueOnce(new ApiError(400, 'failed'))
    .mockResolvedValueOnce({ content: [{ id: 2 }], page: 1, hasNext: false } as never)
  const { result } = renderHook(view === 'private' ? useMyProperties : () => useUserProperties(7), {
    wrapper: setup().wrapper,
  })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  await act(async () => {
    await result.current.fetchNextPage()
  })
  await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true))
  expect(result.current.data?.pages[0].content[0].id).toBe(1)
  await act(async () => {
    await result.current.fetchNextPage()
  })
  await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
  expect(result.current.hasNextPage).toBe(false)
})
