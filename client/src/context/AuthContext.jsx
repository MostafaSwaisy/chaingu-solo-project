import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('pollhub_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('pollhub_token', data.token);
    localStorage.setItem('pollhub_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (username, email, password) => {
      await api.post('/auth/register', { username, email, password });
      await login(username, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('pollhub_token');
    localStorage.removeItem('pollhub_user');
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
