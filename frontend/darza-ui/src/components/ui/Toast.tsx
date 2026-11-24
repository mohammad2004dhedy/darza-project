import { forwardRef, type HTMLAttributes } from 'react'
import { X } from 'lucide-react'
import type { ToastAction } from './ToastContext'
import { Button } from './Button'

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  action?: ToastAction
  message: string
  onDismiss: () => void
}
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { message, action, onDismiss, className = '', ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={`flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-text shadow-lg ${className}`}
    >
      <p className="flex-1">{message}</p>
      {action && <Button variant="ghost" size="sm" onClick={action.onClick}>{action.label}</Button>}
      <Button variant="ghost" size="sm" aria-label="إغلاق التنبيه" onClick={onDismiss}>
        <X size={18} aria-hidden="true" />
      </Button>
    </div>
  )
})
