import { ImageWithPlaceholder } from '../../../../components/ui/ImageWithPlaceholder'
import { useEffect, useRef } from 'react'
import type { ImageResponse } from '../../../../types/api'

interface Props {
  images: ImageResponse[]
  title: string
  index: number
  onSelect: (index: number) => void
}

export function GalleryThumbnails({ images, title, index, onSelect }: Props) {
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = strip.current
    const thumbnail = element?.children[index] as HTMLElement | undefined
    if (!element || !thumbnail) return
    const bounds = element.getBoundingClientRect()
    const item = thumbnail.getBoundingClientRect()
    const delta = item.left < bounds.left ? item.left - bounds.left
      : item.right > bounds.right ? item.right - bounds.right : 0
    if (delta) element.scrollTo({ left: element.scrollLeft + delta, behavior: 'instant' })
  }, [index])
  if (images.length < 2) return null
  return (
    <div ref={strip} dir="ltr" className="flex gap-2 overflow-x-auto p-2" aria-label="الصور المصغرة">
      {images.map((image, position) => (
        <button
          key={`${image.path}-${position}`}
          type="button"
          onClick={() => onSelect(position)}
          aria-label={`عرض الصورة ${position + 1}`}
          aria-current={index === position ? 'true' : undefined}
          className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${index === position ? 'border-primary' : 'border-transparent'}`}
        >
          <ImageWithPlaceholder
            src={image.url}
            alt={`${title} — ${position + 1}`}
            loading="lazy"
            decoding="async"
            containerClassName="h-full w-full"
          />
        </button>
      ))}
    </div>
  )
}
