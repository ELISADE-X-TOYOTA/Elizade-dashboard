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
import { CallListPage, DueSoonPage, OverduePage } from './pages/MaintenanceQueuesPage'
import { IntervalsPage } from './pages/IntervalsPage'
import { VehicleDetailPage } from './pages/VehicleDetailPage'

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
              <Route path="due-soon" element={<DueSoonPage />} />
              <Route path="overdue" element={<OverduePage />} />
              <Route path="call-list" element={<CallListPage />} />
              <Route path="intervals" element={<IntervalsPage />} />
              <Route path="vehicles/:id" element={<VehicleDetailPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
