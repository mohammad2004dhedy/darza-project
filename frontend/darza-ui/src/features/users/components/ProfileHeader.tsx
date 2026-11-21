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

export function ProfileHeader({ user }: { user: ProfileHeaderUser }) {
  const joinedDate = new Date(user.createdAt)

  return (
    <header className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <ProfileAvatar displayName={user.displayName} profileImageUrl={user.profileImageUrl} />
      <div className="min-w-0 space-y-2">
        <h1 className="text-xl font-bold wrap-anywhere sm:text-2xl">{user.displayName}</h1>
        {user.town && (
          <p className="text-sm text-text-muted">
            {user.town.townName}، {user.town.cityName}
          </p>
        )}
        {!Number.isNaN(joinedDate.getTime()) && (
          <p className="text-sm text-text-muted">
            انضم في <time dateTime={user.createdAt}>{joinedDateFormatter.format(joinedDate)}</time>
          </p>
        )}
      </div>
    </header>
  )
}
