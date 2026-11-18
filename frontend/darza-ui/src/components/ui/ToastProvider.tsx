import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './ToastContext'
import { Toast } from './Toast'

export interface ToastProviderProps {
  children: ReactNode
}
export function ToastProvider({ children }: ToastProviderProps) {
  const [message, setMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current)
    setMessage('')
  }, [])
  const showToast = useCallback((text: string) => {
    clearTimeout(timerRef.current)
    setMessage(text)
    timerRef.current = setTimeout(() => setMessage(''), 6000)
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
        {message && <Toast message={message} onDismiss={dismiss} className="pointer-events-auto" />}
      </div>
    </ToastContext.Provider>
  )
}
