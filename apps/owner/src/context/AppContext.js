'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark'); // Dark by default for premium sports look
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Theme and Auth from localStorage
  useEffect(() => {
    // 1. Theme initialization
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || 'dark'; // default to dark
    setTheme(activeTheme);
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Auth initialization
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);

    // 3. Service Worker registration for PWA installation
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('PWA ServiceWorker registered with scope:', reg.scope),
          (err) => console.warn('PWA ServiceWorker registration failed:', err)
        );
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('PWA ServiceWorker unregistered in development mode.');
              }
            });
          }
        });
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const getApiUrl = (path) => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin.startsWith('capacitor://') || (origin.includes('localhost') && !origin.includes(':3000'))) {
        return `http://192.168.1.10:3000${path}`;
      }
    }
    return path;
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, user, login, logout, loading, setUser, getApiUrl }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
