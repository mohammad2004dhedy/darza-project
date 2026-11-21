import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { ImageResponse } from '../../types/api'
import { getUploadUrls, uploadToSignedUrl } from './api'
import { compressImage } from './imageCompress'

export type ImageStatus = 'processing' | 'ready' | 'pending' | 'uploading' | 'done' | 'failed'

export interface UploadImage {
  id: string
  kind: 'existing' | 'new'
  path?: string
  url: string
  blob?: Blob
  status: ImageStatus
  uploadUrl?: string
  error?: string
}

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'تعذّر رفع الصورة. يرجى المحاولة مجدداً'

export function useImageUploader(existingImages: readonly ImageResponse[] = []) {
  const [items, setItems] = useState<UploadImage[]>(() =>
    existingImages.map((image) => ({
      id: crypto.randomUUID(),
      kind: 'existing',
      path: image.path,
      url: image.url,
      status: 'done',
    })),
  )
  const current = useRef(items)
  const mounted = useRef(true)
  const objectUrls = useRef(new Set<string>())
  const queue = useRef(Promise.resolve())
  const uploading = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      for (const url of objectUrls.current) URL.revokeObjectURL(url)
      objectUrls.current.clear()
    }
  }, [])

  function publish(next: UploadImage[]) {
    current.current = next
    if (mounted.current) setItems(next)
  }

  function patch(id: string, update: Partial<UploadImage>) {
    publish(current.current.map((item) => (item.id === id ? { ...item, ...update } : item)))
  }

  function addFiles(files: FileList | readonly File[]): Promise<void> {
    if (uploading.current || !mounted.current) return Promise.resolve()
    const selected = Array.from(files)
    const accepted = selected.slice(0, Math.max(0, 8 - current.current.length))
    setError(accepted.length < selected.length ? 'يمكن إضافة 8 صور كحد أقصى' : null)
    const additions: UploadImage[] = accepted.map(() => ({
      id: crypto.randomUUID(),
      kind: 'new',
      url: '',
      status: 'processing',
    }))
    publish([...current.current, ...additions])
    queue.current = queue.current.then(async () => {
      for (const [index, item] of additions.entries()) {
        if (!mounted.current) return
        if (current.current.some((entry) => entry.id === item.id)) {
          try {
            const blob = await compressImage(accepted[index])
            if (mounted.current && current.current.some((entry) => entry.id === item.id)) {
              const url = URL.createObjectURL(blob)
              objectUrls.current.add(url)
              patch(item.id, { blob, url, status: 'ready' })
            }
          } catch (cause) {
            if (mounted.current) patch(item.id, { status: 'failed', error: message(cause) })
          }
        }
        await pause()
      }
    })
    return queue.current
  }

  function removeImage(id: string) {
    if (uploading.current || !mounted.current) return
    const image = current.current.find((item) => item.id === id)
    if (image?.kind === 'new' && objectUrls.current.delete(image.url)) {
      URL.revokeObjectURL(image.url)
    }
    publish(current.current.filter((item) => item.id !== id))
  }

  const mutation = useMutation({
    retry: false,
    mutationFn: async (): Promise<string[]> => {
      const snapshot = current.current
      if (
        snapshot.length < 1 ||
        snapshot.length > 8 ||
        snapshot.some((item) => item.status === 'processing' || (item.kind === 'new' && !item.blob))
      ) {
        throw new Error('أضف من 1 إلى 8 صور صالحة وانتظر اكتمال معالجتها')
      }
      const missing = snapshot.filter((item) => item.kind === 'new' && item.status !== 'done')
      const needsUrls = missing.filter((item) => !item.path || !item.uploadUrl)
      if (needsUrls.length) {
        const response = await getUploadUrls(needsUrls.length)
        if (
          response.uploadUrls.length !== needsUrls.length ||
          response.imagePaths.length !== needsUrls.length ||
          response.uploadUrls.some((url) => !url.trim()) ||
          response.imagePaths.some((path) => !path.trim()) ||
          new Set(response.imagePaths).size !== response.imagePaths.length
        ) {
          throw new Error('تعذّر تجهيز روابط رفع الصور. يرجى المحاولة مجدداً')
        }
        needsUrls.forEach((item, index) =>
          patch(item.id, {
            uploadUrl: response.uploadUrls[index],
            path: response.imagePaths[index],
            status: 'pending',
            error: undefined,
          }),
        )
      }
      let next = 0
      let failed = false
      let failure: unknown
      async function worker() {
        while (!failed && mounted.current && next < missing.length) {
          const id = missing[next++].id
          const item = current.current.find((image) => image.id === id)!
          patch(id, { status: 'uploading', error: undefined })
          try {
            await uploadToSignedUrl(item.uploadUrl!, item.blob!)
            patch(id, { status: 'done' })
          } catch (cause) {
            const uploadError = cause as { expired?: boolean; ambiguous?: boolean } | null
            const text = uploadError?.ambiguous
              ? 'قد تكون الصورة قد رُفعت رغم انقطاع الاتصال، لكن لا يمكن تأكيد نجاحها. احذفها وأضفها مجدداً؛ لن نستبدل الملف الموجود'
              : message(cause)
            failed = true
            failure = new Error(text)
            patch(id, {
              status: 'failed',
              error: text,
              ...(uploadError?.expired ? { uploadUrl: undefined, path: undefined } : {}),
            })
          }
        }
      }
      await Promise.all([worker(), worker()])
      if (failed) throw failure
      if (!mounted.current) throw new Error('تم إلغاء رفع الصور')
      const paths = current.current.map((item) => item.path)
      if (paths.some((path) => !path?.trim()) || new Set(paths).size !== paths.length) {
        throw new Error('مسارات الصور غير صالحة أو مكررة')
      }
      return paths as string[]
    },
  })

  async function uploadAll(): Promise<string[]> {
    if (uploading.current) throw new Error('رفع الصور قيد التنفيذ')
    uploading.current = true
    if (mounted.current) setError(null)
    try {
      return await mutation.mutateAsync()
    } catch (cause) {
      if (mounted.current) setError(message(cause))
      throw cause
    } finally {
      uploading.current = false
    }
  }

  return {
    items,
    addFiles,
    removeImage,
    uploadAll,
    isProcessing: items.some((item) => item.status === 'processing'),
    isUploading: mutation.isPending,
    progress: { completed: items.filter((item) => item.status === 'done').length, total: items.length },
    error,
  }
}
