import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '../../../components/layout/Logo'
import authBackground from '../../../assets/auth-background.webp'

interface AuthCardProps {
  title: string
  subtitle?: string
  footerText: string
  footerLinkLabel: string
  footerLinkTo: string
  children: ReactNode
}
export function AuthCard({
  title,
  subtitle,
  footerText,
  footerLinkLabel,
  footerLinkTo,
  children,
}: AuthCardProps) {
  return (
    <>
      <img
        src={authBackground}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="pointer-events-none fixed inset-y-0 left-0 -z-10 h-full w-full object-cover object-left opacity-40 md:w-[80vw] md:opacity-100"
      />
      <section
        aria-labelledby="auth-title"
        className="mx-auto w-full max-w-md rounded-lg border border-border bg-surface p-6"
      >
        <header className="flex flex-col items-center gap-1 text-center">
          <Logo />
          <h1 id="auth-title" className="text-2xl font-bold text-primary">
            {title}
          </h1>
          {subtitle && <p className="text-text-muted">{subtitle}</p>}
        </header>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-text-muted">
          {footerText}{' '}
          <Link
            to={footerLinkTo}
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            {footerLinkLabel}
          </Link>
        </p>
      </section>
    </>
  )
}
