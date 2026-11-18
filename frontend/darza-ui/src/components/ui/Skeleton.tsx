import { forwardRef, type HTMLAttributes } from 'react'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className = '', ...props },
  ref,
) {
  return (
    <div
      aria-hidden="true"
      {...props}
      ref={ref}
      className={`h-4 rounded-md bg-border ${className}`}
    />
  )
})
