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
    <div className="flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-xl bg-primary/10 p-2 text-center">
      <Icon className="size-6 text-primary" aria-hidden="true" />
      <span className="text-lg font-bold sm:text-2xl">{value}</span>
      <span className="text-sm text-primary">{label}</span>
    </div>
  )
}
