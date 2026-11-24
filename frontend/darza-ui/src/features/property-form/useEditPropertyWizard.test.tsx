// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { PropertyDetailsResponse } from '../../types/api'
import { ApiError } from '../../api/client'
import * as api from './api'
import { usePropertyWizard } from './usePropertyWizard'

const { navigate, toast } = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }))
import { MemoryRouter } from 'react-router'
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => navigate,
}))
vi.mock('../../context/auth', () => ({
  useAuth: () => ({ userId: 7, isAuthenticated: true, isAdmin: false, role: 'PUBLISHER' }),
}))
vi.mock('../../components/ui/useToast', () => ({ useToast: () => ({ showToast: toast }) }))
vi.mock('./imageCompress', () => ({
  compressImage: vi.fn(async () => new Blob(['webp'], { type: 'image/webp' })),
}))

beforeEach(() => {
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => `blob:${crypto.randomUUID()}`),
      revokeObjectURL: vi.fn(),
    }),
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

const property = {
  id: 9,
  title: 'إعلان موجود',
  description: 'وصف',
  propertyType: 'HOUSE',
  listingType: 'RENT',
  price: 350,
  currency: 'ILS',
  rentPeriod: 'MONTHLY',
  rooms: 0,
  furnished: false,
  town: { cityId: 1, cityName: 'رام الله', townId: 2, townName: 'بيتونيا' },
  address: 'شارع تجريبي',
  latitude: 31.123456,
  longitude: 35.123456,
  user: { id: 7, displayName: 'مالك' },
  isAvailable: true,
  postingStatus: 'APPROVED',
  images: [
    { path: 'properties/7/a.webp', url: 'https://storage.example/a' },
    { path: 'properties/7/b.webp', url: 'https://storage.example/b' },
  ],
} satisfies PropertyDetailsResponse
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return renderHook(({ data }) => usePropertyWizard(data), {
    initialProps: { data: property },
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  })
}
it('initializes all fields and existing images once, without marking an untouched edit dirty', () => {
  const { result, rerender } = setup()
  expect(result.current.form.getValues()).toMatchObject({
    title: property.title,
    cityId: '1',
    townId: '2',
    rooms: '0',
    furnished: 'false',
    latitude: '31.123456',
    longitude: '35.123456',
    imagePaths: property.images.map((i) => i.path),
  })
  expect(result.current.uploader.items.map((i) => i.path)).toEqual(
    property.images.map((i) => i.path),
  )
  expect(result.current.form.formState.isDirty).toBe(false)
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  act(() => result.current.form.setValue('title', 'تحرير محلي', { shouldDirty: true }))
  rerender({ data: { ...property, title: 'بيانات أحدث' } })
  expect(result.current.form.getValues('title')).toBe('تحرير محلي')
})
it('requires confirmation, cancellation sends nothing, and existing images never upload', async () => {
  const update = vi
    .spyOn(api, 'updateProperty')
    .mockResolvedValue({ ...property, postingStatus: 'PENDING' })
  const get = vi.spyOn(api, 'getUploadUrls')
  const upload = vi.spyOn(api, 'uploadToSignedUrl')
  const { result } = setup()
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(result.current.confirming).toBe(true)
  expect(update).not.toHaveBeenCalled()
  act(() => result.current.cancelConfirmation())
  expect(result.current.confirming).toBe(false)
  await act(async () => {
    await result.current.onSubmit()
    await result.current.confirm()
  })
  expect(update).toHaveBeenCalledWith(
    9,
    expect.objectContaining({
      imagePaths: property.images.map((i) => i.path),
      townId: 2,
      latitude: 31.123456,
      longitude: 35.123456,
      rooms: 0,
      furnished: false,
    }),
  )
  expect(get).not.toHaveBeenCalled()
  expect(upload).not.toHaveBeenCalled()
  expect(result.current.form.formState.isDirty).toBe(false)
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
})
it('removes existing images locally and uploads only new images, keeping payload order on PUT retry', async () => {
  const get = vi.spyOn(api, 'getUploadUrls').mockResolvedValue({
    uploadUrls: ['https://storage.example/new'],
    imagePaths: ['properties/7/new.webp'],
  })
  const upload = vi.spyOn(api, 'uploadToSignedUrl').mockResolvedValue()
  const update = vi
    .spyOn(api, 'updateProperty')
    .mockRejectedValueOnce(new ApiError(500, 'تعذر الحفظ'))
    .mockResolvedValueOnce(property)
  const { result } = setup()
  act(() => result.current.uploader.removeImage(result.current.uploader.items[0].id))
  await act(async () => {
    await result.current.uploader.addFiles([new File(['png'], 'new.png', { type: 'image/png' })])
  })
  expect(result.current.uploader.items.map((i) => i.kind)).toEqual(['existing', 'new'])
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  await act(async () => {
    await result.current.confirm()
  })
  expect(result.current.formError).toBe('تعذر الحفظ')
  await act(async () => {
    await result.current.confirm()
  })
  expect(get).toHaveBeenCalledExactlyOnceWith(1)
  expect(upload).toHaveBeenCalledOnce()
  expect(update).toHaveBeenCalledTimes(2)
  expect(update.mock.calls[1][1].imagePaths).toEqual([
    'properties/7/b.webp',
    'properties/7/new.webp',
  ])
})
it('allows clearing both coordinates and omits them rather than sending null', async () => {
  const update = vi.spyOn(api, 'updateProperty').mockResolvedValue(property)
  const { result } = setup()
  act(() => result.current.clearLocation())
  await act(async () => {
    await result.current.confirm()
  })
  expect(update.mock.calls[0][1]).not.toHaveProperty('latitude')
  expect(update.mock.calls[0][1]).not.toHaveProperty('longitude')
})
it('does not confirm or send a form with no remaining images', async () => {
  const update = vi.spyOn(api, 'updateProperty')
  const { result } = setup()
  act(() => {
    for (const item of result.current.uploader.items) result.current.uploader.removeImage(item.id)
  })
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(result.current.confirming).toBe(false)
  expect(result.current.step).toBe(4)
  expect(update).not.toHaveBeenCalled()
})

it('warns only while current edit values differ and confirms the wizard back action', () => {
  const { result } = setup()
  act(() => result.current.form.setValue('title', 'عنوان معدل'))
  const dirty = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(dirty)
  expect(dirty.defaultPrevented).toBe(true)
  act(() => result.current.back())
  expect(result.current.confirmingBack).toBe(true)
  act(() => result.current.cancelBack())
  expect(result.current.confirmingBack).toBe(false)
  act(() => result.current.form.setValue('title', property.title))
  const clean = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(clean)
  expect(clean.defaultPrevented).toBe(false)
  act(() => result.current.back())
  expect(result.current.confirmingBack).toBe(false)
})
