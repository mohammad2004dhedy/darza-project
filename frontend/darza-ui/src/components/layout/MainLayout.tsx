import { Suspense } from 'react'
import { Spinner } from '../ui/Spinner'
import { Outlet } from 'react-router'
import { TopNavbar } from './TopNavbar'
import { BottomNav } from './BottomNav'
import { Footer } from './Footer'
interface MainLayoutProps {
  container?: 'default' | 'wide' | 'none'
}
const containers = {
  default: 'mx-auto w-full max-w-[1100px] px-4 md:px-6',
  wide: 'mx-auto w-full max-w-[1440px] px-4 md:px-6',
  none: 'w-full',
}
export function MainLayout({ container = 'default' }: MainLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col pb-24 md:pb-0">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:bg-surface focus:p-4">
        انتقل للمحتوى
      </a>
      <TopNavbar />
      <main
        id="main-content"
        tabIndex={-1}
        className={`min-h-[calc(100dvh-5rem)] flex-1 py-8 ${containers[container]}`}
      >
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
