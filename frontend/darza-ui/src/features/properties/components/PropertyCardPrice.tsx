import type { PropertyCardResponse } from '../../../types/api'
import { formatPrice, getRentPeriodLabel } from '../format'

interface PropertyCardPriceProps {
  property: PropertyCardResponse
  id?: string
}

export function PropertyCardPrice({ property, id }: PropertyCardPriceProps) {
  return (
    <p id={id} className="flex flex-wrap items-baseline gap-x-1 text-lg font-bold text-primary">
      <span>{formatPrice(property.price, property.currency)}</span>
      {property.listingType === 'RENT' && property.rentPeriod != null && (
        <span className="text-sm font-normal text-text-muted">
          {getRentPeriodLabel(property.rentPeriod)}
        </span>
      )}
    </p>
  )
}
