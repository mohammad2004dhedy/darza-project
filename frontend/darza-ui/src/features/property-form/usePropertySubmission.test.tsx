// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import * as api from './api'
import { defaultValues } from './schema'
import { usePropertyWizard } from './usePropertyWizard'

const { navigate, toast } = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }))
vi.mock('react-router', () => ({ useNavigate: () => navigate }))
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
async function setup(count = 2) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const hook = renderHook(() => usePropertyWizard(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  await act(async () => {
    await hook.result.current.uploader.addFiles(
      Array.from({ length: count }, (_, i) => new File(['png'], `${i}.png`, { type: 'image/png' })),
    )
  })
  act(() => {
    hook.result.current.form.reset({
      ...defaultValues,
      title: 'إعلان جديد',
      propertyType: 'HOUSE',
      listingType: 'SELL',
      price: '0',
      currency: 'ILS',
      townId: '1',
      cityId: '1',
      imagePaths: hook.result.current.uploader.items.map((i) => i.id),
    })
  })
  return { ...hook, invalidate }
}
function urls(count: number) {
  return {
    uploadUrls: Array.from({ length: count }, (_, i) => `https://storage.example/${i}`),
    imagePaths: Array.from({ length: count }, (_, i) => `properties/7/test-${i}.webp`),
  }
}
it('waits for every upload before POST and preserves displayed URL/path pairing', async () => {
  const events: string[] = []
  vi.spyOn(api, 'getUploadUrls').mockImplementation(async (count) => {
    events.push('urls')
    return urls(count)
  })
  let completeSecond: () => void = () => {}
  vi.spyOn(api, 'uploadToSignedUrl').mockImplementation(async (url) => {
    events.push(url)
    if (url.endsWith('/1'))
      await new Promise<void>((resolve) => {
        completeSecond = resolve
      })
  })
  const post = vi.spyOn(api, 'createProperty').mockImplementation(async () => {
    events.push('post')
    return { id: 9, postingStatus: 'PENDING' } as never
  })
  const { result, invalidate } = await setup()
  let submitted: Promise<void>
  await act(async () => {
    submitted = result.current.onSubmit()
    await new Promise((r) => setTimeout(r, 10))
  })
  expect(post).not.toHaveBeenCalled()
  await act(async () => {
    completeSecond()
    await submitted!
  })
  expect(events).toEqual(['urls', 'https://storage.example/0', 'https://storage.example/1', 'post'])
  expect(post.mock.calls[0][0].imagePaths).toEqual(urls(2).imagePaths)
  expect(post.mock.calls[0][0].price).toBe(0)
  expect(navigate).toHaveBeenCalledWith('/properties/9')
  expect(toast).toHaveBeenCalledWith('تم إرسال إعلانك للمراجعة وسيظهر للعامة بعد الموافقة')
  expect(invalidate.mock.calls.map(([arg]) => arg?.queryKey)).toEqual(
    expect.arrayContaining([
      ['properties'],
      ['users', 'me', 'properties'],
      ['users', 7, 'properties'],
    ]),
  )
})
it('upload failure blocks POST and retry skips completed uploads and existing signed pairs', async () => {
  const get = vi.spyOn(api, 'getUploadUrls').mockResolvedValue(urls(2))
  const upload = vi.spyOn(api, 'uploadToSignedUrl').mockResolvedValue(undefined)
  upload.mockImplementationOnce(async () => {}).mockRejectedValueOnce(new Error('upload failed'))
  const post = vi
    .spyOn(api, 'createProperty')
    .mockResolvedValue({ id: 9, postingStatus: 'APPROVED' } as never)
  const { result } = await setup()
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(post).not.toHaveBeenCalled()
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(get).toHaveBeenCalledTimes(1)
  expect(upload.mock.calls.map(([url]) => url)).toEqual([
    'https://storage.example/0',
    'https://storage.example/1',
    'https://storage.example/1',
  ])
  expect(post).toHaveBeenCalledOnce()
})
it('POST failure retry reuses paths without requesting URLs or uploading again and maps errors', async () => {
  const get = vi.spyOn(api, 'getUploadUrls').mockResolvedValue(urls(1))
  const upload = vi.spyOn(api, 'uploadToSignedUrl').mockResolvedValue(undefined)
  const post = vi
    .spyOn(api, 'createProperty')
    .mockRejectedValueOnce(
      new ApiError(400, 'خطأ عام', { title: 'راجع العنوان', unknown: 'سبب آخر' }),
    )
    .mockResolvedValueOnce({ id: 9, postingStatus: 'APPROVED' } as never)
  const { result } = await setup(1)
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(result.current.form.formState.errors.title?.message).toBe('راجع العنوان')
  expect(result.current.step).toBe(5)
  expect(result.current.formError).toBe('خطأ عام')
  await act(async () => {
    await result.current.onSubmit()
  })
  expect(get).toHaveBeenCalledOnce()
  expect(upload).toHaveBeenCalledOnce()
  expect(post).toHaveBeenCalledTimes(2)
  expect(post.mock.calls[1][0].imagePaths).toEqual(post.mock.calls[0][0].imagePaths)
})
