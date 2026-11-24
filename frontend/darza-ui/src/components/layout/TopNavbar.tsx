import { useAuth } from '../../context/auth'
import { LogoutButton } from '../../features/users/components/LogoutButton'
import { ButtonLink } from '../ui/ButtonLink'
import { Logo } from './Logo'
export function TopNavbar() {
  const { isAuthenticated, isAdmin } = useAuth()
  return (
    <header className="sticky top-0 z-(--z-navigation) flex min-h-20 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-6">
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
        {isAuthenticated ? <LogoutButton /> : <ButtonLink to="/login">تسجيل الدخول</ButtonLink>}
      </div>
    </header>
  )
}
