import type { PropertyCardResponse } from '../../../types/api'

interface PropertyCardLocationProps {
  property: PropertyCardResponse
}

export function PropertyCardLocation({ property }: PropertyCardLocationProps) {
  return (
    <p className="text-sm text-text-muted">
      {property.town.cityName} - {property.town.townName}
    </p>
  )
}
