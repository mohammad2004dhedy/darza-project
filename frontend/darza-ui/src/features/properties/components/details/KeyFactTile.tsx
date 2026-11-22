import type { LucideIcon } from 'lucide-react'
export function KeyFactTile({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon
  value: string | number
  label: string
}) {
  return (
    <div className="grid min-h-20 min-w-0 content-center grid-cols-[auto_minmax(0,1fr)] items-center gap-x-1 rounded-xl bg-primary/10 p-3 text-center">
      <Icon className="size-5 text-primary" aria-hidden="true" />
      <span className="order-last col-span-2 whitespace-nowrap text-lg font-bold leading-6">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  )
}
