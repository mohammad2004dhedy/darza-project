interface PlaceholderProps {
  title: string
}
export function Placeholder({ title }: PlaceholderProps) {
  return (
    <section
      aria-labelledby="page-title"
      className="rounded-lg border border-border bg-surface p-6"
    >
      <h1 id="page-title" className="text-2xl font-bold text-primary">
        {title}
      </h1>
      <p className="mt-4 text-text-muted">هاي الصفحة قيد التجهيز، بنكمّلها بالمرحلة الجايّة.</p>
    </section>
  )
}
