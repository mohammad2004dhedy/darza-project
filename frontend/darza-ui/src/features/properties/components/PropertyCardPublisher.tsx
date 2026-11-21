import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { Link } from 'react-router'
import type { PropertyUserResponse } from '../../../types/api'

export function PropertyCardPublisher({
  user,
  prominent = false,
}: {
  user: PropertyUserResponse
  prominent?: boolean
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const imageUrl = user.profileImageUrl
  return (
    <Link
      to={`/users/${user.id}`}
      className={`relative z-10 inline-flex max-w-full items-center rounded-md focus-visible:outline-primary ${prominent ? 'gap-3 text-lg font-bold text-text' : 'gap-2 text-sm text-text-muted'}`}
    >
      {imageUrl && imageUrl !== failedUrl ? (
        <img
          src={imageUrl}
          onError={() => setFailedUrl(imageUrl)}
          alt=""
          width={prominent ? 40 : 32}
          height={prominent ? 40 : 32}
          loading="lazy"
          decoding="async"
          className={`shrink-0 rounded-full object-cover ${prominent ? 'size-10' : 'size-8'}`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center rounded-full bg-background ${prominent ? 'size-10' : 'size-8'}`}
        >
          <UserRound className={prominent ? 'size-5' : 'size-4'} />
        </span>
      )}
      <span className="sr-only">الناشر:</span> <span className="truncate">{user.displayName}</span>
    </Link>
  )
}
