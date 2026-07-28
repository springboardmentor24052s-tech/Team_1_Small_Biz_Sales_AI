import React, { createContext, useContext, useState } from 'react';
import { MOCK_ROLES } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentRole, setCurrentRole] = useState(MOCK_ROLES[0]); // default: Business Owner

  const login = (roleId = 'owner', email = '', password = '') => {
    const role = MOCK_ROLES.find(r => r.id === roleId) || MOCK_ROLES[0];
    setCurrentRole(role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const switchRole = (roleId) => {
    const role = MOCK_ROLES.find(r => r.id === roleId);
    if (role) {
      setCurrentRole(role);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentRole, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
