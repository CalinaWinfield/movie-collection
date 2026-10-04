import React, { useState } from 'react';
import { Disc, Lock, User, Mail, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthModal() {
  const { login, register, loginDemo } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(form.username, form.email, form.password, form.displayName);
      } else {
        await login(form.username || form.email, form.password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await loginDemo();
    } catch (err) {
      setError('Could not connect to demo profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090b10] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-surface rounded-3xl border border-surface-border shadow-2xl p-8 backdrop-blur-xl">
        
        {/* Brand Logo & Headline */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-glow-gold mx-auto mb-4">
            <Disc className="w-9 h-9 text-slate-950 animate-spin-slow" />
          </div>
          <h1 className="font-display font-black text-2xl tracking-wider text-slate-100">
            KOLEKINO
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Keep track of your movie, TV show, and game collections
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-elevated p-1 rounded-xl border border-surface-border mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegister ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegister ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {isRegister ? 'Username' : 'Username or Email'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isRegister ? 'cinephile' : 'Enter your username or email'}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-surface-elevated text-slate-100 pl-10 pr-3 py-2.5 rounded-xl border border-surface-border text-sm focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="alex@collector.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-surface-elevated text-slate-100 pl-10 pr-3 py-2.5 rounded-xl border border-surface-border text-sm focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Display Name (Optional)</label>
              <input
                type="text"
                placeholder="Alex Rivers"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full bg-surface-elevated text-slate-100 px-3.5 py-2.5 rounded-xl border border-surface-border text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-surface-elevated text-slate-100 pl-10 pr-3 py-2.5 rounded-xl border border-surface-border text-sm focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-glow-gold transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{isRegister ? 'Create Collector Account' : 'Sign In to Library'}</span>
          </button>
        </form>

        {/* 1-Click Demo Login Button */}
        <div className="mt-6 pt-6 border-t border-surface-border text-center">
          <p className="text-xs text-slate-400 mb-3">Want to preview the app with sample 4K titles?</p>
          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-elevated hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Instant Demo (Sample 4Ks, Steelbooks & Games)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
