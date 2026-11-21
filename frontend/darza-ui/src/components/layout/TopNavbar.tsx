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
        <div className="flex items-center gap-3">
          <ButtonLink to="/properties/new" className="hidden md:inline-flex">
            أضف عقار
          </ButtonLink>
          <Button variant="outline" onClick={() => logout()}>
            تسجيل الخروج
          </Button>
        </div>
      ) : (
        <ButtonLink to="/login">تسجيل الدخول</ButtonLink>
      )}
    </header>
  )
}
