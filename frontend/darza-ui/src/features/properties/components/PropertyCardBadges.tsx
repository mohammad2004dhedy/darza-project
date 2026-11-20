import { Building2, House, Castle, LandPlot, Store, Shapes, Tag, KeyRound } from 'lucide-react'
import type { PropertyCardResponse, PropertyType, ListingType } from '../../../types/api'
import { getListingTypeLabel, getPropertyTypeLabel } from '../format'

const icons = {
  APARTMENT: Building2,
  HOUSE: House,
  VILLA: Castle,
  LAND: LandPlot,
  COMMERCIAL: Store,
  OTHER: Shapes,
}

export function PropertyTypeBadge({ propertyType }: { propertyType: PropertyType }) {
  const Icon = icons[propertyType]
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-sm font-semibold text-text">
      <Icon aria-hidden="true" className="size-4" />
      {getPropertyTypeLabel(propertyType)}
    </span>
  )
}

export function ListingTypeBadge({ listingType }: { listingType: ListingType }) {
  const Icon = listingType === 'SELL' ? Tag : KeyRound
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-on-primary">
      <Icon aria-hidden="true" className="size-4" />
      {getListingTypeLabel(listingType)}
    </span>
  )
}

export function PropertyCardBadges({ property }: { property: PropertyCardResponse }) {
  return (
    <div className="flex flex-wrap gap-2">
      <PropertyTypeBadge propertyType={property.propertyType} />
      <ListingTypeBadge listingType={property.listingType} />
    </div>
  )
}
