import { afterEach, expect, it, vi } from 'vitest'
import * as client from '../../api/client'
import {
  createProperty,
  deleteProperty,
  getUploadUrls,
  setAvailability,
  updateProperty,
  uploadToSignedUrl,
} from './api'
import type { CreatePropertyRequest } from './schema'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('uses existing client for backend calls and no body for 204 actions', async () => {
  const request = vi.spyOn(client, 'request').mockResolvedValue(undefined)
  const payload = { title: 'أرض' } as CreatePropertyRequest
  await getUploadUrls(2)
  await createProperty(payload)
  await updateProperty(7, payload)
  await setAvailability(7)
  await deleteProperty(7)
  expect(request.mock.calls).toEqual([
    ['/api/storage/upload?count=2&type=PROPERTY'],
    ['/api/property', { method: 'POST', body: JSON.stringify(payload) }],
    ['/api/property/7', { method: 'PUT', body: JSON.stringify(payload) }],
    ['/api/property/7/availability', { method: 'PATCH' }],
    ['/api/property/7', { method: 'DELETE' }],
  ])
})
it('uploads WebP directly without authorization, cookies or upsert', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
  vi.stubGlobal('fetch', fetch)
  const blob = new Blob(['webp'], { type: 'image/webp' })
  await uploadToSignedUrl('https://example.com/signed?token=test', blob)
  expect(fetch).toHaveBeenCalledWith('https://example.com/signed?token=test', {
    method: 'PUT',
    headers: { 'Content-Type': 'image/webp' },
    credentials: 'omit',
    body: blob,
  })
})
it.each([
  [400, 'Asset Already Exists', true, false],
  [409, '', true, false],
  [403, 'expired', false, true],
  [400, 'jwt expired', false, true],
  [500, 'failed', false, false],
])('rejects upload status %i', async (status, body, ambiguous, expired) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status })))
  await expect(
    uploadToSignedUrl('https://example.com/a', new Blob(['x'], { type: 'image/webp' })),
  ).rejects.toMatchObject({ status, ambiguous, expired })
})
it('rejects non-WebP before network and surfaces lost responses', async () => {
  const fetch = vi.fn().mockRejectedValue(new TypeError('network'))
  vi.stubGlobal('fetch', fetch)
  await expect(
    uploadToSignedUrl('https://example.com/a', new Blob(['x'], { type: 'image/jpeg' })),
  ).rejects.toThrow()
  expect(fetch).not.toHaveBeenCalled()
  await expect(
    uploadToSignedUrl('https://example.com/a', new Blob(['x'], { type: 'image/webp' })),
  ).rejects.toMatchObject({ status: 0 })
})
