import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LocationProvider } from './context/LocationContext'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { NurseryMapPage } from './pages/NurseryMapPage'
import { PlantDetailPage } from './pages/PlantDetailPage'
import { PlantSearchPage } from './pages/PlantSearchPage'
import { WeedPage } from './pages/WeedPage'
import { SignInPage } from './pages/SignInPage'
import { GardenPlannerPage } from './pages/GardenPlannerPage'
import { ProfilePage } from './pages/ProfilePage'

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true'

export default function App() {
  const protectedLayout = BYPASS_AUTH ? (
    <Layout />
  ) : (
    <RequireAuth>
      <Layout />
    </RequireAuth>
  )

  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="signin" element={<SignInPage />} />
            <Route element={protectedLayout}>
              <Route index element={<HomePage />} />
              <Route path="plants" element={<PlantSearchPage />} />
              <Route path="plants/:id" element={<PlantDetailPage />} />
              <Route path="weed" element={<WeedPage />} />
              <Route path="planner" element={<GardenPlannerPage />} />
              <Route path="map" element={<NurseryMapPage />} />
              <Route path="learn" element={<LearnPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  )
}
