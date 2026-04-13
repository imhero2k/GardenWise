import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GardenProvider } from './context/GardenContext'
import { LocationProvider } from './context/LocationContext'
import { Layout } from './components/Layout'
import { CommunityPage } from './pages/CommunityPage'
import { HomePage } from './pages/HomePage'
import { MyGardenPage } from './pages/MyGardenPage'
import { NurseryMapPage } from './pages/NurseryMapPage'
import { PlantDetailPage } from './pages/PlantDetailPage'
import { PlantSearchPage } from './pages/PlantSearchPage'
import { WeedPage } from './pages/WeedPage'

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <GardenProvider>
      <LocationProvider>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="plants" element={<PlantSearchPage />} />
            <Route path="plants/:id" element={<PlantDetailPage />} />
            <Route path="garden" element={<MyGardenPage />} />
            <Route path="weed" element={<WeedPage />} />
            <Route path="map" element={<NurseryMapPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </LocationProvider>
    </GardenProvider>
  )
}
