import { Link } from 'react-router'
import logo from '../../assets/darza-logo.webp'

export function Logo() {
  return (
    <Link to="/" aria-label="درزة، الرئيسية" className="inline-flex shrink-0 items-center py-2">
      <img src={logo} alt="درزة" width={120} height={64} className="h-16 w-30 object-contain" />
    </Link>
  )
}
