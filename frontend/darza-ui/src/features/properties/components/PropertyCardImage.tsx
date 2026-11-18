import { ImageOff } from 'lucide-react'

interface PropertyCardImageProps {
  title: string
  imageUrl?: string | null
  eager?: boolean
}

export function PropertyCardImage({ title, imageUrl, eager = false }: PropertyCardImageProps) {
  if (!imageUrl) {
    return (
      <div
        role="img"
        aria-label="لا توجد صورة للعقار"
        className="flex aspect-[4/3] items-center justify-center bg-background"
      >
        <ImageOff aria-hidden="true" className="size-5 text-text-muted" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      width={640}
      height={480}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className="aspect-[4/3] w-full object-cover"
    />
  )
}
