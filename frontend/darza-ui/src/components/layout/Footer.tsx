import { Link } from 'react-router'
const links = [
  { to: '/privacy', label: 'سياسة الخصوصية' },
  { to: '/terms', label: 'شروط الاستخدام' },
  { to: '/about', label: 'عن درزة' },
  { to: '/contact', label: 'تواصل معنا' },
]
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface p-6">
      <nav
        aria-label="روابط الموقع"
        className="flex flex-wrap justify-center gap-4 text-sm text-text-muted"
      >
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="hover:text-primary">
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  )
}
