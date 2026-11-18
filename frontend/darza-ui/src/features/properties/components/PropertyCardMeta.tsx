import type { PropertyCardResponse } from '../../../types/api'

interface PropertyCardMetaProps {
  property: PropertyCardResponse
}

export function PropertyCardMeta({ property }: PropertyCardMetaProps) {
  const details = [
    property.areaSize != null ? `${property.areaSize} م²` : null,
    property.propertyType !== 'LAND' && property.rooms != null ? `${property.rooms} غرف` : null,
    property.propertyType !== 'LAND' && property.bathrooms != null
      ? `${property.bathrooms} حمامات`
      : null,
  ].filter((detail): detail is string => detail !== null)

  if (details.length === 0) return null

  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted">
      {details.map((detail) => (
        <span key={detail}>{detail}</span>
      ))}
    </p>
  )
}
