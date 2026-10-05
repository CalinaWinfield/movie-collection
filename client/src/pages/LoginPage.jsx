import React, { useState, useEffect } from 'react';
import { Disc, Lock, User, Mail, Sparkles, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage({ initialMode = 'login', onNavigate }) {
  const { user, login, register, loginDemo, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });

  useEffect(() => {
    setIsRegister(initialMode === 'register');
    setError('');
  }, [initialMode]);

  const switchMode = (registerMode) => {
    setIsRegister(registerMode);
    setError('');
    if (onNavigate) {
      onNavigate(registerMode ? '/register' : '/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!form.username.trim() || !form.email.trim() || !form.password) {
          throw new Error('Please fill in all required fields');
        }
        await register(form.username.trim(), form.email.trim(), form.password, form.displayName.trim());
      } else {
        const identifier = form.username || form.email;
        if (!identifier.trim() || !form.password) {
          throw new Error('Please enter your username/email and password');
        }
        await login(identifier.trim(), form.password);
      }
      if (onNavigate) {
        onNavigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await loginDemo();
      if (onNavigate) {
        onNavigate('/dashboard');
      }
    } catch (err) {
      setError('Could not connect to demo profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden selection:bg-forest-600/20">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-forest-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-20 w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 py-5 flex items-center justify-between">
        <button
          onClick={() => onNavigate && onNavigate('/dashboard')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-forest-600" />
          <span>Back to Collection</span>
        </button>

        <div 
          onClick={() => onNavigate && onNavigate('/')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 via-forest-500 to-forest-700 flex items-center justify-center shadow-md">
            <Disc className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 flex items-center gap-1.5">
            SHELFMARK
            <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded border border-forest-200">
              COLLECTOR
            </span>
          </span>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('/')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
        >
          Browse as Guest →
        </button>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8">
          
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-forest-500 to-forest-700 flex items-center justify-center shadow-md mx-auto mb-3">
              <Disc className="w-8 h-8 text-white animate-spin-slow" />
            </div>
            <h1 className="font-extrabold text-2xl tracking-tight text-slate-900">
              {isRegister ? 'Create Your Account' : 'Sign in to Shelfmark'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isRegister 
                ? 'Start cataloging your 4K UHD, Blu-ray, and video game library' 
                : 'Welcome back! Sign in to access and manage your personal shelves'}
            </p>
          </div>

          {/* If already signed in */}
          {user ? (
            <div className="p-4 rounded-2xl bg-forest-50 border border-forest-200 text-center space-y-3 mb-4">
              <div className="flex items-center justify-center gap-1.5 text-forest-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-forest-600" />
                <span>Currently Signed In</span>
              </div>
              <p className="text-xs text-slate-600">
                You are currently signed in as <strong className="text-slate-900">{user.display_name || user.username}</strong> (@{user.username}).
              </p>
              <div className="flex gap-2 justify-center pt-1">
                <button
                  onClick={() => onNavigate && onNavigate('/dashboard')}
                  className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Go to Collection
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => switchMode(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !isRegister ? 'bg-forest-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isRegister ? 'bg-forest-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Display Name <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Alex Rivers"
                        value={form.displayName}
                        onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                        className="w-full bg-slate-50 hover:bg-white text-slate-900 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {isRegister ? 'Username *' : 'Username or Email *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={isRegister ? 'e.g. cinephile2026' : 'Enter your username or email'}
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                      required
                    />
                  </div>
                </div>

                {isRegister && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-slate-50 hover:bg-white text-slate-900 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-white text-slate-900 pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:bg-white focus:border-forest-600 focus:outline-hidden transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isRegister ? 'Create My Account' : 'Sign In'}</span>
                </button>
              </form>

              {/* Quick Demo Option */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or try right away
                </span>
              </div>

              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-forest-600" />
                <span>Instant Demo Collector Profile</span>
              </button>

              {/* Bottom Mode Switch Link */}
              <div className="mt-6 text-center text-xs text-slate-500">
                {isRegister ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(false)}
                      className="text-forest-700 hover:text-forest-800 font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(true)}
                      className="text-forest-700 hover:text-forest-800 font-bold hover:underline"
                    >
                      Create one now
                    </button>
                  </span>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-white/50 backdrop-blur-xs">
        <p>Shelfmark Media Collection • Physical & Digital Library Tracker</p>
      </footer>
    </div>
  );
}

export { LoginPage as AuthPage };
