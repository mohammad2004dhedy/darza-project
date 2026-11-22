import { Tag } from './Tag'
import { Tag as TagIcon, KeyRound } from 'lucide-react'
import { propertyIcons } from '../propertyIcons'
import type { PropertyCardResponse, PropertyType, ListingType } from '../../../types/api'
import { getListingTypeLabel, getPropertyTypeLabel } from '../format'

export function PropertyTypeBadge({ propertyType }: { propertyType: PropertyType }) {
  const Icon = propertyIcons[propertyType]
  return (
    <Tag>
      <Icon aria-hidden="true" className="size-4" />
      {getPropertyTypeLabel(propertyType)}
    </Tag>
  )
}

export function ListingTypeBadge({ listingType }: { listingType: ListingType }) {
  const Icon = listingType === 'SELL' ? TagIcon : KeyRound
  return (
    <Tag>
      <Icon aria-hidden="true" className="size-4" />
      {getListingTypeLabel(listingType)}
    </Tag>
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
