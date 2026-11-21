import { Ruler, BedDouble, Bath } from 'lucide-react'
import type { PropertyCardResponse } from '../../../types/api'

export function PropertyCardMeta({ property }: { property: PropertyCardResponse }) {
  const details = [
    { value: property.areaSize, text: 'م²', Icon: Ruler },
    {
      value: property.propertyType === 'LAND' ? null : property.rooms,
      text: 'غرف',
      Icon: BedDouble,
    },
    {
      value: property.propertyType === 'LAND' ? null : property.bathrooms,
      text: 'حمامات',
      Icon: Bath,
    },
  ].filter(({ value }) => value != null)
  if (!details.length) return null
  return (
    <p className="flex flex-wrap gap-2 text-sm text-primary">
      {details.map(({ value, text, Icon }) => (
        <span
          key={text}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1"
        >
          <Icon aria-hidden="true" className="size-4" />
          {value} {text}
        </span>
      ))}
    </p>
  )
}
