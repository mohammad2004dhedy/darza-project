import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, icon, action, className = '', children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={`flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-10 text-center ${className}`}
    >
      {icon && (
        <span aria-hidden="true" className="text-text-muted">
          {icon}
        </span>
      )}
      <h2 className="text-lg font-bold text-text">{title}</h2>
      {description && <p className="text-sm text-text-muted">{description}</p>}
      {action}
      {children}
    </div>
  )
})
