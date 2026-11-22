import { ImageWithPlaceholder } from '../../../components/ui/ImageWithPlaceholder'
import { Link } from 'react-router'
import type { PropertyUserResponse } from '../../../types/api'

export function PropertyCardPublisher({ user }: { user: PropertyUserResponse }) {
  const imageUrl = user.profileImageUrl
  return (
    <Link
      to={`/users/${user.id}`}
      className="relative z-10 inline-flex max-w-full items-center gap-2 rounded-md text-sm text-text-muted focus-visible:outline-primary"
    >
      <ImageWithPlaceholder
        src={imageUrl}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        containerClassName="size-8 shrink-0 rounded-full"
      />
      <span className="sr-only">الناشر:</span> <span className="truncate">{user.displayName}</span>
    </Link>
  )
}
