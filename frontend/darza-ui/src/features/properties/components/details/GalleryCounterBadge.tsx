interface Props {
  index: number
  total: number
}

export function GalleryCounterBadge({ index, total }: Props) {
  if (total < 2) return null
  return (
    <span
      dir="ltr"
      aria-live="polite"
      className="absolute right-3 top-3 rounded-full bg-photo-viewer/80 px-3 py-1 text-sm text-on-primary tabular-nums"
    >
      {index + 1} / {total}
    </span>
  )
}
