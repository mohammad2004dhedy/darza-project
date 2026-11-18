import type { PropertyCardResponse } from '../../../types/api'
import { getListingTypeLabel, getPropertyTypeLabel } from '../format'

interface PropertyCardBadgesProps {
  property: PropertyCardResponse
}

export function PropertyCardBadges({ property }: PropertyCardBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-md bg-background px-2 py-1 text-xs text-text">
        {getPropertyTypeLabel(property.propertyType)}
      </span>
      <span className="rounded-md bg-primary px-2 py-1 text-xs text-on-primary">
        {getListingTypeLabel(property.listingType)}
      </span>
    </div>
  )
}
