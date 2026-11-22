import { RejectionReason } from './RejectionReason'
import { Tag } from './Tag'
import { memo, useId, type ReactNode } from 'react'
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
  actions?: ReactNode
}

function PropertyCardView({ property, eager = false, actions }: PropertyCardProps) {
  const id = useId()
  return (
    <article className="relative h-full overflow-hidden rounded-lg border border-border bg-surface">
      {property.postingStatus && property.postingStatus !== 'APPROVED' && (
        <div
          aria-hidden="true"
          data-testid="status-overlay"
          className={`pointer-events-none absolute inset-0 z-10 ${property.postingStatus === 'REJECTED' ? 'bg-danger/5' : 'bg-text-muted/10'}`}
        />
      )}
      {actions && <div className="relative z-20 p-4">{actions}</div>}
      <div className="relative">
        <PropertyCardImage title={property.title} imageUrl={property.coverImageUrl} eager={eager} />
        <div className="pointer-events-none absolute start-3 top-3">
          <AvailabilityBadge isAvailable={property.isAvailable} />
        </div>
        {property.postingStatus && (
          <span
            className={`pointer-events-none absolute end-3 top-3 rounded-md px-2 py-1 text-sm font-bold ${
              {
                PENDING: 'bg-warning-soft text-warning',
                APPROVED: 'bg-success-soft text-success',
                REJECTED: 'bg-danger-soft text-danger',
              }[property.postingStatus]
            }`}
          >
            {
              { PENDING: 'قيد المراجعة', APPROVED: 'مقبول', REJECTED: 'مرفوض' }[
                property.postingStatus
              ]
            }
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <PropertyTypeBadge propertyType={property.propertyType} />
          <ListingTypeBadge listingType={property.listingType} />
          {property.listingType === 'RENT' && property.rentPeriod && (
            <Tag>
              {
                { HOURLY: 'بالساعة', DAILY: 'يومي', MONTHLY: 'شهري', YEARLY: 'سنوي' }[
                  property.rentPeriod
                ]
              }
            </Tag>
          )}
        </div>
        {property.postingStatus === 'REJECTED' && (
          <RejectionReason reason={property.rejectionReason} />
        )}
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
