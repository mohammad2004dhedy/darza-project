import { createContext } from 'react'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastContextValue {
  showToast: (message: string, action?: ToastAction) => void
}
export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
