import { createContext, useContext, useState, useCallback } from 'react';
import { login as loginApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mm_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('mm_username'));
  const [roleId, setRoleId] = useState(() => {
    const raw = localStorage.getItem('mm_role_id');
    return raw ? Number(raw) : null;
  });

  const signIn = useCallback(async (email, password) => {
    const result = await loginApi(email, password);
    setToken(result.token);
    setUsername(result.username);
    setRoleId(result.roleId);
    localStorage.setItem('mm_token', result.token || '');
    localStorage.setItem('mm_username', result.username || '');
    localStorage.setItem('mm_role_id', String(result.roleId ?? ''));
    return result;
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUsername(null);
    setRoleId(null);
    localStorage.removeItem('mm_token');
    localStorage.removeItem('mm_username');
    localStorage.removeItem('mm_role_id');
  }, []);

  const value = {
    token,
    username,
    roleId,
    isAuthenticated: Boolean(token),
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
