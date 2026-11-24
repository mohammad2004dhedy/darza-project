import { LogOut } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { useLogoutConfirmation } from './logoutConfirmation'

export function LogoutButton() {
  const logout = useLogoutConfirmation()
  return (
    <Button variant="outline" onClick={logout} className="transition-none">
      <LogOut aria-hidden="true" className="size-5" />
      تسجيل الخروج
    </Button>
  )
}
