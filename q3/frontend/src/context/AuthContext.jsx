import React, { createContext, useContext, useState, useEffect } from 'react';
import { request } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cartcraft_token');
      if (token) {
        try {
          const profile = await request('/auth/me');
          setUser(profile);
        } catch (err) {
          localStorage.removeItem('cartcraft_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('cartcraft_token', data.token);
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });
    return data;
  };

  const register = async (name, email, password, role) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    localStorage.setItem('cartcraft_token', data.token);
    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('cartcraft_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
