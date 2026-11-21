// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getUploadUrls, uploadToSignedUrl } from './api'
import { compressImage } from './imageCompress'
import { useImageUploader } from './useImageUploader'

vi.mock('./api', () => ({ getUploadUrls: vi.fn(), uploadToSignedUrl: vi.fn() }))
vi.mock('./imageCompress', () => ({ compressImage: vi.fn() }))

const compressed = new Blob(['compressed'], { type: 'image/webp' })
const files = (count: number) =>
  Array.from(
    { length: count },
    (_, index) => new File(['raw'], `${index}.jpg`, { type: 'image/jpeg' }),
  )
const existing = [{ path: 'existing.webp', url: 'https://server/existing.webp' }]
let serial = 0

function setup(images = [] as typeof existing) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useImageUploader(images), { wrapper })
}

beforeEach(() => {
  vi.mocked(compressImage).mockResolvedValue(compressed)
  vi.mocked(uploadToSignedUrl).mockResolvedValue(undefined)
  vi.mocked(getUploadUrls).mockImplementation(async (count) => {
    const batch = serial++
    return {
      uploadUrls: Array.from({ length: count }, (_, index) => `https://signed/${batch}/${index}`),
      imagePaths: Array.from({ length: count }, (_, index) => `path/${batch}/${index}.webp`),
    }
  })
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => `blob:${serial++}`),
      revokeObjectURL: vi.fn(),
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  vi.unstubAllGlobals()
})

it('reserves at most eight total slots across simultaneous selections, including existing images', async () => {
  const { result } = setup(existing)
  await act(async () => {
    const first = result.current.addFiles(files(5))
    const second = result.current.addFiles(files(5))
    await Promise.all([first, second])
  })
  expect(result.current.items).toHaveLength(8)
  expect(compressImage).toHaveBeenCalledTimes(7)
  expect(result.current.error).toContain('8')
})

it('compresses concurrent selections sequentially and stores only compressed blobs', async () => {
  let active = 0
  let maximum = 0
  vi.mocked(compressImage).mockImplementation(async () => {
    active++
    maximum = Math.max(maximum, active)
    await new Promise((resolve) => setTimeout(resolve, 2))
    active--
    return compressed
  })
  const { result } = setup()
  await act(async () => {
    await Promise.all([result.current.addFiles(files(2)), result.current.addFiles(files(2))])
  })
  expect(maximum).toBe(1)
  expect(result.current.items.every((item) => item.blob === compressed)).toBe(true)
})

it('revokes removed and unmounted object previews but never existing server URLs', async () => {
  const { result, unmount } = setup(existing)
  await act(() => result.current.addFiles(files(2)))
  const urls = result.current.items.slice(1).map((item) => item.url)
  act(() => result.current.removeImage(result.current.items[1].id))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith(urls[0])
  act(() => result.current.removeImage(result.current.items[0].id))
  expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(existing[0].url)
  unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith(urls[1])
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
})

it('discards compression finishing after removal or unmount without creating a preview', async () => {
  let finish!: (blob: Blob) => void
  vi.mocked(compressImage).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const { result, unmount } = setup()
  let pending!: Promise<void>
  act(() => {
    pending = result.current.addFiles(files(1))
  })
  await waitFor(() => expect(compressImage).toHaveBeenCalledTimes(1))
  act(() => result.current.removeImage(result.current.items[0].id))
  unmount()
  await act(async () => {
    finish(compressed)
    await pending
  })
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})

it('reports per-image decode failure and rejects submission until invalid image is removed', async () => {
  vi.mocked(compressImage).mockRejectedValueOnce(new Error('تعذّر قراءة الصورة'))
  const { result } = setup()
  await act(() => result.current.addFiles(files(1)))
  expect(result.current.items[0]).toMatchObject({ status: 'failed', error: 'تعذّر قراءة الصورة' })
  await act(async () => {
    await expect(result.current.uploadAll()).rejects.toThrow('صالحة')
  })
  expect(getUploadUrls).not.toHaveBeenCalled()
})

it('uploads with concurrency two and preserves URL/path pairing and displayed mixed order', async () => {
  let active = 0
  let maximum = 0
  vi.mocked(uploadToSignedUrl).mockImplementation(async () => {
    active++
    maximum = Math.max(maximum, active)
    await new Promise((resolve) => setTimeout(resolve, 3))
    active--
  })
  const { result } = setup(existing)
  await act(() => result.current.addFiles(files(4)))
  let paths!: string[]
  await act(async () => {
    paths = await result.current.uploadAll()
  })
  const response = await vi.mocked(getUploadUrls).mock.results[0].value
  expect(maximum).toBe(2)
  expect(paths).toEqual([existing[0].path, ...response.imagePaths])
  expect(vi.mocked(uploadToSignedUrl).mock.calls.map(([url]) => url)).toEqual(response.uploadUrls)
  expect(result.current.progress).toEqual({ completed: 5, total: 5 })
})

it('retries only unconfirmed images, reuses failed URLs, and retains successes on later submission retries', async () => {
  vi.mocked(uploadToSignedUrl).mockRejectedValueOnce(new Error('network'))
  const { result } = setup()
  await act(() => result.current.addFiles(files(4)))
  await act(async () => {
    await expect(result.current.uploadAll()).rejects.toThrow('network')
  })
  const firstCalls = vi.mocked(uploadToSignedUrl).mock.calls.map(([url]) => url)
  expect(firstCalls).toHaveLength(2)
  expect(result.current.items[1].status).toBe('done')
  let paths!: string[]
  await act(async () => {
    paths = await result.current.uploadAll()
  })
  expect(getUploadUrls).toHaveBeenCalledTimes(1)
  const allCalls = vi.mocked(uploadToSignedUrl).mock.calls.map(([url]) => url)
  expect(allCalls.filter((url) => url === firstCalls[0])).toHaveLength(2)
  expect(allCalls.filter((url) => url === firstCalls[1])).toHaveLength(1)
  await act(async () => {
    expect(await result.current.uploadAll()).toEqual(paths)
  })
  expect(uploadToSignedUrl).toHaveBeenCalledTimes(5)
  expect(getUploadUrls).toHaveBeenCalledTimes(1)
})

it('refreshes only a known-expired pairing on retry', async () => {
  vi.mocked(uploadToSignedUrl).mockRejectedValueOnce(
    Object.assign(new Error('expired'), { expired: true }),
  )
  const { result } = setup()
  await act(() => result.current.addFiles(files(2)))
  await act(async () => {
    await expect(result.current.uploadAll()).rejects.toThrow('expired')
  })
  expect(result.current.items[0].uploadUrl).toBeUndefined()
  expect(result.current.items[1].status).toBe('done')
  await act(() => result.current.uploadAll())
  expect(vi.mocked(getUploadUrls).mock.calls).toEqual([[2], [1]])
  expect(uploadToSignedUrl).toHaveBeenCalledTimes(3)
})

it('never treats an ambiguous already-existing object as confirmed success', async () => {
  vi.mocked(uploadToSignedUrl).mockRejectedValueOnce(
    Object.assign(new Error('Asset Already Exists'), { ambiguous: true }),
  )
  const { result } = setup()
  await act(() => result.current.addFiles(files(1)))
  await act(async () => {
    await expect(result.current.uploadAll()).rejects.toThrow('لا يمكن تأكيد')
  })
  expect(result.current.items[0].status).toBe('failed')
  expect(result.current.items[0].uploadUrl).toBeTruthy()
  expect(result.current.error).toContain('احذفها وأضفها')
})

it('excludes removed existing and uploaded new paths without storage deletion', async () => {
  const { result } = setup(existing)
  await act(() => result.current.addFiles(files(2)))
  await act(() => result.current.uploadAll())
  const retained = result.current.items[2].path
  act(() => {
    result.current.removeImage(result.current.items[0].id)
    result.current.removeImage(result.current.items[0].id)
  })
  await act(async () => {
    expect(await result.current.uploadAll()).toEqual([retained])
  })
  expect(uploadToSignedUrl).toHaveBeenCalledTimes(2)
})

it('blocks add/remove and duplicate submissions while uploading', async () => {
  let finish!: () => void
  vi.mocked(uploadToSignedUrl).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const { result } = setup()
  await act(() => result.current.addFiles(files(1)))
  let pending!: Promise<string[]>
  act(() => {
    pending = result.current.uploadAll()
  })
  await waitFor(() => expect(uploadToSignedUrl).toHaveBeenCalledTimes(1))
  act(() => result.current.removeImage(result.current.items[0].id))
  await act(async () => {
    await result.current.addFiles(files(1))
    await expect(result.current.uploadAll()).rejects.toThrow('قيد التنفيذ')
  })
  expect(result.current.items).toHaveLength(1)
  await act(async () => {
    finish()
    await pending
  })
})

it('rejects malformed URL/path batches before uploading', async () => {
  vi.mocked(getUploadUrls).mockResolvedValueOnce({ uploadUrls: [], imagePaths: [] })
  const { result } = setup()
  await act(() => result.current.addFiles(files(1)))
  await act(async () => {
    await expect(result.current.uploadAll()).rejects.toThrow('روابط')
  })
  expect(uploadToSignedUrl).not.toHaveBeenCalled()
})
