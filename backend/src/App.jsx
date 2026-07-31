import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { dashboardRouteForRole } from './api/auth';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import SalesDashboard from './pages/SalesDashboard';
import Inventory from './pages/Inventory';
import Users from './pages/Users';
import Predict from './pages/Predict';

function RoleRedirect() {
  const { roleId, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardRouteForRole(roleId)} replace />;
}

// Role-id groups mirror require_roles(...) in the backend's main.py exactly.
const ADMIN = [1];
const OWNER_UP = [1, 2];
const MANAGER_UP = [1, 2, 3];
const SALES_UP = [1, 2, 3, 4];

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<RoleRedirect />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allow={ADMIN}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute allow={OWNER_UP}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allow={MANAGER_UP}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-dashboard"
          element={
            <ProtectedRoute allow={SALES_UP}>
              <SalesDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allow={MANAGER_UP}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allow={ADMIN}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/predict"
          element={
            <ProtectedRoute>
              <Predict />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
