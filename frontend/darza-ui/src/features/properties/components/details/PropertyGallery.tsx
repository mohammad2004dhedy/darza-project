import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { ImageResponse } from '../../../../types/api'
import { useDesktopGallery, useGallery } from '../../useGallery'
import { GalleryCounterBadge } from './GalleryCounterBadge'
import { GalleryThumbnails } from './GalleryThumbnails'
import { PhotoViewer } from './PhotoViewer'

interface Props {
  images: ImageResponse[]
  title: string
}

export function PropertyGallery({ images, title }: Props) {
  const { index: currentIndex, track, goTo, onScroll, onKeyDown } = useGallery(images.length)
  const desktop = useDesktopGallery()
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  if (!images.length)
    return (
      <div
        className="aspect-4/3 rounded-xl bg-background"
        role="img"
        aria-label="لا توجد صورة للعقار"
      />
    )
  return (
    <section dir="ltr" aria-label="صور العقار" onKeyDown={onKeyDown}>
      <div className="relative overflow-hidden rounded-xl">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none]"
        >
          {images.map((image, index) => (
            <button
              key={`${image.path}-${index}`}
              type="button"
              onClick={() => setViewerIndex(index)}
              aria-label={`تكبير الصورة ${index + 1}`}
              className={`relative aspect-4/3 max-h-[36rem] shrink-0 snap-start overflow-hidden lg:aspect-16/9 ${images.length > 1 ? 'w-[92%] md:w-full' : 'w-full'}`}
            >
              <img
                src={image.url}
                alt={`${title} — ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : undefined}
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
        <GalleryCounterBadge index={currentIndex} total={images.length} />
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="الصورة السابقة"
              disabled={currentIndex === 0}
              onClick={() => goTo(currentIndex - 1)}
              className="absolute top-1/2 left-3 hidden -translate-y-1/2 min-h-11 min-w-11 rounded-full bg-photo-viewer/80 p-3 text-on-primary disabled:opacity-40 md:block"
            >
              <ChevronLeft aria-hidden="true" size={20} />
            </button>
            <button
              type="button"
              aria-label="الصورة التالية"
              disabled={currentIndex === images.length - 1}
              onClick={() => goTo(currentIndex + 1)}
              className="absolute top-1/2 right-3 hidden -translate-y-1/2 min-h-11 min-w-11 rounded-full bg-photo-viewer/80 p-3 text-on-primary disabled:opacity-40 md:block"
            >
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          </>
        )}
      </div>
      {desktop && (
        <GalleryThumbnails images={images} title={title} index={currentIndex} onSelect={goTo} />
      )}
      {viewerIndex !== null && (
        <PhotoViewer
          images={images}
          title={title}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </section>
  )
}
