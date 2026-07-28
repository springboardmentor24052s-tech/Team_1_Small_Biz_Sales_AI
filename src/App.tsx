import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SalesAnalytics from './pages/SalesAnalytics'
import CustomerIntelligence from './pages/CustomerIntelligence'
import AIForecasting from './pages/AIForecasting'
import Inventory from './pages/Inventory'
import ProductRecommendations from './pages/ProductRecommendations'
import AnomalyDetection from './pages/AnomalyDetection'
import Invoices from './pages/Invoices'
import Reports from './pages/Reports'
import UserManagement from './pages/UserManagement'
import Settings from './pages/Settings'

function AppShell() {
  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sales" element={<SalesAnalytics />} />
        <Route path="/customers" element={<CustomerIntelligence />} />
        <Route path="/forecasting" element={<AIForecasting />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/recommendations" element={<ProductRecommendations />} />
        <Route path="/anomalies" element={<AnomalyDetection />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}
