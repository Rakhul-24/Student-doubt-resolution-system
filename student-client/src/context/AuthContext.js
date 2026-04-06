import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session auth on refresh, but reset when browser session ends.
  useEffect(() => {
    const sessionToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const sessionUser = sessionStorage.getItem('user') || localStorage.getItem('user');

    // Migrate legacy localStorage auth into sessionStorage.
    if (sessionToken) {
      sessionStorage.setItem('token', sessionToken);
      localStorage.removeItem('token');
      setToken(sessionToken);
    }

    if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        sessionStorage.setItem('user', JSON.stringify(parsedUser));
        sessionStorage.setItem('role', parsedUser.role || '');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        setUser(parsedUser);
      } catch {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('role');
      }
    }

    setLoading(false);
  }, []);

  // Register
  const register = useCallback(async (formData) => {
    const response = await authAPI.register(formData);
    const { token: newToken, user: userData } = response.data;
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('role', userData.role);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(newToken);
    setUser(userData);
    return response.data;
  }, []);

  // Login
  const login = useCallback(async (formData) => {
    const response = await authAPI.login(formData);
    const { token: newToken, user: userData } = response.data;
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('role', userData.role);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(newToken);
    setUser(userData);
    return response.data;
  }, []);

  // Google Login
  const googleLogin = useCallback(async (formData) => {
    const response = await authAPI.googleLogin(formData);

    // If new user via Google, backend returns requiresRegistration
    if (response.data.requiresRegistration) {
      return response.data;
    }

    const { token: newToken, user: userData } = response.data;
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('role', userData.role);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(newToken);
    setUser(userData);
    return response.data;
  }, []);

  // Google Register
  const googleRegister = useCallback(async (formData) => {
    const response = await authAPI.googleRegister(formData);
    const { token: newToken, user: userData } = response.data;
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('role', userData.role);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(newToken);
    setUser(userData);
    return response.data;
  }, []);

  // Logout
  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data) => {
    const response = await authAPI.updateProfile(data);
    const updatedUser = response.data.user;
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    sessionStorage.setItem('role', updatedUser.role || '');
    setUser(updatedUser);
    return response.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, googleLogin, googleRegister, logout, updateProfile, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
