import { ApiError } from '../../../api/client'
import { usePublicProfile, useUserProperties } from '../hooks'
import { ProfileContactActions } from './ProfileContactActions'
import { ProfileError } from './ProfileError'
import { ProfileHeader } from './ProfileHeader'
import { ProfileNotFound } from './ProfileNotFound'
import { ProfileSkeleton } from './ProfileSkeleton'
import { UserPropertiesSection } from './UserPropertiesSection'

export function PublicProfileView({ id }: { id: number }) {
  const profile = usePublicProfile(id)
  const properties = useUserProperties(id)
  if (profile.isPending) return <ProfileSkeleton />
  if (profile.error instanceof ApiError && profile.error.status === 404) return <ProfileNotFound />
  if (profile.isError) return <ProfileError onRetry={() => void profile.refetch()} />

  return (
    <div className="space-y-6">
      <ProfileHeader user={profile.data} />
      <ProfileContactActions phoneNumber={profile.data.phoneNumber} />
      <UserPropertiesSection query={properties} />
    </div>
  )
}
