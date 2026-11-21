import { useState } from 'react'
import { ImageOff } from 'lucide-react'

interface Props {
  imageUrl: string
  alt: string
  className: string
  loading: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
}

export function GalleryImage({ imageUrl, alt, className, loading, fetchPriority }: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  if (!imageUrl || imageUrl === failedUrl) {
    return (
      <div
        role="img"
        aria-label="لا توجد صورة للعقار"
        className={`${className} flex items-center justify-center bg-background`}
      >
        <ImageOff aria-hidden="true" className="size-5 text-text-muted" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      onError={() => setFailedUrl(imageUrl)}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
    />
  )
}
