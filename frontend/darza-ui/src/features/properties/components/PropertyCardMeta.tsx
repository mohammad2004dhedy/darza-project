import type { PropertyCardResponse } from '../../../types/api'

interface PropertyCardMetaProps {
  property: PropertyCardResponse
}

export function PropertyCardMeta({ property }: PropertyCardMetaProps) {
  const details = [
    property.areaSize != null && `${property.areaSize} م²`,
    property.rooms != null && `${property.rooms} غرف`,
    property.bathrooms != null && `${property.bathrooms} حمامات`,
  ].filter(Boolean)

  if (details.length === 0) return null

  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-muted">
      {details.map((detail) => (
        <span key={detail}>{detail}</span>
      ))}
    </p>
  )
}
