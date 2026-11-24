import { PublishedAt } from '../features/properties/components/PublishedAt'
import { BackButton } from '../components/ui/BackButton'
import { PropertyOwnerActions } from '../features/property-form/components/PropertyOwnerActions'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../context/auth'
import { ModerationBar } from '../features/admin/ModerationBar'
import { usePropertyDetails } from '../features/properties/hooks'
import { PropertyGallery } from '../features/properties/components/details/PropertyGallery'
import { PropertyHeader } from '../features/properties/components/details/PropertyHeader'
import { PropertyKeyFacts } from '../features/properties/components/details/PropertyKeyFacts'
import { PropertyDescription } from '../features/properties/components/details/PropertyDescription'
import { PropertyLocation } from '../features/properties/components/details/PropertyLocation'
import { PublisherCard } from '../features/properties/components/details/PublisherCard'
import { ContactBar } from '../features/properties/components/details/ContactBar'
import { OwnerStatusNotice } from '../features/properties/components/details/OwnerStatusNotice'
import { DetailsSkeleton } from '../features/properties/components/details/DetailsSkeleton'
import { DetailsNotFound } from '../features/properties/components/details/DetailsNotFound'
import { DetailsError } from '../features/properties/components/details/DetailsError'

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { data: property, isPending, notFound, isError, refetch } = usePropertyDetails(id)
  if (notFound) return <DetailsNotFound />
  if (isPending) return <DetailsSkeleton />
  if (isError || !property) return <DetailsError onRetry={() => void refetch()} />
  return (
    <article className="grid gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:pb-0 lg:[direction:rtl]">
      <div key={property.id} dir="rtl" className="min-w-0 space-y-6">
        {isAdmin && property.postingStatus === 'PENDING' && (
          <ModerationBar
            propertyId={property.id}
            onSuccess={() => navigate('/admin?tab=pending')}
          />
        )}
        <OwnerStatusNotice property={property} />
        <BackButton />
        <PropertyGallery images={property.images} title={property.title} />
        <PropertyHeader property={property} />
        <PublishedAt iso={property.approvedAt} details />
        <PropertyOwnerActions property={property} />
        <PropertyKeyFacts property={property} />
        <PropertyDescription description={property.description} />
        <PropertyLocation property={property} />
      </div>
      <aside
        dir="rtl"
        className="space-y-4 lg:col-start-2 lg:row-start-1 lg:self-start lg:sticky lg:top-24"
      >
        <ContactBar property={property} />
        <PublisherCard user={property.user} />
      </aside>
    </article>
  )
}
