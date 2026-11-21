import { Skeleton } from '../../../components/ui/Skeleton'

export function PropertyCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="aspect-[4/3] bg-border" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    </div>
  )
}
