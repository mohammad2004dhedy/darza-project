import { useState, type ReactNode } from 'react'
import { ConfirmModal } from '../../../components/ui/ConfirmModal'
import { useAuth } from '../../../context/auth'
import { LogoutConfirmationContext } from './logoutConfirmation'

export function LogoutConfirmationProvider({ children }: { children: ReactNode }) {
  const { logout, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <LogoutConfirmationContext.Provider value={() => setOpen(true)}>
      {children}
      <ConfirmModal
        open={open && isAuthenticated}
        title="تسجيل الخروج"
        message="هل أنت متأكد من تسجيل الخروج؟"
        confirmText="تسجيل الخروج"
        cancelText="إلغاء"
        onConfirm={() => {
          setOpen(false)
          logout()
        }}
        onCancel={() => setOpen(false)}
      />
    </LogoutConfirmationContext.Provider>
  )
}
