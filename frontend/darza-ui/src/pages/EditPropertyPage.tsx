import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../context/auth'
import { getPropertyDetails } from '../features/properties/api'
import { DetailsError } from '../features/properties/components/details/DetailsError'
import { DetailsNotFound } from '../features/properties/components/details/DetailsNotFound'
import { DetailsSkeleton } from '../features/properties/components/details/DetailsSkeleton'
import { PropertyWizard } from '../features/property-form/components/PropertyWizard'
import { usePropertyWizard } from '../features/property-form/usePropertyWizard'
import { isOwner } from '../features/users/isOwner'
import type { PropertyDetailsResponse } from '../types/api'

function EditForm({ property }: { property: PropertyDetailsResponse }) {
  const wizard = usePropertyWizard(property)
  return <PropertyWizard wizard={wizard} />
}

export default function EditPropertyPage() {
  const { id } = useParams()
  const { userId } = useAuth()
  const validId = !!id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
  const query = useQuery({
    queryKey: ['properties', 'details', id],
    queryFn: () => getPropertyDetails(Number(id)),
    enabled: validId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  })
  if (!validId || (query.error instanceof ApiError && [400, 403, 404].includes(query.error.status)))
    return <DetailsNotFound />
  if (query.isError) return <DetailsError onRetry={() => void query.refetch()} />
  if (!query.isFetchedAfterMount || !query.data) return <DetailsSkeleton />
  if (!isOwner(userId, query.data.user.id))
    return (
      <p role="alert" className="py-16 text-center">
        لا يمكنك تعديل إعلان لا تملكه
      </p>
    )
  return <EditForm key={id} property={query.data} />
}
