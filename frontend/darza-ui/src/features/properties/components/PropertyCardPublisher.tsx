import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { Link } from 'react-router'
import type { PropertyUserResponse } from '../../../types/api'

export function PropertyCardPublisher({ user }: { user: PropertyUserResponse }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageUrl = user.profileImageUrl
  return (
    <Link
      to={`/users/${user.id}`}
      className="relative z-10 inline-flex max-w-full items-center gap-2 rounded-md text-sm text-text-muted focus-visible:outline-primary"
    >
      {imageUrl && imageUrl !== failedUrl ? (
        <img
          src={imageUrl}
          onError={() => setFailedUrl(imageUrl)}
          alt=""
          width={32}
          height={32}
          loading="lazy"
          decoding="async"
          className="size-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background"
        >
          <UserRound className="size-4" />
        </span>
      )}
      <span className="sr-only">الناشر:</span> <span className="truncate">{user.displayName}</span>
    </Link>
  )
}
