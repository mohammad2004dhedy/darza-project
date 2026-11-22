import { Settings } from 'lucide-react'
import { ButtonLink } from '../../../components/ui/ButtonLink'
import { LocationLine } from '../../properties/components/LocationLine'
import type { MyProfileUserResponse } from '../../../types/api'
import { ProfileAvatar } from './ProfileAvatar'

const joinedDateFormatter = new Intl.DateTimeFormat('ar-u-nu-latn', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

type ProfileHeaderUser = Pick<
  MyProfileUserResponse,
  'displayName' | 'town' | 'profileImageUrl' | 'createdAt'
>

export function ProfileHeader({
  user,
  isOwner = false,
}: {
  user: ProfileHeaderUser
  isOwner?: boolean
}) {
  const joinedDate = new Date(user.createdAt)

  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] rounded-xl border border-border bg-surface p-4 sm:p-6">
      <ProfileAvatar displayName={user.displayName} profileImageUrl={user.profileImageUrl} />
      <div className="min-w-0 flex-1 space-y-2">
        <h1 className="text-xl font-bold wrap-anywhere sm:text-2xl">{user.displayName}</h1>
        {user.town && <LocationLine townName={user.town.townName} cityName={user.town.cityName} />}
        {!Number.isNaN(joinedDate.getTime()) && (
          <p className="text-sm text-text-muted">
            انضم في <time dateTime={user.createdAt}>{joinedDateFormatter.format(joinedDate)}</time>
          </p>
        )}
      </div>
      {isOwner && (
        <ButtonLink
          to="/settings"
          variant="outline"
          className="col-span-2 justify-self-end sm:col-span-1"
        >
          <Settings className="size-4" aria-hidden="true" />
          الإعدادات
        </ButtonLink>
      )}
    </header>
  )
}
