import { forwardRef, type HTMLAttributes } from 'react'
import { Button } from './Button'

export interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  message?: string
  onRetry?: () => void
}
export const ErrorMessage = forwardRef<HTMLDivElement, ErrorMessageProps>(function ErrorMessage(
  { message = 'حدث خطأ، يرجى المحاولة مجدداً', onRetry, className = '', children, ...props },
  ref,
) {
  return (
    <div
      role="alert"
      {...props}
      ref={ref}
      className={`space-y-3 rounded-md bg-danger-soft p-4 text-danger ${className}`}
    >
      <p>{message}</p>
      {children}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  )
})
