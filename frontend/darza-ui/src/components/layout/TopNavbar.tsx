import { useAuth } from '../../context/auth'
import { Button } from '../ui/Button'
import { ButtonLink } from '../ui/ButtonLink'
import { Logo } from './Logo'
export function TopNavbar() {
  const { isAuthenticated, isAdmin, logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6">
      <Logo />
      <div className="flex items-center gap-3">
        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-3 md:flex">
          <ButtonLink to="/" variant="ghost">
            الرئيسية
          </ButtonLink>
          {isAuthenticated && (
            <>
              <ButtonLink to="/properties/new">أضف عقار</ButtonLink>
              <ButtonLink to="/profile" variant="ghost">
                حسابي
              </ButtonLink>
            </>
          )}
          {isAdmin && (
            <ButtonLink to="/admin" variant="ghost">
              لوحة الإدارة
            </ButtonLink>
          )}
        </nav>
        {isAuthenticated ? (
          <Button variant="outline" onClick={() => logout()}>
            تسجيل الخروج
          </Button>
        ) : (
          <ButtonLink to="/login">تسجيل الدخول</ButtonLink>
        )}
      </div>
    </header>
  )
}
