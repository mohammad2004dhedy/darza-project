import { ApiError } from '../../../api/client'
import { useMyProfile, useMyProperties } from '../hooks'
import { LogoutButton } from './LogoutButton'
import { MyAccountInfo } from './MyAccountInfo'
import { ProfileError } from './ProfileError'
import { ProfileHeader } from './ProfileHeader'
import { ProfileNotFound } from './ProfileNotFound'
import { ProfileSkeleton } from './ProfileSkeleton'
import { UserPropertiesSection } from './UserPropertiesSection'

export function MyProfileView() {
  const profile = useMyProfile()
  const properties = useMyProperties()
  if (profile.isPending) return <ProfileSkeleton isMyProfile />
  if (profile.error instanceof ApiError && profile.error.status === 404) return <ProfileNotFound />
  if (profile.isError) return <ProfileError onRetry={() => void profile.refetch()} />

  return (
    <div className="space-y-6">
      <ProfileHeader user={profile.data} />
      <MyAccountInfo user={profile.data} />
      <LogoutButton />
      <UserPropertiesSection query={properties} showStatus />
    </div>
  )
}
