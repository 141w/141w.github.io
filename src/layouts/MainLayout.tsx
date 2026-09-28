import type { ReactNode } from 'react'
import SiteNav from '../components/SiteNav'
import SiteBackground from '../components/SiteBackground'
import SiteFooter from '../components/SiteFooter'
import SplashGate from '../components/SplashGate'
import { useBorderGlow } from '../hooks/useBorderGlow'

export default function MainLayout({ children }: { children: ReactNode }) {
  useBorderGlow()

  return (
    <>
      <SiteBackground />
      <SplashGate />

      <header className="topbar">
        <SiteNav />
      </header>

      <main id="app" className="app">
        {children}
      </main>

      <SiteFooter />
    </>
  )
}
