import { LocationLine } from '../LocationLine'
import { ButtonLink } from '../../../../components/ui/ButtonLink'
import { MapPin } from 'lucide-react'
import { PropertyMapPreview } from './PropertyMapPreview'
import type { PropertyDetailsResponse } from '../../../../types/api'
export function PropertyLocation({ property }: { property: PropertyDetailsResponse }) {
  const hasCoordinates = property.latitude != null && property.longitude != null
  const mapsUrl = hasCoordinates ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}` : ''
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">الموقع</h2>
      <LocationLine townName={property.town.townName} cityName={property.town.cityName} />
      {property.address && <p>{property.address}</p>}
      {hasCoordinates && (
        <>
          <ButtonLink href={mapsUrl} target="_blank" variant="outline">
            <MapPin className="size-5" aria-hidden="true" />
            افتح في خرائط جوجل
          </ButtonLink>
          <PropertyMapPreview latitude={property.latitude!} longitude={property.longitude!} mapsUrl={mapsUrl} />
        </>
      )}
    </section>
  )
}
