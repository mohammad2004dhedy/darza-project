import { Skeleton } from '../../../components/ui/Skeleton'

export function ProfileSkeleton({ isMyProfile = false }: { isMyProfile?: boolean }) {
  return (
    <div role="status" aria-label="جارٍ تحميل الملف الشخصي" className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
        <Skeleton className="h-24 w-24 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-40 max-w-full sm:h-8" />
          <Skeleton className="h-5 w-32 max-w-full" />
          <Skeleton className="h-5 w-36 max-w-full" />
        </div>
      </div>
      {!isMyProfile && <Skeleton className="h-11 w-52" />}
    </div>
  )
}
