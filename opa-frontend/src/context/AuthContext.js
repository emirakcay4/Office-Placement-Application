import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount, check if tokens exist and try to fetch /me profile
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await client.get('/auth/me/');
          setUser(res.data);
        } catch (error) {
          // If /me fails (e.g. refresh failed as well), tokens are invalid
          console.error("Session restored failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for total token death from the Axios interceptor
    const handleLogoutEvent = () => logout();
    window.addEventListener('auth:logout', handleLogoutEvent);
    
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await client.post('/auth/login/', { username, password });
      const { access, refresh, user: userData } = res.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      setUser(userData);
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Invalid username or password' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading: loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
