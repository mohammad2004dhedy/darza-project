import { ButtonLink } from '../../../components/ui/ButtonLink'
import { PropertyOwnerActions } from '../../property-form/components/PropertyOwnerActions'
import { useId } from 'react'
import { PropertyList, type PropertyListQuery } from '../../properties/components/PropertyList'

export function UserPropertiesSection({
  query,
  showStatus = false,
}: {
  query: PropertyListQuery
  showStatus?: boolean
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="space-y-6">
      <h2 id={headingId} className="text-2xl font-bold text-primary">
        {showStatus ? 'إعلاناتي' : 'الإعلانات'}
      </h2>
      <PropertyList
        query={query}
        renderActions={
          showStatus
            ? (property) => <PropertyOwnerActions property={property} compact />
            : undefined
        }
        emptyAction={
          showStatus ? <ButtonLink to="/properties/new">إنشاء إعلان</ButtonLink> : undefined
        }
        emptyTitle={showStatus ? 'لم تنشر أي إعلان بعد' : 'لا توجد إعلانات حالياً'}
        emptyDescription=""
      />
    </section>
  )
}
