import type { PropertyDetailsResponse } from '../../../../types/api'
import { AvailabilityBadge } from '../AvailabilityBadge'
import { PropertyCardBadges } from '../PropertyCardBadges'
import { PropertyCardPrice } from '../PropertyCardPrice'
import { ShareButton } from './ShareButton'
export function PropertyHeader({ property }: { property: PropertyDetailsResponse }) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <AvailabilityBadge isAvailable={property.isAvailable} />
        <PropertyCardBadges property={property} />
      </div>
      <div className="flex items-start justify-between gap-3">
        <h1 className="min-w-0 break-words text-2xl font-bold">{property.title}</h1>
        <ShareButton property={property} />
      </div>
      <PropertyCardPrice property={property} />
    </header>
  )
}
