import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type DialogHTMLAttributes,
} from 'react'
import { Button } from './Button'

export interface ConfirmModalProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  'open' | 'title' | 'onCancel' | 'onConfirm'
> {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'default' | 'danger'
  loading?: boolean
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
}
export const ConfirmModal = forwardRef<HTMLDialogElement, ConfirmModalProps>(function ConfirmModal(
  {
    open,
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    tone = 'default',
    loading = false,
    confirmDisabled = false,
    onConfirm,
    onCancel,
    children,
    className = '',
    onClick,
    ...props
  },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const id = useId()
  useImperativeHandle(ref, () => dialogRef.current!, [])
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [open])
  return (
    <dialog
      {...props}
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      aria-busy={loading || undefined}
      className={`m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-surface p-6 text-text backdrop:bg-text/50 ${className}`}
      onCancel={(event) => {
        event.preventDefault()
        if (!loading) onCancel()
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || loading || event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onCancel()
      }}
    >
      <h2 id={`${id}-title`} className="text-lg font-bold">
        {title}
      </h2>
      <p id={`${id}-message`} className="mt-3 text-sm text-text-muted">
        {message}
      </p>
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          loading={loading}
          disabled={confirmDisabled}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
        <Button variant="outline" disabled={loading} onClick={onCancel} autoFocus>
          {cancelText}
        </Button>
      </div>
    </dialog>
  )
})
