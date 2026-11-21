import type { ImageResponse } from '../../../../types/api'
import { GalleryImage } from './GalleryImage'

interface Props {
  images: ImageResponse[]
  title: string
  index: number
  onSelect: (index: number) => void
}

export function GalleryThumbnails({ images, title, index, onSelect }: Props) {
  if (images.length < 2) return null
  return (
    <div dir="ltr" className="flex gap-2 overflow-x-auto p-2" aria-label="الصور المصغرة">
      {images.map((image, position) => (
        <button
          key={`${image.path}-${position}`}
          type="button"
          onClick={() => onSelect(position)}
          aria-label={`عرض الصورة ${position + 1}`}
          aria-current={index === position ? 'true' : undefined}
          className={`cursor-pointer h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${index === position ? 'border-primary' : 'border-transparent'}`}
        >
          <GalleryImage
            imageUrl={image.url}
            alt={`${title} — ${position + 1}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </button>
      ))}
    </div>
  )
}
