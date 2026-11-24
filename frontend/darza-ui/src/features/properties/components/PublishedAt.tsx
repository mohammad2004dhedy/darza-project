import { Clock } from 'lucide-react'
import { formatPublishedAt } from '../../../lib/formatPublishedAt'

export function PublishedAt({
  iso,
  details = false,
  now,
}: {
  iso?: string
  details?: boolean
  now?: number
}) {
  const published = formatPublishedAt(iso, now)
  if (!published) return null
  return (
    <time
      dateTime={iso}
      title={published.full}
      className="inline-flex min-w-0 items-center gap-1 text-xs text-text-muted"
    >
      <Clock aria-hidden="true" className="size-3.5 shrink-0" />
      <span className={details ? undefined : 'truncate'}>
        {details ? `نُشر في ${published.date} · ${published.relative}` : published.relative}
      </span>
    </time>
  )
}
