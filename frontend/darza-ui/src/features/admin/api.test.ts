import { afterEach, expect, it, vi } from 'vitest'
import * as client from '../../api/client'
import { approveProperty, getAdminProperties, rejectProperty } from './api'

afterEach(() => vi.restoreAllMocks())

it('requests the selected moderation status and page', async () => {
  const request = vi
    .spyOn(client, 'request')
    .mockResolvedValue({ content: [], page: 2, hasNext: false })
  await getAdminProperties('REJECTED', 2)
  expect(request).toHaveBeenCalledWith('/api/admin/properties?status=REJECTED&page=2')
})

it('approves with PATCH', async () => {
  const request = vi.spyOn(client, 'request').mockResolvedValue(undefined)
  await approveProperty(7)
  expect(request).toHaveBeenCalledWith('/api/admin/properties/7/approve', { method: 'PATCH' })
})

it('posts the backend rejectionReason field', async () => {
  const request = vi.spyOn(client, 'request').mockResolvedValue(undefined)
  await rejectProperty(7, 'صور غير واضحة')
  expect(request).toHaveBeenCalledWith('/api/admin/properties/7/reject', {
    method: 'POST',
    body: JSON.stringify({ rejectionReason: 'صور غير واضحة' }),
  })
})
