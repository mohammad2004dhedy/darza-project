import { Skeleton } from '../../../components/ui/Skeleton'

export function PropertyCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="aspect-[4/3] bg-border" />
      <div className="space-y-4 p-4">
        <Skeleton className="w-1/3" />
        <Skeleton className="w-3/4" />
        <Skeleton className="w-1/2" />
      </div>
    </div>
  )
}
