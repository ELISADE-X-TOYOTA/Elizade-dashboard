import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ImportPage } from './pages/ImportPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { PriceBookPage } from './pages/PriceBookPage'
import { ServiceItemsPage } from './pages/ServiceItemsPage'
import { UnmappedHistoryPage } from './pages/UnmappedHistoryPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<OverviewPage />} />
              <Route path="price-book" element={<PriceBookPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="items" element={<ServiceItemsPage />} />
              <Route path="unmapped" element={<UnmappedHistoryPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
