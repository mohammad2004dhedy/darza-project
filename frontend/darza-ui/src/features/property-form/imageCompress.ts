export type ImageErrorCode = 'unsupported' | 'decode' | 'encode'

export class ImageError extends Error {
  readonly code: ImageErrorCode
  constructor(code: ImageErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'ImageError'
  }
}

export function scaledDimensions(width: number, height: number) {
  const scale = Math.min(1, 1600 / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export async function compressImage(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new ImageError('unsupported', 'نوع الصورة غير مدعوم. اختر صورة JPEG أو PNG أو WebP')
  }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new ImageError(
      'decode',
      'تعذر قراءة الصورة على هذا المتصفح. اختر صورة JPEG أو PNG أو WebP أخرى',
    )
  }
  try {
    const canvas = document.createElement('canvas')
    const size = scaledDimensions(bitmap.width, bitmap.height)
    canvas.width = size.width
    canvas.height = size.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas unavailable')
    context.drawImage(bitmap, 0, 0, size.width, size.height)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.8),
    )
    if (!blob || blob.type !== 'image/webp') {
      throw new Error('WebP encoding unavailable')
    }
    return blob
  } catch {
    throw new ImageError(
      'encode',
      'تعذر تحويل الصورة إلى WebP على هذا المتصفح. جرّب متصفحاً يدعم WebP',
    )
  } finally {
    bitmap.close()
  }
}
