import { ImageWithPlaceholder } from '../../../components/ui/ImageWithPlaceholder'

interface PropertyCardImageProps {
  title: string
  imageUrl?: string | null
  eager?: boolean
}

export function PropertyCardImage({ title, imageUrl, eager = false }: PropertyCardImageProps) {
  return (
    <ImageWithPlaceholder
      src={imageUrl ?? undefined}
      alt={title}
      width={640}
      height={480}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      containerClassName="aspect-[4/3] w-full"
      placeholderLabel="لا توجد صورة للعقار"
    />
  )
}
