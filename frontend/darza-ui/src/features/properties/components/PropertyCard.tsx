import { memo, useId } from 'react'
import { Link } from 'react-router'
import type { PropertyCardResponse } from '../../../types/api'
import { AvailabilityBadge } from './AvailabilityBadge'
import { ListingTypeBadge, PropertyTypeBadge } from './PropertyCardBadges'
import { PropertyCardImage } from './PropertyCardImage'
import { PropertyCardLocation } from './PropertyCardLocation'
import { PropertyCardMeta } from './PropertyCardMeta'
import { PropertyCardPrice } from './PropertyCardPrice'
import { PropertyCardPublisher } from './PropertyCardPublisher'

export interface PropertyCardProps {
  property: PropertyCardResponse
  eager?: boolean
}

function PropertyCardView({ property, eager = false }: PropertyCardProps) {
  const id = useId()
  return (
    <article className="relative h-full overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative">
        <PropertyCardImage title={property.title} imageUrl={property.coverImageUrl} eager={eager} />
        <div className="pointer-events-none absolute right-3 top-3">
          <AvailabilityBadge isAvailable={property.isAvailable} />
        </div>
        <div className="pointer-events-none absolute left-3 top-3">
          <ListingTypeBadge listingType={property.listingType} />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <PropertyTypeBadge propertyType={property.propertyType} />
        <h2 className="line-clamp-2 font-bold text-text">
          <Link
            to={`/properties/${property.id}`}
            aria-describedby={`${id}-price ${id}-location`}
            className="focus-visible:outline-primary after:absolute after:inset-0"
          >
            {property.title}
          </Link>
        </h2>
        <PropertyCardPrice property={property} id={`${id}-price`} />
        <PropertyCardMeta property={property} />
        <PropertyCardLocation property={property} id={`${id}-location`} />
        <PropertyCardPublisher user={property.user} />
      </div>
    </article>
  )
}

export const PropertyCard = memo(PropertyCardView)
