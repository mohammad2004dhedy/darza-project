import { NavLink } from 'react-router'

export function AdminNavigation() {
  return <nav aria-label="إدارة الموقع" className="mb-6 flex gap-4 border-b border-border pb-3">
    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'font-bold text-primary' : 'text-text-muted'}>الإعلانات</NavLink>
    <NavLink to="/admin/locations" className={({ isActive }) => isActive ? 'font-bold text-primary' : 'text-text-muted'}>المدن والبلدات</NavLink>
  </nav>
}
