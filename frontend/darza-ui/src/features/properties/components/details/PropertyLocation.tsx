import { MapPin } from 'lucide-react'
import type { PropertyDetailsResponse } from '../../../../types/api'
export function PropertyLocation({ property }: { property: PropertyDetailsResponse }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">الموقع</h2>
      <p>
        {property.town.townName}، {property.town.cityName}
      </p>
      {property.address && <p>{property.address}</p>}
      {property.latitude != null && property.longitude != null && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
        >
          <MapPin className="size-5" aria-hidden="true" />
          افتح في خرائط جوجل
        </a>
      )}
    </section>
  )
}
