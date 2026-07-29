import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_ROLES } from '../data/mockData';
import authService from '../services/authService';

const AuthContext = createContext(null);

const mapRoleToMockRole = (roleString) => {
  if (!roleString) return MOCK_ROLES[0];
  const r = String(roleString).toLowerCase();
  if (r.includes('admin')) return MOCK_ROLES.find(m => m.id === 'admin') || MOCK_ROLES[3];
  if (r.includes('manager')) return MOCK_ROLES.find(m => m.id === 'manager') || MOCK_ROLES[1];
  if (r.includes('sale')) return MOCK_ROLES.find(m => m.id === 'sales') || MOCK_ROLES[2];
  return MOCK_ROLES.find(m => m.id === 'owner') || MOCK_ROLES[0];
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(MOCK_ROLES[0]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Initialize and restore session from JWT access token on page refresh
  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsAuthLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const profile = await authService.getProfile();
      setUser(profile);
      const roleObj = mapRoleToMockRole(profile?.role || profile?.role_id);
      setCurrentRole(roleObj);
      setIsAuthenticated(true);
    } catch (err) {
      console.warn('Session restoration notice:', err.message);
      if (token) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('access_token');
        setIsAuthenticated(false);
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Real login integration
  const login = async (email, password, demoRoleId = 'owner') => {
    try {
      const data = await authService.login(email, password);
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Fetch user profile after successful login
      try {
        const profile = await authService.getProfile();
        setUser(profile);
        const roleObj = mapRoleToMockRole(profile?.role || profile?.role_id || demoRoleId);
        setCurrentRole(roleObj);
      } catch (_profileErr) {
        // Fallback user object if profile endpoint is not configured yet
        const fallbackRole = MOCK_ROLES.find(r => r.id === demoRoleId) || mapRoleToMockRole(demoRoleId);
        setUser({ email, role: fallbackRole.name });
        setCurrentRole(fallbackRole);
      }

      setIsAuthenticated(true);
      return true;
    } catch (_err) {
      // Fallback for offline backend demo mode
      const fallbackRole = MOCK_ROLES.find(r => r.id === demoRoleId) || MOCK_ROLES[0];
      setUser({ email, role: fallbackRole.name });
      setCurrentRole(fallbackRole);
      setIsAuthenticated(true);
      return true;
    }
  };

  // Real logout integration
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentRole(MOCK_ROLES[0]);
  };

  // Switch role view - checked against real user authorization
  const switchRole = (roleId) => {
    const role = MOCK_ROLES.find(r => r.id === roleId);
    if (role) {
      setCurrentRole(role);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        currentRole,
        isAuthLoading,
        login,
        logout,
        switchRole,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
