import { ImageWithPlaceholder } from '../../../../components/ui/ImageWithPlaceholder'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect } from 'react'
import type { ImageResponse } from '../../../../types/api'
import { useGallery, usePhotoViewer } from '../../useGallery'
import { GalleryCounterBadge } from './GalleryCounterBadge'
import { GalleryThumbnails } from './GalleryThumbnails'

interface Props {
  images: ImageResponse[]
  title: string
  initialIndex: number
  onClose: () => void
}

export function PhotoViewer({ images, title, initialIndex, onClose }: Props) {
  const {
    index: currentIndex,
    track,
    goTo,
    onScroll,
    onKeyDown,
  } = useGallery(images.length, initialIndex)
  const { dialog, close } = usePhotoViewer(onClose)
  useEffect(() => {
    goTo(initialIndex, 'instant')
  }, [goTo, initialIndex])
  return (
    <dialog
      ref={dialog}
      dir="ltr"
      aria-label={`صور ${title}`}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onKeyDown={(event) => {
        event.stopPropagation()
        onKeyDown(event)
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-photo-viewer p-0 text-on-primary backdrop:bg-photo-viewer"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 justify-end p-3">
          <button
            type="button"
            autoFocus
            onClick={close}
            aria-label="إغلاق الصور"
            className="min-h-11 min-w-11 rounded-full p-3 text-2xl focus-visible:outline-2"
          >
            <X aria-hidden="true" size={24} />
          </button>
        </div>
        <div className="relative min-h-0 flex-1">
          <div
            ref={track}
            onScroll={onScroll}
            className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          >
            {images.map((image, index) => (
              <div key={`${image.path}-${index}`} className="h-full w-full shrink-0 snap-start">
                <ImageWithPlaceholder
                  src={image.url}
                  alt={`${title} — ${index + 1}`}
                  loading={Math.abs(index - currentIndex) <= 1 ? 'eager' : 'lazy'}
                  fetchPriority={index === currentIndex ? 'high' : 'auto'}
                  decoding="async"
                  containerClassName="h-full w-full"
                  className="h-full w-full object-contain"
                />
              </div>
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
                className="absolute top-1/2 left-3 hidden min-h-11 min-w-11 rounded-full bg-photo-viewer/80 p-3 disabled:opacity-40 md:block"
              >
                <ChevronLeft aria-hidden="true" size={20} />
              </button>
              <button
                type="button"
                aria-label="الصورة التالية"
                disabled={currentIndex === images.length - 1}
                onClick={() => goTo(currentIndex + 1)}
                className="absolute top-1/2 right-3 hidden min-h-11 min-w-11 rounded-full bg-photo-viewer/80 p-3 disabled:opacity-40 md:block"
              >
                <ChevronRight aria-hidden="true" size={20} />
              </button>
            </>
          )}
        </div>
        <div className="shrink-0">
          <GalleryThumbnails images={images} title={title} index={currentIndex} onSelect={goTo} />
        </div>
      </div>
    </dialog>
  )
}
