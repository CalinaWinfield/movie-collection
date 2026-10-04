import React, { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = client.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await client.get('/auth/me');
        setUser(res.user);
      } catch (err) {
        client.setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const handleExpired = () => setUser(null);
    window.addEventListener('shelfmark_auth_expired', handleExpired);
    window.addEventListener('kolekino_auth_expired', handleExpired);
    return () => {
      window.removeEventListener('shelfmark_auth_expired', handleExpired);
      window.removeEventListener('kolekino_auth_expired', handleExpired);
    };
  }, []);

  const login = async (loginId, password) => {
    const res = await client.post('/auth/login', { login: loginId, password });
    client.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (username, email, password, display_name) => {
    const res = await client.post('/auth/register', { username, email, password, display_name });
    client.setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const loginDemo = async () => {
    return await login('cinephile', 'demo1234');
  };

  const logout = () => {
    client.setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await client.put('/auth/profile', data);
    setUser(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginDemo, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
