import { createContext, useContext, useState, useEffect } from 'react';
import apiFetch from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'vendor' | 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    if (!token) {
      setLoading(false);
      return;
    }

    const endpoint = savedRole === 'admin' ? '/admin/me' : '/vendors/me';
    apiFetch(endpoint)
      .then((data) => {
        setUser(data);
        setRole(savedRole);
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      })
      .finally(() => setLoading(false));
  }, []);

  const loginVendor = async (stallName, password) => {
    const data = await apiFetch('/vendors/login', {
      method: 'POST',
      body: JSON.stringify({ stallName, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', 'vendor');
    setUser(data.vendor);
    setRole('vendor');
    return data;
  };

  const loginAdmin = async (username, password) => {
    const data = await apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', 'admin');
    setUser(data.admin);
    setRole('admin');
    return data;
  };

  const signup = async (stallName, upiId, password) => {
    const data = await apiFetch('/vendors/signup', {
      method: 'POST',
      body: JSON.stringify({ stallName, upiId, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', 'vendor');
    setUser(data.vendor);
    setRole('vendor');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  };

  const refreshUser = async () => {
    const endpoint = role === 'admin' ? '/admin/me' : '/vendors/me';
    const data = await apiFetch(endpoint);
    setUser(data);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, loginVendor, loginAdmin, signup, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
