import { Share2 } from 'lucide-react'
import { useShareProperty } from '../../useShareProperty'
export function ShareButton({ id, title }: { id: number; title: string }) {
  const share = useShareProperty(id, title)
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-primary"
    >
      <Share2 className="size-5" aria-hidden="true" />
      مشاركة
    </button>
  )
}
