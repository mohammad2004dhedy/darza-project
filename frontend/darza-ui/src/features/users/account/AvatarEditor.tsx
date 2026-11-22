import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { ProfileAvatar } from '../components/ProfileAvatar'
import { getProfileUploadUrl, type AvatarChange } from './api'

interface Props {
  displayName: string
  originalUrl?: string
  value: AvatarChange
  onChange: (value: AvatarChange) => void
  onBusy: (busy: boolean) => void
  disabled: boolean
  uploading: boolean
}
export function AvatarEditor({
  displayName,
  originalUrl,
  value,
  onChange,
  onBusy,
  disabled,
  uploading,
}: Props) {
  const input = useRef<HTMLInputElement>(null)
  const mounted = useRef(true)
  const preview = useRef<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (preview.current) URL.revokeObjectURL(preview.current)
    }
  }, [])
  async function upload(file: File) {
    onBusy(true)
    setError(null)
    try {
      const [{ compressImage }, { uploadToSignedUrl }] = await Promise.all([
        import('../../property-form/imageCompress'),
        import('../../property-form/api'),
      ])
      const blob = await compressImage(file)
      const signed = await getProfileUploadUrl()
      if (
        signed.uploadUrls.length !== 1 ||
        signed.imagePaths.length !== 1 ||
        !signed.imagePaths[0]
      ) {
        throw new Error('تعذر تجهيز رفع الصورة')
      }
      await uploadToSignedUrl(signed.uploadUrls[0], blob)
      if (mounted.current) {
        if (preview.current) URL.revokeObjectURL(preview.current)
        preview.current = URL.createObjectURL(blob)
        onChange({ kind: 'uploaded', path: signed.imagePaths[0], url: preview.current })
      }
    } catch {
      if (mounted.current) setError('تعذر رفع الصورة، حاول مرة أخرى')
    } finally {
      if (mounted.current) onBusy(false)
    }
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <ProfileAvatar
        displayName={displayName}
        profileImageUrl={
          value.kind === 'uploaded' ? value.url : value.kind === 'removed' ? undefined : originalUrl
        }
      />
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="تغيير الصورة"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void upload(file)
        }}
      />
      <div className="flex gap-2">
        <Button
          variant="ghost"
          loading={uploading}
          disabled={disabled}
          onClick={() => input.current?.click()}
        >
          تغيير الصورة
        </Button>
        <Button
          variant="ghost"
          disabled={
            disabled || (value.kind !== 'uploaded' && (!originalUrl || value.kind === 'removed'))
          }
          onClick={() => {
            onChange({ kind: 'removed' })
            setError(null)
          }}
        >
          إزالة الصورة
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
