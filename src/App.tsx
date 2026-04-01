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
import { SeasonalPage } from './pages/SeasonalPage'
import { WeedPage } from './pages/WeedPage'

export default function App() {
  return (
    <GardenProvider>
      <LocationProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="plants" element={<PlantSearchPage />} />
            <Route path="plants/:id" element={<PlantDetailPage />} />
            <Route path="seasonal" element={<SeasonalPage />} />
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
