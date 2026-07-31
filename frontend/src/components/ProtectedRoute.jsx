import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// allow: array of role_ids permitted on this route (matches the backend's
// require_roles(...) lists in main.py). This is a convenience check only —
// the real gate is always the backend's require_roles dependency.
export default function ProtectedRoute({ children, allow }) {
  const { isAuthenticated, roleId } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allow && roleId && !allow.includes(Number(roleId))) {
    return <Navigate to="/" replace />;
  }

  return children;
}
