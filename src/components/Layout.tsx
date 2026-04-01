import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { LocationBar } from './LocationBar'

export function Layout() {
  return (
    <div className="app-shell">
      <main className="main-content">
        <LocationBar />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
