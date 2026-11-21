import { Share2 } from 'lucide-react'
import type { PropertyDetailsResponse } from '../../../../types/api'
import { useShareProperty } from '../../useShareProperty'

export function ShareButton({ property }: { property: PropertyDetailsResponse }) {
  const share = useShareProperty(
    property.id,
    property.title,
    property.town.townName,
    property.town.cityName,
  )
  return (
    <button
      type="button"
      onClick={share}
      aria-label="مشاركة"
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-primary"
    >
      <Share2 className="size-5" aria-hidden="true" />
    </button>
  )
}
