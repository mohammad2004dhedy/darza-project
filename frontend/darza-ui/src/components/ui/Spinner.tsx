import { forwardRef, type HTMLAttributes } from 'react'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string
}
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { label = 'جارٍ التحميل', className = '', ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      className={`inline-flex items-center gap-2 ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-4 rounded-full border-2 border-current border-e-transparent"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
})
