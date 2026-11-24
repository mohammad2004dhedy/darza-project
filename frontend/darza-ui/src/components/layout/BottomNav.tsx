import { House, LogIn, Plus, UserRound, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../../context/auth'
interface NavItem {
  to: string
  label: string
  active?: boolean
  icon: LucideIcon
}
const home: NavItem = { to: '/', label: 'الرئيسية', icon: House }
function MobileNavItem({ to, label, icon: Icon, active }: NavItem) {
  const { pathname } = useLocation()
  const isActive = active ?? pathname === to
  return (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={
        `flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-md text-xs transition-colors ${isActive ? 'bg-background font-bold text-primary' : 'text-text-muted hover:text-primary'}`
      }
    >
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}
export function BottomNav() {
  const { isAuthenticated, isAdmin, userId } = useAuth()
  const { pathname } = useLocation()
  const items: NavItem[] = isAuthenticated
    ? [
        home,
        { to: '/properties/new', label: 'أضف عقار', icon: Plus },
        { to: '/profile', label: 'حسابي', icon: UserRound, active: pathname === '/profile' || (userId !== null && pathname === `/users/${userId}`) || pathname.startsWith('/settings') },
      ]
    : [home, { to: '/login', label: 'تسجيل الدخول', icon: LogIn }]
  if (isAdmin) items.push({ to: '/admin', label: 'لوحة الإدارة', icon: LayoutDashboard })
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {items.map((item) => (
        <MobileNavItem key={item.to} {...item} />
      ))}
    </nav>
  )
}
