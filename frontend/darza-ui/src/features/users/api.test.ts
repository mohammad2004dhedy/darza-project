import { afterEach, expect, it, vi } from 'vitest'
import * as client from '../../api/client'
import { getMyProfile, getMyProperties, getPublicProfile, getUserProperties } from './api'

afterEach(() => vi.restoreAllMocks())

it('uses the existing client for the four profile endpoints and passes cancellation signals', async () => {
  const request = vi.spyOn(client, 'request').mockResolvedValue({})
  const signal = new AbortController().signal
  await getMyProfile(signal)
  await getMyProperties(2, signal)
  await getPublicProfile(7, signal)
  await getUserProperties(7, 3, signal)
  expect(request.mock.calls).toEqual([
    ['/api/users/me', { signal }],
    ['/api/users/me/properties?page=2', { signal }],
    ['/api/public/users/7/profile', { signal }],
    ['/api/public/users/7/properties?page=3', { signal }],
  ])
})
