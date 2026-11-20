import { Bath, BedDouble, Fence, Ruler, Sofa } from 'lucide-react'
import type { PropertyDetailsResponse } from '../../../../types/api'
import { KeyFactTile } from './KeyFactTile'
export function PropertyKeyFacts({ property }: { property: PropertyDetailsResponse }) {
  const isLand = property.propertyType === 'LAND'
  return (
    <section aria-label="مواصفات العقار" className="grid grid-cols-3 gap-3">
      {property.areaSize != null && (
        <KeyFactTile icon={Ruler} value={property.areaSize} label="المساحة (م²)" />
      )}
      {!isLand && (
        <>
          {property.rooms != null && (
            <KeyFactTile icon={BedDouble} value={property.rooms} label="غرف" />
          )}
          {property.bathrooms != null && (
            <KeyFactTile icon={Bath} value={property.bathrooms} label="حمامات" />
          )}
          {property.furnished != null && (
            <KeyFactTile
              icon={Sofa}
              value={property.furnished ? 'مفروش' : 'غير مفروش'}
              label="الأثاث"
            />
          )}
          {property.hasBalcony === true && (
            <KeyFactTile icon={Fence} value="شرفة" label="مساحة خارجية" />
          )}
        </>
      )}
    </section>
  )
}
