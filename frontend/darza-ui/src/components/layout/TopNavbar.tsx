import { useAuth } from '../../context/auth'
import { Button } from '../ui/Button'
import { ButtonLink } from '../ui/ButtonLink'
import { Logo } from './Logo'
export function TopNavbar() {
  const { isAuthenticated, logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6">
      <Logo />
      {isAuthenticated ? (
        <Button variant="outline" onClick={() => logout()}>
          تسجيل الخروج
        </Button>
      ) : (
        <ButtonLink to="/login">تسجيل الدخول</ButtonLink>
      )}
    </header>
  )
}
