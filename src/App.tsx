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

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route path="signin" element={<SignInPage />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="plants" element={<PlantSearchPage />} />
              <Route path="plants/:id" element={<PlantDetailPage />} />
              <Route path="weed" element={<WeedPage />} />
              <Route path="map" element={<NurseryMapPage />} />
              <Route path="learn" element={<LearnPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  )
}
