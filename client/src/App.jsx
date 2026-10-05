import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { Loader2 } from 'lucide-react';

export function App() {
  const { user, loading: authLoading } = useAuth();

  // Client-side lightweight routing between Home, Dashboard, and Auth
  const [currentPath, setCurrentPath] = useState(() => {
    const p = (window.location.pathname || '').toLowerCase();
    const h = (window.location.hash || '').toLowerCase();
    if (p.includes('/login') || h.includes('login')) return '/login';
    if (p.includes('/register') || h.includes('register')) return '/register';
    if (p.includes('/dashboard') || h.includes('dashboard')) return '/dashboard';
    return '/';
  });

  useEffect(() => {
    const handleLocation = () => {
      const p = (window.location.pathname || '').toLowerCase();
      const h = (window.location.hash || '').toLowerCase();
      if (p.includes('/login') || h.includes('login')) {
        setCurrentPath('/login');
      } else if (p.includes('/register') || h.includes('register')) {
        setCurrentPath('/register');
      } else if (p.includes('/dashboard') || h.includes('dashboard')) {
        setCurrentPath('/dashboard');
      } else {
        setCurrentPath('/');
      }
    };
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If user signs in while on /login or /register, automatically send to /dashboard
  useEffect(() => {
    if (user && (currentPath === '/login' || currentPath === '/register')) {
      navigateTo('/dashboard');
    }
  }, [user, currentPath]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500 mb-2" />
      </div>
    );
  }

  if (currentPath === '/login' || currentPath === '/register') {
    return (
      <LoginPage
        initialMode={currentPath === '/register' ? 'register' : 'login'}
        onNavigate={navigateTo}
      />
    );
  }

  if (currentPath === '/dashboard') {
    return (
      <DashboardPage
        onNavigate={navigateTo}
      />
    );
  }

  // Default: Home Page
  return (
    <HomePage
      onNavigate={navigateTo}
    />
  );
}
