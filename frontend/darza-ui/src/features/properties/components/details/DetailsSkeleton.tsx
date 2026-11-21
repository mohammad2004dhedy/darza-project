export function DetailsSkeleton() {
  return (
    <div
      role="status"
      aria-label="جارٍ تحميل الإعلان"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:[direction:ltr]"
    >
      <div className="space-y-6">
        <div className="aspect-[4/3] rounded-xl bg-border lg:aspect-[16/9] lg:max-h-[36rem]" />
        <div className="h-8 w-3/4 rounded bg-border" />
        <div className="h-6 w-1/3 rounded bg-border" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((value) => (
            <div key={value} className="aspect-square rounded-xl bg-primary/10" />
          ))}
        </div>
        <div className="h-32 rounded-xl bg-border" />
      </div>
      <div className="h-40 rounded-xl bg-border" />
    </div>
  )
}
