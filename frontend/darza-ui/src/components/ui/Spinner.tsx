import { forwardRef, type HTMLAttributes } from 'react'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { label = 'جاري التحميل', size = 'sm', className = '', ...props },
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
        className={`shrink-0 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:[animation-duration:1.5s] ${{ sm: 'size-4', md: 'size-6', lg: 'size-8' }[size]}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
})
