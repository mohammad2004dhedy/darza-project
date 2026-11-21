import { useDescriptionOverflow } from '../../useDescriptionOverflow'
export function PropertyDescription({ description }: { description?: string }) {
  const { ref, expanded, overflows, toggle } = useDescriptionOverflow(description)
  if (!description) return null
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">وصف العقار</h2>
      <p
        ref={ref}
        className={`whitespace-pre-line break-words leading-7 ${expanded ? '' : 'line-clamp-6'}`}
      >
        {description}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className="min-h-11 font-semibold text-primary"
        >
          {expanded ? 'عرض أقل' : 'عرض المزيد'}
        </button>
      )}
    </section>
  )
}
