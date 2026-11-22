import { request } from '../../../api/client'
import type { UpdateUserRequest } from '../../../types/api'
import type { UploadUrlsResponse } from '../../property-form/api'

export type AvatarChange =
  { kind: 'unchanged' } | { kind: 'removed' } | { kind: 'uploaded'; path: string; url: string }

export function getProfileUploadUrl() {
  return request<UploadUrlsResponse>('/api/storage/upload?count=1&type=PROFILE')
}

export async function saveAccount(
  values: Omit<UpdateUserRequest, 'profileImagePath'>,
  avatar: AvatarChange,
) {
  await request('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify({
      ...values,
      ...(avatar.kind === 'uploaded' ? { profileImagePath: avatar.path } : {}),
    }),
  })
  if (avatar.kind === 'removed') {
    await request('/api/users/me/profile/image', { method: 'DELETE' })
  }
}
