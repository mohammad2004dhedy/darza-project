import { afterEach, describe, expect, it, vi } from 'vitest'
import { request, setUnauthorizedHandler } from './client'
import { AuthStorage } from '../lib/authStorage'
import type { LoginResponse } from '../types/api'

function session(token: string): LoginResponse {
  return {
    token,
    userId: 1,
    displayName: 'اختبار',
    role: 'PUBLISHER',
    expiresAt: '2099-01-01T00:00:00Z',
  }
}

afterEach(() => {
  setUnauthorizedHandler(undefined)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('unauthorized session handling', () => {
  it('does not expire a new session when an old request returns 401', async () => {
    let current = session('old')
    vi.spyOn(AuthStorage, 'getSession').mockImplementation(() => current)
    let finish!: (response: Response) => void
    const fetchMock = vi.fn<typeof fetch>(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    const pending = request('/api/public/properties/1')
    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer old',
    )
    current = session('new')
    finish(new Response('', { status: 401 }))
    await expect(pending).rejects.toMatchObject({ status: 401 })
    expect(handler).not.toHaveBeenCalled()
  })

  it.each([
    ['/api/users/me', 401, 'current', true],
    ['/api/auth/login', 401, 'current', false],
    ['/api/users/me', 403, 'current', false],
    ['/api/users/me', 401, undefined, false],
  ] as const)('handles %s status %s with token %s', async (path, status, token, expires) => {
    vi.spyOn(AuthStorage, 'getSession').mockReturnValue(token ? session(token) : null)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })))
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    await expect(request(path)).rejects.toMatchObject({ status })
    expect(handler).toHaveBeenCalledTimes(expires ? 1 : 0)
  })
})
