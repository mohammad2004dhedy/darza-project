import { LogOut } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { useAuth } from '../../../context/auth'

export function LogoutButton() {
  const { logout } = useAuth()
  return (
    <Button variant="outline" onClick={logout} className="transition-none">
      <LogOut aria-hidden="true" className="size-5" />
      تسجيل الخروج
    </Button>
  )
}
