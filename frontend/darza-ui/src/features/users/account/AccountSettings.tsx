import { useMyProfile } from '../hooks'
import { ProfileSkeleton } from '../components/ProfileSkeleton'
import { ProfileError } from '../components/ProfileError'
import { AccountForm } from './AccountForm'

export function AccountSettings() {
  const profile = useMyProfile()
  if (profile.isPending) return <ProfileSkeleton />
  if (profile.isError) return <ProfileError onRetry={() => void profile.refetch()} />
  return <AccountForm key={profile.data.id} profile={profile.data} />
}
