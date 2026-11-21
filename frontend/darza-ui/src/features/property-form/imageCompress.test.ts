// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { compressImage, ImageError, scaledDimensions } from './imageCompress'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it.each([
  [3200, 2000, 1600, 1000],
  [800, 400, 800, 400],
  [1000, 2000, 800, 1600],
])('scales %i × %i without upscaling', (w, h, width, height) => {
  expect(scaledDimensions(w, h)).toEqual({ width, height })
})
function setup(blob: Blob | null) {
  const close = vi.fn()
  const bitmap = { width: 3200, height: 2000, close }
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
  const drawImage = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage,
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(blob))
  return { close, drawImage, bitmap }
}
it('honors orientation, draws scaled bitmap, encodes WebP and closes', async () => {
  const blob = new Blob(['webp'], { type: 'image/webp' })
  const { close, drawImage, bitmap } = setup(blob)
  const file = new File(['png'], 'a.png', { type: 'image/png' })
  expect(await compressImage(file)).toBe(blob)
  expect(createImageBitmap).toHaveBeenCalledWith(file, { imageOrientation: 'from-image' })
  expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1600, 1000)
  expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
    expect.any(Function),
    'image/webp',
    0.8,
  )
  expect(close).toHaveBeenCalledOnce()
})
it.each([null, new Blob(['jpeg'], { type: 'image/jpeg' })])(
  'rejects failed/non-WebP encoding and closes bitmap',
  async (blob) => {
    const { close } = setup(blob)
    await expect(compressImage(new File(['x'], 'x', { type: 'image/jpeg' }))).rejects.toMatchObject(
      { code: 'encode' },
    )
    expect(close).toHaveBeenCalledOnce()
  },
)
it('rejects unsupported types before decode', async () => {
  const decode = vi.fn()
  vi.stubGlobal('createImageBitmap', decode)
  await expect(
    compressImage(new File(['x'], 'x.heic', { type: 'image/heic' })),
  ).rejects.toBeInstanceOf(ImageError)
  expect(decode).not.toHaveBeenCalled()
})
it('returns typed Arabic decode error', async () => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error()))
  await expect(
    compressImage(new File(['x'], 'x.png', { type: 'image/png' })),
  ).rejects.toMatchObject({ code: 'decode', message: expect.stringContaining('تعذر قراءة الصورة') })
})
