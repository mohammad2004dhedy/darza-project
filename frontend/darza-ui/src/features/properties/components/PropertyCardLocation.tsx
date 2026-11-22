import { LocationLine } from './LocationLine'
import type { PropertyCardResponse } from '../../../types/api'

interface PropertyCardLocationProps {
  property: PropertyCardResponse
  id?: string
}

export function PropertyCardLocation({ property, id }: PropertyCardLocationProps) {
  return (
    <LocationLine id={id} townName={property.town.townName} cityName={property.town.cityName} />
  )
}
