import { MapPin } from 'lucide-react'

export function LocationLine({
  townName,
  cityName,
  id,
}: {
  townName: string
  cityName: string
  id?: string
}) {
  return (
    <p id={id} className="flex min-w-0 items-center gap-1 text-sm text-text-muted">
      <MapPin className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">
        <bdi>{townName}</bdi>، <bdi>{cityName}</bdi>
      </span>
    </p>
  )
}
