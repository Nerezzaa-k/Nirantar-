import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const DEMO_CREDENTIALS = {
  hospital: {
    email: 'admin@nirantar.org',
    password: 'admin123',
    role: 'admin',
    name: 'Dr. Rajesh Verma (Hospital MOIC)',
    description: 'Medical Officer In-Charge, Rampur Community Health Centre'
  },
  ngo: {
    email: 'asha.sunita@nirantar.org',
    password: 'worker123',
    role: 'healthcare_worker',
    name: 'Sunita Devi (NGO Field Lead)',
    description: 'Jan Swasthya NGO Field Lead & Community Coordinator'
  },
  patient: {
    email: 'ramesh.kumar@patient.nirantar.org',
    password: 'patient123',
    role: 'patient',
    name: 'Ramesh Kumar (PAT-1001)',
    description: 'Hypertension Patient (Read-Only Treatment Schedule)'
  },
  // Aliases for backward compatibility
  hospital_admin: {
    email: 'admin@nirantar.org',
    password: 'admin123',
    role: 'admin',
    name: 'Dr. Rajesh Verma (Hospital MOIC)',
    description: 'Medical Officer In-Charge, Rampur Community Health Centre'
  },
  ngo_lead: {
    email: 'asha.sunita@nirantar.org',
    password: 'worker123',
    role: 'healthcare_worker',
    name: 'Sunita Devi (NGO Field Lead)',
    description: 'Jan Swasthya NGO Field Lead & Community Coordinator'
  },
  admin: {
    email: 'admin@nirantar.org',
    password: 'admin123',
    role: 'admin',
    name: 'Dr. Rajesh Verma (Hospital MOIC)',
    description: 'Medical Officer In-Charge, Rampur Community Health Centre'
  },
  worker: {
    email: 'asha.sunita@nirantar.org',
    password: 'worker123',
    role: 'healthcare_worker',
    name: 'Sunita Devi (NGO Field Lead)',
    description: 'Jan Swasthya NGO Field Lead & Community Coordinator'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nirantar_token'));
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState(null);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('nirantar_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setActiveMode(res.data.user.role);
        }
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err.message);
        localStorage.removeItem('nirantar_token');
        localStorage.removeItem('nirantar_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('nirantar_token', newToken);
      localStorage.setItem('nirantar_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setActiveMode(newUser.role);
      return newUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('nirantar_token', newToken);
      localStorage.setItem('nirantar_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setActiveMode(newUser.role);
      return newUser;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const quickDemoLogin = async (roleKey) => {
    const creds = DEMO_CREDENTIALS[roleKey];
    if (!creds) throw new Error(`Unknown demo role: ${roleKey}`);
    return await login(creds.email, creds.password);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('nirantar_token');
      localStorage.removeItem('nirantar_user');
      setUser(null);
      setToken(null);
      setActiveMode(null);
    }
  };

  const updateProfile = async (profileData) => {
    const res = await api.patch('/auth/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('nirantar_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.data.message || 'Failed to update profile');
  };

  const switchMode = (newMode) => {
    setActiveMode(newMode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role,
        activeMode: activeMode || user?.role,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        quickDemoLogin,
        logout,
        updateProfile,
        switchMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
