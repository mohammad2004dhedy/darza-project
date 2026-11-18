import { memo } from 'react'
import { Link } from 'react-router'
import type { PropertyCardResponse } from '../../../types/api'
import { PropertyCardBadges } from './PropertyCardBadges'
import { PropertyCardImage } from './PropertyCardImage'
import { PropertyCardLocation } from './PropertyCardLocation'
import { PropertyCardMeta } from './PropertyCardMeta'
import { PropertyCardPrice } from './PropertyCardPrice'

export interface PropertyCardProps {
  property: PropertyCardResponse
  eager?: boolean
}

function PropertyCardView({ property, eager = false }: PropertyCardProps) {
  return (
    <Link
      to={`/properties/${property.id}`}
      aria-label={property.title}
      className="block overflow-hidden rounded-lg border border-border bg-surface focus-visible:outline-primary"
    >
      <PropertyCardImage title={property.title} imageUrl={property.coverImageUrl} eager={eager} />
      <article className="space-y-3 p-4">
        <PropertyCardBadges property={property} />
        <h2 className="line-clamp-2 font-bold text-text">{property.title}</h2>
        <PropertyCardPrice property={property} />
        <PropertyCardMeta property={property} />
        <PropertyCardLocation property={property} />
      </article>
    </Link>
  )
}

export const PropertyCard = memo(PropertyCardView)
