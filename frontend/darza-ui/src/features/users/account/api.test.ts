import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '../../../api/client'
import { getProfileUploadUrl, saveAccount } from './api'
vi.mock('../../../api/client', () => ({ request: vi.fn() }))
const payload = {
  displayName: 'اسم',
  countryCode: '970' as const,
  phoneNumber: '591234567',
  townId: 1,
}
beforeEach(() => vi.mocked(request).mockReset())
describe('account saving', () => {
  it('uploads through the PROFILE endpoint', async () => {
    await getProfileUploadUrl()
    expect(request).toHaveBeenCalledWith('/api/storage/upload?count=1&type=PROFILE')
  })
  it.each([
    { kind: 'unchanged' } as const,
    { kind: 'uploaded', path: 'profile/new.webp', url: 'blob:preview' } as const,
  ])('only puts for $kind', async (avatar) => {
    await saveAccount(payload, avatar)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        ...payload,
        ...(avatar.kind === 'uploaded' ? { profileImagePath: avatar.path } : {}),
      }),
    })
  })
  it('waits for PUT success before deleting a removed avatar', async () => {
    let finish!: () => void
    vi.mocked(request).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const saving = saveAccount(payload, { kind: 'removed' })
    expect(request).toHaveBeenCalledTimes(1)
    expect(JSON.parse(vi.mocked(request).mock.calls[0][1]?.body as string)).not.toHaveProperty(
      'profileImagePath',
    )
    finish()
    await saving
    expect(request).toHaveBeenLastCalledWith('/api/users/me/profile/image', { method: 'DELETE' })
  })
  it('never deletes when PUT fails', async () => {
    vi.mocked(request).mockRejectedValueOnce(new Error('failed'))
    await expect(saveAccount(payload, { kind: 'removed' })).rejects.toThrow('failed')
    expect(request).toHaveBeenCalledTimes(1)
  })
  it('reports deletion failures', async () => {
    vi.mocked(request)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('delete failed'))
    await expect(saveAccount(payload, { kind: 'removed' })).rejects.toThrow('delete failed')
  })
})
