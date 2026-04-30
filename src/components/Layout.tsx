import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { LocationBar } from './LocationBar'
import { SiteFooter } from './SiteFooter'

export function Layout() {
  return (
    <div className="app-shell">
      <main className="main-content">
        <LocationBar />
        <Outlet />
        <SiteFooter />
      </main>
      <BottomNav />
    </div>
  )
}
