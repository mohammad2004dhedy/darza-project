import { createContext, useContext } from 'react'

export const LogoutConfirmationContext = createContext<(() => void) | null>(null)

export function useLogoutConfirmation() {
  const requestLogout = useContext(LogoutConfirmationContext)
  if (!requestLogout) throw new Error('سياق تأكيد تسجيل الخروج غير متاح')
  return requestLogout
}
