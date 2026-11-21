import { useState } from 'react'

export function ProfileAvatar({
  displayName,
  profileImageUrl,
}: {
  displayName: string
  profileImageUrl?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  return profileImageUrl && profileImageUrl !== failedUrl ? (
    <img
      src={profileImageUrl}
      alt={displayName}
      width={96}
      height={96}
      loading="eager"
      decoding="async"
      onError={() => setFailedUrl(profileImageUrl)}
      className="size-24 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-24 shrink-0 items-center justify-center rounded-full bg-background text-4xl font-bold text-primary"
    >
      {Array.from(displayName.trim())[0] ?? '؟'}
    </span>
  )
}
