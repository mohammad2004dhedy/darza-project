import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastAction } from './ToastContext'
import { Toast } from './Toast'

export interface ToastProviderProps {
  children: ReactNode
}
export function ToastProvider({ children }: ToastProviderProps) {
  const [message, setMessage] = useState('')
  const [action, setAction] = useState<ToastAction>()
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current)
    setMessage('')
  }, [])
  const showToast = useCallback((text: string, nextAction?: ToastAction) => {
    clearTimeout(timerRef.current)
    setMessage(text)
    setAction(nextAction)
    if (!nextAction) timerRef.current = setTimeout(() => setMessage(''), 6000)
  }, [])
  useEffect(() => () => clearTimeout(timerRef.current), [])
  const value = useMemo(() => ({ showToast }), [showToast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-4 top-20 z-50 mx-auto max-w-md"
      >
        {message && <Toast action={action} message={message} onDismiss={dismiss} className="pointer-events-auto" />}
      </div>
    </ToastContext.Provider>
  )
}
