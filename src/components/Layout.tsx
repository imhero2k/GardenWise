import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { FrostAlertBanner } from './FrostAlertBanner'
import { HeatAlertBanner } from './HeatAlertBanner'
import { LocationBar } from './LocationBar'
import { SiteFooter } from './SiteFooter'
import { BackToTop } from './BackToTop'

export function Layout() {
  return (
    <div className="app-shell">
      <FrostAlertBanner />
      <HeatAlertBanner />
      <main className="main-content">
        <LocationBar />
        <Outlet />
        <SiteFooter />
      </main>
      <BackToTop />
      <BottomNav />
    </div>
  )
}
