interface PropertyCardImageProps {
  title: string
  imageUrl?: string | null
  eager?: boolean
}

export function PropertyCardImage({ title, imageUrl, eager = false }: PropertyCardImageProps) {
  if (!imageUrl) {
    return <div aria-label="لا توجد صورة للعقار" className="aspect-video bg-background" />
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      width={640}
      height={360}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className="aspect-video w-full object-cover"
    />
  )
}
