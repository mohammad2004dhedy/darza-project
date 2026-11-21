import { useProfilePage } from '../features/users/hooks'
import { MyProfileView } from '../features/users/components/MyProfileView'
import { PublicProfileView } from '../features/users/components/PublicProfileView'
import { ProfileNotFound } from '../features/users/components/ProfileNotFound'

export default function ProfilePage() {
  const { id, isOwner, notFound } = useProfilePage()
  if (notFound) return <ProfileNotFound />
  return isOwner ? <MyProfileView /> : <PublicProfileView id={id} />
}
