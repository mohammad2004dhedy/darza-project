import { useState } from 'react'
import { ImageWithPlaceholder } from '../../../components/ui/ImageWithPlaceholder'

export function ProfileAvatar({
  displayName,
  profileImageUrl,
}: {
  displayName: string
  profileImageUrl?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | undefined>()
  if (!profileImageUrl || failedUrl === profileImageUrl) {
    return (
      <span
        role="img"
        aria-label={displayName}
        className="flex size-24 shrink-0 items-center justify-center rounded-full bg-background text-4xl font-bold text-primary"
      >
        {Array.from(displayName.trim())[0] ?? '؟'}
      </span>
    )
  }
  return (
    <ImageWithPlaceholder
      src={profileImageUrl}
      onError={() => setFailedUrl(profileImageUrl)}
      alt={displayName}
      width={96}
      height={96}
      loading="eager"
      containerClassName="size-24 shrink-0 rounded-full"
      placeholderLabel={displayName}
    />
  )
}
