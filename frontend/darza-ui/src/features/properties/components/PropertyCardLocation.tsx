import type { PropertyCardResponse } from '../../../types/api'

interface PropertyCardLocationProps {
  property: PropertyCardResponse
  id?: string
}

export function PropertyCardLocation({ property, id }: PropertyCardLocationProps) {
  return (
    <p id={id} className="text-sm text-text-muted">
      {property.town.cityName} - {property.town.townName}
    </p>
  )
}
